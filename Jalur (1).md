# Jalur.md — BelajarCeria (Working Title)
Daftar API Routes (Laravel) — Prinsip: Tidak Hardcode, Payload Ringan

---

## 1. Tujuan Dokumen

Semua data yang tampil di frontend (React) — modul, topik, bank soal, progres, laporan — **wajib diambil lewat API**, bukan ditulis tetap (hardcode) di kode frontend. Tujuannya:
1. Konten bisa berubah kapan saja lewat CMS Admin **tanpa perlu build ulang/deploy ulang frontend**.
2. Payload dijaga seringan mungkin (mobile/tablet data anak-anak sering pakai koneksi terbatas).
3. Satu sumber kebenaran (single source of truth) ada di database, bukan tersebar di beberapa file frontend.

---

## 2. Konvensi Umum API

| Aspek | Ketentuan |
|---|---|
| Base URL | `/api/v1/...` (versioning di depan agar breaking change tidak merusak app lama) |
| Format | JSON, `Content-Type: application/json` |
| Auth | Laravel Sanctum (token bearer), token disimpan di sisi client secara aman |
| Format Respons Sukses | `{ "data": ..., "meta": {...} }` |
| Format Respons Error | `{ "message": "...", "errors": {...} }` dengan HTTP status code sesuai (422, 401, 403, 404, 500) |
| Pagination | Selalu pakai `page` & `per_page` untuk list panjang (bank soal, user, laporan) — **tidak pernah** mengembalikan seluruh tabel sekaligus |
| Field Selection | Endpoint list mendukung `?fields=id,name,icon` agar hanya kolom yang dibutuhkan yang dikirim |
| Caching | `ETag` / `Last-Modified` di response header untuk data yang jarang berubah (modules, topics) — frontend cukup fetch ulang jika ada perubahan (`304 Not Modified`) |
| Kompresi | Response di-compress (gzip/br) di level server/CDN |
| Media (gambar/audio/video) | Tidak pernah dikirim sebagai base64 dalam JSON — selalu berupa URL terpisah (CDN/storage), diambil lazy oleh frontend saat dibutuhkan |

---

## 3. Auth

| Method | Endpoint | Deskripsi | Role |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Daftar akun orang tua | Publik |
| POST | `/api/v1/auth/login` | Login (orang tua/admin) | Publik |
| POST | `/api/v1/auth/logout` | Logout | Semua (auth) |
| POST | `/api/v1/auth/forgot-password` | Kirim link reset password | Publik |
| POST | `/api/v1/auth/parental-gate/verify` | Verifikasi parental gate (PIN/soal ringan) sebelum masuk `/orangtua` | Orang tua |

---

## 4. Area `/belajarceria` (Anak) — Konsumsi Konten Ringan

Prinsip di area ini: **fetch bertahap (lazy)**, bukan sekali tarik semua data. Anak hanya mengunduh apa yang sedang dilihat.

| Method | Endpoint | Deskripsi | Optimasi Payload |
|---|---|---|---|
| GET | `/api/v1/children/{child_id}/home` | Data ringkas untuk peta modul: daftar modul + status progres per modul (bukan detail topik) | Hanya field id, code, name, icon, color_theme, progress_percent |
| GET | `/api/v1/modules` | Daftar 7 modul (master data) | Cache lama (`ETag`), jarang berubah |
| GET | `/api/v1/modules/{code}/topics?child_id={id}` | Daftar topik dalam 1 modul + status per anak (locked/unlocked/completed) | Hanya field yang dibutuhkan untuk render kartu topik |
| GET | `/api/v1/topics/{id}` | Detail 1 topik (judul, deskripsi, jumlah soal) | Dipanggil saat topik dibuka, bukan saat render list |
| GET | `/api/v1/topics/{id}/questions?limit=10&random=true` | Ambil **sebagian** bank soal (acak, dibatasi `limit`) untuk 1 sesi kuis — **tidak** menarik seluruh bank soal topik | `limit` wajib diisi (default kecil, mis. 10) agar tidak menarik ratusan soal sekaligus |
| GET | `/api/v1/stories?module=cerita&page=1&per_page=10` | Daftar cerita (paginated) | Thumbnail saja di list, video/pdf URL baru diambil saat cerita dibuka |
| GET | `/api/v1/stories/{id}` | Detail 1 cerita (video_url, pdf_url, vocab) | Dipanggil saat cerita dibuka |
| POST | `/api/v1/quiz-attempts` | Kirim hasil 1 sesi kuis (jawaban, skor) | Payload kecil: hanya `question_id` + `selected_option_id` per jawaban |
| GET | `/api/v1/children/{id}/badges` | Daftar lencana yang sudah didapat anak | — |
| GET | `/api/v1/children/{id}/settings` | Pengaturan suara/musik anak | — |
| PUT | `/api/v1/children/{id}/settings` | Update pengaturan suara/musik | — |

