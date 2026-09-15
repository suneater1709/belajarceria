<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Story;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AdminStoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 20);

        $stories = Story::with('module', 'topic')
            ->withCount('vocabularies')
            ->orderBy('sort_order')
            ->paginate($perPage);

        return response()->json([
            'data' => $stories->items(),
            'meta' => [
                'current_page' => $stories->currentPage(),
                'last_page' => $stories->lastPage(),
                'per_page' => $stories->perPage(),
                'total' => $stories->total(),
            ],
        ]);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $story = Story::with('module', 'topic', 'vocabularies')->find($id);
        if (! $story) {
            return response()->json(['message' => 'Cerita tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $story,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:modules,id',
            'topic_id' => 'nullable|exists:topics,id',
            'title' => 'required|string|max:150',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string',
            'pdf_url' => 'nullable|string',
            'cover_image_url' => 'nullable|string',
            'level' => 'required|in:mudah,sedang,sulit',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'vocabularies' => 'nullable|array',
            'vocabularies.*.word' => 'required|string|max:100',
            'vocabularies.*.meaning' => 'required|string|max:255',
        ], [
            'module_id.required' => 'Modul wajib dipilih.',
            'title.required' => 'Judul cerita wajib diisi.',
            'level.required' => 'Tingkat kesulitan wajib dipilih.',
        ]);

        $vocabularies = $validated['vocabularies'] ?? [];
        unset($validated['vocabularies']);

        $story = Story::create($validated);

        if (! empty($vocabularies)) {
            foreach ($vocabularies as $idx => $v) {
                $story->vocabularies()->create([
                    'word' => $v['word'],
                    'meaning' => $v['meaning'],
                    'sort_order' => $idx + 1,
                ]);
            }
        }

        return response()->json([
            'data' => $story->load('module', 'topic', 'vocabularies'),
            'meta' => ['message' => 'Cerita berhasil ditambahkan.'],
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $story = Story::find($id);
        if (! $story) {
            return response()->json(['message' => 'Cerita tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'module_id' => 'sometimes|required|exists:modules,id',
            'topic_id' => 'nullable|exists:topics,id',
            'title' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string',
            'pdf_url' => 'nullable|string',
            'cover_image_url' => 'nullable|string',
            'level' => 'sometimes|required|in:mudah,sedang,sulit',
            'sort_order' => 'nullable|integer',
            'is_active' => 'nullable|boolean',
            'vocabularies' => 'nullable|array',
            'vocabularies.*.word' => 'required|string|max:100',
            'vocabularies.*.meaning' => 'required|string|max:255',
        ]);

        $vocabularies = $validated['vocabularies'] ?? null;
        unset($validated['vocabularies']);

        $story->update($validated);

        if ($vocabularies !== null) {
            $story->vocabularies()->delete();
            foreach ($vocabularies as $idx => $v) {
                $story->vocabularies()->create([
                    'word' => $v['word'],
                    'meaning' => $v['meaning'],
                    'sort_order' => $idx + 1,
                ]);
            }
        }

        return response()->json([
            'data' => $story->load('module', 'topic', 'vocabularies'),
            'meta' => ['message' => 'Cerita berhasil diperbarui.'],
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $story = Story::find($id);
        if (! $story) {
            return response()->json(['message' => 'Cerita tidak ditemukan.'], 404);
        }

        $story->delete();

        return response()->json([
            'data' => ['message' => 'Cerita berhasil dihapus.'],
        ]);
    }

    public function storeVocabulary(Request $request, $id): JsonResponse
    {
        $story = Story::find($id);
        if (! $story) {
            return response()->json(['message' => 'Cerita tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'word' => 'required|string|max:100',
            'meaning' => 'required|string|max:255',
            'audio_url' => 'nullable|string|max:255',
            'image_url' => 'nullable|string|max:255',
            'sort_order' => 'nullable|integer',
        ], [
            'word.required' => 'Kata wajib diisi.',
            'meaning.required' => 'Arti kata wajib diisi.',
        ]);

        $vocab = $story->vocabularies()->create($validated);

        return response()->json([
            'data' => $vocab,
            'meta' => ['message' => 'Kosakata berhasil ditambahkan ke cerita.'],
        ], 201);
    }

    /**
     * Generate konten cerita anak dan kosakata baru otomatis menggunakan AI.
     */
    public function generateAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'module_id' => 'nullable|exists:modules,id',
            'topic_id' => 'nullable|exists:topics,id',
            'theme' => 'required|string|max:300',
            'level' => 'nullable|in:mudah,sedang,sulit',
        ]);

        $theme = trim($validated['theme'] ?? 'Persahabatan Hewan di Hutan Ceria');
        $level = $validated['level'] ?? 'mudah';

        $apiKey = env('GEMINI_API_KEY');
        $generatedStory = null;

        if (! empty($apiKey)) {
            try {
                $systemPrompt = 'Kamu adalah penulis buku cerita anak Islami & fabel edukatif profesional (usia TK dan SD Kelas 1-3) untuk aplikasi Belajar Ceria. '
                    ."TUGAS UTAMA: Buatkan 1 cerita anak yang BENAR-BENAR SESUAI DENGAN TEMA BERIKUT: '{$theme}'. Jangan ganti tema cerita dengan tema lain! "
                    .'Jika tema menyebutkan hewan tertentu (seperti Kancil, Kura-kura, Kelinci, Gajah, Semut, Burung, Kucing, Buaya, Kera, dsb.), jadikan hewan tersebut sebagai tokoh utama dalam cerita. '
                    .'Jika tema bernuansa nilai budi pekerti atau Islami (seperti kejujuran, sedekah, tolong-menolong, sholat, kebersihan, rasa syukur), fokuskan alur cerita pada nilai tersebut. '
                    ."Tingkat kesulitan bahasa: {$level}. Gunakan bahasa Indonesia yang santun, hangat, ceria, dan memikat imajinasi anak. "
                    .'Keluarkan output HANYA dalam format JSON murni tanpa pembuka/penutup markdown ```json. '
                    .'Format skema JSON: '
                    .'{"title":"Judul Cerita yang Menarik & Sesuai Tema","description":"Sinopsis singkat 1-2 kalimat","content":"Isi cerita lengkap (3-4 paragraf yang dipisahkan oleh enter ganda \\n\\n)","level":"'.$level.'","vocabularies":[{"word":"Kata1","meaning":"Arti kata dalam bahasa anak"},{"word":"Kata2","meaning":"Arti kata..."},{"word":"Kata3","meaning":"Arti kata..."}]}';

                $response = Http::timeout(20)->post(
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
                            'temperature' => 0.7,
                        ],
                    ]
                );

                if ($response->successful()) {
                    $jsonText = $response->json('candidates.0.content.parts.0.text');
                    $parsed = json_decode($jsonText, true);
                    if (is_array($parsed) && ! empty($parsed['title'])) {
                        $generatedStory = $parsed;
                    }
                }
            } catch (\Throwable $e) {
                // Fallback to smart template generator
            }
        }

        if (empty($generatedStory)) {
            $generatedStory = $this->generateFallbackStory($theme, $level);
        }

        return response()->json([
            'success' => true,
            'data' => $generatedStory,
            'meta' => [
                'theme' => $theme,
                'level' => $level,
                'source' => ! empty($apiKey) ? 'gemini_ai' : 'smart_story_engine',
            ],
        ]);
    }

    /**
     * Smart generator cerita anak kontekstual sesuai kata kunci tema input.
     */
    private function generateFallbackStory(string $theme, string $level): array
    {
        $lower = strtolower($theme);

        // 1. Fabel Kancil & Kura-kura
        if (str_contains($lower, 'kancil') && (str_contains($lower, 'kura') || str_contains($lower, 'penyu'))) {
            return [
                'title' => 'Kancil yang Cerdik dan Kura-Kura yang Rendah Hati',
                'description' => 'Kisah persahabatan Kancil yang lincah dan Kura-Kura yang sabar saat bersama-sama menyeberangi sungai jernih di Hutan Ceria.',
                'content' => "Di sebuah hutan yang hijau dan sejuk, hiduplah seekor kancil yang cerdik bernama Kiki dan kura-kura yang bijaksana bernama Koko. Meskipun Kiki bisa berlari sangat cepat, ia selalu menghargai Koko yang berjalan perlahan dan berhati-hati.\n\nSuatu pagi, mereka ingin menikmati buah ara manis di seberang sungai. Arus sungai cukup deras, sehingga Kiki kesulitan untuk menyeberang. Dengan tenang, Koko tersenyum dan berkata, \"Pegang tempurungku yang kuat, Kiki. Kita akan menyeberang bersama-sama dengan aman.\"\n\nKiki menaiki punggung Koko sambil memberikan arahan jalan dari atas. Keduanya berhasil menyeberang dan menikmati buah ara bersama sahabat-sahabat rimba lainnya. Kiki belajar bahwa kecepatan bukanlah segalanya, tetapi kerja sama dan kesabaran adalah kunci keberhasilan.",
                'level' => $level,
                'vocabularies' => [
                    ['word' => 'Bijaksana', 'meaning' => 'Selalu berpikir dengan baik, tenang, dan tidak terburu-buru'],
                    ['word' => 'Tempurung', 'meaning' => 'Cangkang keras pelindung di punggung kura-kura'],
                    ['word' => 'Rimba', 'meaning' => 'Hutan luas yang dipenuhi pepohonan asri dan aneka hewan'],
                ],
            ];
        }

        // 2. Fabel Kancil & Hewan Rimba lainnya
        if (str_contains($lower, 'kancil')) {
            return [
                'title' => 'Petualangan Kancil yang Cerdik dan Sahabat Hutan',
                'description' => 'Kancil yang cerdik menggunakan kecerdasannya untuk membantu teman-temannya di tepi sungai yang permai.',
                'content' => "Pagi yang cerah menyinari Hutan Ceria. Kancil yang lincah dan pintar sedang berjalan-jalan di tepi sungai sambil bernyanyi riang.\n\nDi tengah jalan, ia bertemu dengan anak burung yang sayapnya tersangkut di ranting pohon yang rendah. Dengan sigap dan cerdik, Kancil menyusun batu-batu kecil dan melompat perlahan untuk melepaskan ranting tersebut dengan lembut.\n\nBurung kecil itu bisa terbang kembali dan mencicit gembira. Ibu Burung memberikan buah beri merah manis sebagai ucapan terima kasih. Kancil tersenyum ramah karena kecerdasan yang dimilikinya digunakan untuk menolong sesama makhluk hidup.",
                'level' => $level,
                'vocabularies' => [
                    ['word' => 'Cerdik', 'meaning' => 'Banyak akal yang baik dan pandai mencari jalan keluar'],
                    ['word' => 'Sigap', 'meaning' => 'Tangkas, cepat, dan penuh semangat saat bertindak'],
                    ['word' => 'Mencicit', 'meaning' => 'Suara kicauan burung kecil yang riang'],
                ],
            ];
        }

        // 3. Fabel Kura-kura & Kelinci / Lomba Lari
        if (str_contains($lower, 'kura') || (str_contains($lower, 'kelinci') && str_contains($lower, 'kura'))) {
            return [
                'title' => 'Kura-Kura yang Pantang Menyerah',
                'description' => 'Kura-kura mengajarkan arti kegigihan dan ketekunan dalam meraih tujuan tanpa mudah putus asa.',
                'content' => "Di tepi padang rumput yang luas, Koko si kura-kura kecil bercita-cita mendaki bukit bunga untuk melihat pemandangan matahari terbit yang indah.\n\nTeman-temannya sering berkata bahwa perjalanannya akan memakan waktu lama. Namun, Koko tidak berkecil hati. Setiap hari ia melangkah setapak demi setapak dengan penuh semangat dan keteguhan hati.\n\nSaat fajar tiba, Koko akhirnya sampai di puncak bukit. Cahaya keemasan matahari menyinari tubuhnya dengan sangat hangat. Semua hewan di hutan mengagumi kegigihan Koko yang membuktikan bahwa siapa yang bersungguh-sungguh pasti akan berhasil.",
                'level' => $level,
                'vocabularies' => [
                    ['word' => 'Kegigihan', 'meaning' => 'Kemauan yang kuat dan tidak mudah menyerah'],
                    ['word' => 'Tekun', 'meaning' => 'Rajin, bersungguh-sungguh, dan terus berusaha'],
                    ['word' => 'Fajar', 'meaning' => 'Waktu pagi hari saat matahari baru mulai terbit'],
                ],
            ];
        }

        // 4. Tema Luar Angkasa / Bintang / Bulan / Planet
        if (str_contains($lower, 'bintang') || str_contains($lower, 'angkasa') || str_contains($lower, 'roket') || str_contains($lower, 'bulan') || str_contains($lower, 'planet')) {
            return [
                'title' => 'Petualangan Bintang Kejora dan Roket Cilik',
                'description' => 'Kisah seru Roket Kiki yang terbang ke langit malam untuk membantu Bintang Kejora bersinar kembali.',
                'content' => "Di langit malam yang bertabur cahaya, hiduplah sebuah roket kecil bernama Kiki. Kiki senang sekali terbang mengelilingi bulan sambil menyapa awan-awan lembut yang tertidur nyenyak.\n\nSuatu malam, Kiki melihat Bintang Kejora tampak redup dan bersedih. \"Hai Bintang Kejora, mengapa cahayamu tidak berkilau seperti biasanya?\" tanya Kiki dengan penuh perhatian. Bintang Kejora menjawab bahwa debu angkasa menutupi selimut cahayanya.\n\nDengan riang gembira, Kiki membersihkan debu-debu tersebut menggunakan hembusan angin roketnya yang lembut. Seketika itu juga, Bintang Kejora kembali bersinar sangat terang dan tersenyum bahagia. Sejak saat itu, mereka menjadi sahabat sejati yang selalu saling menjaga di angkasa luas.",
                'level' => $level,
                'vocabularies' => [
                    ['word' => 'Kejora', 'meaning' => 'Bintang yang bersinar sangat terang di waktu fajar atau senja'],
                    ['word' => 'Angkasa', 'meaning' => 'Langit luas tempat bintang, bulan, dan planet berada'],
                    ['word' => 'Berkilau', 'meaning' => 'Tampak bersinar gemerlap dan indah'],
                ],
            ];
        }

        // 5. Fabel Hewan Rimba / Kucing / Burung / Semut / Gajah
        if (str_contains($lower, 'kucing') || str_contains($lower, 'hewan') || str_contains($lower, 'gajah') || str_contains($lower, 'semut') || str_contains($lower, 'burung') || str_contains($lower, 'kelinci') || str_contains($lower, 'fabel')) {
            return [
                'title' => 'Mimi Kucing Pemberani dan Sahabat Rimba',
                'description' => 'Mimi si anak kucing berbulu putih belajar arti kebersamaan dan tolong-menolong di hutan yang asri.',
                'content' => "Di sebuah desa di tepi hutan yang sejuk, hiduplah seekor anak kucing manis bernama Mimi. Bulunya seputih awan dan matanya berbinar seperti kelereng kaca.\n\nSuatu sore saat bermain bola benang, Mimi mendengar suara ciutan lirih dari atas dahan pohon. Ternyata seekor burung pipit kecil sedang kedinginan karena sarangnya terkena hembusan angin kencang.\n\nTanpa ragu, Mimi mengumpulkan dedaunan kering yang hangat dan menyusunnya kembali untuk si burung pipit. Ibu Burung Pipit sangat berterima kasih dan menghadiahi Mimi nyanyian merdu yang menenangkan hati. Mimi tersenyum bangga karena berbuat baik membuat hati terasa hangat.",
                'level' => $level,
                'vocabularies' => [
                    ['word' => 'Rimba', 'meaning' => 'Hutan lebat yang dipenuhi pepohonan tinggi dan banyak hewan'],
                    ['word' => 'Lirih', 'meaning' => 'Suara pelan, lembut, dan terdengar samar'],
                    ['word' => 'Asri', 'meaning' => 'Indah, sejuk, dan sedap dipandang mata'],
                ],
            ];
        }

        // 6. Tema Kejujuran & Nilai Budi Pekerti
        if (str_contains($lower, 'jujur') || str_contains($lower, 'kejujuran') || str_contains($lower, 'pohon')) {
            return [
                'title' => 'Pohon Kejujuran di Kebun Ceria',
                'description' => 'Dodi dan Lani menemukan rahasia buah manis yang hanya berbuah jika kita selalu berkata jujur.',
                'content' => "Dodi dan Lani adalah dua sahabat yang suka berkebun di halaman sekolah. Di sudut kebun, tumbuh sebuah pohon ajaib berdaun keemasan yang sangat cantik.\n\nPak Guru bercerita bahwa pohon itu adalah Pohon Kejujuran. Setiap kali anak-anak berkata jujur dan berbuat baik kepada temannya, bunga-bunga di pohon akan mekar menjadi buah yang manis luar biasa.\n\nKetika Dodi secara tidak sengaja menumpahkan air siraman Lani, Dodi langsung meminta maaf dengan jujur tanpa takut. Ajaib, seketika itu sekuntum bunga merah muda berubah menjadi buah apel yang harum. Dodi dan Lani membagi buah itu bersama teman-teman dengan tawa ceria.",
                'level' => $level,
                'vocabularies' => [
                    ['word' => 'Jujur', 'meaning' => 'Berkata sesuai dengan kenyataan dan tidak berbohong'],
                    ['word' => 'Mekar', 'meaning' => 'Kuncup bunga yang terbuka menjadi indah'],
                    ['word' => 'Keemasan', 'meaning' => 'Berwarna kuning berkilau seperti emas'],
                ],
            ];
        }

        // 7. Dynamic Synthesis untuk Tema Bebas Lainnya
        $capitalizedTheme = ucwords($theme);

        return [
            'title' => "Kisah Indah: {$capitalizedTheme}",
            'description' => "Cerita hangat dan mendidik tentang petualangan {$theme} yang sarat akan pesan budi pekerti.",
            'content' => "Di sebuah tempat yang indah dan penuh keceriaan, dimulailah sebuah kisah tentang {$theme}. Setiap hari membawa pengalaman baru yang menyenangkan dan penuh warna.\n\nSuatu hari, terjadi sebuah peristiwa yang mengajarkan arti tolong-menolong, saling menghargai, dan kebaikan hati. Ketika menghadapi tantangan bersama-sama, segalanya terasa jauh lebih mudah dan membahagiakan.\n\nDengan senyum tulus dan hati yang gembira, semua sahabat belajar bahwa kebaikan kecil yang kita lakukan dengan ikhlas akan membawa kebahagiaan besar bagi semua orang di sekitar kita.",
            'level' => $level,
            'vocabularies' => [
                ['word' => 'Ikhlas', 'meaning' => 'Melakukan kebaikan dengan tulus dari dalam hati'],
                ['word' => 'Tulus', 'meaning' => 'Sungguh-sungguh dan bersih hatinya tanpa pamrih'],
                ['word' => 'Keceriaan', 'meaning' => 'Suasana gembira, riang, dan penuh tawa hangat'],
            ],
        ];
    }

    /**
     * Generate 1 gambar ilustrasi cover cerita anak otomatis menggunakan AI (Gaya Animasi Islami / Kartun Hewan Lembut).
     */
    public function generateAiImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:500',
            'theme' => 'nullable|string|max:300',
            'target_usia' => 'nullable|string|max:50',
            'level' => 'nullable|in:mudah,sedang,sulit',
            'seed' => 'nullable|integer',
        ]);

        $title = $validated['title'];
        $theme = $validated['theme'] ?? $validated['description'] ?? $title;
        $lower = strtolower($theme.' '.$title);

        // Tentukan subjek spesifik (hewan kartun vs anak animasi islami)
        $subjectPrompt = 'cute friendly cartoon animals';
        if (str_contains($lower, 'kancil') && (str_contains($lower, 'kura') || str_contains($lower, 'penyu'))) {
            $subjectPrompt = 'a cute little mousedeer (kancil) and a friendly small turtle wearing green shell';
        } elseif (str_contains($lower, 'kancil')) {
            $subjectPrompt = 'an adorable clever mousedeer (kancil) cartoon character';
        } elseif (str_contains($lower, 'kura')) {
            $subjectPrompt = 'a cheerful cute cartoon turtle character';
        } elseif (str_contains($lower, 'kucing')) {
            $subjectPrompt = 'a cute fluffy cartoon kitten';
        } elseif (str_contains($lower, 'kelinci')) {
            $subjectPrompt = 'a cute smiling cartoon bunny rabbit';
        } elseif (str_contains($lower, 'gajah')) {
            $subjectPrompt = 'a cute baby elephant cartoon character';
        } elseif (str_contains($lower, 'bintang') || str_contains($lower, 'angkasa') || str_contains($lower, 'roket')) {
            $subjectPrompt = 'a cute little smiling toy rocket and glowing yellow star character';
        } elseif (str_contains($lower, 'islam') || str_contains($lower, 'sholat') || str_contains($lower, 'doa') || str_contains($lower, 'masjid') || str_contains($lower, 'santri')) {
            $subjectPrompt = 'cute modest cartoon muslim children with friendly smiles in a peaceful garden';
        }

        // Susun prompt ilustrasi anak bergaya 2D kartun / flat animation islami yang sopan & lembut
        $imagePrompt = "Charming 2D children storybook illustration of {$subjectPrompt} for story titled '{$title}', vibrant soft pastel colors, whimsical storybook art, flat vector cartoon animation style, wholesome, gentle, innocent, highly detailed clean vector graphics, kid-friendly fairytale background, no text, no letters, no words, no photo realistic human faces.";

        $seed = $validated['seed'] ?? rand(1000, 999999);
        $encodedPrompt = urlencode($imagePrompt);

        // Menggunakan pollinations flux image endpoint
        $imageUrl = "https://image.pollinations.ai/prompt/{$encodedPrompt}?width=800&height=600&nologo=true&seed={$seed}&model=flux";

        return response()->json([
            'success' => true,
            'data' => [
                'image_url' => $imageUrl,
                'prompt' => $imagePrompt,
                'seed' => $seed,
            ],
            'meta' => [
                'title' => $title,
                'message' => 'Gambar ilustrasi cerita bergaya kartun edukasi berhasil di-generate.',
            ],
        ]);
    }
}
