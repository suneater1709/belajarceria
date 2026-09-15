<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MilestoneAnak extends Model
{
    use HasFactory;

    protected $table = 'milestone_anak';

    protected $fillable = [
        'anak_id',
        'milestone_key',
        'tercapai',
        'tanggal_tercapai',
    ];

    protected $casts = [
        'tercapai' => 'boolean',
        'tanggal_tercapai' => 'date',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class, 'anak_id');
    }
}
