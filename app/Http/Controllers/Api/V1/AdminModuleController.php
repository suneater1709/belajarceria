<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

class AdminModuleController extends Controller
{
    // --- MODULES ---
    public function indexModules(Request $request): JsonResponse
    {
        $modules = Module::withCount(['topics', 'stories'])->orderBy('sort_order')->get();

        return response()->json(['data' => $modules]);
    }

    public function storeModule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:modules,code',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color_theme' => 'nullable|string|max:20|regex:/^#[0-9A-Fa-f]{6}$/',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ], [
            'code.required' => 'Kode modul unik wajib diisi.',
            'code.unique' => 'Kode modul ini sudah digunakan.',
            'name.required' => 'Nama modul wajib diisi.',
            'color_theme.regex' => 'Format warna harus berupa hex (contoh: #6366F1).',
        ]);

        $module = Module::create($validated);

        return response()->json([
            'data' => $module,
            'meta' => ['message' => 'Modul berhasil ditambahkan.'],
        ], 201);
    }

    public function updateModule(Request $request, $id): JsonResponse
    {
        $module = Module::find($id);
        if (! $module) {
            return response()->json(['message' => 'Modul tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('modules')->ignore($module->id)],
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'color_theme' => 'nullable|string|max:20|regex:/^#[0-9A-Fa-f]{6}$/',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $module->update($validated);

        return response()->json([
            'data' => $module,
            'meta' => ['message' => 'Modul berhasil diperbarui.'],
        ]);
    }

    public function destroyModule(Request $request, $id): JsonResponse
    {
        $module = Module::find($id);
        if (! $module) {
            return response()->json(['message' => 'Modul tidak ditemukan.'], 404);
        }

        $module->delete();

        return response()->json([
            'data' => ['message' => 'Modul berhasil dihapus.'],
        ]);
    }

    // --- TOPICS ---
    public function indexTopics(Request $request, $module_id): JsonResponse
    {
        $module = Module::find($module_id);
        if (! $module) {
            return response()->json(['message' => 'Modul tidak ditemukan.'], 404);
        }

        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 20);

        $topics = Topic::where('module_id', $module->id)
            ->withCount('questions')
            ->orderBy('sort_order')
            ->paginate($perPage);

        return response()->json([
            'data' => $topics->items(),
            'meta' => [
                'current_page' => $topics->currentPage(),
                'last_page' => $topics->lastPage(),
                'per_page' => $topics->perPage(),
                'total' => $topics->total(),
            ],
        ]);
    }

    public function storeTopic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'difficulty' => 'required|in:mudah,sedang,sulit',
            'min_age_level' => 'required|in:4-5,6-7,8',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ], [
            'module_id.required' => 'Modul wajib dipilih.',
            'name.required' => 'Nama topik wajib diisi.',
            'difficulty.required' => 'Tingkat kesulitan wajib ditentukan.',
            'min_age_level.required' => 'Usia minimal wajib dipilih.',
        ]);

        $autoGenerate = $request->boolean('auto_generate_questions', false);
        $questionCount = (int) ($request->input('question_count') ?? 5);

        $topic = DB::transaction(function () use ($validated, $autoGenerate, $questionCount, $request) {
            $t = Topic::create($validated);
            if ($autoGenerate) {
                try {
                    $questionCtrl = new AdminQuestionController;
                    $questionCtrl->createQuestionsForTopic(
                        $t,
                        $questionCount,
                        $t->difficulty ?? 'mudah',
                        'multiple_choice',
                        $request->input('prompt_hint', ''),
                        $request->user()?->id
                    );
                } catch (\Throwable $e) {
                    // Do not fail topic creation if question generation encounters an issue
                }
            }

            return $t;
        });

        $topic->loadCount('questions');

        return response()->json([
            'data' => $topic,
            'meta' => [
                'message' => $autoGenerate && $topic->questions_count > 0
                    ? "Topik dan {$topic->questions_count} butir soal kuis berhasil ditambahkan."
                    : 'Topik berhasil ditambahkan.',
            ],
        ], 201);
    }

    public function updateTopic(Request $request, $id): JsonResponse
    {
        $topic = Topic::find($id);
        if (! $topic) {
            return response()->json(['message' => 'Topik tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'difficulty' => 'sometimes|required|in:mudah,sedang,sulit',
            'min_age_level' => 'sometimes|required|in:4-5,6-7,8',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
        ]);

        $topic->update($validated);

        return response()->json([
            'data' => $topic,
            'meta' => ['message' => 'Topik berhasil diperbarui.'],
        ]);
    }

    public function destroyTopic(Request $request, $id): JsonResponse
    {
        $topic = Topic::find($id);
        if (! $topic) {
            return response()->json(['message' => 'Topik tidak ditemukan.'], 404);
        }

        // Soft delete
        $topic->delete();

        return response()->json([
            'data' => ['message' => 'Topik berhasil dihapus.'],
        ]);
    }

    /**
     * Generate metadata topik edukasi anak secara otomatis menggunakan AI / Smart Curriculum Engine.
     */
    public function generateAiTopic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'prompt' => 'nullable|string|max:255',
            'difficulty' => 'nullable|in:mudah,sedang,sulit',
            'min_age_level' => 'nullable|in:4-5,6-7,8',
        ]);

        $module = Module::find($validated['module_id']);
        $prompt = trim($validated['prompt'] ?? '');
        $difficulty = $validated['difficulty'] ?? 'mudah';
        $minAgeLevel = $validated['min_age_level'] ?? '4-5';

        $apiKey = env('GEMINI_API_KEY');
        $generatedTopic = null;

        if (! empty($apiKey)) {
            try {
                $systemPrompt = 'Kamu adalah perancang kurikulum edukasi anak usia dini (TK / SD Kelas 1-3) untuk aplikasi Belajar Ceria. '
                    ."Buatkan 1 judul topik pembelajaran baru yang menarik, ceria, dan mendidik untuk modul: '{$module->name}' ({$module->description}). "
                    .($prompt ? "Ide / fokus khusus dari admin: '{$prompt}'. " : '')
                    ."Tingkat kesulitan: {$difficulty}, Target usia: {$minAgeLevel} tahun. "
                    .'PENTING: Keluarkan output berupa objek JSON murni tanpa markdown ```. '
                    .'Format JSON: {"name":"Nama Topik Singkat & Ceria (max 60 karakter)","description":"Deskripsi materi 1-2 kalimat ringkas ramah anak","icon":"1 karakter emoji yang paling sesuai","difficulty":"'.$difficulty.'","min_age_level":"'.$minAgeLevel.'"}';

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
                    if (is_array($parsed) && ! empty($parsed['name'])) {
                        $generatedTopic = [
                            'module_id' => $module->id,
                            'name' => $parsed['name'],
                            'description' => $parsed['description'] ?? "Materi seru seputar {$parsed['name']}.",
                            'icon' => $parsed['icon'] ?? '📚',
                            'difficulty' => in_array($parsed['difficulty'] ?? '', ['mudah', 'sedang', 'sulit']) ? $parsed['difficulty'] : $difficulty,
                            'min_age_level' => in_array($parsed['min_age_level'] ?? '', ['4-5', '6-7', '8']) ? $parsed['min_age_level'] : $minAgeLevel,
                        ];
                    }
                }
            } catch (\Throwable $e) {
                // Fallback to local curriculum engine
            }
        }

        if (empty($generatedTopic)) {
            $generatedTopic = $this->generateFallbackTopic($module, $prompt, $difficulty, $minAgeLevel);
        }

        return response()->json([
            'success' => true,
            'data' => $generatedTopic,
            'meta' => [
                'module' => $module->name,
                'source' => ! empty($apiKey) ? 'gemini_ai' : 'smart_curriculum_engine',
            ],
        ]);
    }

    /**
     * Fallback cerdas untuk generate topik berdasarkan modul dan kata kunci.
     */
    private function generateFallbackTopic(Module $module, string $prompt, string $difficulty, string $minAgeLevel): array
    {
        $code = strtolower($module->code ?? '');
        $promptLower = strtolower($prompt);

        // Basis topik default per modul jika tanpa prompt khusus
        $catalog = [
            'bahasa-arab' => [
                ['name' => 'Mengenal Angka Arab 1-10', 'desc' => 'Belajar mengenal angka satu sampai sepuluh dalam bahasa Arab dengan riang gembira.', 'icon' => '🔢'],
                ['name' => 'Huruf Hijaiyah: Dal sampai Ro', 'desc' => 'Mengenal bentuk, bunyi, dan penulisan huruf Dal, Dzal, dan Ro.', 'icon' => '📖'],
                ['name' => 'Mufrodat Benda di Kelas', 'desc' => 'Menghafal kosakata perlengkapan sekolah seperti buku, pensil, dan meja dalam bahasa Arab.', 'icon' => '✏️'],
                ['name' => 'Sapaan Ramah & Ucapan Syukur', 'desc' => 'Mengenal ungkapan salam, ucapan terima kasih (Syukron), dan sapaan islami sehari-hari.', 'icon' => '🤝'],
            ],
            'matematika' => [
                ['name' => 'Petualangan Penjumlahan Bergambar', 'desc' => 'Bermain menghitung jumlah buah dan bintang dengan cara visual yang mudah dipahami.', 'icon' => '🍎'],
                ['name' => 'Mengenal Bentuk Geometri di Sekitar', 'desc' => 'Menemukan bentuk lingkaran, segitiga, dan persegi kotak pada benda sehari-hari.', 'icon' => '🔺'],
                ['name' => 'Belajar Berhitung Mundur 10 ke 1', 'desc' => 'Latihan logika urutan angka mundur seperti roket yang siap meluncur.', 'icon' => '🚀'],
            ],
            'bahasa-indonesia' => [
                ['name' => 'Mengenal Huruf Vokal A-I-U-E-O', 'desc' => 'Mengenal bunyi dan bentuk huruf vokal dasar sebagai fondasi awal membaca kata.', 'icon' => '🔤'],
                ['name' => 'Membaca Suku Kata Terbuka (Ba-Bi-Bu)', 'desc' => 'Latihan mengeja dan merangkai dua huruf menjadi kata bermakna.', 'icon' => '📖'],
                ['name' => 'Mengenal Lawan Kata (Besar-Kecil)', 'desc' => 'Belajar perbandingan kata sifat sehari-hari dengan ilustrasi ceria.', 'icon' => '🐘'],
            ],
            'bahasa-inggris' => [
                ['name' => 'Colors and Shapes Around Us', 'desc' => 'Mengenal aneka warna pelangi dan bentuk benda dalam bahasa Inggris.', 'icon' => '🎨'],
                ['name' => 'Cute Animals & Their Sounds', 'desc' => 'Menyebutkan nama-nama hewan peliharaan dan suaranya dalam bahasa Inggris.', 'icon' => '🐱'],
                ['name' => 'Family Members & Greetings', 'desc' => 'Menyapa ayah, ibu, dan teman menggunakan ungkapan bahasa Inggris yang santun.', 'icon' => '👋'],
            ],
            'ipa' => [
                ['name' => 'Mengenal 5 Panca Indera Kita', 'desc' => 'Mengetahui fungsi mata, telinga, hidung, lidah, dan kulit untuk merasakan dunia.', 'icon' => '👀'],
                ['name' => 'Dunia Hewan Air & Hewan Darat', 'desc' => 'Mengenal tempat tinggal hewan dan cara mereka bergerak mencari makan.', 'icon' => '🐠'],
                ['name' => 'Rahasia Matahari, Hujan & Pelangi', 'desc' => 'Mengenal fenomena cuaca alam dan siklus air secara menyenangkan.', 'icon' => '🌈'],
            ],
            'ips' => [
                ['name' => 'Keluargaku yang Penuh Kasih', 'desc' => 'Mengenal peran ayah, ibu, kakek, nenek, dan pentingnya saling menyayangi.', 'icon' => '🏡'],
                ['name' => 'Ragam Profesi & Cita-Cita Hebat', 'desc' => 'Mengenal tugas mulia dokter, guru, pemadam kebakaran, dan polisi.', 'icon' => '👨‍⚕️'],
                ['name' => 'Gotong Royong & Tertib di Jalan', 'desc' => 'Belajar tolong-menolong bersama tetangga dan mengenal rambu lalu lintas sederhana.', 'icon' => '🚦'],
            ],
            'cerita' => [
                ['name' => 'Kisah Kejujuran Kelinci Putih', 'desc' => 'Cerita fabel interaktif tentang indahnya selalu berkata jujur dan bertanggung jawab.', 'icon' => '🐰'],
                ['name' => 'Petualangan Sahabat Hutan Ceria', 'desc' => 'Dongeng seru tentang kerjasama antar hewan saat menolong anak burung.', 'icon' => '🌳'],
            ],
        ];

        // Jika ada prompt / kata kunci spesifik dari admin, susun topik yang relevan secara dinamis
        if (! empty($prompt)) {
            $formattedName = ucwords($prompt);
            $icon = '📚';
            if (str_contains($promptLower, 'angka') || str_contains($promptLower, 'hitung')) {
                $icon = '🔢';
            } elseif (str_contains($promptLower, 'hewan') || str_contains($promptLower, 'animal')) {
                $icon = '🐾';
            } elseif (str_contains($promptLower, 'warna') || str_contains($promptLower, 'seni')) {
                $icon = '🎨';
            } elseif (str_contains($promptLower, 'bintang') || str_contains($promptLower, 'alam') || str_contains($promptLower, 'langit')) {
                $icon = '⭐';
            } elseif (str_contains($promptLower, 'arab') || str_contains($promptLower, 'hijaiyah')) {
                $icon = '📖';
            } elseif (str_contains($promptLower, 'huruf') || str_contains($promptLower, 'baca')) {
                $icon = '🔤';
            }

            return [
                'module_id' => $module->id,
                'name' => "Mengenal {$formattedName}",
                'description' => "Eksplorasi seru dan pembelajaran interaktif seputar {$prompt} untuk anak ceria.",
                'icon' => $icon,
                'difficulty' => $difficulty,
                'min_age_level' => $minAgeLevel,
            ];
        }

        $modulePool = $catalog[$code] ?? [
            ['name' => "Topik Pembelajaran {$module->name}", 'desc' => "Materi edukatif interaktif untuk anak pada modul {$module->name}.", 'icon' => '✨'],
        ];

        $selected = $modulePool[array_rand($modulePool)];

        return [
            'module_id' => $module->id,
            'name' => $selected['name'],
            'description' => $selected['desc'],
            'icon' => $selected['icon'],
            'difficulty' => $difficulty,
            'min_age_level' => $minAgeLevel,
        ];
    }
}
