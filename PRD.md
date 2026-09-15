# PRD — BelajarCeria (Working Title)
Aplikasi Belajar Interaktif untuk Anak Usia 4–8 Tahun

> **Catatan nama produk:** "BelajarCeria" dipakai sebagai *working title* di dokumen ini. Nama final belum final — akan dikonfirmasi setelah pengecekan ketersediaan domain/merek. **Tidak menggunakan nama "Genius Kids"** karena sudah dipakai pihak lain.

---

## 1. Ringkasan Produk (Executive Summary)

BelajarCeria adalah platform web belajar interaktif untuk anak usia 4–8 tahun, dibangun dengan **Laravel (backend/API) + React JS (frontend SPA) + MySQL (database)**. Produk terinspirasi dari konsep produk referensi "Genius Kids" (8 modul: Cerita, Bahasa Arab, Bahasa Indonesia, Bahasa Inggris, Bahasa Mandarin, IPA, IPS, Matematika), tetapi BelajarCeria membangun **7 modul** (tanpa Bahasa Mandarin) dengan pendekatan yang lebih terstruktur: setiap modul punya **bank soal/konten sendiri** yang bisa dikelola lewat CMS, ditambah **progress tracking anak per anak**, **efek suara**, dan **animasi parallax** supaya anak tidak cepat bosan.

---

## 2. Analisis Kompetitor — Genius Kids (dari materi promosi yang dilampirkan)

### 2.1 Kelebihan Genius Kids
- Visual sangat ramah anak: warna cerah, karakter maskot per modul (owl, robot, dinosaurus, dsb), ilustrasi 3D yang playful.
- Modul cukup lengkap: Cerita interaktif (video + PDF + kuis), 5 Bahasa Asing, IPA, IPS, Matematika.
- Setiap modul dikemas sebagai "petualangan" dengan gerbang/level (mis. "Gerbang Huruf", "Gerbang Bunyi") — memberi rasa progresi.
- Mendukung multi-pemain ("Main Bareng (Live)", "Room" dengan kode invite) untuk beberapa modul — cocok untuk kelas/keluarga.
- Ada sistem bintang/skor sederhana sebagai reward.
- Model bisnis: one-time payment (bukan langganan), dan produk dijual sebagai source code/demo (B2B ke reseller) — bukan hanya B2C.
- Social proof real-time ("D*** — Bandung baru saja mengambil paket") untuk mendorong konversi.

### 2.2 Kekurangan / Celah yang bisa dieksploitasi
- **Tidak terlihat ada dashboard orang tua** yang menampilkan laporan perkembangan anak secara analitik (grafik, waktu belajar, topik lemah).
- **Tidak terlihat sistem multi-anak dalam satu akun keluarga** dengan profil terpisah dan rekomendasi personal.
- **Bank soal tampak statis** (soal tetap, tidak ada indikasi bank soal besar dengan random per sesi yang benar-benar besar/dinamis dari CMS).
- Tidak ada indikasi **tingkat kesulitan adaptif** (soal makin sulit/mudah berdasarkan performa anak).
- Tidak ada modul offline / unduh konten untuk area dengan koneksi lemah.
- Tidak terlihat aksesibilitas untuk anak dengan kebutuhan khusus (mis. narasi penuh/read-aloud konsisten di semua soal, kontras tinggi, ukuran teks/tombol yang dapat diatur).
- Branding lintas modul agak terpecah (tiap modul punya karakter/nama produk sendiri: "Math Fun Quest", "English Fun Quest", dst) — bisa terasa seperti kumpulan aplikasi terpisah, bukan satu ekosistem yang kohesif.
- Model konten tampak dikelola langsung oleh developer/tim produk (bukan CMS yang mudah dipakai non-teknis) — menyulitkan penambahan materi baru secara mandiri & cepat.

