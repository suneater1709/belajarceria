<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Child;
use App\Models\ChildBadge;
use App\Models\ChildProgress;
use App\Models\Module;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\Setting;
use App\Models\StarLog;
use App\Models\Story;
use App\Models\StoryVocabulary;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Users (Admin & Parent)
        $admin = User::create([
            'name' => 'Administrator Ceria',
            'email' => 'admin@belajarceria.id',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'phone' => '081234567890',
            'parental_pin' => Hash::make('1234'),
        ]);

        $parent = User::create([
            'name' => 'Bunda Dian',
            'email' => 'orangtua@belajarceria.id',
            'password' => Hash::make('password123'),
            'role' => 'parent',
            'phone' => '089876543210',
            'parental_pin' => Hash::make('1234'),
        ]);

        // 2. Children
        $child1 = Child::create([
            'user_id' => $parent->id,
            'name' => 'Budi',
            'avatar' => 'owl',
            'birth_date' => now()->subYears(6),
            'gender' => 'male',
            'age_level' => '6-7',
            'total_stars' => 5,
        ]);

        Setting::create([
            'child_id' => $child1->id,
            'sound_effects_enabled' => true,
            'background_music_enabled' => true,
            'voice_narration_enabled' => true,
            'daily_time_limit_minutes' => 30,
        ]);

        $child2 = Child::create([
            'user_id' => $parent->id,
            'name' => 'Siti',
            'avatar' => 'cat',
            'birth_date' => now()->subYears(4),
            'gender' => 'female',
            'age_level' => '4-5',
            'total_stars' => 0,
        ]);

        Setting::create([
            'child_id' => $child2->id,
            'sound_effects_enabled' => true,
            'background_music_enabled' => true,
            'voice_narration_enabled' => true,
            'daily_time_limit_minutes' => 20,
        ]);

        // 3. Badges
        $badges = [
            [
                'code' => 'first_step',
                'name' => 'Langkah Pertama',
                'description' => 'Menyelesaikan kuis pertama kamu dengan semangat!',
                'icon' => 'sparkles',
                'criteria_type' => 'topic_streak',
                'criteria_value' => 1,
            ],
            [
                'code' => 'perfect_100',
                'name' => 'Bintang Sempurna',
                'description' => 'Mendapatkan skor 100 pada sebuah kuis!',
                'icon' => 'award',
                'criteria_type' => 'perfect_score',
                'criteria_value' => 100,
            ],
            [
                'code' => 'star_collector',
                'name' => 'Kolektor Bintang',
                'description' => 'Mengumpulkan lebih dari 30 bintang belajar!',
                'icon' => 'star',
                'criteria_type' => 'total_stars',
                'criteria_value' => 30,
            ],
            [
                'code' => 'math_master',
                'name' => 'Penjelajah Angka',
                'description' => 'Menyelesaikan modul Matematika Ceria!',
                'icon' => 'calculator',
                'criteria_type' => 'module_complete',
                'criteria_value' => 1,
            ],
        ];

        foreach ($badges as $b) {
            Badge::create($b);
        }

        // Berikan badge awal untuk Budi
        $badge1 = Badge::where('code', 'first_step')->first();
        $badgeStar = Badge::where('code', 'star_collector')->first();
        if ($badge1) {
            ChildBadge::create([
                'child_id' => $child1->id,
                'badge_id' => $badge1->id,
                'earned_at' => now()->subDays(2),
            ]);
        }
        if ($badgeStar) {
            ChildBadge::create([
                'child_id' => $child1->id,
                'badge_id' => $badgeStar->id,
                'earned_at' => now()->subDay(),
            ]);
        }

        // 4. Modules (Tepat 7 Modul sesuai PRD.md § 6 - TANPA BAHASA MANDARIN)
        $moduleData = [
            [
                'code' => 'cerita',
                'name' => 'Cerita Anak Digital',
                'description' => 'Cerita interaktif seru, video ramah anak, dan kosakata baru yang memperkaya imajinasi.',
                'icon' => 'book-open',
                'color_theme' => '#8B5CF6',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'code' => 'bahasa-arab',
                'name' => 'Bahasa Arab',
                'description' => 'Belajar huruf hijaiyah, mufrodat benda sekitar, dan angka Arab dengan visual islami ceria.',
                'icon' => 'moon',
                'color_theme' => '#0F766E',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'code' => 'bahasa-indonesia',
                'name' => 'Bahasa Indonesia Ceria',
                'description' => 'Mengenal huruf, membaca suku kata, menyusun kalimat, dan memahami cerita pendek.',
                'icon' => 'flag',
                'color_theme' => '#EF4444',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'code' => 'bahasa-inggris',
                'name' => 'English Fun Quest',
                'description' => 'Petualangan seru belajar kosakata bahasa Inggris: warna, angka, hewan, dan benda harian.',
                'icon' => 'globe',
                'color_theme' => '#14B8A6',
                'sort_order' => 4,
                'is_active' => true,
            ],
            [
                'code' => 'ipa',
                'name' => 'Kognitif Area',
                'description' => 'Eksplorasi alam: panca indera, hewan, tumbuhan, dan rahasia sains di sekitar kita.',
                'icon' => 'flask-conical',
                'color_theme' => '#38BDF8',
                'sort_order' => 5,
                'is_active' => true,
            ],
            [
                'code' => 'ips',
                'name' => 'Social Explore',
                'description' => 'Mengenal lingkungan keluarga, tetangga, arah mata angin, dan budaya nusantara.',
                'icon' => 'compass',
                'color_theme' => '#FB923C',
                'sort_order' => 6,
                'is_active' => true,
            ],
            [
                'code' => 'matematika',
                'name' => 'Math for Fun',
                'description' => 'Bermain logika angka, berhitung seru, penjumlahan, pengurangan, dan pengenalan pola geometri.',
                'icon' => 'calculator',
                'color_theme' => '#6366F1',
                'sort_order' => 7,
                'is_active' => true,
            ],
        ];

        $createdModules = [];
        foreach ($moduleData as $m) {
            $createdModules[$m['code']] = Module::create($m);
        }

        // 5. Topics & Bank Soal
        // --- Modul Matematika ---
        $math = $createdModules['matematika'];
        $topicMath1 = Topic::create([
            'module_id' => $math->id,
            'name' => 'Mengenal Angka 1 sampai 10',
            'description' => 'Menghitung jumlah benda ceria dan mencocokkan lambang bilangannya.',
            'icon' => 'hash',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $topicMath2 = Topic::create([
            'module_id' => $math->id,
            'name' => 'Penjumlahan Ceria',
            'description' => 'Ayo bantu teman berhitung dengan menjumlahkan buah dan bintang!',
            'icon' => 'plus',
            'difficulty' => 'sedang',
            'min_age_level' => '6-7',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $topicMath3 = Topic::create([
            'module_id' => $math->id,
            'name' => 'Bentuk & Geometri Dasar',
            'description' => 'Mengenal lingkaran, segitiga, persegi, dan warna-warni ceria.',
            'icon' => 'shapes',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        // Soal Topik Math 1
        $q1 = Question::create([
            'topic_id' => $topicMath1->id,
            'type' => 'multiple_choice',
            'question_text' => 'Ada berapa apel di keranjang? 🍎 🍎 🍎',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Tepat sekali! Ada 3 buah apel merah segar.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => '2', 'is_correct' => false, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => '3', 'is_correct' => true, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => '4', 'is_correct' => false, 'sort_order' => 3]);
        QuestionOption::create(['question_id' => $q1->id, 'option_text' => '5', 'is_correct' => false, 'sort_order' => 4]);

        $q2 = Question::create([
            'topic_id' => $topicMath1->id,
            'type' => 'true_false',
            'question_text' => 'Lambang bilangan dari angka Lima adalah 5.',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Benar! Angka 5 adalah lambang dari bilangan lima.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $q2->id, 'option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $q2->id, 'option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2]);

        $q3 = Question::create([
            'topic_id' => $topicMath1->id,
            'type' => 'multiple_choice',
            'question_text' => 'Bintang mana yang berjumlah 4? ⭐⭐⭐⭐',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Hebat! 4 bintang bersinar terang.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $q3->id, 'option_text' => 'Empat (4)', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $q3->id, 'option_text' => 'Enam (6)', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $q3->id, 'option_text' => 'Tiga (3)', 'is_correct' => false, 'sort_order' => 3]);

        // Soal Topik Math 2 (Penjumlahan)
        $q4 = Question::create([
            'topic_id' => $topicMath2->id,
            'type' => 'multiple_choice',
            'question_text' => 'Berapakah hasil dari: 2 + 3 = ... ?',
            'points' => 10,
            'difficulty' => 'sedang',
            'explanation' => 'Keren! 2 ditambah 3 hasilnya adalah 5.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $q4->id, 'option_text' => '4', 'is_correct' => false, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $q4->id, 'option_text' => '5', 'is_correct' => true, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $q4->id, 'option_text' => '6', 'is_correct' => false, 'sort_order' => 3]);

        $q5 = Question::create([
            'topic_id' => $topicMath2->id,
            'type' => 'multiple_choice',
            'question_text' => 'Ibu punya 4 jeruk 🍊, lalu memberi 2 jeruk lagi. Berapa jumlah jeruk semuanya?',
            'points' => 10,
            'difficulty' => 'sedang',
            'explanation' => '4 + 2 = 6 jeruk!',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $q5->id, 'option_text' => '5', 'is_correct' => false, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $q5->id, 'option_text' => '6', 'is_correct' => true, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $q5->id, 'option_text' => '7', 'is_correct' => false, 'sort_order' => 3]);

        // --- Modul Bahasa Indonesia ---
        $indo = $createdModules['bahasa-indonesia'];
        $topicIndo1 = Topic::create([
            'module_id' => $indo->id,
            'name' => 'Mengenal Huruf Vokal A-I-U-E-O',
            'description' => 'Mengenal huruf vokal ceria dengan contoh kata benda yang mudah diingat.',
            'icon' => 'type',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $topicIndo2 = Topic::create([
            'module_id' => $indo->id,
            'name' => 'Menyusun Suku Kata',
            'description' => 'Belajar merangkai huruf menjadi kata bermakna: B-U-K-U, B-O-L-A.',
            'icon' => 'spell-check',
            'difficulty' => 'sedang',
            'min_age_level' => '6-7',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        $qi1 = Question::create([
            'topic_id' => $topicIndo1->id,
            'type' => 'multiple_choice',
            'question_text' => 'Huruf pertama pada kata "APEL" adalah huruf apa?',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Pintar! Kata APEL diawali huruf A.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qi1->id, 'option_text' => 'A', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qi1->id, 'option_text' => 'I', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $qi1->id, 'option_text' => 'U', 'is_correct' => false, 'sort_order' => 3]);

        $qi2 = Question::create([
            'topic_id' => $topicIndo1->id,
            'type' => 'arrange_word',
            'question_text' => 'Susunlah huruf berikut menjadi kata nama hewan berkaki empat yang suka susu: [ K - U - C - I - N - G ]',
            'points' => 10,
            'difficulty' => 'sedang',
            'explanation' => 'Luar biasa! Kata yang tepat adalah KUCING.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qi2->id, 'option_text' => 'KUCING', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qi2->id, 'option_text' => 'CINGKU', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $qi2->id, 'option_text' => 'IKUNG', 'is_correct' => false, 'sort_order' => 3]);

        // --- Modul Cerita Anak Digital ---
        $cerita = $createdModules['cerita'];
        $topicCerita1 = Topic::create([
            'module_id' => $cerita->id,
            'name' => 'Fabel Binatang Bijak',
            'description' => 'Kisah persahabatan dan kebaikan hati para hewan di hutan ceria.',
            'icon' => 'sparkle',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $story1 = Story::create([
            'module_id' => $cerita->id,
            'topic_id' => $topicCerita1->id,
            'title' => 'Kancil dan Burung Pipit Sahabat Setia',
            'description' => 'Kisah hangat tentang saling tolong-menolong di hutan tropis Indonesia yang indah.',
            'cover_image_url' => 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=400',
            'video_url' => null,
            'pdf_url' => null,
            'level' => 'mudah',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        StoryVocabulary::create([
            'story_id' => $story1->id,
            'word' => 'Sahabat',
            'meaning' => 'Teman dekat yang saling menyayangi dan menolong',
            'sort_order' => 1,
        ]);
        StoryVocabulary::create([
            'story_id' => $story1->id,
            'word' => 'Rimbun',
            'meaning' => 'Pohon yang banyak daun dan cabangnya',
            'sort_order' => 2,
        ]);
        StoryVocabulary::create([
            'story_id' => $story1->id,
            'word' => 'Bijaksana',
            'meaning' => 'Selalu menggunakan akal budi dan bersikap adil',
            'sort_order' => 3,
        ]);

        $qc1 = Question::create([
            'topic_id' => $topicCerita1->id,
            'type' => 'multiple_choice',
            'question_text' => 'Siapa yang menolong Kancil saat terjebak di semak belukar?',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Benar! Burung Pipit terbang memanggil teman-teman untuk menolong Kancil.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qc1->id, 'option_text' => 'Burung Pipit', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qc1->id, 'option_text' => 'Buaya Besar', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $qc1->id, 'option_text' => 'Singa Galak', 'is_correct' => false, 'sort_order' => 3]);

        // --- Modul Bahasa Inggris ---
        $inggris = $createdModules['bahasa-inggris'];
        $topicInggris1 = Topic::create([
            'module_id' => $inggris->id,
            'name' => 'Colors & Animals',
            'description' => 'Learn vivid colors and cute animal names in fun English!',
            'icon' => 'palette',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $qe1 = Question::create([
            'topic_id' => $topicInggris1->id,
            'type' => 'multiple_choice',
            'question_text' => 'What is the English word for "Kucing"? 🐱',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Great job! Cat means Kucing.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qe1->id, 'option_text' => 'Cat', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qe1->id, 'option_text' => 'Dog', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $qe1->id, 'option_text' => 'Bird', 'is_correct' => false, 'sort_order' => 3]);

        // --- Modul Bahasa Arab ---
        $arab = $createdModules['bahasa-arab'];
        $topicArab1 = Topic::create([
            'module_id' => $arab->id,
            'name' => 'Huruf Hijaiyah: Alif sampai Jim',
            'description' => 'Mengenal bentuk dan lafal huruf ا ب ت ث ج dengan ceria.',
            'icon' => 'book-marked',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $qa1 = Question::create([
            'topic_id' => $topicArab1->id,
            'type' => 'multiple_choice',
            'question_text' => 'Huruf apakah ini: [ ب ] ?',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Masya Allah, tepat! Itu adalah huruf Baa.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qa1->id, 'option_text' => 'Baa (ب)', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qa1->id, 'option_text' => 'Alif (ا)', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $qa1->id, 'option_text' => 'Taa (ت)', 'is_correct' => false, 'sort_order' => 3]);

        // --- Modul IPA ---
        $ipa = $createdModules['ipa'];
        $topicIpa1 = Topic::create([
            'module_id' => $ipa->id,
            'name' => 'Panca Indera Tubuh Kita',
            'description' => 'Mengenal fungsi mata, telinga, hidung, lidah, dan kulit.',
            'icon' => 'eye',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $qipa1 = Question::create([
            'topic_id' => $topicIpa1->id,
            'type' => 'multiple_choice',
            'question_text' => 'Bagian tubuh yang kita gunakan untuk melihat pemandangan indah adalah...',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Betul sekali! Mata adalah indera penglihatan kita.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qipa1->id, 'option_text' => 'Mata 👀', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qipa1->id, 'option_text' => 'Telinga 👂', 'is_correct' => false, 'sort_order' => 2]);
        QuestionOption::create(['question_id' => $qipa1->id, 'option_text' => 'Hidung 👃', 'is_correct' => false, 'sort_order' => 3]);

        // --- Modul IPS ---
        $ips = $createdModules['ips'];
        $topicIps1 = Topic::create([
            'module_id' => $ips->id,
            'name' => 'Keluargaku Tercinta',
            'description' => 'Mengenal peran Ayah, Ibu, Kakak, dan Adik di rumah.',
            'icon' => 'heart',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $qips1 = Question::create([
            'topic_id' => $topicIps1->id,
            'type' => 'true_false',
            'question_text' => 'Di rumah, kita harus saling menyayangi dan membantu anggota keluarga.',
            'points' => 10,
            'difficulty' => 'mudah',
            'explanation' => 'Benar sekali! Keluarga yang rukun membuat rumah terasa nyaman dan ceria.',
            'status' => 'published',
            'created_by' => $admin->id,
        ]);
        QuestionOption::create(['question_id' => $qips1->id, 'option_text' => 'Benar', 'is_correct' => true, 'sort_order' => 1]);
        QuestionOption::create(['question_id' => $qips1->id, 'option_text' => 'Salah', 'is_correct' => false, 'sort_order' => 2]);

        // 6. Child Progress & Star Logs (Demo initial state)
        // Budi sudah menyelesaikan topik Math 1 dan sedang di Math 2
        ChildProgress::create([
            'child_id' => $child1->id,
            'module_id' => $math->id,
            'topic_id' => $topicMath1->id,
            'status' => 'completed',
            'best_score' => 100,
            'stars_earned' => 3,
            'last_accessed_at' => now()->subHours(5),
            'completed_at' => now()->subHours(5),
        ]);

        ChildProgress::create([
            'child_id' => $child1->id,
            'module_id' => $math->id,
            'topic_id' => $topicMath2->id,
            'status' => 'in_progress',
            'best_score' => 70,
            'stars_earned' => 2,
            'last_accessed_at' => now()->subHour(),
            'completed_at' => null,
        ]);

        ChildProgress::create([
            'child_id' => $child1->id,
            'module_id' => $indo->id,
            'topic_id' => $topicIndo1->id,
            'status' => 'unlocked',
            'best_score' => 0,
            'stars_earned' => 0,
            'last_accessed_at' => null,
            'completed_at' => null,
        ]);

        StarLog::create([
            'child_id' => $child1->id,
            'source_type' => 'quiz_attempt',
            'source_id' => null,
            'stars' => 3,
            'created_at' => now()->subHours(5),
        ]);

        StarLog::create([
            'child_id' => $child1->id,
            'source_type' => 'quiz_attempt',
            'source_id' => null,
            'stars' => 2,
            'created_at' => now()->subHour(),
        ]);
    }
}
