<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\ChildProgress;
use App\Models\ChildStoryRead;
use App\Models\Module;
use App\Models\Question;
use App\Models\Setting;
use App\Models\Story;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChildAreaController extends Controller
{
    /**
     * Data ringkas untuk peta modul anak (peta petualangan 7 pulau).
     */
    public function home(Request $request, $child_id): JsonResponse
    {
        $child = Child::find($child_id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        // Bintang dihitung secara real dari total perolehan bintang kuis anak
        $realStars = (int) $child->progress()->sum('stars_earned');
        if ($child->total_stars !== $realStars) {
            $child->update(['total_stars' => $realStars]);
        }

        $modules = Module::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name', 'icon', 'color_theme', 'sort_order']);

        $modulesData = $modules->map(function ($mod) use ($child_id) {
            $isStory = $mod->code === 'cerita';
            $totalStories = $isStory ? Story::where('is_active', true)->count() : 0;
            $completedStories = $isStory ? ChildStoryRead::where('child_id', $child_id)->count() : 0;

            $totalTopics = $isStory ? $totalStories : Topic::where('module_id', $mod->id)->where('is_active', true)->count();
            $completedTopics = $isStory ? $completedStories : ChildProgress::where('child_id', $child_id)
                ->where('module_id', $mod->id)
                ->where('status', 'completed')
                ->count();

            $progressPercent = $totalTopics > 0 ? (int) round(($completedTopics / $totalTopics) * 100) : 0;

            return [
                'id' => $mod->id,
                'code' => $mod->code,
                'name' => $mod->name,
                'icon' => $mod->icon,
                'color_theme' => $mod->color_theme,
                'sort_order' => $mod->sort_order,
                'is_story_module' => $isStory,
                'total_stories' => $totalStories,
                'total_topics' => $totalTopics,
                'completed_topics' => $completedTopics,
                'progress_percent' => $progressPercent,
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
                'modules' => $modulesData,
            ],
        ]);
    }

    /**
     * Master 7 modul pembelajaran.
     */
    public function modules(Request $request): JsonResponse
    {
        $modules = Module::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'code', 'name', 'description', 'icon', 'color_theme', 'sort_order']);

        return response()->json([
            'data' => $modules,
        ]);
    }

    /**
     * Daftar topik dalam 1 modul + status progres anak.
     */
    public function topics(Request $request, $code): JsonResponse
    {
        $module = Module::where('code', $code)->where('is_active', true)->first();
        if (! $module) {
            return response()->json(['message' => 'Modul tidak ditemukan.'], 404);
        }

        $childId = $request->query('child_id');
        $child = $childId ? Child::find($childId) : null;

        $topics = Topic::where('module_id', $module->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $topicsData = $topics->map(function ($topic, $index) use ($child) {
            $status = 'locked';
            $starsEarned = 0;
            $bestScore = 0;

            if ($child) {
                $prog = ChildProgress::where('child_id', $child->id)
                    ->where('topic_id', $topic->id)
                    ->first();

                if ($prog) {
                    $status = $prog->status;
                    $starsEarned = $prog->stars_earned;
                    $bestScore = $prog->best_score;
                } elseif ($index === 0) {
                    // Topik pertama modul selalu terbuka untuk dicoba
                    $status = 'unlocked';
                }
            } else {
                if ($index === 0) {
                    $status = 'unlocked';
                }
            }

            $questionCount = Question::where('topic_id', $topic->id)->where('status', 'published')->count();

            return [
                'id' => $topic->id,
                'name' => $topic->name,
                'description' => $topic->description,
                'icon' => $topic->icon,
                'difficulty' => $topic->difficulty,
                'min_age_level' => $topic->min_age_level,
                'sort_order' => $topic->sort_order,
                'status' => $status,
                'stars_earned' => $starsEarned,
                'best_score' => $bestScore,
                'question_count' => $questionCount,
            ];
        });

        return response()->json([
            'data' => [
                'module' => [
                    'id' => $module->id,
                    'code' => $module->code,
                    'name' => $module->name,
                    'description' => $module->description,
                    'icon' => $module->icon,
                    'color_theme' => $module->color_theme,
                ],
                'topics' => $topicsData,
            ],
        ]);
    }

    /**
     * Detail 1 topik.
     */
    public function topicDetail(Request $request, $id): JsonResponse
    {
        $topic = Topic::with('module')->find($id);
        if (! $topic) {
            return response()->json(['message' => 'Topik tidak ditemukan.'], 404);
        }

        $questionCount = Question::where('topic_id', $topic->id)->where('status', 'published')->count();

        return response()->json([
            'data' => [
                'id' => $topic->id,
                'name' => $topic->name,
                'description' => $topic->description,
                'icon' => $topic->icon,
                'difficulty' => $topic->difficulty,
                'min_age_level' => $topic->min_age_level,
                'question_count' => $questionCount,
                'module' => [
                    'id' => $topic->module->id,
                    'code' => $topic->module->code,
                    'name' => $topic->module->name,
                    'color_theme' => $topic->module->color_theme,
                ],
            ],
        ]);
    }

    /**
     * Ambil subset bank soal secara acak (ringan, limit maksimal 50).
     */
    public function questions(Request $request, $id): JsonResponse
    {
        $topic = Topic::find($id);
        if (! $topic) {
            return response()->json(['message' => 'Topik tidak ditemukan.'], 404);
        }

        $limit = (int) $request->query('limit', 10);
        if ($limit > 50) {
            return response()->json([
                'message' => 'Permintaan soal melebihi batas maksimal (maksimal 50 soal per sesi).',
            ], 422);
        }
        if ($limit <= 0) {
            $limit = 10;
        }

        $isRandom = filter_var($request->query('random', true), FILTER_VALIDATE_BOOLEAN);

        $query = Question::where('topic_id', $topic->id)
            ->where('status', 'published')
            ->with(['options' => function ($q) {
                $q->orderBy('sort_order')->select(['id', 'question_id', 'option_text', 'option_image_url', 'option_audio_url', 'match_group', 'is_correct', 'sort_order']);
            }]);

        if ($isRandom) {
            $query->inRandomOrder();
        }

        $questions = $query->limit($limit)->get();

        // Acak urutan opsi jawaban sebelum disajikan ke anak (Fisher-Yates) sesuai acuan AI generator §6.1
        $questions->each(function ($question) {
            if ($question->options && $question->options->count() > 1 && $question->type !== 'matching') {
                $shuffled = $question->options->shuffle()->values();
                $question->setRelation('options', $shuffled);
            }
        });

        return response()->json([
            'data' => $questions,
            'meta' => [
                'total_in_session' => $questions->count(),
                'topic_id' => $topic->id,
            ],
        ]);
    }

    /**
     * Daftar cerita digital paginated.
     */
    public function stories(Request $request): JsonResponse
    {
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 10);
        $childId = $request->query('child_id');

        $query = Story::where('is_active', true)->orderBy('sort_order');

        if ($request->filled('topic_id')) {
            $query->where('topic_id', $request->query('topic_id'));
        }

        $stories = $query->paginate($perPage, ['id', 'module_id', 'topic_id', 'title', 'description', 'cover_image_url', 'level', 'sort_order']);

        $readStoryIds = [];
        if ($childId) {
            $readStoryIds = ChildStoryRead::where('child_id', $childId)->pluck('story_id')->toArray();
        }

        $items = collect($stories->items())->map(function ($s) use ($readStoryIds) {
            $data = $s->toArray();
            $data['is_completed'] = in_array($s->id, $readStoryIds);

            return $data;
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $stories->currentPage(),
                'last_page' => $stories->lastPage(),
                'per_page' => $stories->perPage(),
                'total' => $stories->total(),
            ],
        ]);
    }

    /**
     * Tandai cerita selesai dibaca oleh anak.
     */
    public function completeStory(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'child_id' => 'required|exists:children,id',
        ], [
            'child_id.required' => 'ID anak wajib disertakan.',
            'child_id.exists' => 'Profil anak tidak ditemukan.',
        ]);

        $child = Child::findOrFail($validated['child_id']);
        $story = Story::findOrFail($id);

        $read = ChildStoryRead::firstOrCreate(
            ['child_id' => $child->id, 'story_id' => $story->id],
            ['completed_at' => now()]
        );

        $totalStories = Story::where('is_active', true)->count();
        $completedStories = ChildStoryRead::where('child_id', $child->id)->count();

        return response()->json([
            'data' => [
                'read' => $read,
                'completed_stories' => $completedStories,
                'total_stories' => $totalStories,
                'progress_percent' => $totalStories > 0 ? (int) round(($completedStories / $totalStories) * 100) : 0,
            ],
            'meta' => [
                'message' => 'Cerita berhasil diselesaikan!',
            ],
        ], 200);
    }

    /**
     * Detail 1 cerita digital + kosakata.
     */
    public function storyDetail(Request $request, $id): JsonResponse
    {
        $story = Story::with(['vocabularies' => function ($q) {
            $q->orderBy('sort_order');
        }])->find($id);

        if (! $story) {
            return response()->json(['message' => 'Cerita tidak ditemukan.'], 404);
        }

        return response()->json([
            'data' => $story,
        ]);
    }

    /**
     * Daftar lencana yang dimiliki anak.
     */
    public function badges(Request $request, $child_id): JsonResponse
    {
        $child = Child::find($child_id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $badges = $child->badges()->get();

        return response()->json([
            'data' => $badges,
        ]);
    }

    /**
     * Pengaturan audio/waktu anak.
     */
    public function settings(Request $request, $child_id): JsonResponse
    {
        $child = Child::find($child_id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $settings = Setting::firstOrCreate(
            ['child_id' => $child->id],
            [
                'sound_effects_enabled' => true,
                'background_music_enabled' => true,
                'voice_narration_enabled' => true,
                'daily_time_limit_minutes' => 30,
            ]
        );

        return response()->json([
            'data' => $settings,
        ]);
    }

    /**
     * Simpan pengaturan audio/waktu anak.
     */
    public function updateSettings(Request $request, $child_id): JsonResponse
    {
        $child = Child::find($child_id);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $settings = Setting::firstOrCreate(['child_id' => $child->id]);

        $settings->update($request->only([
            'sound_effects_enabled',
            'background_music_enabled',
            'voice_narration_enabled',
            'daily_time_limit_minutes',
        ]));

        return response()->json([
            'data' => $settings,
            'meta' => ['message' => 'Pengaturan berhasil disimpan.'],
        ]);
    }
}
