# Struktur.md — BelajarCeria (Working Title)
Struktur Database (MySQL) & Arsitektur Data

Stack: **Laravel (Eloquent ORM) + MySQL**. Semua tabel menggunakan `id` auto-increment (`BIGINT UNSIGNED`) sebagai primary key kecuali disebutkan lain, serta `created_at`/`updated_at` standar Laravel (tidak dituliskan ulang di setiap tabel demi ringkas, tapi dianggap ada di semua tabel utama).

---

## 1. Diagram Relasi (Ringkas, ERD Naratif)

```
users (orang tua/admin/guru)
  └── children (profil anak, 1 user bisa punya banyak anak)
        ├── child_progress (progres per topik)
        ├── quiz_attempts (riwayat pengerjaan kuis)
        │     └── quiz_answers (jawaban per soal dalam satu attempt)
        ├── child_badges (lencana yang didapat)
        └── star_logs (riwayat perolehan bintang)

modules (7 modul: cerita, bahasa-arab, bahasa-indonesia, bahasa-inggris, ipa, ips, matematika)
  └── topics (sub-materi per modul)
        └── questions (bank soal per topik)
              └── question_options (opsi jawaban per soal)

stories (khusus modul Cerita)
  └── story_vocabularies (kosakata per cerita)

badges (master lencana)
rooms (opsional, mode kelas/guru — fase lanjutan)
  └── room_members (anak yang tergabung dalam room)
settings (pengaturan per anak: suara, musik, dsb)
```

---

## 2. Skema Tabel (DDL MySQL)

### 2.1 `users`
Akun orang tua, guru (opsional), dan admin sistem.
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('parent', 'teacher', 'admin') NOT NULL DEFAULT 'parent',
    phone VARCHAR(30) NULL,
    parental_pin VARCHAR(255) NULL COMMENT 'hash PIN untuk parental gate',
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### 2.2 `children`
Profil anak, dimiliki oleh satu akun orang tua (`users`).
```sql
CREATE TABLE children (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) NULL,
    birth_date DATE NULL,
    gender ENUM('male', 'female', 'unspecified') DEFAULT 'unspecified',
    age_level ENUM('4-5', '6-7', '8') NOT NULL DEFAULT '6-7'
        COMMENT 'menentukan tingkat kesulitan default',
    total_stars INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2.3 `modules`
Master 7 modul pembelajaran.
```sql
CREATE TABLE modules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE
        COMMENT 'cerita | bahasa-arab | bahasa-indonesia | bahasa-inggris | ipa | ips | matematika',
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(255) NULL,
    color_theme VARCHAR(20) NULL COMMENT 'hex warna aksen modul, mis. #6366F1',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### 2.4 `topics`
Sub-materi/level dalam satu modul (contoh: modul Matematika → topik "Penjumlahan", "Pengurangan").
```sql
CREATE TABLE topics (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(255) NULL,
    difficulty ENUM('mudah', 'sedang', 'sulit') NOT NULL DEFAULT 'mudah',
    min_age_level ENUM('4-5', '6-7', '8') NOT NULL DEFAULT '4-5',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);
```

