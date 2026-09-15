<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\Module;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\Story;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $totalParents = User::where('role', 'parent')->count();
        $totalChildren = Child::count();
        $totalModules = Module::count();
        $totalTopics = Topic::count();
        $totalQuestions = Question::count();
        $totalStories = Story::count();
        $totalAttempts = QuizAttempt::count();

        // Modul terpopuler berdasarkan attempt kuis
        $popularModules = Module::withCount(['topics as attempts_count' => function ($q) {
            $q->join('quiz_attempts', 'topics.id', '=', 'quiz_attempts.topic_id');
        }])->orderBy('attempts_count', 'desc')->get(['id', 'code', 'name', 'color_theme']);

        // Aktivitas kuis terbaru
        $recentAttempts = QuizAttempt::with(['child', 'topic.module'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'child_name' => $a->child ? $a->child->name : 'Anonim',
                    'topic_name' => $a->topic ? $a->topic->name : 'Topik',
                    'module_name' => ($a->topic && $a->topic->module) ? $a->topic->module->name : 'Modul',
                    'score' => $a->score,
                    'stars_earned' => $a->stars_earned,
                    'created_at' => $a->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'data' => [
                'total_users' => User::count(),
                'total_parents' => $totalParents,
                'total_children' => $totalChildren,
                'total_modules' => $totalModules,
                'total_topics' => $totalTopics,
                'total_questions' => $totalQuestions,
                'total_stories' => $totalStories,
                'total_quiz_attempts' => $totalAttempts,
                'counts' => [
                    'parents' => $totalParents,
                    'children' => $totalChildren,
                    'modules' => $totalModules,
                    'topics' => $totalTopics,
                    'questions' => $totalQuestions,
                    'stories' => $totalStories,
                    'quiz_attempts' => $totalAttempts,
                ],
                'popular_modules' => $popularModules,
                'recent_activity' => $recentAttempts,
            ],
        ]);
    }
}
