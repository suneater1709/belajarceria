<?php

namespace Tests\Feature;

use App\Models\Module;
use App\Models\Topic;
use App\Models\User;
use Tests\TestCase;

class AdminQuestionAiTest extends TestCase
{
    public function test_can_generate_exact_requested_number_of_ai_questions(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $topic = Topic::first();

        // Request 5 questions
        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/questions/generate-ai', [
            'topic_id' => $topic->id,
            'count' => 5,
            'difficulty' => 'mudah',
            'type' => 'multiple_choice',
            'prompt_hint' => 'soal hijaiyah',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data',
            'meta' => ['count', 'requested_count', 'topic'],
        ]);

        $data = $response->json('data');
        $this->assertCount(5, $data, 'Must generate exactly 5 questions when requested.');

        // Verify distinct questions
        $texts = array_column($data, 'question_text');
        $this->assertCount(5, array_unique($texts), 'All 5 generated questions must be unique.');
    }

    public function test_hijaiyah_instruction_strictly_returns_hijaiyah_questions(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $topic = Topic::where('name', 'like', '%hijaiyah%')->first() ?? Topic::first();

        // Request 3 questions with specific instruction "fokus huruf hijaiyah saja"
        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/questions/generate-ai', [
            'topic_id' => $topic->id,
            'count' => 3,
            'difficulty' => 'mudah',
            'type' => 'multiple_choice',
            'prompt_hint' => 'fokus huruf hijaiyah saja',
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(3, $data);

        foreach ($data as $q) {
            $text = strtolower($q['question_text']);
            $this->assertStringNotContainsString('mufrodat', $text, 'Should not contain mufrodat when focused on hijaiyah.');
        }
    }

    public function test_arabic_numbers_topic_generates_arabic_numbers_questions(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $topic = Topic::where('name', 'like', '%Angka Arab%')->first() ?? Topic::first();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/questions/generate-ai', [
            'topic_id' => $topic->id,
            'count' => 5,
            'difficulty' => 'mudah',
            'type' => 'multiple_choice',
            'prompt_hint' => 'Mengenal Angka Arab 1-10',
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(5, $data);

        // Verify that questions relate to numbers in Arabic
        $hasArabicNumberRef = false;
        foreach ($data as $q) {
            $text = $q['question_text'];
            if (str_contains($text, 'angka Arab') || str_contains($text, 'bilangan') || str_contains($text, 'Wahid') || str_contains($text, '١') || str_contains($text, '٥')) {
                $hasArabicNumberRef = true;
                break;
            }
        }
        $this->assertTrue($hasArabicNumberRef, 'Generated questions should reference Arabic numbers.');
    }

    public function test_creating_topic_with_auto_generate_questions_creates_questions(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $module = Module::first();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/topics', [
            'module_id' => $module->id,
            'name' => 'Belajar Berhitung Ceria 1-5',
            'description' => 'Topik seru belajar berhitung bersama teman ceria.',
            'icon' => '🔢',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
            'auto_generate_questions' => true,
            'question_count' => 5,
        ]);

        $response->assertStatus(201);
        $topicId = $response->json('data.id');
        $createdTopic = Topic::with('questions')->find($topicId);

        $this->assertNotNull($createdTopic);
        $this->assertCount(5, $createdTopic->questions, 'Topic created with auto_generate_questions must have 5 questions.');
    }

    public function test_sentence_building_topic_generates_sentence_building_questions_and_avoids_existing_duplicates(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $module = Module::first();

        $topic = Topic::create([
            'module_id' => $module->id,
            'name' => 'Mengenal Menyusun Kalimat',
            'description' => 'Belajar menyusun kata menjadi kalimat yang padu dan benar.',
            'icon' => '📝',
            'difficulty' => 'mudah',
            'min_age_level' => '4-5',
        ]);

        $existingTexts = [
            'Lawan kata (antonim) dari kata BESAR adalah...',
            'Manakah di bawah ini yang merupakan deretan huruf VOKAL?',
            'Kata B-U-K-U jika dieja dan dibaca suku katanya menjadi...',
            'Susunlah huruf berikut menjadi kata nama hewan berkaki empat yang suka susu...',
            'Huruf pertama pada kata APEL adalah huruf apa?',
        ];

        foreach ($existingTexts as $et) {
            $topic->questions()->create([
                'type' => 'multiple_choice',
                'question_text' => $et,
                'points' => 10,
                'difficulty' => 'mudah',
                'status' => 'published',
            ]);
        }

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/questions/generate-ai', [
            'topic_id' => $topic->id,
            'count' => 3,
            'difficulty' => 'mudah',
            'type' => 'multiple_choice',
            'prompt_hint' => 'menyusun kalimat',
        ]);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(3, $data);

        foreach ($data as $q) {
            $text = $q['question_text'];

            // Check that it does not duplicate any of the 5 existing questions
            foreach ($existingTexts as $et) {
                $this->assertNotEquals($et, $text, "Generated question should not duplicate existing question: {$et}");
                $this->assertStringNotContainsString('huruf VOKAL', $text);
                $this->assertStringNotContainsString('kata BESAR', $text);
            }

            // Verify that it is actually about sentence building
            $textLower = strtolower($text);
            $isAboutSentence = str_contains($textLower, 'kalimat')
                || str_contains($textLower, 'susun')
                || str_contains($textLower, 'kata');
            $this->assertTrue($isAboutSentence, "Question must test sentence construction: {$text}");
        }
    }

    public function test_consecutive_generate_calls_with_session_questions_prevents_repetition(): void
    {
        $admin = User::where('role', 'admin')->first() ?? User::factory()->create(['role' => 'admin']);
        $topic = Topic::where('name', 'like', '%Kalimat%')->first() ?? Topic::first();

        // 1. First generate call
        $res1 = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/questions/generate-ai', [
            'topic_id' => $topic->id,
            'count' => 3,
            'difficulty' => 'mudah',
            'type' => 'multiple_choice',
            'prompt_hint' => 'menyusun kalimat',
        ]);
        $res1->assertStatus(200);
        $firstBatch = array_column($res1->json('data'), 'question_text');
        $this->assertCount(3, $firstBatch);

        // 2. Second generate call in the same session, passing session_questions from first batch
        $res2 = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/questions/generate-ai', [
            'topic_id' => $topic->id,
            'count' => 3,
            'difficulty' => 'mudah',
            'type' => 'multiple_choice',
            'prompt_hint' => 'menyusun kalimat',
            'session_questions' => $firstBatch,
        ]);
        $res2->assertStatus(200);
        $secondBatch = array_column($res2->json('data'), 'question_text');
        $this->assertCount(3, $secondBatch);

        // 3. Verify zero overlap between first and second batch
        $intersection = array_intersect($firstBatch, $secondBatch);
        $this->assertEmpty($intersection, 'Consecutive generate calls must not return duplicate questions.');
    }
}
