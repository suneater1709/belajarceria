# Design.md — BelajarCeria (Working Title)
Panduan Desain Visual, Audio, dan Interaksi

---

## 1. Prinsip Desain

1. **Soft & Ceria** — palet warna pastel/cerah tapi tidak menyilaukan, bentuk membulat (rounded corners besar, tanpa sudut tajam).
2. **Playful tapi Fokus** — animasi dan dekorasi mendukung suasana, bukan mengganggu konsentrasi anak saat menjawab soal.
3. **Feedback Instan** — setiap aksi anak (tap, jawab, selesai) mendapat respons visual + audio dalam < 300ms.
4. **Minim Teks, Maksimal Visual** — ikon besar, ilustrasi jelas, teks pendek dengan opsi dibacakan (read-aloud).
5. **Konsisten Lintas Modul** — satu maskot utama sebagai pemandu di semua modul, dengan variasi kostum/aksesori sesuai tema modul.

---

## 2. Sistem Warna

### 2.1 Warna Netral & Dasar
- Background utama: putih hangat / krem sangat muda (`#FFFBF5`)
- Teks utama: abu gelap lembut (`#2E2A4A`) — bukan hitam pekat, agar tetap ramah anak
- Card/permukaan: putih (`#FFFFFF`) dengan shadow lembut

### 2.2 Warna per Modul (identitas warna, dipakai untuk aksen, ikon, progress bar)
| Modul | Warna Utama | Nuansa |
|---|---|---|
| Cerita | Ungu (`#8B5CF6`) | Playful/imajinatif |
| Bahasa Arab | Hijau tua/emerald (`#0F766E`) dengan aksen emas | Tenang, islami |
| Bahasa Indonesia | Merah-putih lembut (`#EF4444` / `#F87171`) | Nasionalis ceria |
| Bahasa Inggris | Teal (`#14B8A6`) | Segar |
| IPA | Biru langit (`#38BDF8`) | Eksploratif |
| IPS | Oranye (`#FB923C`) | Hangat, sosial |
| Matematika | Indigo (`#6366F1`) | Fokus, playful |

### 2.3 Warna Status
- Benar: hijau cerah (`#22C55E`) + ikon bintang/centang animasi.
- Salah: merah (`#EF4444`), boleh dipakai secara langsung untuk menandai jawaban salah — tetap disertai nada suara & pesan yang mendorong coba lagi (mis. "Coba lagi ya!") agar tidak terasa menghukum meski warnanya tegas.
- Gagal Simpan / Error (area Orang Tua & Admin): merah tegas (`#DC2626`) untuk toast/alert saat operasi CRUD gagal (gagal simpan, gagal hapus, validasi gagal, koneksi error).
- Progress/locked: abu muda (`#E5E7EB`).

---

## 3. Tipografi

- **Font utama**: rounded sans-serif ramah anak (mis. "Baloo 2", "Fredoka", atau "Quicksand") untuk judul & elemen besar.
- **Font isi/instruksi**: sans-serif tinggi keterbacaan (mis. "Nunito" / "Poppins") untuk teks soal, agar tetap mudah dibaca orang tua/anak yang mulai lancar membaca.
- Ukuran teks minimum untuk anak: 18–20px pada teks soal, 28px+ untuk judul.
- Hindari huruf kapital penuh untuk paragraf panjang (sulit dibaca anak yang baru belajar).

---

## 4. Ikonografi & Ilustrasi

- Gaya ilustrasi 3D playful/soft (mengikuti tren referensi: karakter maskot, elemen dekoratif seperti bintang, awan, buku, planet).
- Maskot utama: satu karakter ramah (mis. burung hantu/kucing/anak-anak animasi) yang muncul di semua modul sebagai pemandu, dengan variasi topi/atribut sesuai modul (mis. topi wisuda untuk umum, sorban untuk Bahasa Arab, jas lab untuk IPA).
- Ikon tombol besar dan jelas (bulat/rounded-square, min. 44x44px area tap).

---

## 5. Animasi Parallax