**Catatan penting soal bank soal besar:** Endpoint `topics/{id}/questions` **selalu** butuh parameter `limit` (server menolak/mengabaikan permintaan tanpa limit yang menarik >50 soal sekaligus) supaya bank soal yang terus bertambah di CMS tidak membuat payload kuis membengkak — anak tetap hanya menerima subset acak sesuai kebutuhan 1 sesi.

---

## 5. Area `/orangtua` (Parent Dashboard)

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/parent/children` | Daftar profil anak milik akun ini |
| POST | `/api/v1/parent/children` | Tambah profil anak baru |
| PUT | `/api/v1/parent/children/{id}` | Edit profil anak |
| DELETE | `/api/v1/parent/children/{id}` | Hapus profil anak |
| GET | `/api/v1/parent/children/{id}/report?range=week` | Laporan progres (waktu belajar, skor rata-rata, topik lemah) — `range`: `week` / `month` / `all` |
| GET | `/api/v1/parent/children/{id}/badges` | Riwayat lencana anak |
| GET | `/api/v1/parent/account` | Data akun orang tua |
| PUT | `/api/v1/parent/account` | Update data akun (nama, email, password) |
| PUT | `/api/v1/parent/pin` | Set/ubah PIN parental gate |

**Optimasi:** endpoint `report` mengembalikan data **teragregasi** (sudah dihitung di backend — rata-rata, total, per-topik-lemah) alih-alih mengirim seluruh riwayat `quiz_attempts` mentah ke frontend untuk dihitung ulang.

---

## 6. Area `/admin` (CMS & Manajemen)

### 6.1 Modul & Topik
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/modules` | Daftar semua modul |
| POST | `/api/v1/admin/modules` | Tambah modul baru |
| PUT | `/api/v1/admin/modules/{id}` | Edit modul |
| DELETE | `/api/v1/admin/modules/{id}` | Hapus/nonaktifkan modul |
| GET | `/api/v1/admin/modules/{id}/topics?page=1&per_page=20` | Daftar topik dalam modul (paginated) |
| POST | `/api/v1/admin/topics` | Tambah topik |
| PUT | `/api/v1/admin/topics/{id}` | Edit topik |
| DELETE | `/api/v1/admin/topics/{id}` | Hapus/nonaktifkan topik |

### 6.2 Bank Soal
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/topics/{id}/questions?page=1&per_page=20` | Daftar soal dalam topik (paginated, bukan sekaligus semua) |
| POST | `/api/v1/admin/questions` | Tambah soal + opsi jawaban |
| PUT | `/api/v1/admin/questions/{id}` | Edit soal |
| DELETE | `/api/v1/admin/questions/{id}` | Hapus soal |
| POST | `/api/v1/admin/questions/{id}/options` | Tambah opsi jawaban |
| PUT | `/api/v1/admin/options/{id}` | Edit opsi jawaban |
| DELETE | `/api/v1/admin/options/{id}` | Hapus opsi jawaban |
| POST | `/api/v1/admin/media/upload` | Upload gambar/audio/video, mengembalikan URL (dipakai untuk isi `*_url` di soal/cerita) |

### 6.3 Cerita
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/stories?page=1&per_page=20` | Daftar cerita |
| POST | `/api/v1/admin/stories` | Tambah cerita |
| PUT | `/api/v1/admin/stories/{id}` | Edit cerita |
| DELETE | `/api/v1/admin/stories/{id}` | Hapus cerita |
| POST | `/api/v1/admin/stories/{id}/vocabularies` | Tambah kosakata cerita |

