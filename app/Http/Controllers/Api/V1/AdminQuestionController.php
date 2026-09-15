<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AdminQuestionController extends Controller
{
    /**
     * Daftar soal dalam topik (paginated).
     */
    public function indexByTopic(Request $request, $topic_id): JsonResponse
    {
        $topic = Topic::find($topic_id);
        if (! $topic) {
            return response()->json(['message' => 'Topik tidak ditemukan.'], 404);
        }

        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 20);

        $questions = Question::where('topic_id', $topic->id)
            ->with(['options' => function ($q) {
                $q->orderBy('sort_order');
            }])
            ->orderBy('id', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $questions->items(),
            'meta' => [
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
                'per_page' => $questions->perPage(),
                'total' => $questions->total(),
            ],
        ]);
    }

    /**
     * Tambah soal + opsi jawaban sekaligus dalam DB Transaction.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic_id' => 'required|exists:topics,id',
            'type' => 'required|in:multiple_choice,true_false,matching,listen_choose,arrange_word,drag_drop',
            'question_text' => 'required|string',
            'question_image_url' => 'nullable|string|max:255',
            'question_audio_url' => 'nullable|string|max:255',
            'points' => 'nullable|integer|min:1',
            'difficulty' => 'required|in:mudah,sedang,sulit',
            'explanation' => 'nullable|string',
            'status' => 'required|in:draft,published',
            'options' => 'required|array|min:2',
            'options.*.option_text' => 'nullable|string|max:255',
            'options.*.option_image_url' => 'nullable|string|max:255',
            'options.*.match_group' => 'nullable|string|max:50',
            'options.*.is_correct' => 'required|boolean',
            'options.*.sort_order' => 'nullable|integer',
        ], [
            'topic_id.required' => 'Topik wajib dipilih.',
            'type.required' => 'Tipe soal wajib dipilih.',
            'question_text.required' => 'Teks soal wajib diisi.',
            'options.required' => 'Opsi jawaban wajib disertakan.',
            'options.min' => 'Minimal harus ada 2 opsi jawaban.',
        ]);

        // Cek validasi: jika status published, harus ada minimal 1 jawaban benar
        if ($validated['status'] === 'published') {
            $hasCorrect = collect($validated['options'])->contains('is_correct', true);
            if (! $hasCorrect) {
                return response()->json([
                    'message' => 'Soal tidak dapat dipublikasikan tanpa minimal satu jawaban benar.',
                    'errors' => ['status' => ['Harus ada minimal 1 opsi dengan status Benar.']],
                ], 422);
            }
        }

        $question = DB::transaction(function () use ($validated, $request) {
            $q = Question::create([
                'topic_id' => $validated['topic_id'],
                'type' => $validated['type'],
                'question_text' => $validated['question_text'],
                'question_image_url' => $validated['question_image_url'] ?? null,
                'question_audio_url' => $validated['question_audio_url'] ?? null,
                'points' => $validated['points'] ?? 10,
                'difficulty' => $validated['difficulty'],
                'explanation' => $validated['explanation'] ?? null,
                'status' => $validated['status'],
                'created_by' => $request->user() ? $request->user()->id : null,
            ]);

            foreach ($validated['options'] as $idx => $opt) {
                QuestionOption::create([
                    'question_id' => $q->id,
                    'option_text' => $opt['option_text'] ?? null,
                    'option_image_url' => $opt['option_image_url'] ?? null,
                    'match_group' => $opt['match_group'] ?? null,
                    'is_correct' => $opt['is_correct'],
                    'sort_order' => $opt['sort_order'] ?? ($idx + 1),
                ]);
            }

            return $q->load('options');
        });

        return response()->json([
            'data' => $question,
            'meta' => ['message' => 'Soal berhasil ditambahkan.'],
        ], 201);
    }

    /**
     * Edit soal (mendukung optimistic locking via updated_at).
     */
    public function update(Request $request, $id): JsonResponse
    {
        $question = Question::find($id);
        if (! $question) {
            return response()->json(['message' => 'Soal tidak ditemukan.'], 404);
        }

        // Optimistic lock check
        if ($request->filled('updated_at')) {
            $clientUpdatedAt = strtotime($request->updated_at);
            $dbUpdatedAt = $question->updated_at->timestamp;
            if ($clientUpdatedAt && abs($clientUpdatedAt - $dbUpdatedAt) > 1) {
                return response()->json([
                    'message' => 'Data sudah diubah oleh pihak lain, silakan muat ulang halaman.',
                ], 409);
            }
        }

        $validated = $request->validate([
            'type' => 'sometimes|required|in:multiple_choice,true_false,matching,listen_choose,arrange_word,drag_drop',
            'question_text' => 'sometimes|required|string',
            'question_image_url' => 'nullable|string|max:255',
            'question_audio_url' => 'nullable|string|max:255',
            'points' => 'nullable|integer|min:1',
            'difficulty' => 'sometimes|required|in:mudah,sedang,sulit',
            'explanation' => 'nullable|string',
            'status' => 'sometimes|required|in:draft,published',
            'options' => 'nullable|array',
        ]);

        // Jika mengubah ke published, cek apakah memiliki minimal 1 jawaban benar
        $targetStatus = $validated['status'] ?? $question->status;
        if ($targetStatus === 'published') {
            if (isset($validated['options'])) {
                $hasCorrect = collect($validated['options'])->contains('is_correct', true);
            } else {
                $hasCorrect = $question->options()->where('is_correct', true)->exists();
            }

            if (! $hasCorrect) {
                return response()->json([
                    'message' => 'Soal tidak dapat dipublikasikan tanpa minimal satu jawaban benar.',
                    'errors' => ['status' => ['Harus ada minimal 1 opsi dengan status Benar.']],
                ], 422);
            }
        }

        $updatedQuestion = DB::transaction(function () use ($question, $validated) {
            $question->update(collect($validated)->except('options')->toArray());

            if (isset($validated['options'])) {
                $question->options()->delete();
                foreach ($validated['options'] as $idx => $opt) {
                    QuestionOption::create([
                        'question_id' => $question->id,
                        'option_text' => $opt['option_text'] ?? null,
                        'option_image_url' => $opt['option_image_url'] ?? null,
                        'match_group' => $opt['match_group'] ?? null,
                        'is_correct' => $opt['is_correct'],
                        'sort_order' => $opt['sort_order'] ?? ($idx + 1),
                    ]);
                }
            }

            return $question->fresh(['options']);
        });

        return response()->json([
            'data' => $updatedQuestion,
            'meta' => ['message' => 'Soal berhasil diperbarui.'],
        ]);
    }

    /**
     * Hapus soal (Soft delete).
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        $question = Question::find($id);
        if (! $question) {
            return response()->json(['message' => 'Soal tidak ditemukan.'], 404);
        }

        $question->delete();

        return response()->json([
            'data' => ['message' => 'Soal berhasil dihapus.'],
        ]);
    }

    /**
     * Tambah opsi ke suatu soal.
     */
    public function storeOption(Request $request, $question_id): JsonResponse
    {
        $question = Question::find($question_id);
        if (! $question) {
            return response()->json(['message' => 'Soal tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'option_text' => 'nullable|string|max:255',
            'option_image_url' => 'nullable|string|max:255',
            'is_correct' => 'required|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $option = $question->options()->create($validated);

        return response()->json([
            'data' => $option,
            'meta' => ['message' => 'Opsi jawaban berhasil ditambahkan.'],
        ], 201);
    }

    /**
     * Edit opsi jawaban.
     */
    public function updateOption(Request $request, $id): JsonResponse
    {
        $option = QuestionOption::find($id);
        if (! $option) {
            return response()->json(['message' => 'Opsi jawaban tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'option_text' => 'nullable|string|max:255',
            'option_image_url' => 'nullable|string|max:255',
            'is_correct' => 'sometimes|required|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        $option->update($validated);

        return response()->json([
            'data' => $option,
            'meta' => ['message' => 'Opsi jawaban berhasil diperbarui.'],
        ]);
    }

    /**
     * Hapus opsi jawaban.
     */
    public function destroyOption(Request $request, $id): JsonResponse
    {
        $option = QuestionOption::with('question')->find($id);
        if (! $option) {
            return response()->json(['message' => 'Opsi jawaban tidak ditemukan.'], 404);
        }

        // Cegah menghapus opsi benar terakhir jika soal published
        if ($option->is_correct && $option->question && $option->question->status === 'published') {
            $otherCorrectCount = QuestionOption::where('question_id', $option->question_id)
                ->where('id', '!=', $option->id)
                ->where('is_correct', true)
                ->count();

            if ($otherCorrectCount === 0) {
                return response()->json([
                    'message' => 'Tidak dapat menghapus satu-satunya jawaban benar pada soal yang sudah dipublikasikan.',
                ], 422);
            }
        }

        $option->delete();

        return response()->json([
            'data' => ['message' => 'Opsi jawaban berhasil dihapus.'],
        ]);
    }

    /**
     * Acak urutan array opsi (Fisher-Yates) dan perbarui sort_order (§6.1 acuan-ai-generator.md).
     */
    private function shuffleOptions(array $options): array
    {
        $count = count($options);
        if ($count <= 1) {
            return $options;
        }

        // Algoritma Fisher-Yates
        for ($i = $count - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            $temp = $options[$i];
            $options[$i] = $options[$j];
            $options[$j] = $temp;
        }

        // Terapkan sort_order baru yang berurutan
        foreach ($options as $idx => &$opt) {
            $opt['sort_order'] = $idx + 1;
        }
        unset($opt);

        return $options;
    }

    /**
     * Normalisasi teks untuk perbandingan kemiripan / duplikasi.
     */
    private function normalizeTextForComparison(string $text): string
    {
        $t = mb_strtolower($text, 'UTF-8');
        // Hapus karakter non-alphanumeric (simbol, emoji, tanda baca)
        $t = preg_replace('/[^\p{L}\p{N}\s]/u', '', $t);
        // Rapikan spasi berlebih
        $t = preg_replace('/\s+/', ' ', $t);

        return trim($t);
    }

    /**
     * Cek apakah teks pertanyaan baru duplikat atau terlalu mirip (similarity >= threshold) dengan daftar existing.
     */
    public function isDuplicateQuestion(string $text, array $existingList, float $threshold = 85.0): bool
    {
        $normA = $this->normalizeTextForComparison($text);
        if (empty($normA)) {
            return false;
        }

        foreach ($existingList as $existing) {
            $normB = $this->normalizeTextForComparison($existing);
            if (empty($normB)) {
                continue;
            }

            // 1. Identik persis setelah normalisasi
            if ($normA === $normB) {
                return true;
            }

            // 2. Ekstrak target materi dalam tanda kutip, kurung siku, atau kurung biasa
            preg_match_all('/["\'\[\(](.*?)["\'\]\)]/u', $text, $matchesA);
            preg_match_all('/["\'\[\(](.*?)["\'\]\)]/u', $existing, $matchesB);

            $termsA = ! empty($matchesA[1]) ? array_values(array_filter(array_map('trim', $matchesA[1]))) : [];
            $termsB = ! empty($matchesB[1]) ? array_values(array_filter(array_map('trim', $matchesB[1]))) : [];

            // Jika kedua soal punya target spesifik dalam tanda kutip/kurung dan targetnya berbeda (mis. "BESAR" vs "TERANG"), bukan duplikat
            if (! empty($termsA) && ! empty($termsB)) {
                $overlap = array_intersect(
                    array_map('mb_strtolower', $termsA),
                    array_map('mb_strtolower', $termsB)
                );
                if (empty($overlap)) {
                    continue;
                }
            }

            // 3. Perhitungan kemiripan teks (similar_text & Levenshtein)
            similar_text($normA, $normB, $percent);
            if ($percent >= $threshold) {
                return true;
            }

            $maxLen = max(strlen($normA), strlen($normB));
            if ($maxLen > 0) {
                $lev = levenshtein($normA, $normB);
                $sim = (1 - ($lev / $maxLen)) * 100;
                if ($sim >= $threshold) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate kumpulan data soal kuis untuk suatu topik mengikuti acuan-ai-generator.md.
     */
    public function generateQuestionsData(Topic $topic, int $count = 5, string $difficulty = 'mudah', string $type = 'multiple_choice', string $customPrompt = '', array $sessionQuestions = []): array
    {
        if ($count < 1) {
            $count = 1;
        }
        if ($count > 10) {
            $count = 10;
        }

        $moduleName = $topic->module ? $topic->module->name : 'Pendidikan Anak';
        $topicName = $topic->name;
        $topicDesc = $topic->description ?: "Materi pembelajaran seputar {$topicName}";
        $targetUsia = $topic->min_age_level ? "{$topic->min_age_level} tahun" : '4-5 tahun';

        $apiKey = env('GEMINI_API_KEY');
        $generatedQuestions = [];

        // 1. Ambil SEMUA soal yang sudah tersimpan di database untuk topik ini (§4.3)
        $dbQuestions = Question::where('topic_id', $topic->id)
            ->pluck('question_text')
            ->toArray();

        // Gabungkan dengan soal dari sesi popup sebelumnya (jika admin regenerate tanpa menutup modal)
        $allExistingQuestions = array_values(array_unique(array_filter(array_merge($dbQuestions, $sessionQuestions))));

        $existingSection = '';
        if (! empty($allExistingQuestions)) {
            $existingSection = "\nSOAL YANG SUDAH ADA DI TOPIK INI (jangan dibuat ulang / terlalu mirip):\n";
            foreach ($allExistingQuestions as $idx => $eq) {
                $existingSection .= ($idx + 1).'. "'.$eq."\"\n";
            }
            $existingSection .= "\nInstruksi Khusus Duplikasi: Soal baru yang kamu buat TIDAK BOLEH sama persis, tidak boleh berupa variasi tipis (ganti 1-2 kata saja), dan tidak boleh menguji konsep yang sama dengan soal di daftar atas — walau kalimatnya diubah.\n";
        }

        // 2. Penguatan pengikatan materi & jenis kemampuan yang diuji
        $abilityInstruction = "\nPENGUATAN BATAS MATERI & JENIS KEMAMPUAN:\n"
            .'Nama topik dan instruksi tambahan di atas menjelaskan JENIS KEMAMPUAN yang harus diuji tiap soal. '
            ."Sebelum menulis tiap soal, tanyakan pada dirimu: apakah soal ini benar-benar menguji kemampuan '{$topicName}'".($customPrompt ? " / '{$customPrompt}'" : '').'? '
            ."Jika soal yang kamu pikirkan hanya 'berhubungan' tapi menguji kemampuan lain (mis. kosakata/antonim/pengejaan padahal topiknya menyusun kalimat), JANGAN dipakai — ganti dengan soal yang benar-benar menguji kemampuan tersebut. "
            ."Contoh soal yang BENAR untuk topik 'Menyusun Kalimat': memilih susunan kata yang membentuk kalimat benar dari kata acak, melengkapi kalimat rumpang dengan kata yang tepat, atau mengurutkan potongan kalimat jadi kalimat utuh.\n";

        if (! empty($apiKey)) {
            $attempts = 0;
            $maxAttempts = 2;

            while (count($generatedQuestions) < $count && $attempts < $maxAttempts) {
                $attempts++;
                $neededCount = $count - count($generatedQuestions);

                try {
                    // Update daftar existing dengan apa yang sudah ter-generate sejauh ini
                    $currentExistingList = array_values(array_unique(array_merge(
                        $allExistingQuestions,
                        array_column($generatedQuestions, 'question_text')
                    )));

                    $dynamicExistingSection = '';
                    if (! empty($currentExistingList)) {
                        $dynamicExistingSection = "\nSOAL YANG SUDAH ADA DI TOPIK INI (jangan dibuat ulang / terlalu mirip):\n";
                        foreach ($currentExistingList as $idx => $eq) {
                            $dynamicExistingSection .= ($idx + 1).'. "'.$eq."\"\n";
                        }
                        $dynamicExistingSection .= "\nInstruksi Khusus Duplikasi: Soal baru yang kamu buat TIDAK BOLEH sama persis, tidak boleh berupa variasi tipis (ganti 1-2 kata saja), dan tidak boleh menguji konsep yang sama dengan soal di daftar atas — walau kalimatnya diubah.\n";
                    }

                    // System prompt sesuai template §4 & §4.3 acuan-ai-generator.md
                    $systemPrompt = "Kamu adalah penyusun soal kuis untuk aplikasi belajar anak \"BelajarCeria\".\n\n"
                        ."KONTEKS TOPIK (WAJIB DIPATUHI, INI BATAS MATERI):\n"
                        ."- Modul: {$moduleName}\n"
                        ."- Topik: {$topicName}\n"
                        ."- Deskripsi topik: {$topicDesc}\n"
                        ."- Tingkat kesulitan: {$difficulty}\n"
                        ."- Target usia: {$targetUsia}\n\n"
                        .($customPrompt ? "INSTRUKSI TAMBAHAN DARI ADMIN: \"{$customPrompt}\"\n\n" : '')
                        ."CARA MEMPERLAKUKAN INSTRUKSI TAMBAHAN:\n"
                        ."- Instruksi tambahan hanya boleh MEMPERSEMPIT atau MEMBERI GAYA pada soal dalam topik di atas.\n"
                        ."- Instruksi tambahan TIDAK BOLEH membawa soal keluar dari cakupan topik. Jika instruksi tampak meminta materi di luar topik, terapkan instruksi itu HANYA sebatas yang masih cocok dengan topik.\n"
                        ."- Jika instruksi tambahan kosong, buat soal murni dari cakupan topik saja.\n"
                        .$abilityInstruction
                        .$dynamicExistingSection."\n"
                        ."TUGAS:\n"
                        ."1. Buat TEPAT {$neededCount} soal pilihan ganda untuk topik di atas.\n"
                        ."2. Setiap soal: 1 pertanyaan jelas, 3 opsi jawaban (1 benar + 2 distractor masuk akal), 1 penjelasan singkat jawaban benar, tingkat kesulitan sesuai {$difficulty}.\n"
                        ."3. Semua soal harus tentang topik \"{$topicName}\" — dilarang menyertakan materi dari topik atau modul lain.\n"
                        ."4. Soal baru yang kamu buat TIDAK BOLEH sama persis, tidak boleh berupa variasi tipis, dan tidak boleh menguji konsep yang sama dengan soal di daftar 'SOAL YANG SUDAH ADA' di atas.\n"
                        ."5. Jangan mengulang pola/kalimat soal yang identik antar nomor.\n"
                        ."6. Posisi opsi jawaban dalam output TIDAK PENTING, sistem yang akan mengacak. Tandai jawaban benar lewat field is_correct.\n\n"
                        ."FORMAT OUTPUT: HANYA JSON array murni tanpa markdown, berisi persis {$neededCount} objek soal dengan skema:\n"
                        ."[{\"type\":\"{$type}\",\"question_text\":\"pertanyaan ramah anak\",\"difficulty\":\"{$difficulty}\",\"points\":10,\"explanation\":\"penjelasan ringkas 1 kalimat\",\"options\":[{\"option_text\":\"teks opsi benar\",\"is_correct\":true},{\"option_text\":\"teks pengecoh 1\",\"is_correct\":false},{\"option_text\":\"teks pengecoh 2\",\"is_correct\":false}]}]";

                    $response = Http::timeout(15)->post(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}",
                        [
                            'contents' => [
                                [
                                    'parts' => [
                                        ['text' => $systemPrompt],
                                    ],
                                ],
                            ],
                            'generationConfig' => [
                                'response_mime_type' => 'application/json',
                                'temperature' => 0.8,
                            ],
                        ]
                    );

                    if ($response->successful()) {
                        $rawText = $response->json('candidates.0.content.parts.0.text') ?? '';
                        $cleanJson = trim(preg_replace('/^```(?:json)?|```$/m', '', $rawText));
                        $parsed = json_decode($cleanJson, true);
                        if (is_array($parsed)) {
                            $items = isset($parsed['soal']) ? $parsed['soal'] : (isset($parsed['questions']) ? $parsed['questions'] : (isset($parsed[0]) ? $parsed : []));
                            if (is_array($items) && ! empty($items)) {
                                foreach ($items as $item) {
                                    if (count($generatedQuestions) >= $count) {
                                        break;
                                    }

                                    if (! empty($item['question_text']) || ! empty($item['pertanyaan'])) {
                                        $qText = trim($item['question_text'] ?? $item['pertanyaan']);

                                        // Validasi duplikasi & similarity terhadap DB, session, dan hasil generate saat ini
                                        $allToCheck = array_merge($allExistingQuestions, array_column($generatedQuestions, 'question_text'));
                                        if ($this->isDuplicateQuestion($qText, $allToCheck)) {
                                            continue; // Tolak soal duplikat/mirip
                                        }

                                        $rawOpts = $item['options'] ?? $item['opsi'] ?? [];
                                        $formattedOpts = [];
                                        foreach ($rawOpts as $ro) {
                                            $formattedOpts[] = [
                                                'option_text' => $ro['option_text'] ?? $ro['teks'] ?? '',
                                                'is_correct' => (bool) ($ro['is_correct'] ?? false),
                                            ];
                                        }

                                        // Validasi skema: minimal 2 opsi dan ada 1 opsi benar
                                        if (count($formattedOpts) >= 2 && collect($formattedOpts)->contains('is_correct', true)) {
                                            $generatedQuestions[] = [
                                                'type' => $type,
                                                'question_text' => $qText,
                                                'difficulty' => $item['difficulty'] ?? $item['kesulitan'] ?? $difficulty,
                                                'points' => $item['points'] ?? $item['poin'] ?? 10,
                                                'explanation' => $item['explanation'] ?? $item['penjelasan'] ?? "Jawaban yang benar untuk topik {$topicName}.",
                                                'options' => $this->shuffleOptions($formattedOpts), // Acak opsi via Fisher-Yates
                                                'flagged_duplicate' => false,
                                            ];
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    // Fallback to curriculum engine
                    break;
                }
            }
        }

        // Fallback intelligent curriculum engine jika API offline atau jumlah belum mencukupi
        if (count($generatedQuestions) < $count) {
            $allToCheck = array_values(array_unique(array_merge($allExistingQuestions, array_column($generatedQuestions, 'question_text'))));
            $needed = $count - count($generatedQuestions);
            $fallbackQuestions = $this->generateFallbackQuestions($moduleName, $topicName, $needed, $difficulty, $type, $customPrompt, $allToCheck);

            foreach ($fallbackQuestions as $fq) {
                if (count($generatedQuestions) >= $count) {
                    break;
                }

                if (isset($fq['options']) && is_array($fq['options'])) {
                    $fq['options'] = $this->shuffleOptions($fq['options']);
                }
                $fq['flagged_duplicate'] = false;
                $generatedQuestions[] = $fq;
            }
        }

        // Pastikan semua soal yang dikembalikan memiliki opsi yang sudah diacak posisinya dan unik
        $finalQuestions = array_slice(array_values($generatedQuestions), 0, $count);
        foreach ($finalQuestions as &$fq) {
            if (isset($fq['options']) && is_array($fq['options'])) {
                $fq['options'] = $this->shuffleOptions($fq['options']);
            }
        }
        unset($fq);

        return $finalQuestions;
    }

    /**
     * Buat dan simpan sekumpulan soal secara langsung ke database untuk topik tertentu.
     */
    public function createQuestionsForTopic(Topic $topic, int $count = 5, string $difficulty = 'mudah', string $type = 'multiple_choice', string $customPrompt = '', ?int $userId = null): array
    {
        $questionsData = $this->generateQuestionsData($topic, $count, $difficulty, $type, $customPrompt);

        return DB::transaction(function () use ($topic, $questionsData, $userId) {
            $results = [];
            foreach ($questionsData as $qData) {
                $q = Question::create([
                    'topic_id' => $topic->id,
                    'type' => $qData['type'] ?? 'multiple_choice',
                    'question_text' => $qData['question_text'],
                    'points' => $qData['points'] ?? 10,
                    'difficulty' => $qData['difficulty'] ?? 'mudah',
                    'explanation' => $qData['explanation'] ?? null,
                    'status' => 'published',
                    'created_by' => $userId,
                ]);

                // Acak opsi sebelum disimpan ke database (§6.1 acuan-ai-generator.md)
                $shuffledOptions = $this->shuffleOptions($qData['options']);
                foreach ($shuffledOptions as $idx => $opt) {
                    QuestionOption::create([
                        'question_id' => $q->id,
                        'option_text' => $opt['option_text'],
                        'is_correct' => (bool) $opt['is_correct'],
                        'sort_order' => $opt['sort_order'] ?? ($idx + 1),
                    ]);
                }

                $results[] = $q->load('options');
            }

            return $results;
        });
    }

    /**
     * Generate soal kuis otomatis menggunakan AI (Gemini atau Smart Curriculum Engine).
     */
    public function generateAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic_id' => 'required|exists:topics,id',
            'count' => 'nullable|integer|min:1|max:10',
            'difficulty' => 'nullable|in:mudah,sedang,sulit',
            'type' => 'nullable|in:multiple_choice,true_false,arrange_word',
            'custom_prompt' => 'nullable|string|max:300',
            'prompt_hint' => 'nullable|string|max:300',
            'session_questions' => 'nullable|array',
            'session_questions.*' => 'string',
            'exclude_questions' => 'nullable|array',
            'exclude_questions.*' => 'string',
        ]);

        $topic = Topic::with('module')->find($validated['topic_id']);
        $count = (int) ($validated['count'] ?? 3);
        $difficulty = $validated['difficulty'] ?? 'mudah';
        $type = $validated['type'] ?? 'multiple_choice';
        $customPrompt = trim($validated['custom_prompt'] ?? $validated['prompt_hint'] ?? '');
        $sessionQuestions = array_merge(
            $validated['session_questions'] ?? [],
            $validated['exclude_questions'] ?? []
        );

        $generatedQuestions = $this->generateQuestionsData($topic, $count, $difficulty, $type, $customPrompt, $sessionQuestions);
        $apiKey = env('GEMINI_API_KEY');

        return response()->json([
            'success' => true,
            'data' => $generatedQuestions,
            'meta' => [
                'count' => count($generatedQuestions),
                'requested_count' => $count,
                'topic' => $topic->name,
                'module' => $topic->module ? $topic->module->name : 'Pendidikan Anak',
                'custom_prompt' => $customPrompt,
                'source' => ! empty($apiKey) ? 'gemini_ai' : 'smart_curriculum_engine',
            ],
        ]);
    }

    /**
     * Simpan kumpulan soal hasil AI ke Bank Soal secara bulk dalam 1 transaksi.
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'topic_id' => 'required|exists:topics,id',
            'questions' => 'required|array|min:1',
            'questions.*.type' => 'required|string',
            'questions.*.question_text' => 'required|string',
            'questions.*.difficulty' => 'required|in:mudah,sedang,sulit',
            'questions.*.points' => 'nullable|integer',
            'questions.*.explanation' => 'nullable|string',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*.option_text' => 'required|string',
            'questions.*.options.*.is_correct' => 'required|boolean',
        ]);

        $created = DB::transaction(function () use ($validated, $request) {
            $results = [];
            foreach ($validated['questions'] as $qData) {
                $q = Question::create([
                    'topic_id' => $validated['topic_id'],
                    'type' => $qData['type'] ?? 'multiple_choice',
                    'question_text' => $qData['question_text'],
                    'points' => $qData['points'] ?? 10,
                    'difficulty' => $qData['difficulty'] ?? 'mudah',
                    'explanation' => $qData['explanation'] ?? null,
                    'status' => 'published',
                    'created_by' => $request->user() ? $request->user()->id : null,
                ]);

                // Acak opsi jawaban sebelum disimpan (§6.1 acuan-ai-generator.md)
                $shuffledOptions = $this->shuffleOptions($qData['options']);
                foreach ($shuffledOptions as $idx => $opt) {
                    QuestionOption::create([
                        'question_id' => $q->id,
                        'option_text' => $opt['option_text'],
                        'is_correct' => (bool) $opt['is_correct'],
                        'sort_order' => $opt['sort_order'] ?? ($idx + 1),
                    ]);
                }

                $results[] = $q->load('options');
            }

            return $results;
        });

        return response()->json([
            'success' => true,
            'data' => $created,
            'message' => count($created).' soal berhasil disimpan ke Bank Soal.',
        ], 201);
    }

    /**
     * Generator kurikulum pintar mandiri yang menghasilkan variasi soal kaya, presisi, dan dinamis sesuai instruksi.
     */
    private function generateFallbackQuestions(string $moduleName, string $topicName, int $count, string $difficulty, string $type, string $customPrompt = '', array $existingList = []): array
    {
        $promptLower = strtolower($customPrompt);
        $topicLower = strtolower($topicName);
        $moduleLower = strtolower($moduleName);
        $searchKey = $promptLower.' '.$topicLower.' '.$moduleLower;

        $pool = [];

        // 1. CEK INTENSI KHUSUS ANGKA ARAB (1-10 / adad)
        $isArabicNumbersFocus = str_contains($searchKey, 'angka arab')
            || str_contains($searchKey, 'bilangan arab')
            || str_contains($searchKey, 'nomor arab')
            || str_contains($searchKey, 'adad')
            || (str_contains($searchKey, 'arab') && (str_contains($searchKey, 'angka') || str_contains($searchKey, '1-10') || str_contains($searchKey, 'hitung')));

        // 2. CEK INTENSI KHUSUS HIJAIYAH (Jika instruksi atau topik meminta huruf hijaiyah)
        $isHijaiyahFocus = str_contains($promptLower, 'hijaiyah')
            || (str_contains($promptLower, 'huruf') && ! str_contains($promptLower, 'vokal') && ! str_contains($promptLower, 'abjad'))
            || (str_contains($topicLower, 'hijaiyah') && ! str_contains($promptLower, 'mufrodat') && ! str_contains($promptLower, 'kosakata'));

        $isMufrodatFocus = str_contains($promptLower, 'mufrodat')
            || str_contains($promptLower, 'kosakata arab')
            || str_contains($promptLower, 'arti kata')
            || (str_contains($topicLower, 'mufrodat') && ! str_contains($promptLower, 'hijaiyah'));

        // 3. CEK INTENSI BAHASA INDONESIA SPESIFIK
        $isSentenceFocus = str_contains($searchKey, 'susun kalimat')
            || str_contains($searchKey, 'menyusun kalimat')
            || str_contains($searchKey, 'susun kata')
            || str_contains($searchKey, 'rangkai kata')
            || str_contains($searchKey, 'susunan kalimat')
            || (str_contains($topicLower, 'kalimat') && ! str_contains($promptLower, 'vokal') && ! str_contains($promptLower, 'antonim'));

        $isVowelFocus = str_contains($searchKey, 'vokal')
            || str_contains($searchKey, 'konsonan')
            || (str_contains($promptLower, 'huruf') && str_contains($moduleLower, 'indonesia'));

        $isAntonymFocus = str_contains($searchKey, 'antonim')
            || str_contains($searchKey, 'lawan kata')
            || str_contains($searchKey, 'sinonim')
            || str_contains($searchKey, 'persamaan kata');

        $isSyllableFocus = str_contains($searchKey, 'suku kata')
            || str_contains($searchKey, 'eja')
            || str_contains($searchKey, 'mengeja');

        $isPunctuationFocus = str_contains($searchKey, 'kapital')
            || str_contains($searchKey, 'tanda baca')
            || str_contains($searchKey, 'titik');

        if ($isArabicNumbersFocus) {
            $pool = $this->getArabicNumbersPool($difficulty);
        } elseif ($isHijaiyahFocus && ! $isMufrodatFocus) {
            $pool = $this->getHijaiyahPool($difficulty);
        } elseif ($isMufrodatFocus) {
            $pool = $this->getMufrodatPool($difficulty);
        } elseif (str_contains($searchKey, 'arab') || str_contains($searchKey, 'islam')) {
            $pool = array_merge($this->getHijaiyahPool($difficulty), $this->getArabicNumbersPool($difficulty), $this->getMufrodatPool($difficulty));
        } elseif ($isSentenceFocus) {
            $pool = $this->getSentenceBuildingPool($difficulty, $promptLower);
        } elseif ($isVowelFocus) {
            $pool = $this->getVowelConsonantPool($difficulty, $promptLower);
        } elseif ($isAntonymFocus) {
            $pool = $this->getAntonymSynonymPool($difficulty, $promptLower);
        } elseif ($isSyllableFocus) {
            $pool = $this->getSyllablePool($difficulty, $promptLower);
        } elseif ($isPunctuationFocus) {
            $pool = $this->getPunctuationPool($difficulty, $promptLower);
        } elseif (str_contains($searchKey, 'matematika') || str_contains($searchKey, 'hitung') || str_contains($searchKey, 'math') || str_contains($searchKey, 'angka') || str_contains($searchKey, 'jumlah')) {
            $pool = $this->getMathPool($difficulty, $promptLower);
        } elseif (str_contains($searchKey, 'english') || str_contains($searchKey, 'inggris')) {
            $pool = $this->getEnglishPool($difficulty, $promptLower);
        } elseif (str_contains($searchKey, 'indonesia') || str_contains($searchKey, 'bahasa')) {
            $pool = $this->getIndonesianPool($difficulty, $promptLower);
        } elseif (str_contains($searchKey, 'ipa') || str_contains($searchKey, 'sains') || str_contains($searchKey, 'alam') || str_contains($searchKey, 'hewan') || str_contains($searchKey, 'tumbuhan')) {
            $pool = $this->getSciencePool($difficulty, $promptLower);
        } elseif (str_contains($searchKey, 'ips') || str_contains($searchKey, 'sosial') || str_contains($searchKey, 'keluarga') || str_contains($searchKey, 'profesi')) {
            $pool = $this->getSocialPool($difficulty, $promptLower);
        } else {
            $pool = array_merge($this->getGeneralPool($difficulty, $topicName), $this->getIndonesianPool($difficulty, $promptLower));
        }

        // Filter berdasarkan tipe soal jika diminta spesifik
        if ($type === 'true_false') {
            $tfPool = array_filter($pool, fn ($q) => $q['type'] === 'true_false');
            if (count($tfPool) >= $count) {
                $pool = $tfPool;
            }
        } elseif ($type === 'multiple_choice') {
            $mcPool = array_filter($pool, fn ($q) => $q['type'] === 'multiple_choice');
            if (count($mcPool) >= $count) {
                $pool = $mcPool;
            }
        }

        // Acak untuk memberikan variasi segar pada setiap generate
        shuffle($pool);

        $results = [];
        $usedTexts = [];

        foreach ($pool as $q) {
            if (! in_array($q['question_text'], $usedTexts) && ! $this->isDuplicateQuestion($q['question_text'], $existingList)) {
                $usedTexts[] = $q['question_text'];
                $results[] = $q;
                if (count($results) >= $count) {
                    break;
                }
            }
        }

        // Jika masih kurang, lengkapi dengan variasi dinamis yang relevan
        while (count($results) < $count) {
            $idx = count($results) + 1;
            $results[] = [
                'question_text' => "Pertanyaan seru ke-{$idx} seputar materi {$topicName}: Pilihlah jawaban yang paling tepat! 🌟",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Belajar dengan tekun dan ceria membantu kita semakin pintar dan berprestasi.',
                'options' => [
                    ['option_text' => 'Belajar dan berlatih dengan giat ✨', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Malas membaca buku', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Bermain tanpa henti', 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        return array_slice($results, 0, $count);
    }

    private function getArabicNumbersPool(string $difficulty): array
    {
        $numbers = [
            ['arabic' => '١', 'latin' => '1', 'name' => 'Wahid (وَاحِدٌ)', 'meaning' => 'Satu'],
            ['arabic' => '٢', 'latin' => '2', 'name' => 'Itsnan (اِثْنَانِ)', 'meaning' => 'Dua'],
            ['arabic' => '٣', 'latin' => '3', 'name' => 'Tsalatsah (ثَلَاثَةٌ)', 'meaning' => 'Tiga'],
            ['arabic' => '٤', 'latin' => '4', 'name' => 'Arba\'ah (أَرْبَعَةٌ)', 'meaning' => 'Empat'],
            ['arabic' => '٥', 'latin' => '5', 'name' => 'Khamsah (خَمْسَةٌ)', 'meaning' => 'Lima'],
            ['arabic' => '٦', 'latin' => '6', 'name' => 'Sittah (سِتَّةٌ)', 'meaning' => 'Enam'],
            ['arabic' => '٧', 'latin' => '7', 'name' => 'Sab\'ah (سَبْعَةٌ)', 'meaning' => 'Tujuh'],
            ['arabic' => '٨', 'latin' => '8', 'name' => 'Tsamaniyah (ثَمَانِيَةٌ)', 'meaning' => 'Delapan'],
            ['arabic' => '٩', 'latin' => '9', 'name' => 'Tis\'ah (تِسْعَةٌ)', 'meaning' => 'Sembilan'],
            ['arabic' => '١٠', 'latin' => '10', 'name' => '\'Asyarah (عَشَرَةٌ)', 'meaning' => 'Sepuluh'],
        ];
        shuffle($numbers);

        $pool = [];

        // Soal Tebak Lambang Angka Arab dari Angka Latin
        foreach (array_slice($numbers, 0, 5) as $num) {
            $pool[] = [
                'question_text' => "Manakah bentuk lambang angka Arab untuk bilangan {$num['latin']} ({$num['name']})? 🔢",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Angka {$num['latin']} ({$num['meaning']}) dalam tulisan Arab dilambangkan dengan ({$num['arabic']}) dan dibaca {$num['name']}.",
                'options' => [
                    ['option_text' => "{$num['arabic']} ({$num['name']})", 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => $num['arabic'] === '١' ? '٢ (Itsnan)' : '١ (Wahid)', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => $num['arabic'] === '٥' ? '٣ (Tsalatsah)' : '٥ (Khamsah)', 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        // Soal Tebak Nilai dari Lambang Angka Arab
        foreach (array_slice($numbers, 0, 5) as $num) {
            $pool[] = [
                'question_text' => "Lambang angka Arab '{$num['arabic']}' ({$num['name']}) artinya adalah angka berapa? 🌟",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Lambang {$num['arabic']} dibaca {$num['name']} yang mewakili angka {$num['latin']} ({$num['meaning']}).",
                'options' => [
                    ['option_text' => "{$num['latin']} ({$num['meaning']})", 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => $num['latin'] === '1' ? '2 (Dua)' : '1 (Satu)', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => $num['latin'] === '5' ? '10 (Sepuluh)' : '5 (Lima)', 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        // Soal True/False
        $pool[] = [
            'question_text' => "Lambang angka Arab '٥' dibaca 'Khamsah' dan memiliki arti angka 5.",
            'type' => 'true_false',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Benar, lambang ٥ dalam bahasa Arab adalah angka 5 (Khamsah).',
            'options' => [
                ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
            ],
        ];

        $pool[] = [
            'question_text' => "Lambang angka Arab '١' dibaca 'Wahid' dan berarti angka 1.",
            'type' => 'true_false',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Benar, angka 1 dalam bahasa Arab ditulis ١ dan dibaca Wahid.',
            'options' => [
                ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
            ],
        ];

        $pool[] = [
            'question_text' => "Lambang angka Arab '٧' (terbuka ke atas) adalah angka 7, sedangkan '٨' (menghadap ke bawah) adalah angka 8.",
            'type' => 'true_false',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Benar, ٧ adalah angka 7 (Sab\'ah) dan ٨ adalah angka 8 (Tsamaniyah).',
            'options' => [
                ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
            ],
        ];

        return $pool;
    }

    private function getHijaiyahPool(string $difficulty): array
    {
        $letters = [
            ['name' => 'Alif', 'char' => 'ا', 'dots' => 'tidak memiliki titik', 'next' => 'Ba (ب)', 'prev' => 'awal huruf hijaiyah'],
            ['name' => 'Ba', 'char' => 'ب', 'dots' => '1 titik di bawah', 'next' => 'Ta (ت)', 'prev' => 'Alif (ا)'],
            ['name' => 'Ta', 'char' => 'ت', 'dots' => '2 titik di atas', 'next' => 'Tsa (ث)', 'prev' => 'Ba (ب)'],
            ['name' => 'Tsa', 'char' => 'ث', 'dots' => '3 titik di atas', 'next' => 'Jim (ج)', 'prev' => 'Ta (ت)'],
            ['name' => 'Jim', 'char' => 'ج', 'dots' => '1 titik di tengah perut', 'next' => 'Ha (ح)', 'prev' => 'Tsa (ث)'],
            ['name' => 'Ha', 'char' => 'ح', 'dots' => 'tanpa titik', 'next' => 'Kha (خ)', 'prev' => 'Jim (ج)'],
            ['name' => 'Kha', 'char' => 'خ', 'dots' => '1 titik di atas', 'next' => 'Dal (د)', 'prev' => 'Ha (ح)'],
            ['name' => 'Dal', 'char' => 'د', 'dots' => 'tanpa titik', 'next' => 'Dzal (ذ)', 'prev' => 'Kha (خ)'],
            ['name' => 'Dzal', 'char' => 'ذ', 'dots' => '1 titik di atas', 'next' => 'Ra (ر)', 'prev' => 'Dal (د)'],
            ['name' => 'Ra', 'char' => 'ر', 'dots' => 'tanpa titik', 'next' => 'Zay (ز)', 'prev' => 'Dzal (ذ)'],
            ['name' => 'Sin', 'char' => 'س', 'dots' => '3 gerigi tanpa titik', 'next' => 'Syin (ش)', 'prev' => 'Zay (ز)'],
            ['name' => 'Nun', 'char' => 'ن', 'dots' => '1 titik di atas mangkuk', 'next' => 'Wawu (و)', 'prev' => 'Mim (م)'],
            ['name' => 'Ya', 'char' => 'ي', 'dots' => '2 titik di bawah', 'next' => 'huruf terakhir hijaiyah', 'prev' => 'Hamzah (ء)'],
        ];
        shuffle($letters);

        $pool = [];

        // Soal Tebak Lambang Huruf
        foreach (array_slice($letters, 0, 5) as $l) {
            $pool[] = [
                'question_text' => "Manakah bentuk lambang huruf Hijaiyah \"{$l['name']}\"? 📖",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Huruf {$l['name']} ditulis dengan bentuk lambang ({$l['char']}).",
                'options' => [
                    ['option_text' => "{$l['char']} ({$l['name']})", 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => $l['char'] === 'ب' ? 'ت (Ta)' : 'ب (Ba)', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => $l['char'] === 'ج' ? 'د (Dal)' : 'ج (Jim)', 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        // Soal Posisi Titik (Multiple Choice & True/False)
        foreach (array_slice($letters, 0, 4) as $l) {
            $pool[] = [
                'question_text' => "Berapa jumlah titik dan letak pada huruf {$l['name']} ({$l['char']})? ✍️",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Huruf {$l['name']} ({$l['char']}) memiliki ciri {$l['dots']}.",
                'options' => [
                    ['option_text' => ucfirst($l['dots']), 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => '2 titik di tengah', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => '3 titik di samping', 'is_correct' => false, 'sort_order' => 3],
                ],
            ];

            $pool[] = [
                'question_text' => "Huruf Hijaiyah {$l['name']} ({$l['char']}) {$l['dots']}.",
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Benar, ciri penulisan huruf {$l['name']} adalah {$l['dots']}.",
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ];
        }

        // Soal Urutan Huruf
        $pool[] = [
            'question_text' => 'Huruf apakah yang berada tepat setelah huruf Ba (ب)? 🔤',
            'type' => 'multiple_choice',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Urutan hijaiyah: Alif (ا), Ba (ب), Ta (ت), Tsa (ث). Setelah Ba adalah Ta.',
            'options' => [
                ['option_text' => 'Ta (ت)', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Alif (ا)', 'is_correct' => false, 'sort_order' => 2],
                ['option_text' => 'Jim (ج)', 'is_correct' => false, 'sort_order' => 3],
            ],
        ];

        $pool[] = [
            'question_text' => 'Huruf Hijaiyah pertama dalam abjad Arab adalah Alif (ا).',
            'type' => 'true_false',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Benar, Alif (ا) adalah huruf nomor 1 dalam hijaiyah.',
            'options' => [
                ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
            ],
        ];

        // Soal Harakat Dasar
        $pool[] = [
            'question_text' => 'Tanda baca Fathah (ـَ) di atas huruf menghasilkan bunyi vokal... 🔊',
            'type' => 'multiple_choice',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Fathah berbunyi "A", Kasrah berbunyi "I", dan Dhammah berbunyi "U".',
            'options' => [
                ['option_text' => 'Bunyi "A"', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Bunyi "I"', 'is_correct' => false, 'sort_order' => 2],
                ['option_text' => 'Bunyi "U"', 'is_correct' => false, 'sort_order' => 3],
            ],
        ];

        $pool[] = [
            'question_text' => 'Huruf Ba berharakat kasrah (بِ) dibaca dengan bunyi "Bi".',
            'type' => 'true_false',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Benar, harakat kasrah di bawah huruf Ba dibaca "Bi".',
            'options' => [
                ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
            ],
        ];

        return $pool;
    }

    private function getMufrodatPool(string $difficulty): array
    {
        $mufrodat = [
            ['ar' => 'شُكْرًا (Syukron)', 'id' => 'Terima Kasih', 'wrong1' => 'Sama-sama', 'wrong2' => 'Selamat Pagi', 'icon' => '🤝'],
            ['ar' => 'أَهْلًا وَسَهْلًا (Ahlan wa Sahlan)', 'id' => 'Selamat Datang', 'wrong1' => 'Sampai Jumpa', 'wrong2' => 'Maafkan Saya', 'icon' => '👋'],
            ['ar' => 'كِتَابٌ (Kitaabun)', 'id' => 'Buku', 'wrong1' => 'Pensil', 'wrong2' => 'Meja Belajar', 'icon' => '📚'],
            ['ar' => 'قَلَمٌ (Qolamun)', 'id' => 'Pena / Pensil', 'wrong1' => 'Penghapus', 'wrong2' => 'Penggaris', 'icon' => '✏️'],
            ['ar' => 'بَيْتٌ (Baitun)', 'id' => 'Rumah', 'wrong1' => 'Sekolah', 'wrong2' => 'Masjid', 'icon' => '🏠'],
            ['ar' => 'مَسْجِدٌ (Masjidun)', 'id' => 'Masjid', 'wrong1' => 'Pasar', 'wrong2' => 'Taman', 'icon' => '🕌'],
            ['ar' => 'أُمٌّ (Ummun)', 'id' => 'Ibu', 'wrong1' => 'Ayah', 'wrong2' => 'Kakak', 'icon' => '❤️'],
            ['ar' => 'أَبٌ (Abun)', 'id' => 'Ayah', 'wrong1' => 'Ibu', 'wrong2' => 'Paman', 'icon' => '👨'],
            ['ar' => 'سَيَّارَةٌ (Sayyaarotun)', 'id' => 'Mobil', 'wrong1' => 'Sepeda', 'wrong2' => 'Pesawat', 'icon' => '🚗'],
            ['ar' => 'زَهْرَةٌ (Zahrotun)', 'id' => 'Bunga', 'wrong1' => 'Pohon', 'wrong2' => 'Rumput', 'icon' => '🌸'],
        ];
        shuffle($mufrodat);

        $pool = [];
        foreach ($mufrodat as $m) {
            $pool[] = [
                'question_text' => "Apa arti dari mufrodat \"{$m['ar']}\"? {$m['icon']}",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "{$m['ar']} artinya {$m['id']}.",
                'options' => [
                    ['option_text' => $m['id'], 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => $m['wrong1'], 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => $m['wrong2'], 'is_correct' => false, 'sort_order' => 3],
                ],
            ];

            $pool[] = [
                'question_text' => "Mufrodat \"{$m['ar']}\" memiliki arti {$m['id']}.",
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Benar, kata {$m['ar']} diterjemahkan sebagai {$m['id']}.",
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ];
        }

        return $pool;
    }

    /**
     * Pool khusus untuk Menyusun Kalimat, Susun Kata, dan Kelengkapan Kalimat.
     */
    private function getSentenceBuildingPool(string $difficulty, string $prompt): array
    {
        $pool = [
            [
                'question_text' => 'Susunlah kata-kata berikut agar menjadi kalimat yang benar: [membaca - Budi - buku] 📖',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Susunan Subjek - Predikat - Objek yang benar adalah: Budi membaca buku.',
                'options' => [
                    ['option_text' => 'Budi membaca buku', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Buku Budi membaca', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Membaca buku Budi', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Manakah susunan kalimat yang benar dari kata acak: [sekolah - ke - pergi - Siti]? 🎒',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Susunan yang runtut dan bermakna adalah: Siti pergi ke sekolah.',
                'options' => [
                    ['option_text' => 'Siti pergi ke sekolah', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Ke sekolah Siti pergi', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Pergi Siti sekolah ke', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Susunlah kata-kata berikut menjadi kalimat: [makan - kucing - ikan] 🐱',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Susunan yang tepat adalah Kucing makan ikan.',
                'options' => [
                    ['option_text' => 'Kucing makan ikan', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Ikan kucing makan', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Makan ikan kucing', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Lengkapilah kalimat rumpang berikut: "Ibu sedang memasak nasi di ..." 🍳',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Tempat yang tepat untuk memasak makanan adalah di dapur.',
                'options' => [
                    ['option_text' => 'Dapur', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Kamar tidur', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Halaman jalan', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Susunlah potongan kata berikut agar menjadi kalimat utuh: [bunga - menyiram - Lani] 🌸',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Susunan kata yang benar adalah Lani menyiram bunga.',
                'options' => [
                    ['option_text' => 'Lani menyiram bunga', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Bunga Lani menyiram', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Menyiram bunga Lani', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Manakah kalimat di bawah ini yang memiliki susunan kata yang baik dan masuk akal? 🌟',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Kalimat "Adik minum susu hangat" memiliki urutan kata yang jelas dan logis.',
                'options' => [
                    ['option_text' => 'Adik minum susu hangat', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Hangat adik susu minum', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Susu minum hangat adik', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Lengkapilah kalimat berikut: "Doni mengendarai ... baru ke taman." 🚲',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benda yang dikendarai ke taman adalah sepeda.',
                'options' => [
                    ['option_text' => 'Sepeda', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Bantal', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Sendok', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Susunlah kata acak ini: [bola - bermain - lapangan - di - anak-anak] ⚽',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Susunan yang benar adalah: Anak-anak bermain bola di lapangan.',
                'options' => [
                    ['option_text' => 'Anak-anak bermain bola di lapangan', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Lapangan di bola bermain anak-anak', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Bermain bola di anak-anak lapangan', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Kalimat "Buku tas di dalam tersimpan" adalah susunan kalimat yang benar.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Salah, susunan yang benar adalah "Buku tersimpan di dalam tas".',
                'options' => [
                    ['option_text' => 'Salah', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Benar', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
            [
                'question_text' => 'Kalimat "Kelinci melompat dengan riang" adalah contoh susunan kalimat yang baik.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benar, subjek kelinci melakukan kegiatan melompat dengan jelas.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
        ];

        // Generator dinamis untuk variasi susun kata tanpa batas
        $subjects = ['Rani', 'Edo', 'Ali', 'Dina', 'Bimo', 'Kakak', 'Paman', 'Kakek', 'Bibi', 'Sari'];
        $verbs = [
            ['v' => 'menggambar', 'o' => 'pemandangan indah', 'icon' => '🎨', 'wrong1' => 'pemandangan menggambar', 'wrong2' => 'indah menggambar pemandangan'],
            ['v' => 'menanam', 'o' => 'pohon mangga di kebun', 'icon' => '🌱', 'wrong1' => 'pohon menanam mangga di kebun', 'wrong2' => 'kebun di menanam pohon mangga'],
            ['v' => 'mencuci', 'o' => 'sepatu sampai bersih', 'icon' => '👟', 'wrong1' => 'sepatu mencuci bersih sampai', 'wrong2' => 'sampai bersih mencuci sepatu'],
            ['v' => 'membeli', 'o' => 'buah apel manis di pasar', 'icon' => '🍎', 'wrong1' => 'pasar di apel membeli manis buah', 'wrong2' => 'manis buah membeli di pasar apel'],
            ['v' => 'merapikan', 'o' => 'tempat tidur setiap pagi', 'icon' => '🛏️', 'wrong1' => 'pagi setiap tempat merapikan tidur', 'wrong2' => 'tidur tempat pagi merapikan setiap'],
            ['v' => 'menyanyikan', 'o' => 'lagu anak bersama teman', 'icon' => '🎵', 'wrong1' => 'lagu menyanyikan anak teman bersama', 'wrong2' => 'teman bersama menyanyikan lagu anak'],
            ['v' => 'membantu', 'o' => 'ibu menyiapkan makanan', 'icon' => '🍲', 'wrong1' => 'makanan menyiapkan membantu ibu', 'wrong2' => 'ibu makanan membantu menyiapkan'],
            ['v' => 'membawa', 'o' => 'payung saat hujan turun', 'icon' => '☔', 'wrong1' => 'hujan payung membawa saat turun', 'wrong2' => 'turun saat membawa payung hujan'],
        ];

        shuffle($subjects);
        shuffle($verbs);

        foreach ($verbs as $idx => $vb) {
            $subj = $subjects[$idx % count($subjects)];
            $correctSentence = "{$subj} {$vb['v']} {$vb['o']}";
            $wordsJumbled = "[{$vb['o']} - {$subj} - {$vb['v']}]";
            $questionText = "Susunlah kata-kata acak berikut menjadi kalimat yang padu: {$wordsJumbled} {$vb['icon']}";

            $pool[] = [
                'question_text' => $questionText,
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Susunan kalimat yang tepat dan runtut adalah \"{$correctSentence}\".",
                'options' => [
                    ['option_text' => $correctSentence, 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => "{$vb['wrong1']} {$subj}", 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => "{$subj} {$vb['wrong2']}", 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        return $pool;
    }

    private function getVowelConsonantPool(string $difficulty, string $prompt): array
    {
        return [
            [
                'question_text' => 'Manakah di bawah ini yang merupakan deretan huruf VOKAL? 🔤',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Huruf vokal dalam alfabet bahasa Indonesia adalah A, I, U, E, dan O.',
                'options' => [
                    ['option_text' => 'A, I, U, E, O', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'B, C, D, F, G', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'K, L, M, N, P', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Huruf pertama pada kata "APEL" adalah huruf vokal... 🍎',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Kata Apel diawali dengan huruf vokal A.',
                'options' => [
                    ['option_text' => 'A', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'I', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'U', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Huruf "B", "C", dan "D" termasuk ke dalam kelompok huruf Konsonan.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benar, huruf selain A, I, U, E, O adalah huruf konsonan.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
        ];
    }

    private function getAntonymSynonymPool(string $difficulty, string $prompt): array
    {
        return [
            [
                'question_text' => 'Lawan kata (antonim) dari kata "BESAR" adalah... 🐘↔️🐜',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Kebalikan dari besar adalah kecil.',
                'options' => [
                    ['option_text' => 'Kecil', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Tinggi', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Luas', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Lawan kata dari kata "TERANG" pada siang hari adalah... ☀️↔️🌙',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Kebalikan dari terang adalah gelap.',
                'options' => [
                    ['option_text' => 'Gelap', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Panas', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Silau', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Persamaan kata (sinonim) dari kata "SENANG" adalah "Gembira" 😊.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benar, senang dan gembira memiliki arti perasaan bahagia yang sama.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
        ];
    }

    private function getSyllablePool(string $difficulty, string $prompt): array
    {
        return [
            [
                'question_text' => 'Kata "B-U-K-U" jika dieja dan dibaca suku katanya menjadi... 📚',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'B-U (Bu) dan K-U (Ku) dibaca Buku.',
                'options' => [
                    ['option_text' => 'Buku', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Bolu', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Batu', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Berapa jumlah suku kata pada kata "SE-KO-LAH"? 🏫',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Kata Sekolah terdiri dari 3 suku kata: Se - ko - lah.',
                'options' => [
                    ['option_text' => '3 suku kata', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => '2 suku kata', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => '4 suku kata', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
        ];
    }

    private function getPunctuationPool(string $difficulty, string $prompt): array
    {
        return [
            [
                'question_text' => 'Huruf pertama pada penulisan awal kalimat harus menggunakan Huruf Kapital (Besar).',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benar, aturan penulisan yang baik mengharuskan huruf pertama kalimat ditulis kapital.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
            [
                'question_text' => 'Tanda baca yang diletakkan pada akhir kalimat berita adalah tanda... 📝',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Tanda titik (.) digunakan untuk mengakhiri kalimat berita.',
                'options' => [
                    ['option_text' => 'Titik (.)', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Tanya (?)', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Seru (!)', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
        ];
    }

    private function getMathPool(string $difficulty, string $prompt): array
    {
        $pool = [];
        $emojis = ['🍎', '⭐', '🎈', '🍭', '🚗', '🍓'];

        // Dynamic Penjumlahan
        for ($i = 0; $i < 4; $i++) {
            $a = rand(1, 5);
            $b = rand(1, 5);
            $sum = $a + $b;
            $emoji = $emojis[array_rand($emojis)];
            $visA = str_repeat($emoji, $a);
            $visB = str_repeat($emoji, $b);

            $pool[] = [
                'question_text' => "Berapa hasil penjumlahan {$a} + {$b}? ({$visA} + {$visB})",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "{$a} ditambah {$b} sama dengan {$sum}.",
                'options' => [
                    ['option_text' => "{$sum} {$emoji}", 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => ($sum + 1)." {$emoji}", 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => max(1, $sum - 1)." {$emoji}", 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        // Dynamic Pengurangan
        for ($i = 0; $i < 3; $i++) {
            $a = rand(4, 9);
            $b = rand(1, 3);
            $diff = $a - $b;
            $emoji = $emojis[array_rand($emojis)];

            $pool[] = [
                'question_text' => "Ada {$a} {$emoji}, lalu dimakan {$b} {$emoji}. Berapa sisa {$emoji} sekarang? 🧁",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "{$a} dikurang {$b} menyisakan {$diff}.",
                'options' => [
                    ['option_text' => "{$diff} {$emoji}", 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => ($diff + 1)." {$emoji}", 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => max(1, $diff - 1)." {$emoji}", 'is_correct' => false, 'sort_order' => 3],
                ],
            ];
        }

        // Geometri
        $pool[] = [
            'question_text' => 'Bentuk bangun datar yang memiliki 3 buah sisi dan 3 sudut adalah... 🔺',
            'type' => 'multiple_choice',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Segitiga memiliki 3 sisi dan 3 titik sudut.',
            'options' => [
                ['option_text' => 'Segitiga 🔺', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Lingkaran ⭕', 'is_correct' => false, 'sort_order' => 2],
                ['option_text' => 'Persegi ⏹️', 'is_correct' => false, 'sort_order' => 3],
            ],
        ];

        $pool[] = [
            'question_text' => 'Roda sepeda dan uang koin memiliki bentuk dasar Lingkaran ⭕.',
            'type' => 'true_false',
            'difficulty' => $difficulty,
            'points' => 10,
            'explanation' => 'Benar, roda dan koin berbentuk bundar/lingkaran.',
            'options' => [
                ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
            ],
        ];

        return $pool;
    }

    private function getEnglishPool(string $difficulty, string $prompt): array
    {
        $vocab = [
            ['en' => 'Cat', 'id' => 'Kucing', 'icon' => '🐱', 'w1' => 'Dog', 'w2' => 'Bird'],
            ['en' => 'Dog', 'id' => 'Anjing', 'icon' => '🐶', 'w1' => 'Cat', 'w2' => 'Rabbit'],
            ['en' => 'Apple', 'id' => 'Apel', 'icon' => '🍎', 'w1' => 'Banana', 'w2' => 'Orange'],
            ['en' => 'Red', 'id' => 'Merah', 'icon' => '🔴', 'w1' => 'Blue', 'w2' => 'Green'],
            ['en' => 'Blue', 'id' => 'Biru', 'icon' => '🔵', 'w1' => 'Yellow', 'w2' => 'Black'],
            ['en' => 'Sun', 'id' => 'Matahari', 'icon' => '☀️', 'w1' => 'Moon', 'w2' => 'Star'],
            ['en' => 'Book', 'id' => 'Buku', 'icon' => '📖', 'w1' => 'Bag', 'w2' => 'Pencil'],
            ['en' => 'Elephant', 'id' => 'Gajah', 'icon' => '🐘', 'w1' => 'Ant', 'w2' => 'Tiger'],
        ];
        shuffle($vocab);

        $pool = [];
        foreach ($vocab as $v) {
            $pool[] = [
                'question_text' => "What is the English word for \"{$v['id']}\"? {$v['icon']}",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "{$v['id']} in English is {$v['en']}.",
                'options' => [
                    ['option_text' => $v['en'], 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => $v['w1'], 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => $v['w2'], 'is_correct' => false, 'sort_order' => 3],
                ],
            ];

            $pool[] = [
                'question_text' => "\"{$v['en']}\" is the English translation of \"{$v['id']}\".",
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => "Yes, {$v['en']} means {$v['id']}.",
                'options' => [
                    ['option_text' => 'True (Benar)', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'False (Salah)', 'is_correct' => false, 'sort_order' => 2],
                ],
            ];
        }

        return $pool;
    }

    private function getIndonesianPool(string $difficulty, string $prompt): array
    {
        return array_merge(
            $this->getSentenceBuildingPool($difficulty, $prompt),
            $this->getVowelConsonantPool($difficulty, $prompt),
            $this->getAntonymSynonymPool($difficulty, $prompt),
            $this->getSyllablePool($difficulty, $prompt),
            $this->getPunctuationPool($difficulty, $prompt)
        );
    }

    private function getSciencePool(string $difficulty, string $prompt): array
    {
        return [
            [
                'question_text' => 'Bagian tubuh yang berfungsi sebagai indera pendengar suara adalah... 👂',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Telinga adalah alat indera untuk mendengar suara.',
                'options' => [
                    ['option_text' => 'Telinga 👂', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Mata 👀', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Hidung 👃', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Hewan manakah yang bergerak dengan cara berenang di dalam air? 🌊',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Ikan bernapas dengan insang dan berenang menggunakan sirip.',
                'options' => [
                    ['option_text' => 'Ikan 🐟', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Kucing 🐱', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Burung 🐦', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Tumbuhan memerlukan air 💧 dan sinar matahari ☀️ untuk tumbuh subur.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benar, tumbuhan berfotosintesis menggunakan bantuan cahaya matahari dan air.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
        ];
    }

    private function getSocialPool(string $difficulty, string $prompt): array
    {
        return [
            [
                'question_text' => 'Siapakah orang yang bertugas mengobati pasien di rumah sakit? 🏥',
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Dokter dan perawat bertugas merawat dan mengobati orang yang sakit.',
                'options' => [
                    ['option_text' => 'Dokter 👨‍⚕️', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Pilot 👨‍✈️', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Koki 👨‍🍳', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Ketika teman sedang kesulitan membawa barang, sikap kita adalah membantunya 🤝.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Tolong-menolong antar teman membuat suasana belajar menjadi rukun dan damai.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
        ];
    }

    private function getGeneralPool(string $difficulty, string $topicName): array
    {
        return [
            [
                'question_text' => "Manakah sikap anak cerdas dan mandiri saat belajar {$topicName}? 🌟",
                'type' => 'multiple_choice',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Fokus dan gembira saat belajar membuat materi mudah dipahami.',
                'options' => [
                    ['option_text' => 'Memperhatikan penjelasan guru & tersenyum', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Mengganggu teman yang sedang belajar', 'is_correct' => false, 'sort_order' => 2],
                    ['option_text' => 'Mencoret-coret meja', 'is_correct' => false, 'sort_order' => 3],
                ],
            ],
            [
                'question_text' => 'Mengucapkan terima kasih saat diberi bantuan adalah kebiasaan terpuji 💬.',
                'type' => 'true_false',
                'difficulty' => $difficulty,
                'points' => 10,
                'explanation' => 'Benar, bersikap santun dan bersyukur disukai banyak teman.',
                'options' => [
                    ['option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1],
                    ['option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2],
                ],
            ],
        ];
    }
}
