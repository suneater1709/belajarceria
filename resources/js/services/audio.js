// Audio Engine untuk BelajarCeria menggunakan Web Audio API & HTML5 Audio Preloading (Tanpa TTS/Voice)

class SoundEngine {
    constructor() {
        this.ctx = null;
        // Sound effects selalu aktif untuk feedback interaktif anak
        this.soundEnabled = true;
        this.musicEnabled = localStorage.getItem('bc_music_enabled') !== 'false';
        this.bgmOscillators = [];
        this.bgmTimer = null;
        this.isBgmPlaying = false;

        this.currentAudio = null;
        this.audioCache = new Map();
    }

    initContext() {
        try {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch (e) {
            console.warn('Web Audio initialization error:', e);
        }
    }

    setMusicEnabled(val) {
        this.musicEnabled = val;
        localStorage.setItem('bc_music_enabled', val ? 'true' : 'false');
        if (!val) {
            this.stopBgm();
        } else {
            this.startBgm();
        }
    }

    // Preload audio file ke memory cache agar playback mulus tanpa jeda
    preloadAudio(url) {
        if (!url || this.audioCache.has(url)) return;
        try {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            this.audioCache.set(url, audio);
        } catch (e) {
            console.warn('Audio preloading failed for:', url, e);
        }
    }

    // Play file audio dari URL
    playAudioUrl(url, onEnd = null) {
        if (!url) return;
        this.stopAllAudio();

        let audio = this.audioCache.get(url);
        if (!audio) {
            audio = new Audio(url);
            this.audioCache.set(url, audio);
        }

        audio.currentTime = 0;
        this.currentAudio = audio;

        if (onEnd) {
            audio.onended = () => {
                this.currentAudio = null;
                onEnd();
            };
        } else {
            audio.onended = () => {
                this.currentAudio = null;
            };
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.warn('Audio playback prevented or failed:', err);
                this.currentAudio = null;
            });
        }
    }

    // Hentikan pemutaran audio file seketika
    stopAudioFile() {
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
            } catch (e) {
                // ignore
            }
            this.currentAudio = null;
        }
    }

    // Hentikan SEMUA file suara audio
    stopAllAudio() {
        this.stopAudioFile();
    }

    // 1. Pop / Tap Button (Bubble Pop Ceria)
    playPop() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.07);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
    }

    // Success alias for playCorrect
    playSuccess() {
        this.playCorrect();
    }

    // Error alias for playWrong
    playError() {
        this.playWrong();
    }

    // 2. Jawaban Benar (Melodi Ceria Xylophone Glockenspiel Arpeggio)
    playCorrect() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Tangga nada riang: C5, E5, G5, C6 (523Hz, 659Hz, 784Hz, 1046Hz)
        const chords = [
            { freq: 523.25, time: 0.00, dur: 0.28 },
            { freq: 659.25, time: 0.08, dur: 0.28 },
            { freq: 783.99, time: 0.16, dur: 0.32 },
            { freq: 1046.50, time: 0.24, dur: 0.45 },
            { freq: 1318.51, time: 0.32, dur: 0.50 }  // E6 bonus chime
        ];

        chords.forEach(({ freq, time, dur }) => {
            const noteStart = now + time;

            // Lapisan 1: Triangle Warm Base
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(freq, noteStart);

            gain1.gain.setValueAtTime(0, noteStart);
            gain1.gain.linearRampToValueAtTime(0.35, noteStart + 0.015);
            gain1.gain.exponentialRampToValueAtTime(0.001, noteStart + dur);

            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);

            osc1.start(noteStart);
            osc1.stop(noteStart + dur);

            // Lapisan 2: Sine Bell Ringing Harpa
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2, noteStart); // Oktaf atas

            gain2.gain.setValueAtTime(0, noteStart);
            gain2.gain.linearRampToValueAtTime(0.18, noteStart + 0.01);
            gain2.gain.exponentialRampToValueAtTime(0.001, noteStart + dur * 0.7);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc2.start(noteStart);
            osc2.stop(noteStart + dur * 0.7);
        });
    }

    // 3. Jawaban Salah (Nada Lucu & Lembut Kartun "Boing-Boop" yang Tidak Menakutkan)
    playWrong() {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Nada 1: Soft cartoon "Uh-oh" part 1
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(370, now);
        osc1.frequency.exponentialRampToValueAtTime(290, now + 0.14);

        gain1.gain.setValueAtTime(0.28, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.14);

        // Nada 2: Soft cartoon "Uh-oh" part 2
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(270, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(190, now + 0.35);

        gain2.gain.setValueAtTime(0.3, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);

        osc2.start(now + 0.15);
        osc2.stop(now + 0.35);
    }

    // 4. Sparkle / Bintang Baru
    playSparkle() {
        this.initContext();
        if (!this.ctx) return;

        const frequencies = [880, 1174, 1318, 1760, 2093];
        frequencies.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + idx * 0.05);
            osc.stop(this.ctx.currentTime + idx * 0.05 + 0.2);
        });
    }

    // 5. Fanfare Kemenangan Kuis
    playFanfare() {
        this.initContext();
        if (!this.ctx) return;

        const melody = [
            { freq: 523.25, time: 0.00, dur: 0.14 }, // C5
            { freq: 523.25, time: 0.15, dur: 0.14 }, // C5
            { freq: 523.25, time: 0.30, dur: 0.14 }, // C5
            { freq: 659.25, time: 0.45, dur: 0.30 }, // E5
            { freq: 783.99, time: 0.75, dur: 0.22 }, // G5
            { freq: 1046.50, time: 0.98, dur: 0.60 } // C6
        ];

        melody.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(item.freq, this.ctx.currentTime + item.time);

            gain.gain.setValueAtTime(0, this.ctx.currentTime + item.time);
            gain.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + item.time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + item.time + item.dur);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + item.time);
            osc.stop(this.ctx.currentTime + item.time + item.dur);
        });
    }

    // 6. Upbeat & Cheerful Children BGM Engine (110-140 BPM, Major Keys, Ukulele/Xylophone/Glockenspiel)
    setContext(context = 'default') {
        if (this.currentContext === context) return;
        this.currentContext = context;
        if (this.isBgmPlaying && this.musicEnabled) {
            this.stopBgm();
            this.startBgm(context);
        }
    }

    startBgm(context = null) {
        if (context) {
            this.currentContext = context;
        }
        if (!this.musicEnabled) return;
        this.initContext();
        if (!this.ctx) return;

        if (this.isBgmPlaying) {
            this.stopBgm();
        }

        this.isBgmPlaying = true;
        const currentMode = this.currentContext || 'default';

        // Konfigurasi Pola Musik Ceria Berdasarkan Konteks
        // 1. 'energetic' (Kuis & Permainan): ~132 BPM, F/C Major, arpeggio ukulele + glockenspiel ceria & lompat-lompat
        // 2. 'calm' (Cerita & Belajar Tenang): ~115 BPM, G/C Major, marimba & music box hangat ramah anak
        // 3. 'default': ~124 BPM, C Major, melodi riang taman bermain

        let tempoMs = 230; // ~130 BPM
        let pattern = [];

        if (currentMode === 'energetic' || currentMode === 'quiz') {
            tempoMs = 225; // ~133 BPM
            // Ceria energik F Major & C Major (F4, A4, C5, E5, D5, G4, A4, C5, F5, G5, A5)
            pattern = [
                // Bar 1 - F Major bouncy
                { melody: 698.46, bass: 349.23, chord: [440.00, 523.25], type: 'pluck', bell: 1046.50 }, // F5, F4, A4+C5, C6
                { melody: 523.25, type: 'pluck' },                                                        // C5
                { melody: 587.33, chord: [440.00, 523.25], type: 'pluck', bell: 1174.66 },               // D5
                { melody: 659.25, type: 'pluck' },                                                        // E5
                // Bar 2 - C Major happy jump
                { melody: 783.99, bass: 261.63, chord: [392.00, 523.25], type: 'pluck', bell: 1318.51 }, // G5, C4, G4+C5, E6
                { melody: 659.25, type: 'pluck' },                                                        // E5
                { melody: 587.33, chord: [392.00, 523.25], type: 'pluck', bell: 1046.50 },               // D5
                { melody: 523.25, type: 'pluck' },                                                        // C5
                // Bar 3 - Dm / Bb Major
                { melody: 698.46, bass: 293.66, chord: [440.00, 587.33], type: 'pluck', bell: 1396.91 }, // F5, D4, A4+D5, F6
                { melody: 783.99, type: 'pluck' },                                                        // G5
                { melody: 880.00, chord: [440.00, 587.33], type: 'pluck', bell: 1760.00 },               // A5
                { melody: 783.99, type: 'pluck' },                                                        // G5
                // Bar 4 - C7 happy resolution
                { melody: 659.25, bass: 261.63, chord: [392.00, 493.88], type: 'pluck', bell: 1318.51 }, // E5, C4, G4+B4, E6
                { melody: 587.33, type: 'pluck' },                                                        // D5
                { melody: 523.25, chord: [349.23, 440.00, 523.25], type: 'pluck', bell: 1046.50 },       // C5, F Major chord
                { melody: 698.46, type: 'pluck' }                                                         // F5
            ];
        } else if (currentMode === 'calm' || currentMode === 'story') {
            tempoMs = 265; // ~113 BPM (tenang namun tetap hangat, ceria & mendidik)
            // Marimba & Glockenspiel C & G Major
            pattern = [
                { melody: 523.25, bass: 261.63, chord: [329.63, 392.00], bell: 1046.50 }, // C5
                { melody: 587.33 },                                                        // D5
                { melody: 659.25, chord: [329.63, 392.00] },                               // E5
                { melody: 783.99, bell: 1318.51 },                                         // G5
                { melody: 659.25, bass: 196.00, chord: [293.66, 392.00] },                 // E5, G3
                { melody: 587.33 },                                                        // D5
                { melody: 523.25, chord: [293.66, 392.00], bell: 1046.50 },                // C5
                { melody: 440.00 },                                                        // A4
                { melody: 493.88, bass: 220.00, chord: [329.63, 440.00] },                 // B4, A3
                { melody: 523.25 },                                                        // C5
                { melody: 587.33, chord: [329.63, 440.00], bell: 1174.66 },                // D5
                { melody: 659.25 },                                                        // E5
                { melody: 587.33, bass: 196.00, chord: [293.66, 392.00] },                 // D5
                { melody: 493.88 },                                                        // B4
                { melody: 523.25, chord: [261.63, 329.63, 392.00], bell: 1046.50 },        // C5
                { melody: 392.00 }                                                         // G4
            ];
        } else {
            // Default: Suasana Ceria Belajar (122 BPM)
            tempoMs = 245;
            pattern = [
                { melody: 523.25, bass: 261.63, chord: [329.63, 392.00], bell: 1046.50 },
                { melody: 659.25 },
                { melody: 783.99, chord: [329.63, 392.00], bell: 1318.51 },
                { melody: 880.00 },
                { melody: 783.99, bass: 349.23, chord: [440.00, 523.25] },
                { melody: 659.25 },
                { melody: 523.25, chord: [440.00, 523.25], bell: 1046.50 },
                { melody: 587.33 },
                { melody: 659.25, bass: 293.66, chord: [392.00, 493.88] },
                { melody: 587.33 },
                { melody: 523.25, chord: [392.00, 493.88], bell: 1046.50 },
                { melody: 440.00 },
                { melody: 392.00, bass: 261.63, chord: [329.63, 392.00] },
                { melody: 523.25 },
                { melody: 659.25, chord: [329.63, 392.00], bell: 1318.51 },
                { melody: 783.99 }
            ];
        }

        let step = 0;

        const playStep = () => {
            if (!this.isBgmPlaying || !this.musicEnabled || !this.ctx) return;

            const now = this.ctx.currentTime;
            const currentStep = pattern[step % pattern.length];

            // 1. Melodi Utama (Ukulele / Glockenspiel Ceria)
            if (currentStep.melody) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(currentStep.melody, now);

                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(0.045, now + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.0005, now + (tempoMs / 1000) * 1.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + (tempoMs / 1000) * 1.3);
            }

            // 2. Bell / Lonceng Ceria (Harmonic Chime di Atas)
            if (currentStep.bell) {
                const oscBell = this.ctx.createOscillator();
                const gainBell = this.ctx.createGain();
                oscBell.type = 'sine';
                oscBell.frequency.setValueAtTime(currentStep.bell, now);

                gainBell.gain.setValueAtTime(0, now);
                gainBell.gain.linearRampToValueAtTime(0.025, now + 0.008);
                gainBell.gain.exponentialRampToValueAtTime(0.0005, now + 0.4);

                oscBell.connect(gainBell);
                gainBell.connect(this.ctx.destination);
                oscBell.start(now);
                oscBell.stop(now + 0.4);
            }

            // 3. Strumming Chord Lembut
            if (currentStep.chord) {
                currentStep.chord.forEach((freq, idx) => {
                    const oscChord = this.ctx.createOscillator();
                    const gainChord = this.ctx.createGain();
                    oscChord.type = 'sine';
                    oscChord.frequency.setValueAtTime(freq, now + idx * 0.015);

                    gainChord.gain.setValueAtTime(0, now + idx * 0.015);
                    gainChord.gain.linearRampToValueAtTime(0.022, now + idx * 0.015 + 0.01);
                    gainChord.gain.exponentialRampToValueAtTime(0.0005, now + (tempoMs / 1000) * 1.5);

                    oscChord.connect(gainChord);
                    gainChord.connect(this.ctx.destination);
                    oscChord.start(now + idx * 0.015);
                    oscChord.stop(now + (tempoMs / 1000) * 1.5);
                });
            }

            // 4. Bass Note Riang (Ukulele Bass / Marimba Low)
            if (currentStep.bass) {
                const oscBass = this.ctx.createOscillator();
                const gainBass = this.ctx.createGain();
                oscBass.type = 'triangle';
                oscBass.frequency.setValueAtTime(currentStep.bass, now);

                gainBass.gain.setValueAtTime(0, now);
                gainBass.gain.linearRampToValueAtTime(0.05, now + 0.015);
                gainBass.gain.exponentialRampToValueAtTime(0.0005, now + 0.35);

                oscBass.connect(gainBass);
                gainBass.connect(this.ctx.destination);
                oscBass.start(now);
                oscBass.stop(now + 0.35);
            }

            step++;
            this.bgmTimer = setTimeout(playStep, tempoMs);
        };

        playStep();
    }

    stopBgm() {
        this.isBgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

export const sound = new SoundEngine();