### 2.5 `questions`
Bank soal — inti dari "konsep/bank soal sendiri per pembelajaran".
```sql
CREATE TABLE questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    topic_id BIGINT UNSIGNED NOT NULL,
    type ENUM(
        'multiple_choice',   -- pilihan ganda (teks/gambar)
        'true_false',        -- benar/salah
        'matching',          -- mencocokkan pasangan
        'listen_choose',     -- dengar audio lalu pilih jawaban
        'arrange_word',      -- susun kata/kalimat
        'drag_drop'          -- seret & lepas
    ) NOT NULL DEFAULT 'multiple_choice',
    question_text TEXT NOT NULL,
    question_image_url VARCHAR(255) NULL,
    question_audio_url VARCHAR(255) NULL COMMENT 'narasi/voice-over soal',
    points INT UNSIGNED NOT NULL DEFAULT 10,
    difficulty ENUM('mudah', 'sedang', 'sulit') NOT NULL DEFAULT 'mudah',
    explanation TEXT NULL COMMENT 'penjelasan singkat setelah dijawab (opsional)',
    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
    created_by BIGINT UNSIGNED NULL COMMENT 'FK ke users (admin/guru pembuat soal)',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### 2.6 `question_options`
Opsi jawaban untuk soal bertipe pilihan ganda/mencocokkan/dsb.
```sql
CREATE TABLE question_options (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT UNSIGNED NOT NULL,
    option_text VARCHAR(255) NULL,
    option_image_url VARCHAR(255) NULL,
    option_audio_url VARCHAR(255) NULL,
    match_group VARCHAR(50) NULL COMMENT 'untuk tipe matching, mengelompokkan pasangan A-B',
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);
```

### 2.7 `stories` (khusus modul Cerita)
```sql
CREATE TABLE stories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT UNSIGNED NOT NULL,
    topic_id BIGINT UNSIGNED NULL COMMENT 'opsional, jika cerita dikelompokkan per topik',
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    video_url VARCHAR(255) NULL,
    pdf_url VARCHAR(255) NULL,
    cover_image_url VARCHAR(255) NULL,
    level ENUM('mudah', 'sedang', 'sulit') NOT NULL DEFAULT 'mudah',
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
);
```

### 2.8 `story_vocabularies`
```sql
CREATE TABLE story_vocabularies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    story_id BIGINT UNSIGNED NOT NULL,
    word VARCHAR(100) NOT NULL,
    meaning VARCHAR(255) NOT NULL,
    audio_url VARCHAR(255) NULL,
    image_url VARCHAR(255) NULL,
    sort_order INT UNSIGNED NOT NULL DEFAULT 0,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
);
```

### 2.9 `quiz_attempts`
Satu baris = satu sesi anak mengerjakan satu topik.
```sql
CREATE TABLE quiz_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id BIGINT UNSIGNED NOT NULL,
    topic_id BIGINT UNSIGNED NOT NULL,
    total_questions INT UNSIGNED NOT NULL DEFAULT 0,
    correct_count INT UNSIGNED NOT NULL DEFAULT 0,
    score INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'skor akhir, mis. 0-100',
    stars_earned TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0-3 bintang',
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);
```

### 2.10 `quiz_answers`
Detail jawaban anak per soal dalam satu attempt (untuk analitik "topik lemah").
```sql
CREATE TABLE quiz_answers (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id BIGINT UNSIGNED NOT NULL,
    question_id BIGINT UNSIGNED NOT NULL,
    selected_option_id BIGINT UNSIGNED NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    answered_at TIMESTAMP NULL,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES question_options(id) ON DELETE SET NULL
);
```

### 2.11 `child_progress`
Ringkasan status per anak per topik (dipakai untuk render "peta petualangan").
```sql
CREATE TABLE child_progress (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id BIGINT UNSIGNED NOT NULL,
    module_id BIGINT UNSIGNED NOT NULL,
    topic_id BIGINT UNSIGNED NOT NULL,
    status ENUM('locked', 'unlocked', 'in_progress', 'completed') NOT NULL DEFAULT 'locked',
    best_score INT UNSIGNED NOT NULL DEFAULT 0,
    stars_earned TINYINT UNSIGNED NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    UNIQUE KEY uq_child_topic (child_id, topic_id),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);
```

### 2.12 `badges`
Master lencana/pencapaian.
```sql
CREATE TABLE badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    icon VARCHAR(255) NULL,
    criteria_type ENUM('module_complete', 'topic_streak', 'perfect_score', 'total_stars') NOT NULL,
    criteria_value INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'nilai ambang, mis. total_stars >= 50',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

### 2.13 `child_badges`
```sql
CREATE TABLE child_badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id BIGINT UNSIGNED NOT NULL,
    badge_id BIGINT UNSIGNED NOT NULL,
    earned_at TIMESTAMP NULL,
    UNIQUE KEY uq_child_badge (child_id, badge_id),
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);
```

