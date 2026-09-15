<?php

namespace Tests\Feature;

use App\Models\Child;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChildGrowthTest extends TestCase
{
    protected User $parent;

    protected Child $child;

    protected function setUp(): void
    {
        parent::setUp();

        $this->parent = User::first() ?? User::factory()->create([
            'email' => 'parent_test@example.com',
            'role' => 'parent',
        ]);

        $this->child = Child::where('user_id', $this->parent->id)->first() ?? Child::create([
            'user_id' => $this->parent->id,
            'parent_id' => $this->parent->id,
            'name' => 'Bintang Ceria',
            'avatar' => 'owl',
            'birth_date' => now()->subYears(4)->subMonths(2)->toDateString(),
            'age_level' => '3-4',
            'total_stars' => 10,
        ]);
    }

    public function test_parent_can_get_child_growth_data(): void
    {
        Sanctum::actingAs($this->parent);

        $response = $this->getJson("/api/v1/parent/children/{$this->child->id}/growth");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'child' => ['id', 'name', 'avatar', 'birth_date', 'age_level', 'calculated_age'],
                'summary' => [
                    'latest_date',
                    'latest_weight',
                    'latest_height',
                    'latest_head_circumference',
                    'status_badge',
                    'status_label',
                    'status_note',
                    'disclaimer',
                    'needs_reminder',
                    'reminder_text',
                    'total_measurements',
                    'milestone_stats' => ['total', 'completed', 'percent'],
                ],
                'chart_data',
                'history',
                'milestones' => [
                    '*' => ['key', 'title', 'category', 'age_recommendation', 'tercapai', 'tanggal_tercapai'],
                ],
            ],
        ]);
    }

    public function test_parent_can_store_and_update_and_delete_measurement(): void
    {
        Sanctum::actingAs($this->parent);

        // 1. Store
        $storeResponse = $this->postJson("/api/v1/parent/children/{$this->child->id}/growth", [
            'tanggal' => now()->toDateString(),
            'berat_kg' => 16.5,
            'tinggi_cm' => 104.2,
            'lingkar_kepala_cm' => 49.0,
        ]);

        $storeResponse->assertStatus(201);
        $recordId = $storeResponse->json('data.id');
        $this->assertDatabaseHas('pertumbuhan_anak', [
            'id' => $recordId,
            'anak_id' => $this->child->id,
            'berat_kg' => 16.50,
            'tinggi_cm' => 104.20,
            'lingkar_kepala_cm' => 49.00,
        ]);

        // 2. Update
        $updateResponse = $this->putJson("/api/v1/parent/growth/{$recordId}", [
            'tanggal' => now()->toDateString(),
            'berat_kg' => 16.8,
            'tinggi_cm' => 105.0,
            'lingkar_kepala_cm' => 49.5,
        ]);

        $updateResponse->assertStatus(200);
        $this->assertDatabaseHas('pertumbuhan_anak', [
            'id' => $recordId,
            'berat_kg' => 16.80,
            'tinggi_cm' => 105.00,
        ]);

        // 3. Delete
        $deleteResponse = $this->deleteJson("/api/v1/parent/growth/{$recordId}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('pertumbuhan_anak', [
            'id' => $recordId,
        ]);
    }

    public function test_parent_can_toggle_milestone(): void
    {
        Sanctum::actingAs($this->parent);

        // Toggle to true
        $response1 = $this->postJson("/api/v1/parent/children/{$this->child->id}/milestones/toggle", [
            'milestone_key' => 'sebut_nama_lengkap',
            'tercapai' => true,
        ]);

        $response1->assertStatus(200);
        $this->assertDatabaseHas('milestone_anak', [
            'anak_id' => $this->child->id,
            'milestone_key' => 'sebut_nama_lengkap',
            'tercapai' => true,
        ]);

        // Toggle to false
        $response2 = $this->postJson("/api/v1/parent/children/{$this->child->id}/milestones/toggle", [
            'milestone_key' => 'sebut_nama_lengkap',
            'tercapai' => false,
        ]);

        $response2->assertStatus(200);
        $this->assertDatabaseHas('milestone_anak', [
            'anak_id' => $this->child->id,
            'milestone_key' => 'sebut_nama_lengkap',
            'tercapai' => false,
            'tanggal_tercapai' => null,
        ]);
    }
}