### 5.1 Tujuan
Memberi kedalaman visual pada background tanpa mengganggu elemen interaktif (soal, tombol) yang selalu statis/stabil di foreground.

### 5.2 Struktur Layer (contoh per modul)
```
Layer 0 (paling belakang): gradient langit/warna dasar modul — statis
Layer 1: elemen jauh (awan, bintang, planet) — bergerak sangat lambat (parallax factor 0.1–0.2)
Layer 2: elemen tengah (pohon, gunung, buku raksasa, ombak) — bergerak sedang (0.3–0.5)
Layer 3: elemen dekoratif dekat (bunga, partikel, confetti saat reward) — bergerak lebih cepat (0.6–0.8)
Layer 4 (foreground, TIDAK parallax): kartu soal, tombol, maskot pemandu — selalu stabil
```

### 5.3 Trigger Animasi
- **Idle/ambient**: layer bergerak halus otomatis (mis. awan melayang, bintang berkedip) — loop lembut, tidak lelah dipandang.
- **Scroll/transisi antar layar**: parallax bereaksi terhadap perpindahan halaman (mis. dari peta modul ke daftar topik).
- **Reward moment**: partikel/confetti meledak di layer depan saat anak menyelesaikan topik atau naik level.
- Gunakan CSS transform + requestAnimationFrame atau library ringan (mis. Framer Motion di React) — hindari animasi berat yang menurunkan performa di tablet low-end.

### 5.4 Guardrail Performa
- Maksimal 3–4 layer aktif bersamaan per layar.
- Animasi otomatis nonaktif/reduced jika perangkat mendeteksi `prefers-reduced-motion` atau performa rendah.

---

## 6. Efek Suara & Audio

| Event | Jenis Suara |
|---|---|
| Tap tombol umum | Klik lembut/pop pendek |
| Buka modul/topik baru | Chime naik (whoosh + bell ringan) |
| Jawaban benar | Suara ceria pendek (bell/xylophone) + opsional suara maskot "Yeay!" |
| Jawaban salah | Suara netral-lembut (bukan buzzer keras), disertai dorongan "Coba lagi ya!" |
| Topik selesai / naik level | Fanfare singkat + confetti visual |
| Dapat bintang/lencana baru | Suara "sparkle"/kilau |
| Narasi soal (voice-over) | Suara rekaman/TTS jelas, kecepatan sedang, jeda antar kalimat |
| Musik latar (opsional, bisa dimatikan) | Instrumental lembut, loop, volume rendah agar tidak mendominasi |

**Kontrol suara**: tombol mute/unmute musik dan efek suara terpisah, selalu terlihat di pojok layar anak (ikon speaker besar).

---

## 7. Modal Konfirmasi (Aksi Kritis)

Untuk aksi yang **tidak bisa dibatalkan** atau **mengubah status sesi** (logout, hapus profil anak, hapus soal/topik/modul, hapus user), aplikasi **wajib** menampilkan modal konfirmasi sebelum aksi dieksekusi — tidak langsung dijalankan dari satu tap/klik saja.

### 7.1 Kapan Modal Konfirmasi Muncul
| Aksi | Area | Level Risiko |
|---|---|---|
| Logout | Orang Tua, Admin | Sedang (sesi hilang, harus login ulang) |
| Keluar dari mode anak / kembali ke pilih profil | Anak (lewat parental gate) | Rendah-sedang |
| Hapus profil anak | Orang Tua | Tinggi (data progres ikut terhapus) |
| Hapus modul/topik/soal/opsi jawaban/cerita | Admin | Tinggi (mempengaruhi anak yang sedang belajar) |
| Hapus/suspend user | Admin | Tinggi |
| Reset progres anak | Orang Tua | Tinggi |

### 7.2 Anatomi Modal
- **Overlay gelap semi-transparan** di belakang modal (fokus perhatian, mencegah tap tidak sengaja ke elemen lain).
- **Judul singkat** — mis. "Keluar dari akun?", "Hapus soal ini?".
- **Deskripsi 1 baris** — jelaskan konsekuensi, mis. "Semua progres anak ini akan ikut terhapus dan tidak bisa dikembalikan."
- **Dua tombol sejajar**:
  - Tombol **Batal** (sekunder, netral/abu) — posisi kiri, jadi default focus agar aksi merusak tidak tertekan tidak sengaja (mis. saat menekan Enter).
  - Tombol **Konfirmasi** (primer, warna sesuai risiko — lihat 8.3) — posisi kanan.
