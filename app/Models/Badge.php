<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Badge extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'icon',
        'criteria_type',
        'criteria_value',
    ];

    protected $casts = [
        'criteria_value' => 'integer',
    ];

    public function children(): BelongsToMany
    {
        return $this->belongsToMany(Child::class, 'child_badges')
            ->withPivot('earned_at')
            ->withTimestamps();
    }
}
