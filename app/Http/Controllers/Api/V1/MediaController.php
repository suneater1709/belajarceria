<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,webp,mp3,wav,ogg,pdf|max:10240',
        ], [
            'file.required' => 'File wajib diunggah.',
            'file.mimes' => 'Format file tidak didukung. Gunakan format JPG, PNG, WEBP, MP3, WAV, atau PDF.',
            'file.max' => 'Ukuran file maksimal 10MB.',
        ]);

        $file = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(20).'.'.$extension;

        // Simpan ke public/uploads
        $file->move(public_path('uploads'), $filename);

        $url = url('uploads/'.$filename);

        return response()->json([
            'data' => [
                'filename' => $filename,
                'url' => $url,
            ],
            'meta' => [
                'message' => 'File berhasil diunggah.',
            ],
        ], 201);
    }
}
