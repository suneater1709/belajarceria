# Acuan AI Generator — BelajarCeria
### Generate Topik AI & Generate Soal AI (Bank Soal CMS)

Dokumen ini jadi acuan tunggal (source of truth) untuk perilaku AI pada dua fitur:
1. **Generate Topik AI** (7 Modul & Topik) — menghasilkan 1 topik baru + 5 soal.
2. **Generate Soal AI** (Bank Soal CMS) — menghasilkan N soal untuk 1 topik yang sudah ada.

Tujuannya menutup 2 masalah yang sudah terjadi:
- Soal yang dihasilkan **melenceng dari topik/instruksi tambahan** admin.
- Jawaban benar **selalu ada di posisi/opsi yang sama**, sehingga mudah ditebak anak tanpa membaca soal.

---

## 1. Prinsip Inti (berlaku untuk kedua fitur)

1. **Topik adalah batas keras (hard constraint).** Setiap soal WAJIB bisa dijawab hanya dengan pengetahuan yang tercakup dalam topik yang diberikan. Jika topik "Huruf Hijaiyah: Alif sampai Jim", soal TIDAK BOLEH menyinggung huruf di luar Alif–Jim, apalagi materi modul lain (angka, warna, dst).
2. **Instruksi tambahan admin adalah perintah, bukan saran.** Jika instruksi tambahan bertentangan atau lebih sempit dari topik, instruksi tambahan yang menang (mempersempit cakupan), selama masih valid secara materi. Jika instruksi tambahan meminta hal di luar topik sama sekali (mis. topik "Bahasa Arab" tapi instruksi "soal tentang hewan buas"), AI harus menolak/menyesuaikan, bukan memaksakan — lihat §6.
3. **Keacakan jawaban wajib, tapi TIDAK boleh dipercayakan ke AI.** AI cukup menandai opsi mana yang benar (by content, bukan by posisi). Posisi acak dilakukan di backend/server saat render atau saat simpan ke DB — lihat §5.
4. **Kesesuaian usia & tingkat kesulitan.** Bahasa, contoh, dan kompleksitas soal harus sesuai `target_usia` / `tingkat_kesulitan` yang dipilih (mis. usia 4–5 tahun → kalimat pendek, 1 konsep per soal, hindari istilah abstrak).
5. **Tidak ada duplikasi & tidak ada plagiarisme dari soal yang sudah ada di topik yang sama** (khusus Generate Soal AI, lihat §4.3).
6. **Output harus deterministik secara struktur** — selalu JSON valid sesuai skema di §5, tidak ada teks pembuka/penutup, tidak ada markdown code fence di luar yang diminta backend.

---

## 2. Alur Sistem (ringkas)

```
Admin input → Backend susun prompt (system + user) → Panggil AI →
AI kembalikan JSON (opsi BELUM diacak posisinya) →
Backend validasi (topik match, skema, duplikasi) →
Backend ACAK posisi opsi tiap soal →
Simpan ke DB / tampilkan preview ke admin
```

Poin kritis: **AI tidak pernah bertanggung jawab atas posisi akhir jawaban di UI.** Itu tugas backend. AI hanya menandai `is_correct`.

---

## 3. System Prompt — Generate Topik AI

Dipakai saat admin klik "Generate Topik Sekarang" (Gambar 4). Menghasilkan 1 topik baru + 5 soal untuk topik tersebut, dalam satu kali generate.

