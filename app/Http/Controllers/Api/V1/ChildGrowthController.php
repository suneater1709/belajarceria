<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Child;
use App\Models\MilestoneAnak;
use App\Models\PertumbuhanAnak;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChildGrowthController extends Controller
{
    /**
     * Master daftar milestone perkembangan anak usia 3-6 tahun (24 Indikator Lengkap).
     */
    private function getMasterMilestones(): array
    {
        return [
            // 1. Bahasa & Komunikasi
            [
                'key' => 'sebut_nama_lengkap',
                'title' => 'Bisa menyebutkan nama sendiri & keluarga dengan jelas',
                'category' => 'Bahasa & Komunikasi',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'cerita_pengalaman',
                'title' => 'Mampu menceritakan kembali kejadian sederhana yang dialaminya',
                'category' => 'Bahasa & Komunikasi',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'tanya_apa_kenapa',
                'title' => 'Aktif bertanya menggunakan kata tanya mengapa atau bagaimana',
                'category' => 'Bahasa & Komunikasi',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'kenal_huruf_vokal',
                'title' => 'Mampu mengenali dan melafalkan huruf vokal (A, I, U, E, O)',
                'category' => 'Bahasa & Komunikasi',
                'age_recommendation' => '4-5 Tahun',
            ],

            // 2. Motorik Kasar
            [
                'key' => 'lompat_dua_kaki',
                'title' => 'Bisa melompat ke depan dengan 2 kaki bersamaan',
                'category' => 'Motorik Kasar',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'lompat_satu_kaki',
                'title' => 'Bisa melompat dengan satu kaki atau berjalan jinjit',
                'category' => 'Motorik Kasar',
                'age_recommendation' => '5-6 Tahun',
            ],
            [
                'key' => 'tangkap_bola_besar',
                'title' => 'Mampu melempar dan menangkap bola berukuran sedang',
                'category' => 'Motorik Kasar',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'bersepeda_roda_tiga',
                'title' => 'Bisa mengayuh sepeda roda tiga atau mainan dorong seimbang',
                'category' => 'Motorik Kasar',
                'age_recommendation' => '3-4 Tahun',
            ],

            // 3. Motorik Halus
            [
                'key' => 'pegang_pensil',
                'title' => 'Bisa memegang pensil atau krayon dengan jari yang tepat',
                'category' => 'Motorik Halus',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'gambar_bentuk_orang',
                'title' => 'Bisa menggambar orang sederhana (kepala, badan, kaki/tangan)',
                'category' => 'Motorik Halus',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'gunting_kertas_lurus',
                'title' => 'Mampu menggunting kertas mengikuti pola garis lurus',
                'category' => 'Motorik Halus',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'susun_menara_balok',
                'title' => 'Mampu menyusun menara dari 8–10 balok tanpa roboh',
                'category' => 'Motorik Halus',
                'age_recommendation' => '3-4 Tahun',
            ],

            // 4. Kognitif
            [
                'key' => 'instruksi_dua_langkah',
                'title' => 'Bisa mengikuti instruksi 2–3 langkah berurutan secara mandiri',
                'category' => 'Kognitif',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'hitung_benda_dasar',
                'title' => 'Bisa menghitung 1 sampai 10 benda nyata dengan menunjuknya',
                'category' => 'Kognitif',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'kelompok_warna_bentuk',
                'title' => 'Mampu mengelompokkan benda berdasarkan warna atau bentuk sama',
                'category' => 'Kognitif',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'kenal_konsep_waktu',
                'title' => 'Memahami konsep waktu sederhana (pagi, siang, malam, kemarin)',
                'category' => 'Kognitif',
                'age_recommendation' => '5-6 Tahun',
            ],

            // 5. Kemandirian
            [
                'key' => 'pakai_baju_sendiri',
                'title' => 'Bisa memakai pakaian atau sandal sederhana sendiri',
                'category' => 'Kemandirian',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'kancing_baju',
                'title' => 'Bisa mengancingkan baju atau merapikan tas sendiri',
                'category' => 'Kemandirian',
                'age_recommendation' => '5-6 Tahun',
            ],
            [
                'key' => 'cuci_tangan_mandiri',
                'title' => 'Mampu mencuci dan mengeringkan tangan secara mandiri',
                'category' => 'Kemandirian',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'rapikan_mainan',
                'title' => 'Mau merapikan mainan atau perlengkapan setelah digunakan',
                'category' => 'Kemandirian',
                'age_recommendation' => '4-5 Tahun',
            ],

            // 6. Sosial & Emosional
            [
                'key' => 'berbagi_dan_antre',
                'title' => 'Bisa bermain bersama teman dan bergantian aturan/giliran',
                'category' => 'Sosial & Emosional',
                'age_recommendation' => '5-6 Tahun',
            ],
            [
                'key' => 'ucap_tolong_terimakasih',
                'title' => 'Terbiasa mengucapkan tolong, terima kasih, dan maaf',
                'category' => 'Sosial & Emosional',
                'age_recommendation' => '3-4 Tahun',
            ],
            [
                'key' => 'ungkapkan_perasaan',
                'title' => 'Mampu mengungkapkan rasa senang, sedih, atau takut dengan kata-kata',
                'category' => 'Sosial & Emosional',
                'age_recommendation' => '4-5 Tahun',
            ],
            [
                'key' => 'bantu_tugas_rumah',
                'title' => 'Menunjukkan inisiatif membantu tugas sederhana di rumah',
                'category' => 'Sosial & Emosional',
                'age_recommendation' => '5-6 Tahun',
            ],
        ];
    }

    private function resolveChild(Request $request, $childId): ?Child
    {
        if (empty($childId)) {
            return null;
        }

        $user = $request->user();
        if (! $user) {
            return null;
        }

        $child = Child::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhere('parent_id', $user->id);
        })->find($childId);

        if (! $child && $user->isAdmin()) {
            $child = Child::find($childId);
        }

        return $child;
    }

    /**
     * Mendapatkan data lengkap tumbuh kembang anak.
     */
    public function index(Request $request, $childId): JsonResponse
    {
        $child = $this->resolveChild($request, $childId);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        // 1. Hitung Usia Terkini
        $ageString = 'Usia '.$child->age_level.' Tahun';
        if ($child->birth_date) {
            $diff = Carbon::parse($child->birth_date)->diff(now());
            $years = $diff->y;
            $months = $diff->m;
            if ($years > 0 && $months > 0) {
                $ageString = "{$years} Tahun {$months} Bulan";
            } elseif ($years > 0) {
                $ageString = "{$years} Tahun";
            } else {
                $ageString = "{$months} Bulan";
            }
        }

        // 2. Data Pengukuran Pertumbuhan
        $records = PertumbuhanAnak::where('anak_id', $child->id)
            ->orderBy('tanggal', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $latestRecord = $records->last();

        // 3. Data Milestones & Seleksi Tugas Harian Dinamis
        $savedMilestones = MilestoneAnak::where('anak_id', $child->id)
            ->get()
            ->keyBy('milestone_key');

        $todayDate = now()->toDateString();
        $masterMilestones = $this->getMasterMilestones();

        $allMilestonesMapped = array_map(function ($item) use ($savedMilestones) {
            $saved = $savedMilestones->get($item['key']);
            $tanggalRaw = ($saved && $saved->tanggal_tercapai) ? Carbon::parse($saved->tanggal_tercapai)->toDateString() : null;

            return [
                'key' => $item['key'],
                'title' => $item['title'],
                'category' => $item['category'],
                'age_recommendation' => $item['age_recommendation'],
                'tercapai' => $saved ? (bool) $saved->tercapai : false,
                'tanggal_raw' => $tanggalRaw,
                'tanggal_tercapai' => ($saved && $saved->tanggal_tercapai) ? Carbon::parse($saved->tanggal_tercapai)->translatedFormat('d M Y') : null,
            ];
        }, $masterMilestones);

        $totalMilestones = count($allMilestonesMapped);
        $allAchieved = array_values(array_filter($allMilestonesMapped, fn ($m) => $m['tercapai']));
        $completedMilestonesCount = count($allAchieved);

        // Capaian yang dituntaskan hari ini
        $completedToday = array_values(array_filter($allAchieved, fn ($m) => $m['tanggal_raw'] === $todayDate));

        // Milestone yang belum pernah dicapai
        $unachievedMilestones = array_values(array_filter($allMilestonesMapped, fn ($m) => ! $m['tercapai']));

        // Algoritma Seleksi Harian Dinamis:
        // Setiap hari, acak urutan milestone yang belum dicapai menggunakan seed berbasis child_id + tanggal hari ini.
        $seed = (int) sprintf('%u', crc32($child->id.'_'.$todayDate));
        mt_srand($seed);
        $shuffledUnachieved = $unachievedMilestones;
        for ($i = count($shuffledUnachieved) - 1; $i > 0; $i--) {
            $j = mt_rand(0, $i);
            $tmp = $shuffledUnachieved[$i];
            $shuffledUnachieved[$i] = $shuffledUnachieved[$j];
            $shuffledUnachieved[$j] = $tmp;
        }
        mt_srand(); // Kembalikan ke random generator standar

        // Ambil maksimal 5 target aktif harian yang belum selesai
        $dailyActiveTasks = array_slice($shuffledUnachieved, 0, 5);

        // Status selesai harian: jika tidak ada task aktif tersisa hari ini
        $allCompletedToday = count($dailyActiveTasks) === 0;

        // 4. Logika Real-time Status Perkembangan (Live dari Checklist Milestone & Pengukuran Fisik)
        $statusBadge = 'empty';
        $statusLabel = 'Belum Ada Data';
        $statusNote = 'Belum ada data capaian milestone atau pengukuran fisik yang dicatat.';

        if ($completedMilestonesCount > 0) {
            $percentMilestone = (int) round(($completedMilestonesCount / $totalMilestones) * 100);
            if ($percentMilestone >= 70) {
                $statusBadge = 'normal';
                $statusLabel = 'Sangat Baik ('.$completedMilestonesCount.'/'.$totalMilestones.' Capaian)';
                $statusNote = "Anak telah menguasai {$completedMilestonesCount} dari {$totalMilestones} milestone perkembangan usianya dengan sangat optimal.";
            } elseif ($percentMilestone >= 30) {
                $statusBadge = 'normal';
                $statusLabel = 'Sesuai Tahapan ('.$completedMilestonesCount.'/'.$totalMilestones.' Capaian)';
                $statusNote = "Perkembangan anak berjalan baik ({$completedMilestonesCount} capaian tercapai) dan terus menunjukkan kemajuan positif.";
            } else {
                $statusBadge = 'normal';
                $statusLabel = 'Mulai Berkembang ('.$completedMilestonesCount.'/'.$totalMilestones.' Capaian)';
                $statusNote = "Anak mulai menunjukkan kemandirian dan capaian milestone dasar ({$completedMilestonesCount} tercapai).";
            }
        } elseif ($records->count() > 0) {
            $statusBadge = 'normal';
            $statusLabel = 'Data Fisik Tercatat';
            $statusNote = 'Data pengukuran berat dan tinggi telah dicatat. Yuk lengkapi juga checklist milestone harian di bawah.';
        }

        // 5. Pengingat 30 Hari
        $needsReminder = false;
        $reminderText = null;
        if ($latestRecord) {
            $daysSinceLast = Carbon::parse($latestRecord->tanggal)->diffInDays(now());
            if ($daysSinceLast >= 30) {
                $needsReminder = true;
                $reminderText = "Sudah {$daysSinceLast} hari belum update data pertumbuhan {$child->name}.";
            }
        } else {
            $needsReminder = true;
            $reminderText = "Yuk catat data pengukuran berat & tinggi pertama untuk {$child->name}!";
        }

        return response()->json([
            'data' => [
                'child' => [
                    'id' => $child->id,
                    'name' => $child->name,
                    'avatar' => $child->avatar,
                    'birth_date' => $child->birth_date ? Carbon::parse($child->birth_date)->format('Y-m-d') : null,
                    'birth_date_formatted' => $child->birth_date ? Carbon::parse($child->birth_date)->translatedFormat('d F Y') : null,
                    'age_level' => $child->age_level,
                    'calculated_age' => $ageString,
                ],
                'summary' => [
                    'latest_date' => $latestRecord ? Carbon::parse($latestRecord->tanggal)->translatedFormat('d M Y') : null,
                    'latest_weight' => $latestRecord ? (float) $latestRecord->berat_kg : null,
                    'latest_height' => $latestRecord ? (float) $latestRecord->tinggi_cm : null,
                    'latest_head_circumference' => ($latestRecord && $latestRecord->lingkar_kepala_cm) ? (float) $latestRecord->lingkar_kepala_cm : null,
                    'status_badge' => $statusBadge, // 'normal' | 'warning' | 'empty'
                    'status_label' => $statusLabel,
                    'status_note' => $statusNote,
                    'disclaimer' => 'Bukan pengganti pemeriksaan dokter/posyandu.',
                    'needs_reminder' => $needsReminder,
                    'reminder_text' => $reminderText,
                    'total_measurements' => $records->count(),
                    'milestone_stats' => [
                        'total' => $totalMilestones,
                        'completed' => $completedMilestonesCount,
                        'percent' => $totalMilestones > 0 ? (int) round(($completedMilestonesCount / $totalMilestones) * 100) : 0,
                    ],
                ],
                'daily_milestones' => $dailyActiveTasks,
                'completed_today' => $completedToday,
                'all_achieved' => $allAchieved,
                'all_completed_today' => $allCompletedToday,
                'daily_stats' => [
                    'active_count' => count($dailyActiveTasks),
                    'completed_today_count' => count($completedToday),
                    'all_completed_today' => $allCompletedToday,
                    'message' => $allCompletedToday
                        ? 'Semua target capaian hari ini telah tuntas! 🎉 Capaian baru yang bervariasi akan muncul kembali besok.'
                        : 'Selesaikan target capaian harian si kecil hari ini.',
                ],
                'chart_data' => $records->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'tanggal' => Carbon::parse($r->tanggal)->format('Y-m-d'),
                        'tanggal_formatted' => Carbon::parse($r->tanggal)->translatedFormat('d M Y'),
                        'berat_kg' => (float) $r->berat_kg,
                        'tinggi_cm' => (float) $r->tinggi_cm,
                        'lingkar_kepala_cm' => $r->lingkar_kepala_cm ? (float) $r->lingkar_kepala_cm : null,
                    ];
                }),
                'history' => $records->reverse()->values()->map(function ($r) {
                    return [
                        'id' => $r->id,
                        'tanggal' => Carbon::parse($r->tanggal)->format('Y-m-d'),
                        'tanggal_formatted' => Carbon::parse($r->tanggal)->translatedFormat('d M Y'),
                        'berat_kg' => (float) $r->berat_kg,
                        'tinggi_cm' => (float) $r->tinggi_cm,
                        'lingkar_kepala_cm' => $r->lingkar_kepala_cm ? (float) $r->lingkar_kepala_cm : null,
                    ];
                }),
                'milestones' => $allMilestonesMapped,
            ],
        ]);
    }

    /**
     * Tambah data pengukuran baru.
     */
    public function storeMeasurement(Request $request, $childId): JsonResponse
    {
        $child = $this->resolveChild($request, $childId);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'tanggal' => 'required|date|before_or_equal:today',
            'berat_kg' => 'required|numeric|min:1|max:100',
            'tinggi_cm' => 'required|numeric|min:30|max:200',
            'lingkar_kepala_cm' => 'nullable|numeric|min:20|max:100',
        ], [
            'tanggal.required' => 'Tanggal pengukuran wajib diisi.',
            'tanggal.before_or_equal' => 'Tanggal pengukuran tidak boleh melebihi hari ini.',
            'berat_kg.required' => 'Berat badan wajib diisi.',
            'berat_kg.numeric' => 'Berat badan harus berupa angka (kg).',
            'tinggi_cm.required' => 'Tinggi badan wajib diisi.',
            'tinggi_cm.numeric' => 'Tinggi badan harus berupa angka (cm).',
        ]);

        $record = PertumbuhanAnak::create([
            'anak_id' => $child->id,
            'tanggal' => $validated['tanggal'],
            'berat_kg' => $validated['berat_kg'],
            'tinggi_cm' => $validated['tinggi_cm'],
            'lingkar_kepala_cm' => $validated['lingkar_kepala_cm'] ?? null,
        ]);

        return response()->json([
            'data' => $record,
            'meta' => ['message' => 'Data pengukuran pertumbuhan berhasil disimpan.'],
        ], 201);
    }

    /**
     * Edit data pengukuran.
     */
    public function updateMeasurement(Request $request, $id): JsonResponse
    {
        $record = PertumbuhanAnak::with('child')->find($id);
        if (! $record) {
            return response()->json(['message' => 'Data pengukuran tidak ditemukan.'], 404);
        }

        $child = $this->resolveChild($request, $record->anak_id);
        if (! $child) {
            return response()->json(['message' => 'Akses data pengukuran ditolak.'], 403);
        }

        $validated = $request->validate([
            'tanggal' => 'required|date|before_or_equal:today',
            'berat_kg' => 'required|numeric|min:1|max:100',
            'tinggi_cm' => 'required|numeric|min:30|max:200',
            'lingkar_kepala_cm' => 'nullable|numeric|min:20|max:100',
        ], [
            'tanggal.required' => 'Tanggal pengukuran wajib diisi.',
            'tanggal.before_or_equal' => 'Tanggal pengukuran tidak boleh melebihi hari ini.',
            'berat_kg.required' => 'Berat badan wajib diisi.',
            'berat_kg.numeric' => 'Berat badan harus berupa angka (kg).',
            'tinggi_cm.required' => 'Tinggi badan wajib diisi.',
            'tinggi_cm.numeric' => 'Tinggi badan harus berupa angka (cm).',
        ]);

        $record->update([
            'tanggal' => $validated['tanggal'],
            'berat_kg' => $validated['berat_kg'],
            'tinggi_cm' => $validated['tinggi_cm'],
            'lingkar_kepala_cm' => $validated['lingkar_kepala_cm'] ?? null,
        ]);

        return response()->json([
            'data' => $record,
            'meta' => ['message' => 'Data pengukuran berhasil diperbarui.'],
        ]);
    }

    /**
     * Hapus data pengukuran.
     */
    public function destroyMeasurement(Request $request, $id): JsonResponse
    {
        $record = PertumbuhanAnak::with('child')->find($id);
        if (! $record) {
            return response()->json(['message' => 'Data pengukuran tidak ditemukan.'], 404);
        }

        $child = $this->resolveChild($request, $record->anak_id);
        if (! $child) {
            return response()->json(['message' => 'Akses data pengukuran ditolak.'], 403);
        }

        $record->delete();

        return response()->json([
            'data' => ['message' => 'Data pengukuran berhasil dihapus.'],
        ]);
    }

    /**
     * Toggle checklist milestone anak.
     */
    public function toggleMilestone(Request $request, $childId = null): JsonResponse
    {
        $targetChildId = $childId ?? $request->input('id_anak') ?? $request->input('child_id');
        $child = $this->resolveChild($request, $targetChildId);
        if (! $child) {
            return response()->json(['message' => 'Profil anak tidak ditemukan.'], 404);
        }

        $milestoneKey = $request->input('milestone_key') ?? $request->input('id_item_milestone');
        if (empty($milestoneKey)) {
            return response()->json(['message' => 'Key/ID item milestone wajib diisi.'], 422);
        }

        $tercapai = false;
        if ($request->has('tercapai')) {
            $tercapai = filter_var($request->input('tercapai'), FILTER_VALIDATE_BOOLEAN);
        } elseif ($request->has('status')) {
            $status = $request->input('status');
            $tercapai = in_array($status, ['tercapai', 'completed', true, 1, '1'], true);
        }

        $tanggalTercapai = $tercapai
            ? ($request->input('tanggal_tercapai') ? Carbon::parse($request->input('tanggal_tercapai'))->toDateString() : now()->toDateString())
            : null;

        $milestone = MilestoneAnak::updateOrCreate(
            [
                'anak_id' => $child->id,
                'milestone_key' => $milestoneKey,
            ],
            [
                'tercapai' => $tercapai,
                'tanggal_tercapai' => $tanggalTercapai,
            ]
        );

        return response()->json([
            'data' => [
                'id' => $milestone->id,
                'id_anak' => $milestone->anak_id,
                'anak_id' => $milestone->anak_id,
                'id_item_milestone' => $milestone->milestone_key,
                'milestone_key' => $milestoneKey,
                'status' => $milestone->tercapai ? 'tercapai' : 'belum',
                'tercapai' => (bool) $milestone->tercapai,
                'tanggal_tercapai' => $milestone->tanggal_tercapai ? $milestone->tanggal_tercapai->toDateString() : null,
                'updated_at' => $milestone->updated_at,
            ],
            'meta' => ['message' => 'Status milestone berhasil diperbarui.'],
        ]);
    }
}