### 2.14 `star_logs`
Riwayat perolehan bintang (audit trail untuk laporan orang tua).
```sql
CREATE TABLE star_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id BIGINT UNSIGNED NOT NULL,
    source_type ENUM('quiz_attempt', 'daily_login', 'bonus') NOT NULL DEFAULT 'quiz_attempt',
    source_id BIGINT UNSIGNED NULL COMMENT 'mis. id quiz_attempts jika source_type=quiz_attempt',
    stars INT NOT NULL,
    created_at TIMESTAMP NULL,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);
```

### 2.15 `settings`
Pengaturan per anak (suara, musik, dsb).
```sql
CREATE TABLE settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id BIGINT UNSIGNED NOT NULL UNIQUE,
    sound_effects_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    background_music_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    voice_narration_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    daily_time_limit_minutes INT UNSIGNED NULL COMMENT 'batas waktu layar harian, opsional',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);
```

### 2.16 `rooms` (opsional — fase lanjutan, mode guru/kelas)
```sql
CREATE TABLE rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT UNSIGNED NOT NULL COMMENT 'FK ke users dengan role teacher',
    room_code VARCHAR(10) NOT NULL UNIQUE COMMENT 'kode invite, mis. J7WEU9',
    module_id BIGINT UNSIGNED NOT NULL,
    topic_id BIGINT UNSIGNED NULL,
    status ENUM('open', 'in_progress', 'closed') NOT NULL DEFAULT 'open',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
);
```

### 2.17 `room_members` (opsional — fase lanjutan)
```sql
CREATE TABLE room_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    child_id BIGINT UNSIGNED NOT NULL,
    joined_at TIMESTAMP NULL,
    UNIQUE KEY uq_room_child (room_id, child_id),
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE
);
```

---

## 3. Indeks Tambahan yang Disarankan

```sql
CREATE INDEX idx_topics_module ON topics(module_id, sort_order);
CREATE INDEX idx_questions_topic_status ON questions(topic_id, status);
CREATE INDEX idx_attempts_child ON quiz_attempts(child_id, topic_id);
CREATE INDEX idx_progress_child_module ON child_progress(child_id, module_id);
CREATE INDEX idx_star_logs_child ON star_logs(child_id, created_at);
```

---

## 4. Catatan Implementasi Laravel

- Gunakan **migration per tabel** sesuai urutan dependency di atas (users → modules → children → topics → questions → question_options → dst).
- Setiap tabel utama sebaiknya punya **Model + Factory + Seeder** — terutama `modules`, `topics`, `questions`, `question_options` untuk memudahkan seeding bank soal awal (7 modul × beberapa topik × banyak soal).
- Relasi Eloquent inti:
  - `User hasMany Children`
  - `Child hasMany QuizAttempts, ChildProgress, ChildBadges, StarLogs`
  - `Module hasMany Topics`
  - `Topic hasMany Questions`
  - `Question hasMany QuestionOptions`
  - `Story belongsTo Module`, `Story hasMany StoryVocabularies`
- Gunakan **Laravel Sanctum** untuk autentikasi API yang dikonsumsi React SPA.
- Pertimbangkan **soft delete** (`deleted_at`) pada `questions` dan `topics` agar riwayat `quiz_answers` lama tidak kehilangan referensi saat konten diarsipkan, bukan dihapus permanen.
- Media (gambar/audio/video) disarankan disimpan via Laravel Filesystem (local/S3-compatible) dan hanya path/URL yang disimpan di kolom `*_url`.

---

## 5. Ringkasan Alur Data Saat Anak Mengerjakan Kuis

```
1. React fetch GET /api/topics/{id}/questions  → ambil soal + opsi dari `questions` & `question_options`
2. Anak menjawab tiap soal → simpan sementara di state React
3. Selesai kuis → POST /api/quiz-attempts
   → Laravel membuat 1 baris `quiz_attempts`
   → menyimpan tiap jawaban ke `quiz_answers`
   → menghitung skor & bintang → update `child_progress`
   → menambah baris ke `star_logs`
   → cek kriteria `badges` → jika terpenuhi, insert `child_badges`
4. Parent Dashboard membaca agregasi dari `child_progress`, `quiz_attempts`, `star_logs` untuk laporan.
```