```
Kamu adalah penyusun kurikulum untuk aplikasi belajar anak "BelajarCeria".

KONTEKS:
- Modul target: {nama_modul} (kode: {kode_modul})
- Deskripsi modul: {deskripsi_modul}
- Tingkat kesulitan: {tingkat_kesulitan}
- Target usia anak: {target_usia}
- Ide/kata kunci topik dari admin (opsional): "{ide_kata_kunci}"

TUGAS:
1. Jika "ide/kata kunci topik" diisi admin, topik baru WAJIB dibangun persis dari kata kunci
   tersebut. Jangan mengganti, memperluas, atau mengarang topik lain yang tidak diminta.
2. Jika kosong, susun 1 ide topik baru yang:
   - Relevan dengan deskripsi modul di atas
   - Belum tumpang tindih dengan topik-topik yang sudah ada di modul ini (daftar topik existing
     akan disertakan backend jika tersedia)
   - Sesuai tingkat kesulitan & target usia
3. Buat judul topik singkat (maks 6 kata), deskripsi topik 1 kalimat.
4. Buat TEPAT 5 soal untuk topik ini. SETIAP soal harus:
   - Hanya menguji materi yang ada dalam topik yang baru saja kamu tentukan — dilarang keras
     menyinggung materi modul lain atau topik lain.
   - Sesuai bahasa & kompleksitas untuk usia {target_usia}: kalimat pendek, 1 konsep per soal,
     hindari istilah abstrak atau majemuk.
   - Punya tepat 3 opsi jawaban: 1 benar, 2 pengecoh (distractor) yang masuk akal tapi jelas
     salah bila anak paham materi topik.
   - Punya penjelasan singkat (1 kalimat) kenapa jawaban itu benar.
5. Urutan opsi jawaban yang kamu tulis TIDAK PENTING dan TIDAK AKAN dipakai apa adanya — sistem
   akan mengacak posisinya. Fokus hanya pada KEBENARAN isi tiap opsi, tandai opsi benar lewat
   field is_correct, bukan lewat posisi.
6. Variasikan jenis pertanyaan antar soal (pengenalan bentuk/huruf/angka, pencocokan, hitung
   jumlah, dll — sesuai relevansi topik) supaya tidak semua soal berpola sama persis.

ATURAN VALIDASI DIRI SEBELUM MENJAWAB (cek satu per satu, diam-diam, jangan ditulis di output):
- Apakah topik yang saya buat murni dari kata kunci admin (jika diisi)? Jika saya menambah unsur
  lain yang tidak diminta, hapus.
- Apakah kelima soal 100% bisa dijawab hanya dari cakupan topik ini, tanpa pengetahuan luar?
- Apakah bahasa soal sudah sesuai target usia?

FORMAT OUTPUT: HANYA JSON valid sesuai skema berikut, tanpa teks lain, tanpa code fence:
{ ...lihat §5.1... }
```

---

## 4. System Prompt — Generate Soal AI (Bank Soal CMS)

Dipakai dari popup "Generator Bank Soal AI" (Gambar 3), untuk topik yang sudah ada. Ini yang paling sering melenceng karena admin sering menambahkan instruksi tambahan bebas teks.

### 4.1 Template prompt

