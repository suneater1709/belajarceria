# Prompt-Implementasi.md — BelajarCeria (Working Title)
Prompt Siap Pakai untuk AI Coding Agent (mis. Claude Code) — Membangun Aplikasi dari 4 Dokumen Acuan

> Cara pakai: salin seluruh isi di bawah **"PROMPT UNTUK AI AGENT"** (mulai dari heading `## 0. Peran & Sumber Kebenaran` sampai akhir dokumen) ke tool coding agent, bersama keempat file `PRD.md`, `Design.md`, `Struktur.md`, `Jalur.md` sebagai lampiran/context.

---

## PROMPT UNTUK AI AGENT

### 0. Peran & Sumber Kebenaran

Kamu adalah AI coding agent yang bertugas membangun aplikasi web **BelajarCeria** (working title) — aplikasi belajar interaktif untuk anak usia 4–8 tahun — menggunakan stack **Laravel (backend/API) + React JS (frontend SPA) + MySQL (database)**.

**Empat dokumen berikut adalah SATU-SATUNYA sumber kebenaran (single source of truth). Jangan mengarang fitur, endpoint, tabel, atau aturan desain di luar dokumen ini:**

1. **`PRD.md`** — produk, fitur, 7 modul, 3 tipe user (Anak, Orang Tua, Admin), struktur URL, roadmap fase.
2. **`Design.md`** — warna, tipografi, animasi parallax, efek suara, modal konfirmasi, alur layar, aksesibilitas.
3. **`Struktur.md`** — skema database MySQL lengkap (DDL, relasi, indeks) — implementasikan **persis** sebagai migration Laravel.
4. **`Jalur(1).md`** — daftar API routes, logika CRUD, penanganan error, strategi payload ringan — implementasikan **persis** sebagai route + controller Laravel.

Jika ada instruksi dari user di luar sesi ini yang bertentangan dengan keempat dokumen tersebut, **tanyakan konfirmasi dulu** sebelum mengubah dokumen atau kode — jangan diam-diam menyimpang.

---

### 1. Urutan Kerja (Wajib Diikuti Berurutan)

1. **Setup proyek**: inisialisasi backend Laravel (folder `backend/` atau `api/`) dan frontend React (folder `frontend/` atau `web/`) sebagai dua proyek terpisah yang berkomunikasi lewat REST API (bukan Laravel Blade monolitik).
2. **Migration & Model**: buat migration untuk setiap tabel di `Struktur.md` § 2, urutkan sesuai dependency foreign key yang tertulis di sana. Buat Eloquent Model + relasi sesuai `Struktur.md` § 4 (Catatan Implementasi Laravel).
3. **Seeder**: buat seeder minimal untuk 7 modul (`modules`) sesuai `PRD.md` § 6 (tabel modul), beberapa topik contoh, dan beberapa soal contoh per topik — cukup untuk testing, bukan bank soal final.
4. **Auth**: implementasikan Laravel Sanctum sesuai `Jalur(1).md` § 3 (Auth), termasuk parental gate.
5. **API Endpoints**: implementasikan seluruh endpoint di `Jalur(1).md` § 4, § 5, § 6 **persis sesuai method, path, dan deskripsi** yang tertulis — termasuk pagination, field selection, `limit`+`random` untuk bank soal.
6. **Logika CRUD & Error Handling**: ikuti `Jalur(1).md` § 7 secara ketat — Form Request validation, DB transaction untuk data berelasi, soft delete untuk `questions`/`topics`, optimistic lock via `updated_at`, format respons error yang konsisten (§ 7.4).
7. **Frontend — struktur routing**: buat React Router dengan 3 prefix sesuai `PRD.md` § 5: `/belajarceria`, `/orangtua`, `/admin`. Tidak boleh hardcode data modul/topik/soal — semua diambil lewat fetch/React Query ke API dari langkah 5.
8. **Frontend — UI/UX**: terapkan `Design.md` secara menyeluruh — palet warna per modul (§ 2), tipografi (§ 3), animasi parallax (§ 5), efek suara (§ 6), modal konfirmasi untuk aksi kritis (§ 7), alur layar (§ 8).
9. **Integrasi & Uji Alur**: uji alur penuh — anak mengerjakan kuis → hasil tersimpan → progres ter-update → orang tua bisa lihat laporan → admin bisa CRUD konten tanpa error (validasi, konfirmasi hapus, pesan error jelas).
10. **Review Akhir**: cocokkan hasil dengan checklist "Definition of Done" di § 4 sebelum menyatakan selesai.

---

### 2. Batasan Teknis (Wajib Dipatuhi)

