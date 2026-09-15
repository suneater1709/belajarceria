<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PertumbuhanAnak extends Model
{
    use HasFactory;

    protected $table = 'pertumbuhan_anak';

    protected $fillable = [
        'anak_id',
        'tanggal',
        'berat_kg',
        'tinggi_cm',
        'lingkar_kepala_cm',
    ];

    protected $casts = [
        'tanggal' => 'date',
        'berat_kg' => 'float',
        'tinggi_cm' => 'float',
        'lingkar_kepala_cm' => 'float',
    ];

    public function child(): BelongsTo
    {
        return $this->belongsTo(Child::class, 'anak_id');
    }
}
