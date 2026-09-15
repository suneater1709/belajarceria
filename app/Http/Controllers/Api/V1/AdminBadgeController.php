<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminBadgeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $badges = Badge::withCount('children')->orderBy('id', 'desc')->get();

        return response()->json(['data' => $badges]);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $badge = Badge::withCount('children')->find($id);
        if (! $badge) {
            return response()->json(['message' => 'Lencana tidak ditemukan.'], 404);
        }

        return response()->json(['data' => $badge]);
    }

    public function store(Request $request): JsonResponse
    {
        // Jika code tidak dikirim, generate otomatis dari nama
        if (! $request->filled('code') && $request->filled('name')) {
            $baseCode = Str::slug($request->input('name'), '_');
            $code = $baseCode;
            $count = 1;
            while (Badge::withTrashed()->where('code', $code)->exists()) {
                $code = "{$baseCode}_{$count}";
                $count++;
            }
            $request->merge(['code' => $code]);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:badges,code',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'criteria_type' => 'required|in:module_complete,topic_streak,perfect_score,total_stars',
            'criteria_value' => 'required|integer|min:0',
        ], [
            'code.required' => 'Kode lencana wajib diisi.',
            'code.unique' => 'Kode lencana sudah digunakan.',
            'name.required' => 'Nama lencana wajib diisi.',
            'criteria_type.required' => 'Tipe kriteria pemicu lencana wajib dipilih.',
            'criteria_value.required' => 'Nilai target kriteria wajib diisi.',
        ]);

        $badge = Badge::create($validated);

        return response()->json([
            'data' => $badge,
            'meta' => ['message' => 'Lencana berhasil dibuat.'],
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $badge = Badge::find($id);
        if (! $badge) {
            return response()->json(['message' => 'Lencana tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'code' => 'sometimes|required|string|max:50|unique:badges,code,'.$badge->id,
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'criteria_type' => 'sometimes|required|in:module_complete,topic_streak,perfect_score,total_stars',
            'criteria_value' => 'sometimes|required|integer|min:0',
        ]);

        $badge->update($validated);

        return response()->json([
            'data' => $badge,
            'meta' => ['message' => 'Lencana berhasil diperbarui.'],
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $badge = Badge::find($id);
        if (! $badge) {
            return response()->json(['message' => 'Lencana tidak ditemukan.'], 404);
        }

        $badge->delete(); // Soft delete

        return response()->json([
            'data' => ['message' => 'Lencana berhasil dihapus (soft-delete).'],
        ]);
    }
}
