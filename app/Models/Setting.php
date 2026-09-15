<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'child_id',
        'sound_effects_enabled',
        'background_music_enabled',
        'voice_narration_enabled',
        'daily_time_limit_minutes',
    ];

    protected $casts = [
        'sound_effects_enabled' => 'boolean',
        'background_music_enabled' => 'boolean',
        'voice_narration_enabled' => 'boolean',
        'daily_time_limit_minutes' => 'integer',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class);
    }
}
