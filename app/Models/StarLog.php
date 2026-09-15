<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StarLog extends Model
{
    use HasFactory;

    protected $table = 'star_logs';

    public $timestamps = false;

    protected $fillable = [
        'child_id',
        'source_type',
        'source_id',
        'stars',
        'created_at',
    ];

    protected $casts = [
        'stars' => 'integer',
        'created_at' => 'datetime',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class);
    }
}