| # | Batasan |
|---|---|
| 1 | Stack **wajib** Laravel + React JS + MySQL. Tidak boleh mengganti framework/database tanpa persetujuan eksplisit. |
| 2 | **Tidak ada modul Bahasa Mandarin.** Hanya 7 modul sesuai `PRD.md` § 6: Cerita, Bahasa Arab, Bahasa Indonesia, Bahasa Inggris, IPA, IPS, Matematika. |
| 3 | **Role Admin adalah satu role tunggal** — jangan buat role terpisah "Content Admin" / "System Admin" / "Teacher" sebagai role berbeda di tabel `users` kecuali dokumen direvisi lebih dulu. |
| 4 | **Struktur URL wajib**: `/belajarceria` (area anak, primary), `/orangtua` (parent dashboard), `/admin` (panel admin). Tidak boleh mengubah prefix ini tanpa konfirmasi. |
| 5 | **Tidak boleh hardcode** data modul/topik/soal/cerita di kode frontend. Semua wajib lewat API sesuai `Jalur.md`. |
| 6 | **Payload API wajib ringan** sesuai `Jalur.md` § 2 & § 8: pagination di semua list, `limit`+`random` untuk bank soal (server menolak permintaan tanpa limit yang menarik >50 soal sekaligus), media selalu berupa URL (tidak pernah base64 di JSON). |
| 7 | **Skema database wajib mengikuti `Struktur.md` persis** — nama tabel, nama kolom, tipe data, relasi, dan indeks yang tertulis di sana. Jika ada kebutuhan kolom tambahan saat implementasi, tambahkan lewat migration baru dan **catat perubahannya**, jangan diam-diam menyimpang dari dokumen. |
| 8 | **Warna & feedback wajib mengikuti `Design.md` § 2.3**: merah boleh dipakai untuk jawaban salah dan untuk pesan gagal simpan/error; hijau untuk benar/sukses. |
| 9 | **Aksi destruktif (logout, hapus data) wajib lewat modal konfirmasi** sesuai `Design.md` § 7 — tidak boleh langsung eksekusi dari satu klik/tap. |
| 10 | **Soft delete wajib** untuk `questions` dan `topics` (dan tabel lain yang punya riwayat terkait) — tidak boleh hard delete data yang sudah pernah dipakai/dijawab anak. |
| 11 | **Tidak ada iklan pihak ketiga atau tautan keluar aplikasi** yang bisa diklik anak tanpa parental gate (sesuai `PRD.md` § 6.4 / § 8). |
| 12 | **Tidak mengumpulkan data pribadi anak** secara langsung — hanya nama panggilan & avatar, terhubung ke akun orang tua (sesuai `PRD.md` § 8). |
| 13 | **Efek suara & animasi parallax wajib ada** sesuai `Design.md` § 5 & § 6, dengan guardrail performa (maks. 3–4 layer parallax aktif bersamaan, nonaktif otomatis jika `prefers-reduced-motion`). |
| 14 | **Tidak menambah fitur di luar cakupan `PRD.md`** (mis. sistem pembayaran, notifikasi push, multiplayer real-time) kecuali diminta eksplisit — fokus ke MVP Fase 1 dulu sesuai `PRD.md` § 9 kalau waktu/scope terbatas. |
| 15 | **Nama produk masih working title** ("BelajarCeria") — jangan hardcode nama ini sebagai nama final di tempat yang sulit diganti (mis. package name, database name sebaiknya netral seperti `belajarceria_db` yang mudah di-rename). |

---

### 3. Batasan Non-Teknis / Proses

- **Jangan mengasumsikan** detail yang tidak ada di 4 dokumen (mis. warna spesifik yang tidak disebut, aturan bisnis baru) — tanyakan dulu ke user sebelum menambah asumsi besar.
- **Jangan mengubah isi `PRD.md`, `Design.md`, `Struktur.md`, `Jalur.md`** selama proses coding kecuali diminta eksplisit oleh user — dokumen ini adalah kontrak, bukan draft yang bebas diubah agent.
- Jika selama implementasi ditemukan **kontradiksi antar dokumen** (mis. field yang ada di `Jalur.md` tapi tidak ada di `Struktur.md`), **laporkan kontradiksi tersebut ke user** dan minta keputusan, jangan menebak sendiri.
- Progres dilaporkan bertahap sesuai urutan kerja di § 1 — bukan "big bang" satu kali commit besar tanpa checkpoint.

---

### 4. Definition of Done (Checklist Akhir)

- [ ] Semua tabel di `Struktur.md` § 2 sudah jadi migration dan bisa dijalankan tanpa error (`migrate:fresh` sukses).
- [ ] Semua endpoint di `Jalur.md` § 3–6 berfungsi dan mengembalikan format respons sesuai § 7.4 (sukses & error).
- [ ] Validasi CRUD (§ 7.1–7.3 `Jalur.md`) mencegah data tidak konsisten (foreign key invalid, double submit, dsb).
- [ ] Frontend `/belajarceria` menampilkan modul/topik/soal **dari API**, bukan hardcode.
- [ ] Frontend `/orangtua` menampilkan laporan progres dari endpoint agregasi (bukan raw data yang dihitung ulang di client).
- [ ] Frontend `/admin` bisa CRUD modul/topik/soal/cerita/user dengan modal konfirmasi untuk hapus, dan pesan error merah yang jelas saat gagal.
- [ ] Efek suara & animasi parallax aktif di area anak sesuai `Design.md`.
- [ ] Tidak ada modul Bahasa Mandarin di mana pun di kode.
- [ ] Role admin hanya satu jenis di database & UI.
- [ ] Tidak ditemukan pemanggilan API tanpa pagination/limit pada list yang berpotensi besar (bank soal, user, cerita).