```
Kamu adalah penyusun soal kuis untuk aplikasi belajar anak "BelajarCeria".

KONTEKS TOPIK (WAJIB DIPATUHI, INI BATAS MATERI):
- Modul: {nama_modul}
- Topik: {nama_topik}
- Deskripsi topik: {deskripsi_topik}
- Tingkat kesulitan: {tingkat_kesulitan}
- Target usia: {target_usia}

INSTRUKSI TAMBAHAN DARI ADMIN (opsional): "{instruksi_tambahan}"

CARA MEMPERLAKUKAN INSTRUKSI TAMBAHAN:
- Instruksi tambahan hanya boleh MEMPERSEMPIT atau MEMBERI GAYA pada soal dalam topik di atas
  (contoh valid: "soal bergambar hewan", "gunakan gaya cerita", "fokus ke huruf Ba dan Ta saja").
- Instruksi tambahan TIDAK BOLEH membawa soal keluar dari cakupan topik. Jika instruksi
  tampak meminta materi di luar topik, terapkan instruksi itu HANYA sebatas yang masih
  cocok dengan topik, dan abaikan bagian yang benar-benar di luar topik. Jangan mengarang
  penyesuaian sendiri di luar topik demi menuruti instruksi.
- Jika instruksi tambahan kosong, buat soal murni dari cakupan topik saja.

PENGUATAN BATAS MATERI & JENIS KEMAMPUAN:
Nama topik dan instruksi tambahan di atas menjelaskan JENIS KEMAMPUAN yang harus diuji tiap
soal. Sebelum menulis tiap soal, tanyakan pada dirimu: apakah soal ini benar-benar menguji
kemampuan "{nama_topik}" / "{instruksi_tambahan}"? Jika soal yang kamu pikirkan hanya
"berhubungan" tapi menguji kemampuan lain (mis. kosakata/antonim/pengejaan padahal topiknya
menyusun kalimat), JANGAN dipakai — ganti dengan soal yang benar-benar menguji kemampuan
tersebut. Contoh soal yang BENAR untuk topik "Menyusun Kalimat": memilih susunan kata yang
membentuk kalimat benar dari kata acak, melengkapi kalimat rumpang dengan kata yang tepat,
atau mengurutkan potongan kalimat jadi kalimat utuh.

{daftar_soal_yang_sudah_ada}

TUGAS:
1. Buat TEPAT {jumlah_soal} soal pilihan ganda untuk topik di atas.
2. Setiap soal: 1 pertanyaan jelas, 3 opsi jawaban (1 benar + 2 distractor masuk akal),
   1 penjelasan singkat jawaban benar, tingkat kesulitan sesuai {tingkat_kesulitan}.
3. Semua soal harus tentang topik "{nama_topik}" — dilarang menyertakan materi dari topik
   atau modul lain, walau sekilas terasa "masih nyambung".
4. Soal baru yang kamu buat TIDAK BOLEH sama persis, tidak boleh berupa variasi tipis (ganti 1-2 kata saja),
   dan tidak boleh menguji konsep yang sama dengan soal di daftar "SOAL YANG SUDAH ADA" di atas — walau kalimatnya diubah.
5. Jangan mengulang pola/kalimat soal yang identik antar nomor.
6. Posisi opsi jawaban dalam output TIDAK PENTING, sistem yang akan mengacak. Tandai jawaban
   benar lewat field is_correct.

VALIDASI DIRI SEBELUM MENJAWAB (diam-diam, jangan ditulis di output):
- Apakah SEMUA soal masih 100% dalam batas topik "{nama_topik}", bukan cuma "berhubungan"?
- Apakah saya menuruti instruksi tambahan hanya sejauh masih cocok dengan topik ini?
- Apakah ada soal yang menyentuh materi modul lain? Jika ya, ganti soal itu.
- Apakah ada soal yang mengulang atau mirip dengan soal yang sudah ada? Jika ya, buat soal konsep lain.

FORMAT OUTPUT: HANYA JSON valid sesuai skema §5.2, tanpa teks lain, tanpa code fence.
```

### 4.2 Menangani instruksi tambahan yang jelas keluar topik

Contoh: Topik = "Huruf Hijaiyah: Alif sampai Jim" (Bahasa Arab), instruksi tambahan = "soal tentang warna-warni pelangi".

- AI **tidak boleh** membuat soal tentang pelangi/warna.
- Perilaku yang benar: AI tetap membuat soal tentang huruf Alif–Jim, dan (jika masuk akal) memakai unsur "warna" hanya sebagai bumbu visual/ilustrasi (mis. "huruf apa yang ditulis warna merah ini?"), bukan sebagai materi yang diuji.
- Backend sebaiknya menampilkan **badge/peringatan** di preview jika hasil AI terdeteksi menyimpang jauh dari topik (lihat §6.2), supaya admin sadar dan bisa regenerate.

### 4.3 Cegah duplikasi dengan soal existing & session regenerate

Backend wajib mengambil SEMUA soal yang sudah tersimpan di topik tersebut di database + soal yang sudah di-generate di sesi popup saat ini, lalu menyertakannya ke prompt:

```
SOAL YANG SUDAH ADA DI TOPIK INI (jangan dibuat ulang / terlalu mirip):
1. "Lawan kata (antonim) dari kata BESAR adalah..."
2. "Manakah di bawah ini yang merupakan deretan huruf VOKAL?"
3. "Kata B-U-K-U jika dieja dan dibaca suku katanya menjadi..."
4. "Susunlah huruf berikut menjadi kata nama hewan berkaki empat yang suka susu..."
5. "Huruf pertama pada kata APEL adalah huruf apa..."
```

Instruksi tegas terkait duplikasi:
- Soal baru TIDAK BOLEH sama persis atau variasi tipis dari daftar di atas.
- Backend melakukan validasi kemiripan teks (similarity >= 75%) terhadap daftar existing. Jika ada kemiripan tinggi, backend secara otomatis memicu 1x retry khusus butir soal tersebut sebelum disajikan ke admin.

---

## 5. Skema Output JSON

### 5.1 Generate Topik AI

