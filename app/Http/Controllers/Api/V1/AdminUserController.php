<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $role = $request->query('role');
        $page = (int) $request->query('page', 1);
        $perPage = (int) $request->query('per_page', 20);

        $query = User::withCount('children')->orderBy('id', 'desc');

        if ($role && in_array($role, ['parent', 'teacher', 'admin'])) {
            $query->where('role', $role);
        }

        $users = $query->paginate($perPage, ['id', 'name', 'email', 'role', 'phone', 'created_at']);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function suspend(Request $request, $id): JsonResponse
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        // Cegah admin me-suspend diri sendiri
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json(['message' => 'Anda tidak dapat menonaktifkan akun sendiri.'], 422);
        }

        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json([
            'data' => [
                'user_id' => $user->id,
                'message' => 'Akun berhasil dinonaktifkan (sesi token telah dicabut).',
            ],
        ]);
    }
}
