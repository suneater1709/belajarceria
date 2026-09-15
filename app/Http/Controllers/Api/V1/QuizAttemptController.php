<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\Child;
use App\Models\ChildBadge;
use App\Models\ChildProgress;
use App\Models\QuestionOption;
use App\Models\QuizAnswer;
use App\Models\QuizAttempt;
use App\Models\StarLog;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizAttemptController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'child_id' => 'required|exists:children,id',
            'topic_id' => 'required|exists:topics,id',
            'started_at' => 'nullable|date',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|exists:questions,id',
            'answers.*.selected_option_id' => 'nullable|exists:question_options,id',
        ], [
            'child_id.required' => 'ID anak wajib disertakan.',
            'topic_id.required' => 'ID topik wajib disertakan.',
            'answers.required' => 'Jawaban kuis wajib dikirim.',
        ]);

        $child = Child::findOrFail($validated['child_id']);
        $topic = Topic::with('module')->findOrFail($validated['topic_id']);

        $result = DB::transaction(function () use ($validated, $child, $topic) {
            $answers = $validated['answers'];
            $totalQuestions = count($answers);
            $correctCount = 0;

            // Evaluasi jawaban
            $processedAnswers = [];
            foreach ($answers as $ans) {
                $isCorrect = false;
                if (! empty($ans['selected_option_id'])) {
                    $option = QuestionOption::where('id', $ans['selected_option_id'])
                        ->where('question_id', $ans['question_id'])
                        ->first();
                    if ($option && $option->is_correct) {
                        $isCorrect = true;
                        $correctCount++;
                    }
                }

                $processedAnswers[] = [
                    'question_id' => $ans['question_id'],
                    'selected_option_id' => $ans['selected_option_id'] ?? null,
                    'is_correct' => $isCorrect,
                    'answered_at' => now(),
                ];
            }

            // Hitung skor & bintang
            $score = $totalQuestions > 0 ? (int) round(($correctCount / $totalQuestions) * 100) : 0;
            $starsEarned = 0;
            if ($score >= 90) {
                $starsEarned = 3;
            } elseif ($score >= 65) {
                $starsEarned = 2;
            } elseif ($score >= 35) {
                $starsEarned = 1;
            }

            // Simpan quiz_attempts
            $attempt = QuizAttempt::create([
                'child_id' => $child->id,
                'topic_id' => $topic->id,
                'total_questions' => $totalQuestions,
                'correct_count' => $correctCount,
                'score' => $score,
                'stars_earned' => $starsEarned,
                'started_at' => $validated['started_at'] ?? now()->subMinutes(3),
                'finished_at' => now(),
            ]);

            // Simpan quiz_answers
            foreach ($processedAnswers as $pa) {
                QuizAnswer::create([
                    'attempt_id' => $attempt->id,
                    'question_id' => $pa['question_id'],
                    'selected_option_id' => $pa['selected_option_id'],
                    'is_correct' => $pa['is_correct'],
                    'answered_at' => $pa['answered_at'],
                ]);
            }

            // Update child_progress
            $progress = ChildProgress::firstOrNew([
                'child_id' => $child->id,
                'topic_id' => $topic->id,
            ]);

            $progress->module_id = $topic->module_id;

            $previousStars = $progress->stars_earned ?? 0;
            $starsDelta = max(0, $starsEarned - $previousStars);

            $progress->best_score = max($progress->best_score ?? 0, $score);
            $progress->stars_earned = max($previousStars, $starsEarned);
            $progress->status = ($score >= 60 || $progress->status === 'completed') ? 'completed' : 'in_progress';
            $progress->last_accessed_at = now();
            if ($progress->status === 'completed' && ! $progress->completed_at) {
                $progress->completed_at = now();
            }
            $progress->save();

            // Jika berhasil lulus (score >= 60), buka otomatis topik selanjutnya pada modul yang sama
            if ($score >= 60) {
                $nextTopic = Topic::where('module_id', $topic->module_id)
                    ->where('is_active', true)
                    ->where('sort_order', '>', $topic->sort_order)
                    ->orderBy('sort_order')
                    ->first();

                if ($nextTopic) {
                    $nextProg = ChildProgress::firstOrNew([
                        'child_id' => $child->id,
                        'topic_id' => $nextTopic->id,
                    ]);
                    $nextProg->module_id = $topic->module_id;
                    if (! $nextProg->exists || $nextProg->status === 'locked') {
                        $nextProg->status = 'unlocked';
                        $nextProg->save();
                    }
                }
            }

            // Tambahkan bintang jika ada kenaikan
            if ($starsDelta > 0) {
                StarLog::create([
                    'child_id' => $child->id,
                    'source_type' => 'quiz_attempt',
                    'source_id' => $attempt->id,
                    'stars' => $starsDelta,
                    'created_at' => now(),
                ]);

                $child->increment('total_stars', $starsDelta);
            }

            // Cek Badges yang berpotensi baru didapat
            $newlyUnlockedBadges = [];

            // 1. First Step (langkah pertama)
            $badgeFirst = Badge::where('code', 'first_step')->first();
            if ($badgeFirst && ! $child->badges()->where('badge_id', $badgeFirst->id)->exists()) {
                ChildBadge::create([
                    'child_id' => $child->id,
                    'badge_id' => $badgeFirst->id,
                    'earned_at' => now(),
                ]);
                $newlyUnlockedBadges[] = $badgeFirst;
            }

            // 2. Perfect 100
            if ($score === 100) {
                $badge100 = Badge::where('code', 'perfect_100')->first();
                if ($badge100 && ! $child->badges()->where('badge_id', $badge100->id)->exists()) {
                    ChildBadge::create([
                        'child_id' => $child->id,
                        'badge_id' => $badge100->id,
                        'earned_at' => now(),
                    ]);
                    $newlyUnlockedBadges[] = $badge100;
                }
            }

            // 3. Star Collector
            if ($child->fresh()->total_stars >= 30) {
                $badgeStar = Badge::where('code', 'star_collector')->first();
                if ($badgeStar && ! $child->badges()->where('badge_id', $badgeStar->id)->exists()) {
                    ChildBadge::create([
                        'child_id' => $child->id,
                        'badge_id' => $badgeStar->id,
                        'earned_at' => now(),
                    ]);
                    $newlyUnlockedBadges[] = $badgeStar;
                }
            }

            return [
                'attempt' => $attempt,
                'score' => $score,
                'stars_earned' => $starsEarned,
                'stars_delta' => $starsDelta,
                'correct_count' => $correctCount,
                'total_questions' => $totalQuestions,
                'total_stars' => $child->fresh()->total_stars,
                'newly_unlocked_badges' => $newlyUnlockedBadges,
            ];
        });

        return response()->json([
            'data' => $result,
            'meta' => [
                'message' => 'Hasil kuis berhasil disimpan.',
            ],
        ], 201);
    }
}