```json
{
  "topik": {
    "judul": "string, maks 6 kata",
    "deskripsi": "string, 1 kalimat",
    "kode_modul": "string",
    "tingkat_kesulitan": "mudah | sedang | sulit",
    "target_usia": "string, mis. 4-5 tahun"
  },
  "soal": [
    {
      "pertanyaan": "string",
      "tipe": "multiple_choice",
      "opsi": [
        { "teks": "string", "is_correct": true },
        { "teks": "string", "is_correct": false },
        { "teks": "string", "is_correct": false }
      ],
      "penjelasan": "string, 1 kalimat",
      "poin": 10,
      "kesulitan": "mudah | sedang | sulit"
    }
    // total 5 objek soal
  ]
}
```

### 5.2 Generate Soal AI (Bank Soal)

```json
{
  "soal": [
    {
      "pertanyaan": "string",
      "tipe": "multiple_choice",
      "opsi": [
        { "teks": "string", "is_correct": true },
        { "teks": "string", "is_correct": false },
        { "teks": "string", "is_correct": false }
      ],
      "penjelasan": "string",
      "poin": 10,
      "kesulitan": "mudah | sedang | sulit"
    }
    // total sesuai jumlah_soal yang diminta
  ]
}
```

> Catatan: `opsi` sengaja **tidak** punya field posisi/urutan. Urutan array apa adanya dari AI diabaikan oleh backend — lihat §6.1.

---

## 6. Validasi & Pemrosesan di Backend (WAJIB, di luar tanggung jawab AI)

### 6.1 Randomisasi posisi jawaban (solusi masalah Gambar 4)

Jangan pernah menyimpan/menampilkan `opsi` persis urutan dari AI. Lakukan shuffle di backend setiap kali:
- soal baru disimpan ke DB (acak sekali, simpan urutan final), **atau**
- setiap soal ditampilkan ke anak (acak ulang tiap sesi, lebih aman karena tidak bisa dihafal urutannya).

Contoh logika (bahasa-agnostik):
```
function shuffleOptions(opsi):
    acak urutan array opsi (Fisher-Yates)
    return opsi   // is_correct tetap menempel ke objeknya, bukan ke index
```
Rekomendasi: acak ulang di sisi tampilan anak (saat fetch soal), bukan hanya sekali saat generate — supaya walau soal sama, posisi jawaban benar tidak selalu sama tiap anak mengerjakan ulang.

### 6.2 Deteksi soal melenceng dari topik (solusi masalah Gambar 3)

Sebelum soal ditampilkan sebagai preview ke admin:
1. **Cek kata kunci topik**: bandingkan konten soal dengan `nama_topik` + `deskripsi_topik` (bisa pakai pemanggilan AI kedua sebagai "verifier" dengan prompt terpisah dan singkat: *"Apakah pertanyaan berikut murni tentang topik '{nama_topik}'? Jawab hanya YA atau TIDAK beserta alasan singkat."*).
2. Jika terdeteksi TIDAK relevan, soal tersebut ditandai `flagged: true` di preview (bukan otomatis dihapus), admin bisa pilih: hapus, edit manual, atau regenerate soal itu saja.
3. Simpan `instruksi_tambahan` mentah bersama soal yang dihasilkan (untuk audit/debug jika suatu saat hasil dianggap aneh).

### 6.3 Validasi skema

- Tolak/gagal-kan response jika: jumlah opsi ≠ 3, jumlah `is_correct: true` ≠ 1, field wajib kosong, atau JSON tidak valid.
- Jika gagal, retry generate otomatis maksimal 1–2 kali sebelum menampilkan error ke admin.

---

## 7. Checklist QA sebelum fitur dianggap selesai

- [ ] Soal hasil generate (kedua fitur) tidak pernah menyentuh materi di luar topik saat diuji dengan minimal 5 topik berbeda dari modul berbeda.
- [ ] Instruksi tambahan yang valid (masih dalam topik) benar-benar mempengaruhi hasil soal.
- [ ] Instruksi tambahan yang di luar topik tidak membuat AI keluar jalur (diuji dengan kasus ekstrem seperti contoh §4.2).
- [ ] Posisi jawaban benar tidak selalu di opsi pertama — cek distribusi posisi pada minimal 20 soal, harus tersebar di opsi 1/2/3 secara acak (bukan pola tetap).
- [ ] Tidak ada soal duplikat/mirip persis dengan soal existing di topik yang sama saat generate soal tambahan.
- [ ] Semua output AI lolos validasi skema JSON sebelum masuk DB.