### 6.4 User & Sistem
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/v1/admin/users?role=parent&page=1` | Daftar user (filter by role) |
| PUT | `/api/v1/admin/users/{id}/suspend` | Suspend akun bermasalah |
| GET | `/api/v1/admin/badges` | Daftar master lencana |
| POST | `/api/v1/admin/badges` | Tambah lencana baru |
| GET | `/api/v1/admin/dashboard/summary` | Ringkasan penggunaan platform (user aktif, modul terpopuler) — data teragregasi, bukan raw |

---

## 7. Logika CRUD & Penanganan Error (Anti-Error)

Prinsip: setiap operasi CRUD (Create, Read, Update, Delete) **divalidasi di backend** (bukan hanya di frontend), mengembalikan status code yang jelas, dan operasi destruktif **wajib dikonfirmasi dulu di frontend** (lihat Design.md § 7. Modal Konfirmasi) sebelum request dikirim.

### 7.1 Alur Umum CRUD (berlaku untuk semua resource: modules, topics, questions, options, stories, children, users, dst)

```
CREATE (POST)
  1. Frontend kirim form data.
  2. Backend validasi (Laravel Form Request): field wajib, tipe data, panjang, foreign key valid.
     → Jika gagal: 422 Unprocessable Entity + { "errors": { "field": ["pesan error"] } }
  3. Jika valid: simpan ke DB dalam transaction (DB::transaction) agar data terkait
     (mis. question + question_options) tersimpan utuh atau tidak sama sekali (rollback jika ada yang gagal).
  4. Sukses → 201 Created + data yang baru dibuat (termasuk id).

READ (GET)
  1. Jika resource tidak ditemukan → 404 Not Found + pesan jelas ("Topik tidak ditemukan").
  2. Jika user tidak berhak akses (mis. orang tua akses anak milik user lain) → 403 Forbidden.
  3. List selalu dibungkus pagination (lihat § 2), tidak pernah mengembalikan array kosong tanpa `meta` (frontend perlu tahu total halaman untuk UI "load more").

UPDATE (PUT/PATCH)
  1. Validasi sama seperti CREATE, tapi field boleh partial untuk PATCH.
  2. Cek resource ada dulu (404 jika tidak) sebelum validasi field lain.
  3. Update dalam transaction jika menyentuh tabel relasi (mis. edit soal + opsi jawaban sekaligus).
  4. Sukses → 200 OK + data terbaru.

DELETE
  1. Frontend WAJIB menampilkan modal konfirmasi dulu (lihat Design.md § 7) sebelum request DELETE dikirim.
  2. Backend cek resource ada → 404 jika tidak ada (mis. sudah terhapus di tab lain).
  3. Untuk resource yang punya riwayat terkait (mis. `questions` yang sudah pernah dijawab di `quiz_answers`),
     gunakan **soft delete** (`deleted_at`) — bukan hapus permanen — agar riwayat anak tidak rusak/error saat ditampilkan di laporan.
  4. Untuk resource tanpa riwayat terkait (mis. `question_options` yang baru dibuat, belum pernah dipakai), boleh hard delete.
  5. Sukses → 200 OK + { "message": "Berhasil dihapus" } atau 204 No Content.
```

### 7.2 Aturan Validasi Kunci per Resource (contoh, mencegah data tidak konsisten)

| Resource | Validasi Wajib |
|---|---|
| `modules` | `code` unik, `name` wajib, `color_theme` format hex valid |
| `topics` | `module_id` harus ada di tabel `modules`, `name` wajib |
| `questions` | `topic_id` harus ada, `type` harus salah satu enum yang valid, minimal **1 opsi jawaban benar** (`is_correct = true`) sebelum status bisa diubah ke `published` |
| `question_options` | `question_id` harus ada, tidak boleh menghapus opsi terakhir jika soal masih `published` (soal jadi tidak punya jawaban) |
| `children` | `user_id` = user yang sedang login (tidak bisa membuat anak untuk akun lain), `age_level` harus enum valid |
| `quiz_attempts` | `child_id` harus milik user yang login, `topic_id` harus ada, jumlah jawaban tidak boleh melebihi jumlah soal yang diminta di sesi |
| `users` (admin) | `email` unik, `role` harus enum valid (`parent`/`admin`) |

### 7.3 Mencegah Error Umum

| Potensi Error | Pencegahan |
|---|---|
| Foreign key tidak ditemukan (mis. `topic_id` dihapus tapi masih dirujuk) | Validasi `exists:table,id` di Form Request sebelum simpan; gunakan `ON DELETE CASCADE`/`SET NULL` sesuai skema di Struktur.md |
| Double submit (tombol simpan/hapus ditekan 2x) | Tombol otomatis `disabled` + loading state saat request berjalan (lihat Design.md § 7.4) |
| Race condition saat 2 admin edit data sama | Gunakan `updated_at` sebagai optimistic lock — jika `updated_at` di request tidak cocok dengan di DB, kembalikan 409 Conflict |
| Payload terlalu besar bikin timeout | Pagination + limit wajib (lihat § 2 dan § 8) |
| Soal terhapus padahal masih ada anak yang menjawabnya | Soft delete untuk `questions`, bukan hard delete |
| Hapus modul/topik yang masih dipakai anak lain | Tampilkan peringatan jumlah anak yang sedang mengerjakan sebelum konfirmasi hapus (opsional info tambahan di modal konfirmasi) |
| Sesi login habis saat submit form panjang | Refresh token otomatis (silent refresh) sebelum expired, atau simpan draft form sementara di client |

### 7.4 Format Respons Error Konsisten (dipakai di semua endpoint)

```json
// 422 - validasi gagal
{
  "message": "Data tidak valid.",
  "errors": {
    "name": ["Nama topik wajib diisi."],
    "module_id": ["Modul tidak ditemukan."]
  }
}

