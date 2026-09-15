<?php

namespace Tests\Feature;

use App\Models\Child;
use App\Models\Module;
use App\Models\Question;
use App\Models\Story;
use App\Models\Topic;
use App\Models\User;
use Tests\TestCase;

class BelajarCeriaApiTest extends TestCase
{
    public function test_modules_endpoint_returns_exactly_7_modules_without_mandarin(): void
    {
        $response = $this->getJson('/api/v1/modules');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(7, $data);

        $codes = collect($data)->pluck('code')->toArray();
        $this->assertContains('cerita', $codes);
        $this->assertContains('bahasa-arab', $codes);
        $this->assertContains('bahasa-indonesia', $codes);
        $this->assertContains('bahasa-inggris', $codes);
        $this->assertContains('ipa', $codes);
        $this->assertContains('ips', $codes);
        $this->assertContains('matematika', $codes);

        // Pastikan tidak ada Mandarin
        $this->assertNotContains('bahasa-mandarin', $codes);
        $this->assertNotContains('mandarin', $codes);
    }

    public function test_child_home_endpoint(): void
    {
        $child = Child::first();
        $response = $this->getJson("/api/v1/children/{$child->id}/home");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'child' => ['id', 'name', 'avatar', 'age_level', 'total_stars'],
                'modules' => [
                    '*' => ['id', 'code', 'name', 'color_theme', 'progress_percent'],
                ],
            ],
        ]);
    }

    public function test_questions_endpoint_has_limit_and_options(): void
    {
        $topic = Topic::first();
        $response = $this->getJson("/api/v1/topics/{$topic->id}/questions?limit=3&random=true");

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertLessThanOrEqual(3, count($data));

        if (count($data) > 0) {
            $this->assertArrayHasKey('options', $data[0]);
        }
    }

    public function test_quiz_attempt_submission_updates_progress_and_stars(): void
    {
        $child = Child::first();
        $topic = Topic::first();
        $questions = Question::where('topic_id', $topic->id)->with('options')->get();

        $answers = [];
        foreach ($questions as $q) {
            $correctOption = $q->options->where('is_correct', true)->first();
            $answers[] = [
                'question_id' => $q->id,
                'selected_option_id' => $correctOption ? $correctOption->id : null,
            ];
        }

        $response = $this->postJson('/api/v1/quiz-attempts', [
            'child_id' => $child->id,
            'topic_id' => $topic->id,
            'answers' => $answers,
        ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.score', 100);
        $response->assertJsonPath('data.stars_earned', 3);
    }

    public function test_parent_authentication_and_report(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'orangtua@belajarceria.id',
            'password' => 'password123',
        ]);

        $loginRes->assertStatus(200);
        $token = $loginRes->json('data.token');
        $this->assertNotEmpty($token);

        $child = Child::first();

        $reportRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/parent/children/{$child->id}/report");

        $reportRes->assertStatus(200);
        $reportRes->assertJsonStructure([
            'data' => [
                'child',
                'summary' => ['total_attempts', 'average_score', 'total_stars'],
                'module_progress',
                'weak_topics',
            ],
        ]);
    }

    public function test_admin_dashboard_summary(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@belajarceria.id',
            'password' => 'password123',
        ]);

        $loginRes->assertStatus(200);
        $token = $loginRes->json('data.token');

        $summaryRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/admin/dashboard/summary');

        $summaryRes->assertStatus(200);
        $summaryRes->assertJsonStructure([
            'data' => [
                'counts' => ['parents', 'children', 'modules', 'questions'],
                'popular_modules',
            ],
        ]);
    }

    public function test_question_options_include_is_correct(): void
    {
        $topic = Topic::first();
        $response = $this->getJson("/api/v1/topics/{$topic->id}/questions?limit=5");

        $response->assertStatus(200);
        $questions = $response->json('data');
        $this->assertNotEmpty($questions);

        foreach ($questions as $q) {
            $this->assertNotEmpty($q['options']);
            foreach ($q['options'] as $opt) {
                $this->assertArrayHasKey('is_correct', $opt);
                $this->assertIsBool($opt['is_correct']);
            }
        }
    }

    public function test_child_profiles_scoped_to_authenticated_parent(): void
    {
        // 1. Login sebagai parent
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'orangtua@belajarceria.id',
            'password' => 'password123',
        ]);
        $token = $loginRes->json('data.token');

        // 2. Ambil list profil anak
        $childrenRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/parent/children');
        $childrenRes->assertStatus(200);
        $children = $childrenRes->json('data');
        $this->assertNotEmpty($children);

        // Pastikan semua anak memiliki parent_id / user_id yang cocok
        $parentId = $loginRes->json('data.user.id');
        foreach ($children as $c) {
            $this->assertEquals($parentId, $c['user_id']);
        }

        // 3. Tambah anak baru melalui parent endpoint
        $storeRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/parent/children', [
                'name' => 'Adik Rian',
                'age_level' => '4-5',
                'avatar' => 'rabbit',
            ]);
        $storeRes->assertStatus(201);
        $newChild = $storeRes->json('data');
        $this->assertEquals('Adik Rian', $newChild['name']);
        $this->assertEquals($parentId, $newChild['user_id']);
        $this->assertEquals($parentId, $newChild['parent_id']);
    }

    public function test_admin_story_full_crud(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@belajarceria.id',
            'password' => 'password123',
        ]);
        $token = $loginRes->json('data.token');

        $module = Module::first();

        // 1. Create
        $createRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/stories', [
                'module_id' => $module->id,
                'title' => 'Cerita Petualangan Baru',
                'description' => 'Sinopsis kisah petualangan di hutan ceria.',
                'content' => 'Di suatu hari yang cerah, seekor burung hantu bijak bertemu dengan anak-anak...',
                'level' => 'mudah',
                'vocabularies' => [
                    ['word' => 'Bijak', 'meaning' => 'Pintar dan pandai mengambil keputusan'],
                    ['word' => 'Hutan', 'meaning' => 'Tempat yang ditumbuhi banyak pohon lebat'],
                ],
            ]);
        $createRes->assertStatus(201);
        $storyId = $createRes->json('data.id');

        // 2. Read (Detail)
        $showRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/stories/{$storyId}");
        $showRes->assertStatus(200);
        $showRes->assertJsonPath('data.title', 'Cerita Petualangan Baru');
        $this->assertCount(2, $showRes->json('data.vocabularies'));

        // 3. Update
        $updateRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/admin/stories/{$storyId}", [
                'title' => 'Cerita Petualangan Baru (Updated)',
                'level' => 'sedang',
            ]);
        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.title', 'Cerita Petualangan Baru (Updated)');

        // 4. Delete
        $deleteRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/stories/{$storyId}");
        $deleteRes->assertStatus(200);
    }

    public function test_admin_badge_full_crud(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@belajarceria.id',
            'password' => 'password123',
        ]);
        $token = $loginRes->json('data.token');

        $uniqueSuffix = uniqid();
        // 1. Create
        $createRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/admin/badges', [
                'name' => 'Lencana Juara Super '.$uniqueSuffix,
                'description' => 'Berhasil menyelesaikan semua soal tanpa salah',
                'icon' => '🏆',
                'criteria_type' => 'perfect_score',
                'criteria_value' => 100,
            ]);
        $createRes->assertStatus(201);
        $badgeId = $createRes->json('data.id');

        // 2. Read (Detail)
        $showRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/admin/badges/{$badgeId}");
        $showRes->assertStatus(200);
        $showRes->assertJsonPath('data.name', 'Lencana Juara Super '.$uniqueSuffix);

        // 3. Update
        $updateRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/v1/admin/badges/{$badgeId}", [
                'name' => 'Lencana Juara Hebat',
                'criteria_value' => 95,
            ]);
        $updateRes->assertStatus(200);
        $updateRes->assertJsonPath('data.name', 'Lencana Juara Hebat');

        // 4. Delete (Soft delete)
        $deleteRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/v1/admin/badges/{$badgeId}");
        $deleteRes->assertStatus(200);

        // Pastikan soft delete: record masih ada di database tapi deleted_at terisi
        $this->assertSoftDeleted('badges', ['id' => $badgeId]);
    }

    public function test_real_stars_and_story_progress_per_child(): void
    {
        $parent = User::where('role', 'parent')->first();

        // Buat 2 anak terpisah
        $anakA = Child::create([
            'user_id' => $parent->id,
            'name' => 'Anak Percobaan A',
            'avatar' => 'owl',
            'age_level' => '4-5',
            'total_stars' => 0,
        ]);

        $anakB = Child::create([
            'user_id' => $parent->id,
            'name' => 'Anak Percobaan B',
            'avatar' => 'cat',
            'age_level' => '4-5',
            'total_stars' => 0,
        ]);

        $story = Story::first();
        $this->assertNotNull($story);

        // 1. Awalnya keduanya 0 bintang dan 0 progres cerita
        $resA = $this->getJson("/api/v1/children/{$anakA->id}/home");
        $resA->assertStatus(200);
        $resA->assertJsonPath('data.child.total_stars', 0);
        $ceritaModA = collect($resA->json('data.modules'))->firstWhere('code', 'cerita');
        $this->assertEquals(0, $ceritaModA['completed_topics']);
        $this->assertEquals(0, $ceritaModA['progress_percent']);

        $resB = $this->getJson("/api/v1/children/{$anakB->id}/home");
        $resB->assertStatus(200);
        $resB->assertJsonPath('data.child.total_stars', 0);
        $ceritaModB = collect($resB->json('data.modules'))->firstWhere('code', 'cerita');
        $this->assertEquals(0, $ceritaModB['completed_topics']);
        $this->assertEquals(0, $ceritaModB['progress_percent']);

        // 2. Anak A menyelesaikan membaca 1 cerita
        $completeRes = $this->postJson("/api/v1/stories/{$story->id}/complete", [
            'child_id' => $anakA->id,
        ]);
        $completeRes->assertStatus(200);

        // 3. Cek data Anak A vs Anak B (tidak boleh tercampur)
        $afterA = $this->getJson("/api/v1/children/{$anakA->id}/home");
        $afterModA = collect($afterA->json('data.modules'))->firstWhere('code', 'cerita');
        $this->assertEquals(1, $afterModA['completed_topics']);
        $this->assertGreaterThan(0, $afterModA['progress_percent']);

        $afterB = $this->getJson("/api/v1/children/{$anakB->id}/home");
        $afterModB = collect($afterB->json('data.modules'))->firstWhere('code', 'cerita');
        $this->assertEquals(0, $afterModB['completed_topics']);
        $this->assertEquals(0, $afterModB['progress_percent']);

        // 4. Cek stories list query per anak
        $storiesA = $this->getJson("/api/v1/stories?child_id={$anakA->id}");
        $storyItemA = collect($storiesA->json('data'))->firstWhere('id', $story->id);
        $this->assertTrue($storyItemA['is_completed']);

        $storiesB = $this->getJson("/api/v1/stories?child_id={$anakB->id}");
        $storyItemB = collect($storiesB->json('data'))->firstWhere('id', $story->id);
        $this->assertFalse($storyItemB['is_completed']);
    }
}