### 2.3 Peluang Diferensiasi BelajarCeria
1. **Satu ekosistem, satu maskot utama** yang konsisten di semua modul (memperkuat brand recall untuk anak), dengan sub-karakter di tiap modul sebagai variasi.
2. **CMS bank soal per modul** yang benar-benar dinamis: admin/guru dapat menambah topik, soal, dan level baru tanpa deploy ulang aplikasi.
3. **Parent Dashboard** dengan laporan progres, waktu belajar, topik yang perlu diulang, dan rekomendasi.
4. **Profil multi-anak** dalam satu akun orang tua, dengan onboarding usia untuk menyesuaikan level default.
5. **Reward system lebih kaya**: bintang, lencana (badge), dan "peta progres" visual per modul (gamifikasi jalur belajar).
6. **Efek suara + voice-over (TTS/rekaman)** konsisten di semua soal untuk anak yang belum lancar membaca.
7. **Animasi parallax pada background** tiap modul (bukan sekadar ilustrasi statis) agar terasa hidup tanpa mengganggu fokus belajar.

---

## 3. Tujuan Produk

- Membantu anak usia 4–8 tahun belajar 7 bidang inti (Cerita, Bahasa Arab, Bahasa Indonesia, Bahasa Inggris, IPA, IPS, Matematika) dengan cara yang menyenangkan dan mandiri.
- Memberi orang tua visibilitas atas progres belajar anak.
- Menyediakan fondasi konten yang mudah di-*maintain* dan diperluas (bank soal per topik, per modul).
- Menjadi produk yang secara teknis solid (Laravel + React + MySQL) sehingga scalable dan bisa dikembangkan lebih lanjut (mis. dijadikan white-label seperti model bisnis kompetitor).

---

## 4. Target Pengguna (User Personas)

### 4.1 Anak (Primary User) — usia 4–8 tahun
- Belum lancar/baru belajar membaca → butuh visual besar, suara, sedikit teks.
- Rentang perhatian pendek → sesi belajar singkat (5–10 menit per aktivitas), feedback instan.
- Suka reward visual (bintang, lencana, karakter yang bereaksi).

### 4.2 Orang Tua (Secondary User / Akun Utama)
- Membuat akun, mendaftarkan 1+ profil anak.
- Memonitor progres, memilih modul/level, mengatur waktu layar & pengaturan suara.
- Butuh kepercayaan bahwa konten aman & sesuai usia (tanpa iklan pihak ketiga, tanpa link keluar sembarangan).

### 4.3 Admin (Internal — satu role, tidak dipisah)
Satu role admin tunggal yang menangani baik pengelolaan konten maupun pengelolaan sistem (tidak ada pemisahan "Content Admin" vs "System Admin"):
- Menambah/mengelola modul, topik & bank soal (CMS) — upload gambar/audio/video, atur level kesulitan & urutan.
- Mengelola user (orang tua, anak, admin lain), termasuk suspend/hapus akun bermasalah.
- Melihat rekap penggunaan & progres secara global (semua anak/semua modul).
- Mengelola konfigurasi sistem (mis. maintenance mode, versi konten, pengaturan reward/badge).
- (Fase lanjutan, opsional) Mengelola "room"/kelas jika mode guru diaktifkan — tetap dilakukan lewat panel Admin yang sama, bukan role terpisah.

---

## 5. Struktur URL / Routing per User

Aplikasi dipisah berdasarkan area akses lewat prefix URL, agar jelas mana area anak, orang tua, dan admin:

| Prefix | Area | Diakses oleh |
|---|---|---|
| `/belajarceria` | Area utama/anak (peta modul, topik, kuis, reward) — halaman primary/landing aplikasi | Anak (lewat profil yang dipilih di akun orang tua) |
| `/orangtua` | Parent Dashboard (progres anak, laporan, pengaturan, manajemen profil anak) | Orang tua (setelah login & parental gate) |
| `/admin` | Panel Admin (CMS modul/topik/bank soal, manajemen user, konfigurasi sistem) | Admin (satu role, login terpisah) |

Contoh sub-route:
```
/belajarceria                     → pilih profil anak / peta modul (home)
/belajarceria/{modul}             → daftar topik dalam modul, mis. /belajarceria/matematika
/belajarceria/{modul}/{topik}     → sesi soal/aktivitas
/belajarceria/{modul}/{topik}/hasil → layar reward/hasil kuis

/orangtua/login
/orangtua/dashboard
/orangtua/anak                    → manajemen profil anak
/orangtua/anak/{id}/laporan       → laporan progres anak tertentu
/orangtua/pengaturan

/admin/login
/admin/dashboard
/admin/modul
/admin/modul/{modul}/topik
/admin/topik/{topik}/soal
/admin/user
```

