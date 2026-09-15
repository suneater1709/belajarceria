<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:150|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:30',
            'parental_pin' => 'nullable|string|min:4|max:6',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar.',
            'password.required' => 'Password wajib diisi.',
            'password.min' => 'Password minimal 6 karakter.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'parent',
            'phone' => $validated['phone'] ?? null,
            'parental_pin' => isset($validated['parental_pin']) ? Hash::make($validated['parental_pin']) : null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'token' => $token,
            ],
            'meta' => [
                'message' => 'Pendaftaran berhasil.',
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Email wajib diisi.',
            'password.required' => 'Password wajib diisi.',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password yang Anda masukkan salah.',
                'errors' => [
                    'email' => ['Kredensial tidak cocok dengan data kami.'],
                ],
            ], 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'has_pin' => ! empty($user->parental_pin),
                ],
                'token' => $token,
            ],
            'meta' => [
                'message' => 'Login berhasil.',
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'data' => [
                'message' => 'Berhasil logout.',
            ],
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        return response()->json([
            'data' => [
                'message' => 'Link reset password telah dikirim ke email Anda (demo mode).',
            ],
        ]);
    }

    public function verifyParentalGate(Request $request): JsonResponse
    {
        $user = $request->user();

        // Bisa verifikasi via PIN atau via jawaban soal matematika
        if ($request->filled('pin')) {
            if (! $user || empty($user->parental_pin)) {
                // Default pin jika belum diset adalah 1234
                if ($request->pin === '1234') {
                    return response()->json(['data' => ['verified' => true]]);
                }
            } else {
                if (Hash::check($request->pin, $user->parental_pin)) {
                    return response()->json(['data' => ['verified' => true]]);
                }
            }

            return response()->json([
                'message' => 'PIN salah.',
                'errors' => ['pin' => ['PIN yang dimasukkan tidak sesuai.']],
            ], 422);
        }

        if ($request->filled('challenge_answer') && $request->filled('expected_answer')) {
            if ((int) $request->challenge_answer === (int) $request->expected_answer) {
                return response()->json(['data' => ['verified' => true]]);
            }

            return response()->json([
                'message' => 'Jawaban tantangan matematika salah.',
                'errors' => ['challenge_answer' => ['Jawaban belum tepat.']],
            ], 422);
        }

        return response()->json([
            'message' => 'Parameter verifikasi tidak lengkap.',
        ], 422);
    }
}
