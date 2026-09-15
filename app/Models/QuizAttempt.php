<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QuizAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'child_id',
        'topic_id',
        'total_questions',
        'correct_count',
        'score',
        'stars_earned',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'total_questions' => 'integer',
        'correct_count' => 'integer',
        'score' => 'integer',
        'stars_earned' => 'integer',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QuizAnswer::class, 'attempt_id');
    }
}
