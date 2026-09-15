<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Child extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'parent_id',
        'name',
        'avatar',
        'birth_date',
        'gender',
        'age_level',
        'total_stars',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'total_stars' => 'integer',
    ];

    protected static function booted()
    {
        static::saving(function ($child) {
            if ($child->parent_id && ! $child->user_id) {
                $child->user_id = $child->parent_id;
            } elseif ($child->user_id && ! $child->parent_id) {
                $child->parent_id = $child->user_id;
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function progress(): HasMany
    {
        return $this->hasMany(ChildProgress::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'child_badges')
            ->withPivot('earned_at')
            ->withTimestamps();
    }

    public function starLogs(): HasMany
    {
        return $this->hasMany(StarLog::class);
    }

    public function settings(): HasOne
    {
        return $this->hasOne(Setting::class);
    }

    public function growthRecords(): HasMany
    {
        return $this->hasMany(PertumbuhanAnak::class, 'anak_id');
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(MilestoneAnak::class, 'anak_id');
    }

    public function storyReads(): HasMany
    {
        return $this->hasMany(ChildStoryRead::class);
    }

    public function getRealTotalStarsAttribute(): int
    {
        return (int) $this->progress()->sum('stars_earned');
    }
}