// 404 - tidak ditemukan
{
  "message": "Topik tidak ditemukan."
}

// 403 - tidak berhak
{
  "message": "Anda tidak memiliki akses ke data ini."
}

// 409 - konflik (mis. optimistic lock gagal)
{
  "message": "Data sudah diubah oleh pihak lain, silakan muat ulang."
}

// 500 - error server (jangan bocorkan detail teknis ke frontend)
{
  "message": "Terjadi kesalahan pada server. Silakan coba lagi."
}
```

Frontend menampilkan pesan dari `message`/`errors` ini langsung ke user memakai warna merah (lihat Design.md § 2.3 — Gagal Simpan/Error), tanpa perlu menerjemahkan ulang kode error secara hardcode di React.

---

## 8. Strategi Menjaga Data Tetap Ringan

1. **Tidak ada data statis di frontend** — semua nama modul, ikon, warna, teks soal berasal dari API, disimpan sementara di state/cache client (mis. React Query/SWR) dengan waktu kedaluwarsa (`staleTime`), bukan ditulis ulang di kode.
2. **Pagination wajib** di semua endpoint yang berpotensi tumbuh besar (bank soal, daftar user, daftar cerita, laporan).
3. **Random + limit untuk bank soal** — anak tidak pernah menarik seluruh bank soal topik, hanya sejumlah soal yang dibutuhkan 1 sesi.
4. **Field selection (`?fields=`)** dipakai di layar ringan seperti peta modul, agar tidak ikut menarik field berat (mis. `description` panjang) yang tidak ditampilkan di kartu.
5. **Cache di sisi client** untuk data yang jarang berubah (`modules`, `topics`) memakai `ETag`/`Last-Modified`, sehingga kunjungan berikutnya cukup dapat `304 Not Modified` (tanpa body).
6. **Media terpisah dari data teks** — gambar/audio/video selalu berupa URL (disajikan lewat CDN/storage, dengan lazy-load & format terkompresi mis. WebP/AAC), tidak pernah disisipkan sebagai base64 ke dalam response JSON.
7. **Agregasi dilakukan di backend**, bukan di frontend — endpoint laporan (`/parent/children/{id}/report`, `/admin/dashboard/summary`) mengirim hasil hitungan jadi, bukan data mentah yang harus diproses ulang oleh browser anak.
8. **Rate limiting** (Laravel throttle) diterapkan di endpoint publik/anak untuk mencegah pemakaian data berlebih akibat pemanggilan berulang yang tidak perlu.

---

## 9. Ringkasan Pemetaan Frontend ↔ API

| Halaman Frontend (dari Design.md) | Endpoint yang Dipanggil |
|---|---|
| Peta Modul (Home Anak) | `GET /children/{id}/home` |
| Daftar Topik per Modul | `GET /modules/{code}/topics?child_id=` |
| Layar Soal/Aktivitas | `GET /topics/{id}/questions?limit=10&random=true` → `POST /quiz-attempts` |
| Layar Hasil/Reward | Hasil dari response `POST /quiz-attempts` (tidak perlu fetch ulang) |
| Parent Dashboard | `GET /parent/children`, `GET /parent/children/{id}/report` |
| Admin CMS | seluruh endpoint `/admin/*` sesuai tabel di atas |
| Modal Konfirmasi Logout | `POST /auth/logout` (dipanggil setelah user tekan Konfirmasi) |
| Modal Konfirmasi Hapus | `DELETE /...` resource terkait (dipanggil setelah user tekan Konfirmasi) |