**Catatan:** `/belajarceria` dipakai sebagai prefix primary (bukan `/`) supaya konsisten dengan nama produk sekaligus memisahkan area anak dari halaman publik (mis. landing page pemasaran nantinya bisa ada di `/`).

---

## 6. Ruang Lingkup Modul (7 Modul)

| Kode | Modul | Deskripsi Singkat |
|---|---|---|
| `cerita` | Cerita Anak Digital | Video/cerita interaktif + kosakata + kuis pemahaman |
| `bahasa-arab` | Bahasa Arab | Huruf hijaiyah, bunyi, kata & benda, aktivitas interaktif |
| `bahasa-indonesia` | Bahasa Indonesia Ceria | Huruf, kata, kalimat, tanda baca, membaca-menjawab |
| `bahasa-inggris` | English Fun Quest | Kosakata tematik (warna, angka, tubuh, cuaca, hewan, dll) |
| `ipa` | Ilmu Pengetahuan Alam | Kuis sains, siklus hidup, benda, tubuh manusia, dll |
| `ips` | Ilmu Pengetahuan Sosial | Diri & keluarga, peta, budaya Indonesia, ekonomi cilik, sejarah sederhana |
| `matematika` | Math Fun Quest | Berhitung dasar, perbandingan, penjumlahan, pengurangan, ganjil-genap |

**Catatan:** Tidak ada modul Bahasa Mandarin (dikecualikan sesuai permintaan).

Setiap modul memiliki struktur yang konsisten:
```
Modul → Topik (sub-materi) → Bank Soal/Konten → Sesi Belajar/Kuis → Progress & Reward
```

---

## 7. Fitur Utama

### 7.1 Fitur Anak (Learner App)
1. **Pemilihan Profil Anak** — avatar, nama panggilan, level usia.
2. **Peta Modul** — tampilan "peta petualangan" (mirip papan permainan) menampilkan 7 modul sebagai pulau/gerbang.
3. **Topik & Level per Modul** — dikunci-buka secara progresif (mis. topik berikutnya terbuka setelah topik sebelumnya selesai dengan skor minimum).
4. **Tipe Soal Beragam**: pilihan ganda bergambar, benar/salah, mencocokkan (drag & drop / tap-to-match), mendengar & pilih, susun kata/kalimat, tebak warna/pola.
5. **Efek Suara**:
   - Suara tap/klik tombol.
   - Suara jawaban benar/salah (nada ceria/lembut, tidak menghakimi).
   - Suara naik level / dapat bintang / dapat lencana.
   - Narasi suara (voice-over) untuk instruksi & soal (opsional TTS atau rekaman).
   - Musik latar lembut yang bisa dimatikan.
6. **Animasi Parallax** — layer background bergerak halus mengikuti scroll/transisi antar layar (multi-layer: langit, awan, elemen tematik per modul) untuk memberi kesan hidup tanpa mengganggu fokus.
7. **Sistem Reward** — bintang per soal benar, lencana per topik/modul selesai, "peta progres" yang terisi warna seiring modul diselesaikan.
8. **Mode Ulangi Materi** — anak bisa mengulang topik yang sudah pernah dikerjakan.
9. **Read-Aloud** — tombol dengar ulang teks soal (aksesibilitas untuk anak yang belum lancar membaca).

### 7.2 Fitur Orang Tua (Parent Dashboard)
1. Manajemen profil anak (tambah/edit/hapus, multi-anak dalam 1 akun).
2. Laporan progres per anak: modul yang sudah dikerjakan, skor rata-rata, waktu belajar total/mingguan.
3. Rekomendasi topik yang perlu diulang (berdasarkan skor rendah).
4. Pengaturan: suara/musik on-off, batas waktu layar harian (opsional), kunci PIN orang tua untuk keluar dari mode anak.
5. Riwayat lencana & pencapaian anak.