- Modal untuk area Anak (kalau ada, mis. konfirmasi keluar sesi) tetap pakai gaya rounded & maskot agar konsisten, bukan modal gaya "dewasa" yang kaku.

### 7.3 Warna Tombol Konfirmasi Berdasarkan Risiko
| Level Risiko | Warna Tombol Konfirmasi |
|---|---|
| Rendah–Sedang (logout, keluar sesi) | Warna primer modul/brand (mis. indigo/ungu), bukan merah — karena bukan aksi destruktif data |
| Tinggi (hapus data permanen: profil anak, soal, topik, modul, user) | Merah (`#DC2626`) — menegaskan aksi tidak bisa dibatalkan |

### 7.4 Perilaku Interaksi
- Modal hanya bisa ditutup lewat tombol **Batal**, tombol **X**, atau klik overlay (opsional, bisa dinonaktifkan untuk aksi berisiko tinggi agar tidak tertutup tidak sengaja).
- Setelah tombol Konfirmasi ditekan pada aksi hapus/CRUD, tombol berubah ke state **loading** (spinner kecil + disabled) sampai respons API diterima — mencegah double-submit.
- Jika aksi gagal (API error), modal **tidak langsung tertutup** — tampilkan pesan error merah (lihat 2.3) di dalam modal, biarkan user coba lagi atau batal.
- Jika aksi berhasil, modal tertutup otomatis + toast notifikasi sukses singkat (hijau, 2–3 detik).

---

## 8. Alur Layar Utama (Screen Flow)

1. **Splash Screen** — logo + maskot muncul dengan animasi ringan.
2. **Pilih Profil Anak** — kartu-kartu avatar anak (untuk akun dengan multi-anak); tombol "Tambah Anak" mengarah ke alur orang tua (dengan parental gate).
3. **Peta Modul (Home Anak)** — tampilan peta petualangan bergaya taman bermain, 7 pulau/gerbang modul tersebar, dengan status terkunci/terbuka & progres bintang per modul.
4. **Daftar Topik per Modul** — kartu topik dengan ikon, status (belum/sedang/selesai), jumlah soal.
5. **Layar Soal/Aktivitas** — kartu soal di foreground, background parallax modul terkait, tombol dengar ulang, opsi jawaban besar.
6. **Layar Hasil/Reward** — animasi bintang/lencana, ringkasan skor, tombol lanjut/ulangi.
7. **Parent Dashboard (setelah parental gate)** — ringkasan progres semua anak, grafik waktu belajar, pengaturan akun & konten.
8. **Admin CMS (desktop-oriented)** — tabel manajemen modul/topik/soal, form tambah/edit dengan upload media.

---

## 9. Aksesibilitas & Kenyamanan Anak

- Semua instruksi soal punya versi audio (read-aloud), bukan hanya teks.
- Kontras warna teks-background dijaga agar tetap terbaca meski dengan palet pastel.
- Tidak ada elemen yang berkedip cepat (menghindari risiko bagi anak sensitif cahaya).
- Sesi belajar diberi jeda otomatis/pengingat lembut setiap ±10–15 menit ("Yuk istirahat sebentar!") — opsional, dikontrol orang tua.
- Tidak ada iklan pihak ketiga atau tautan keluar aplikasi yang bisa diklik anak tanpa parental gate.

---

## 10. Desain Responsif

- **Tablet** = pengalaman utama (mengikuti pola penggunaan pada referensi), layout kartu besar 2–3 kolom.
- **Mobile** = layout 1 kolom, ukuran tombol tetap besar, parallax layer dikurangi (2 layer) untuk performa.
- **Desktop** (khusus area orang tua & admin) = layout dashboard standar dengan tabel & grafik.
