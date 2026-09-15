<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChildProgress extends Model
{
    use HasFactory;

    protected $table = 'child_progress';

    protected $fillable = [
        'child_id',
        'module_id',
        'topic_id',
        'status',
        'best_score',
        'stars_earned',
        'last_accessed_at',
        'completed_at',
    ];

    protected $casts = [
        'best_score' => 'integer',
        'stars_earned' => 'integer',
        'last_accessed_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class);
    }

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }
}