### 7.3 Fitur Admin/CMS
1. CRUD Modul, Topik, dan Bank Soal (dengan upload gambar/audio).
2. Pengaturan level kesulitan & urutan topik.
3. Pengelolaan konten Cerita (upload video/PDF, daftar kosakata per cerita).
4. Manajemen user (orang tua, anak, admin).
5. Dashboard ringkasan penggunaan platform (jumlah user aktif, modul terpopuler, dll) — opsional fase lanjutan.
6. (Opsional, fase lanjutan) Manajemen "Room/Kelas" untuk guru — mirip fitur multi-pemain kompetitor, tapi berbasis progres kelas.

### 7.4 Fitur Sistem
- Autentikasi orang tua (register/login, lupa password) — anak tidak login sendiri, hanya pilih profil di dalam akun orang tua.
- Parental Gate sederhana (mis. soal matematika ringan) sebelum masuk ke area pengaturan/orang tua, agar anak tidak bisa mengubah pengaturan tanpa sengaja.
- Penyimpanan progres otomatis (autosave) tiap soal selesai.
- Responsive design (tablet-first, karena target penggunaan mirip referensi yang memakai tampilan tablet, tapi tetap mobile & desktop friendly).

---

## 8. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| Performa | Waktu muat awal < 3 detik di koneksi 4G; aset gambar/audio dioptimasi & lazy-load |
| Keamanan | Password hashing (Laravel default), rate limiting login, parental gate untuk area sensitif, tidak ada input bebas dari anak (untuk menghindari konten tidak pantas) |
| Skalabilitas | Struktur database modular per modul agar mudah menambah modul ke-8, ke-9 di masa depan |
| Aksesibilitas | Kontras warna cukup (WCAG AA sebisa mungkin meski target anak), tombol besar (min. 44x44px), read-aloud di semua soal |
| Kompatibilitas | Browser modern (Chrome, Safari, Edge) di tablet, mobile, dan desktop |
| Bahasa | UI utama Bahasa Indonesia; konten modul bahasa asing tetap dalam bahasa target masing-masing |
| Data Anak | Tidak mengumpulkan data pribadi anak secara langsung (nama panggilan/avatar saja); data terhubung ke akun orang tua |

---

## 9. Roadmap Fase Pengembangan

### Fase 1 — MVP (Fokus: 3 modul inti dulu untuk validasi)
- Auth orang tua + profil anak.
- Modul: Cerita, Matematika, Bahasa Indonesia (paling mudah divalidasi dengan bank soal awal).
- Tipe soal: pilihan ganda bergambar + benar/salah.
- Efek suara dasar (klik, benar/salah, level up).
- Sistem bintang sederhana.
- Parent dashboard versi dasar (progres per modul).

### Fase 2 — Ekspansi Modul
- Tambah modul: Bahasa Arab, Bahasa Inggris, IPA, IPS.
- Tambah tipe soal: mencocokkan, susun kata, mendengar & pilih.
- Animasi parallax penuh di semua modul.
- Sistem lencana (badge) & peta progres visual.

### Fase 3 — Penyempurnaan & Skalabilitas
- CMS bank soal lengkap untuk admin non-teknis.
- Mode kelas/room untuk guru (multi-anak dalam satu sesi terpantau).
- Rekomendasi belajar adaptif sederhana (berdasarkan skor lemah).
- Opsi konten offline/PWA.

---

## 10. Metrik Keberhasilan (Success Metrics)

- Rata-rata durasi sesi belajar per anak (target: 5–15 menit/sesi, beberapa sesi/hari).
- Tingkat penyelesaian topik (completion rate) per modul.
- Retensi mingguan anak aktif.
- Rating kepuasan orang tua (survei sederhana in-app).
- Jumlah bank soal per modul yang bertambah secara berkala (indikator kemudahan CMS).

---

## 11. Batasan & Asumsi

- Modul Bahasa Mandarin **tidak** termasuk dalam ruang lingkup (sesuai instruksi).
- Nama produk final belum ditentukan; "BelajarCeria" hanya working title di dokumentasi ini.
- Konten audio (voice-over) di fase awal bisa menggunakan rekaman manual atau TTS pihak ketiga — keputusan teknis detail dibahas terpisah saat implementasi.
- Model bisnis (gratis/berbayar/langganan) belum dibahas di PRD ini — fokus dokumen ini pada produk & fitur, bukan monetisasi.
