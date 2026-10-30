<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class PdfBankSoalSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::where('role', 'admin')->first();
        $adminId = $admin ? $admin->id : null;

        $jsonFiles = [
            'bank_soal_bahasa_arab.json' => [
                'name' => 'Bahasa Arab',
                'description' => 'Kenali huruf hijaiyah, harakat, dan kata pertamamu!',
                'icon' => 'moon',
                'color_theme' => '#0F766E',
                'sort_order' => 2,
            ],
            'bank_soal_bahasa_indonesia.json' => [
                'name' => 'Bahasa Indonesia Ceria',
                'description' => 'Membaca, menulis, dan bercerita dengan gembira!',
                'icon' => 'flag',
                'color_theme' => '#EF4444',
                'sort_order' => 3,
            ],
            'bank_soal_bahasa_inggris.json' => [
                'name' => 'English Fun Quest',
                'description' => 'Let\'s play, read, and speak English together!',
                'icon' => 'globe',
                'color_theme' => '#14B8A6',
                'sort_order' => 4,
            ],
            'bank_soal_kognitif.json' => [
                'name' => 'Kognitif Area',
                'description' => 'Asah logika, pola, dan cara berpikir seperti programmer cilik!',
                'icon' => 'flask-conical',
                'color_theme' => '#38BDF8',
                'sort_order' => 5,
            ],
            'bank_soal_social_explore.json' => [
                'name' => 'Social Explore',
                'description' => 'Kenali adab, iman, budaya, dan dunia di sekitarmu!',
                'icon' => 'compass',
                'color_theme' => '#FB923C',
                'sort_order' => 6,
            ],
            'bank_soal_math.json' => [
                'name' => 'Math for Fun',
                'description' => 'Berhitung itu seru kalau dimainkan!',
                'icon' => 'calculator',
                'color_theme' => '#6366F1',
                'sort_order' => 7,
            ],
        ];

        $totalQuestionsInserted = 0;
        $totalOptionsInserted = 0;
        $totalTopicsInserted = 0;

        foreach ($jsonFiles as $filename => $moduleMeta) {
            $filePath = __DIR__ . '/data/' . $filename;

            if (!File::exists($filePath)) {
                $this->command->warn("File tidak ditemukan: {$filePath}");
                continue;
            }

            $content = json_decode(File::get($filePath), true);
            if (!$content || !isset($content['module_code']) || !isset($content['levels'])) {
                $this->command->error("Format JSON tidak valid pada: {$filename}");
                continue;
            }

            $moduleCode = $content['module_code'];

            DB::transaction(function () use (
                $moduleCode,
                $moduleMeta,
                $content,
                $adminId,
                &$totalTopicsInserted,
                &$totalQuestionsInserted,
                &$totalOptionsInserted
            ) {
                // 1. Pastikan Modul tersedia
                $module = Module::firstOrCreate(
                    ['code' => $moduleCode],
                    [
                        'name' => $moduleMeta['name'],
                        'description' => $moduleMeta['description'],
                        'icon' => $moduleMeta['icon'],
                        'color_theme' => $moduleMeta['color_theme'],
                        'sort_order' => $moduleMeta['sort_order'],
                        'is_active' => true,
                    ]
                );

                $this->command->info("Memproses Modul: {$module->name} ({$module->code})");

                // 2. Iterasi setiap Level / Topik
                foreach ($content['levels'] as $lvl) {
                    $topic = Topic::updateOrCreate(
                        [
                            'module_id' => $module->id,
                            'name' => $lvl['topic_name'],
                        ],
                        [
                            'description' => $lvl['description'] ?? null,
                            'difficulty' => $lvl['difficulty'] ?? 'mudah',
                            'min_age_level' => $lvl['min_age_level'] ?? '4-5',
                            'sort_order' => $lvl['level'] ?? 1,
                            'is_active' => true,
                        ]
                    );

                    $totalTopicsInserted++;

                    // 3. Iterasi setiap Soal dalam Topik
                    foreach ($lvl['questions'] as $qData) {
                        $question = Question::updateOrCreate(
                            [
                                'topic_id' => $topic->id,
                                'question_text' => $qData['question'],
                            ],
                            [
                                'type' => 'multiple_choice',
                                'points' => 10,
                                'difficulty' => $lvl['difficulty'] ?? 'mudah',
                                'status' => 'published',
                                'created_by' => $adminId,
                            ]
                        );

                        $totalQuestionsInserted++;

                        // Bersihkan opsi lama agar tidak duplikat saat seeding ulang
                        $question->options()->delete();

                        // 4. Masukkan Opsi Jawaban (A, B, C)
                        foreach ($qData['options'] as $idx => $opt) {
                            QuestionOption::create([
                                'question_id' => $question->id,
                                'option_text' => $opt['text'],
                                'is_correct' => (bool)$opt['is_correct'],
                                'sort_order' => $idx + 1,
                            ]);
                            $totalOptionsInserted++;
                        }
                    }
                }
            });
        }

        $this->command->info("=== SEEDING BANK SOAL SELESAI ===");
        $this->command->info("Total Topik Diproses: {$totalTopicsInserted}");
        $this->command->info("Total Soal Dimasukkan: {$totalQuestionsInserted}");
        $this->command->info("Total Pilihan Jawaban: {$totalOptionsInserted}");
    }
}

