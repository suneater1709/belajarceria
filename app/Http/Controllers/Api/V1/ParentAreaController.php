<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ChildProgress;
use App\Models\ChildStoryRead;
use App\Models\Module;
use App\Models\QuizAttempt;
use App\Models\Setting;
use App\Models\Story;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ParentAreaController extends Controller
{
    /**
     * Daftar anak milik orang tua yang login.
     */
    public function children(Request $request): JsonResponse
    {
        $children = $request->user()->children()->with('settings')->get()->map(function ($child) {
            $realStars = (int) $child->progress()->sum('stars_earned');
            if ($child->total_stars !== $realStars) {
                $child->update(['total_stars' => $realStars]);
            }
            $child->total_stars = $realStars;

            return $child;
        });

        return response()->json([
            'data' => $children,
        ]);
    }

    /**
     * Tambah profil anak baru.
     */
    public function storeChild(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'avatar' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,unspecified',
            'age_level' => 'required|in:3-4,5-6,3,4,5,6,4-5,6-7,8',
        ], [
            'name.required' => 'Nama anak wajib diisi.',
            'age_level.required' => 'Tingkat usia anak wajib dipilih.',
            'age_level.in' => 'Usia anak harus berada dalam rentang 3–6 tahun.',
        ]);

        $child = $request->user()->children()->create([
            'name' => $validated['name'],
            'avatar' => $validated['avatar'] ?? 'owl',
            'birth_date' => $validated['birth_date'] ?? null,
            'gender' => $validated['gender'] ?? 'unspecified',
            'age_level' => $validated['age_level'],
            'total_stars' => 0,
        ]);

        // Buat setting default
        Setting::create([
            'child_id' => $child->id,
            'sound_effects_enabled' => true,
            'background_music_enabled' => true,
            'voice_narration_enabled' => true,
            'daily_time_limit_minutes' => 30,
        ]);

        return response()->json([
            'data' => $child->load('settings'),
            'meta' => ['message' => 'Profil anak berhasil ditambahkan.'],
        ], 201);
    }

    /**
     * Edit profil anak.
     */
    public function updateChild(Request $request, $id): JsonResponse
    {
        $child = $request->user()->children()->find($id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'avatar' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'gender' => 'nullable|in:male,female,unspecified',
            'age_level' => 'sometimes|required|in:3-4,5-6,3,4,5,6,4-5,6-7,8',
        ]);

        $child->update($validated);

        return response()->json([
            'data' => $child,
            'meta' => ['message' => 'Profil anak berhasil diperbarui.'],
        ]);
    }

    /**
     * Hapus profil anak.
     */
    public function destroyChild(Request $request, $id): JsonResponse
    {
        $child = $request->user()->children()->find($id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $child->delete();

        return response()->json([
            'data' => ['message' => 'Profil anak berhasil dihapus.'],
        ]);
    }

    /**
     * Laporan progres teragregasi untuk satu anak.
     */
    public function report(Request $request, $id): JsonResponse
    {
        $child = $request->user()->children()->find($id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $realStars = (int) $child->progress()->sum('stars_earned');
        if ($child->total_stars !== $realStars) {
            $child->update(['total_stars' => $realStars]);
        }

        $range = $request->query('range', 'week');
        $query = QuizAttempt::where('child_id', $child->id);

        if ($range === 'week') {
            $query->where('created_at', '>=', now()->subDays(7));
        } elseif ($range === 'month') {
            $query->where('created_at', '>=', now()->subDays(30));
        }

        $attempts = $query->with('topic.module')->orderBy('created_at', 'desc')->get();

        $totalAttempts = $attempts->count();
        $averageScore = $totalAttempts > 0 ? (int) round($attempts->avg('score')) : 0;
        $totalMinutesLearned = $totalAttempts * 5; // estimasi 5 menit per sesi kuis

        // Topik Lemah (skor rata-rata < 70)
        $topicStats = $attempts->groupBy('topic_id')->map(function ($group) {
            $first = $group->first();
            $topic = $first ? $first->topic : null;
            $avg = (int) round($group->avg('score'));

            return [
                'topic_id' => $first ? $first->topic_id : 0,
                'topic_name' => $topic ? $topic->name : 'Topik',
                'module_name' => ($topic && $topic->module) ? $topic->module->name : 'Modul',
                'average_score' => $avg,
                'attempt_count' => $group->count(),
            ];
        })->values();

        $weakTopics = $topicStats->filter(function ($item) {
            return $item['average_score'] < 70;
        })->values();

        // Progres per 7 Modul
        $modules = Module::where('is_active', true)->orderBy('sort_order')->get();
        $moduleProgress = $modules->map(function ($mod) use ($child) {
            $isStory = $mod->code === 'cerita';
            $totalTopics = $isStory ? Story::where('is_active', true)->count() : Topic::where('module_id', $mod->id)->where('is_active', true)->count();
            $completedCount = $isStory
                ? ChildStoryRead::where('child_id', $child->id)->count()
                : ChildProgress::where('child_id', $child->id)
                    ->where('module_id', $mod->id)
                    ->where('status', 'completed')
                    ->count();

            $bestScoreAvg = $isStory
                ? ($completedCount > 0 ? 100 : 0)
                : (int) round(ChildProgress::where('child_id', $child->id)
                    ->where('module_id', $mod->id)
                    ->avg('best_score') ?? 0);

            return [
                'id' => $mod->id,
                'code' => $mod->code,
                'name' => $mod->name,
                'icon' => $mod->icon,
                'color_theme' => $mod->color_theme,
                'total_topics' => $totalTopics,
                'completed_topics' => $completedCount,
                'percent' => $totalTopics > 0 ? (int) round(($completedCount / $totalTopics) * 100) : 0,
                'average_score' => $bestScoreAvg,
            ];
        });

        return response()->json([
            'data' => [
                'child' => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'avatar' => $child->avatar,
                    'age_level' => $child->age_level,
                    'total_stars' => $realStars,
                ],
                'summary' => [
                    'range' => $range,
                    'total_attempts' => $totalAttempts,
                    'average_score' => $averageScore,
                    'estimated_minutes' => $totalMinutesLearned,
                    'total_stars' => $realStars,
                ],
                'weak_topics' => $weakTopics,
                'module_progress' => $moduleProgress,
                'recent_attempts' => $attempts->take(5)->map(function ($a) {
                    return [
                        'id' => $a->id,
                        'topic_name' => $a->topic ? $a->topic->name : 'Topik',
                        'module_name' => ($a->topic && $a->topic->module) ? $a->topic->module->name : 'Modul',
                        'score' => $a->score,
                        'stars_earned' => $a->stars_earned,
                        'date' => $a->created_at->format('d M Y, H:i'),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Riwayat lencana anak.
     */
    public function childBadges(Request $request, $id): JsonResponse
    {
        $child = $request->user()->children()->find($id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $child->badges()->get(),
        ]);
    }

    /**
     * Akun orang tua.
     */
    public function account(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'has_pin' => ! empty($user->parental_pin),
                'children_count' => $user->children()->count(),
            ],
        ]);
    }

    /**
     * Update akun orang tua.
     */
    public function updateAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:6',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.unique' => 'Email sudah digunakan oleh akun lain.',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return response()->json([
            'data' => $user,
            'meta' => ['message' => 'Data akun berhasil diperbarui.'],
        ]);
    }

    /**
     * Update PIN parental gate.
     */
    public function updatePin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string|min:4|max:6',
        ], [
            'pin.required' => 'PIN baru wajib diisi.',
            'pin.min' => 'PIN minimal 4 angka.',
            'pin.max' => 'PIN maksimal 6 angka.',
        ]);

        $request->user()->update([
            'parental_pin' => Hash::make($validated['pin']),
        ]);

        return response()->json([
            'data' => ['message' => 'PIN Parental Gate berhasil diperbarui.'],
        ]);
    }
}
