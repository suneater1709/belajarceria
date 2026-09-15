<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Story extends Model
{
    use HasFactory;

    protected $fillable = [
        'module_id',
        'topic_id',
        'title',
        'description',
        'content',
        'video_url',
        'pdf_url',
        'cover_image_url',
        'level',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function vocabularies(): HasMany
    {
        return $this->hasMany(StoryVocabulary::class)->orderBy('sort_order');
    }

    public function storyReads(): HasMany
    {
        return $this->hasMany(ChildStoryRead::class);
    }
}
