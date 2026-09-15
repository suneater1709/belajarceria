import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, XCircle, Sparkles, HelpCircle, Loader2, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../../components/common/Navbar';
import ParallaxBackground from '../../components/common/ParallaxBackground';
import { sound } from '../../services/audio';
import { api, getActiveChild } from '../../services/api';

const OPTION_THEMES = [
    {
        badge: '🍎 A',
        icon: '🍎',
        label: 'A',
        bg: 'bg-amber-50/90',
        border: 'border-amber-200 hover:border-amber-400',
        text: 'text-amber-950',
        badgeBg: 'bg-amber-200/80 text-amber-900',
        activeShadow: 'shadow-[0_4px_0_#F59E0B]',
        idleShadow: 'shadow-[0_4px_0_#FDE68A]',
    },
    {
        badge: '🚀 B',
        icon: '🚀',
        label: 'B',
        bg: 'bg-sky-50/90',
        border: 'border-sky-200 hover:border-sky-400',
        text: 'text-sky-950',
        badgeBg: 'bg-sky-200/80 text-sky-900',
        activeShadow: 'shadow-[0_4px_0_#0EA5E9]',
        idleShadow: 'shadow-[0_4px_0_#BAE6FD]',
    },
    {
        badge: '🌈 C',
        icon: '🌈',
        label: 'C',
        bg: 'bg-purple-50/90',
        border: 'border-purple-200 hover:border-purple-400',
        text: 'text-purple-950',
        badgeBg: 'bg-purple-200/80 text-purple-900',
        activeShadow: 'shadow-[0_4px_0_#A855F7]',
        idleShadow: 'shadow-[0_4px_0_#E9D5FF]',
    },
    {
        badge: '🎨 D',
        icon: '🎨',
        label: 'D',
        bg: 'bg-rose-50/90',
        border: 'border-rose-200 hover:border-rose-400',
        text: 'text-rose-950',
        badgeBg: 'bg-rose-200/80 text-rose-900',
        activeShadow: 'shadow-[0_4px_0_#F43F5E]',
        idleShadow: 'shadow-[0_4px_0_#FECDD3]',
    },
];

export default function QuizSessionPage() {
    const { modul, topicId } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(getActiveChild());

    const [topic, setTopic] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [userAnswers, setUserAnswers] = useState([]);
    const [startTime] = useState(new Date().toISOString());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const activeChild = getActiveChild();
        if (!activeChild) {
            navigate('/belajarceria', { replace: true });
            return;
        }
        setChild(activeChild);

        let isMounted = true;
        const loadData = async () => {
            try {
                setLoadError('');
                const topicRes = await api.getTopicDetail(topicId);
                if (!isMounted) return;
                setTopic(topicRes.data);

                // Fetch bank soal sekali untuk sesi ini
                const questionsRes = await api.getQuestions(topicId, 5, true);
                if (!isMounted) return;

                if (questionsRes.data && questionsRes.data.length > 0) {
                    setQuestions(questionsRes.data);
                } else {
                    setLoadError('Belum ada soal kuis yang tersedia pada topik ini.');
                }
            } catch (err) {
                console.error('Error memuat soal kuis:', err);
                if (isMounted) {
                    setLoadError(err.message || 'Gagal memuat soal kuis.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        sound.setContext('energetic');
        loadData();

        return () => {
            isMounted = false;
            sound.stopAllAudio();
            sound.setContext('default');
        };
    }, [topicId, modul, navigate]);

    const handleSelectOption = (option) => {
        if (isAnswered) return; // Mencegah klik ganda

        setSelectedOptionId(option.id);
        setIsAnswered(true);

        const currentQ = questions[currentIndex];
        const isRight = Boolean(option.is_correct === true || option.is_correct === 1 || option.is_correct === '1');
        setIsCorrectAnswer(isRight);

        // Feedback audio instan <300ms
        if (isRight) {
            sound.playCorrect();
            // Confetti ceria saat jawaban benar
            try {
                confetti({
                    particleCount: 45,
                    spread: 70,
                    origin: { y: 0.65 },
                    colors: ['#F59E0B', '#10B981', '#6366F1', '#EC4899', '#38BDF8']
                });
            } catch (e) {
                // ignore if canvas unavailable
            }
        } else {
            sound.playWrong();
        }

        // Tampilkan feedback box dengan animasi smooth delay
        setTimeout(() => {
            setFeedbackVisible(true);
        }, 150);

        // Catat jawaban
        setUserAnswers(prev => [
            ...prev,
            {
                question_id: currentQ.id,
                selected_option_id: option.id,
            }
        ]);
    };

    const handleNextQuestion = async () => {
        sound.stopAllAudio();
        sound.playPop();

        if (currentIndex + 1 < questions.length) {
            // Lanjut ke soal berikutnya
            setCurrentIndex(prev => prev + 1);
            setSelectedOptionId(null);
            setIsAnswered(false);
            setIsCorrectAnswer(false);
            setFeedbackVisible(false);
        } else {
            // Selesai kuis: Kirim ke server
            setIsSubmitting(true);
            try {
                const payload = {
                    child_id: child.id,
                    topic_id: parseInt(topicId, 10),
                    started_at: startTime,
                    answers: userAnswers,
                };

                const res = await api.submitQuizAttempt(payload);
                navigate(`/belajarceria/${modul}/${topicId}/hasil`, {
                    state: { result: res.data }
                });
            } catch (err) {
                console.error('Gagal submit kuis:', err);
                alert(err.message || 'Gagal menyimpan hasil kuis.');
                setIsSubmitting(false);
            }
        }
    };

    if (isLoading) {
        return (
            <ParallaxBackground>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-bold text-sm">Menyiapkan petualangan soal seru...</p>
                </div>
            </ParallaxBackground>
        );
    }

    if (!isLoading && (loadError || questions.length === 0)) {
        return (
            <ParallaxBackground>
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
                    <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner">
                        🦉
                    </div>
                    <h2 className="text-2xl font-black text-[#2E2A4A] font-heading mb-2">
                        {loadError || 'Belum Ada Soal'}
                    </h2>
                    <p className="text-sm text-gray-600 mb-6 font-medium">
                        Topik ini sedang dipersiapkan oleh tim guru ceria. Yuk coba topik atau modul lainnya dulu!
                    </p>
                    <button
                        onClick={() => { sound.playPop(); navigate(`/belajarceria/${modul}`); }}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer min-h-[48px]"
                    >
                        Kembali ke Daftar Topik
                    </button>
                </div>
            </ParallaxBackground>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
    const themeColor = topic && topic.module ? topic.module.color_theme : '#6366F1';
    const isTrueFalse = currentQuestion.type === 'true_false' || (currentQuestion.options && currentQuestion.options.length === 2 && currentQuestion.options.some(o => /benar|salah|true|false/i.test(o.option_text)));

    return (
        <ParallaxBackground moduleColor={themeColor}>
            <Navbar />

            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col justify-between">
                {/* Header Sesi & Bar Progres */}
                <div className="mb-6">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2">
                        <span className="truncate max-w-[220px] sm:max-w-md">Topik: {topic ? topic.name : 'Aktivitas Kuis'}</span>
                        <span className="font-heading text-sm text-indigo-600 font-extrabold shrink-0">
                            Soal {currentIndex + 1} dari {questions.length}
                        </span>
                    </div>

                    <div className="w-full h-3.5 bg-white/90 rounded-full overflow-hidden p-0.5 border-2 border-indigo-100 shadow-inner">
                        <div 
                            className="h-full bg-gradient-to-r from-amber-400 via-pink-400 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Kartu Soal Utama */}
                <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-3 border-amber-200/80 shadow-2xl flex flex-col space-y-6">
                    {/* Baris Narasi Soal */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-100 text-amber-900 text-xs font-extrabold rounded-full uppercase shadow-xs">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                <span>Poin: {currentQuestion.points || 10} Bintang</span>
                            </span>
                            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full capitalize">
                                Level: {currentQuestion.difficulty || 'mudah'}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading leading-snug">
                            {currentQuestion.question_text}
                        </h2>
                    </div>

                    {/* Gambar Soal jika ada */}
                    {currentQuestion.question_image_url && (
                        <div className="rounded-2xl overflow-hidden max-h-64 bg-amber-50/50 border-2 border-amber-100 flex items-center justify-center p-2 shadow-inner">
                            <img 
                                src={currentQuestion.question_image_url} 
                                alt={currentQuestion.question_text || "Gambar Soal"} 
                                className="max-h-60 w-auto object-contain rounded-xl"
                            />
                        </div>
                    )}

                    {/* Pilihan Jawaban Playful & Fun (Poin 3) */}
                    <div className={`grid gap-3.5 pt-1 ${isTrueFalse ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        {currentQuestion.options && currentQuestion.options.map((opt, idx) => {
                            const isSelected = selectedOptionId === opt.id;
                            const optIsCorrect = Boolean(opt.is_correct === true || opt.is_correct === 1 || opt.is_correct === '1');
                            const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
                            const isBenarText = /benar|true/i.test(opt.option_text);
                            const isSalahText = /salah|false/i.test(opt.option_text);

                            // Custom playful True/False icons & colors
                            let optionBadge = theme.badge;
                            let optionIcon = theme.icon;
                            let baseBg = theme.bg;
                            let baseBorder = theme.border;
                            let baseText = theme.text;
                            let shadowStyle = theme.idleShadow;

                            if (isTrueFalse) {
                                if (isBenarText) {
                                    baseBg = 'bg-emerald-50/90';
                                    baseBorder = 'border-emerald-200 hover:border-emerald-400';
                                    baseText = 'text-emerald-950';
                                    optionBadge = '👍 Benar';
                                    optionIcon = '👍';
                                    shadowStyle = 'shadow-[0_4px_0_#6EE7B7]';
                                } else if (isSalahText) {
                                    baseBg = 'bg-rose-50/90';
                                    baseBorder = 'border-rose-200 hover:border-rose-400';
                                    baseText = 'text-rose-950';
                                    optionBadge = '👎 Salah';
                                    optionIcon = '👎';
                                    shadowStyle = 'shadow-[0_4px_0_#FDA4AF]';
                                }
                            }

                            let stateClasses = `${baseBg} ${baseBorder} ${baseText} ${shadowStyle} hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-1 active:shadow-none`;

                            if (isAnswered) {
                                if (optIsCorrect) {
                                    // Jawaban BENAR -> HIJAU Playful & Glowing
                                    stateClasses = 'bg-emerald-100/90 border-emerald-400 text-emerald-950 ring-4 ring-emerald-300/60 shadow-[0_4px_0_#10B981] animate-pop-scale';
                                } else if (isSelected && !optIsCorrect) {
                                    // Jawaban SALAH yang dipilih -> MERAH
                                    stateClasses = 'bg-rose-100/90 border-rose-400 text-rose-950 ring-4 ring-rose-300/60 shadow-[0_4px_0_#F43F5E] animate-soft-shake';
                                } else {
                                    // Pilihan lain yang tidak dipilih
                                    stateClasses = 'bg-gray-50/70 border-gray-200 text-gray-400 opacity-50 shadow-none';
                                }
                            }

                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    disabled={isAnswered}
                                    onClick={() => handleSelectOption(opt)}
                                    className={`p-4 sm:p-4.5 rounded-3xl border-3 font-heading text-lg font-bold text-left transition-all duration-200 flex items-center justify-between cursor-pointer min-h-[68px] ${stateClasses}`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-black shadow-xs shrink-0 ${
                                            isAnswered && optIsCorrect 
                                                ? 'bg-emerald-500 text-white' 
                                                : isAnswered && isSelected && !optIsCorrect
                                                ? 'bg-rose-500 text-white'
                                                : 'bg-white/80 text-current'
                                        }`}>
                                            {isTrueFalse ? optionIcon : theme.label}
                                        </span>
                                        <span className="leading-snug">{opt.option_text}</span>
                                    </div>

                                    {isAnswered && optIsCorrect && (
                                        <div className="flex items-center space-x-1 text-emerald-600 shrink-0 ml-2 animate-bounce-in">
                                            <CheckCircle2 className="w-6 h-6 fill-emerald-100 text-emerald-600" />
                                        </div>
                                    )}
                                    {isAnswered && isSelected && !optIsCorrect && (
                                        <div className="flex items-center space-x-1 text-rose-600 shrink-0 ml-2 animate-bounce-in">
                                            <XCircle className="w-6 h-6 fill-rose-100 text-rose-600" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Kotak Feedback & Penjelasan Rewarding (Poin 6) */}
                    {isAnswered && feedbackVisible && (
                        <div className={`p-5 rounded-3xl border-3 transition-all flex items-start space-x-3.5 animate-bounce-in shadow-xl ${
                            isCorrectAnswer 
                                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950 shadow-emerald-200/50' 
                                : 'bg-gradient-to-r from-rose-50 to-amber-50 border-rose-300 text-rose-950 shadow-rose-200/50'
                        }`}>
                            <div className="text-3xl shrink-0 p-2 rounded-2xl bg-white shadow-xs">
                                {isCorrectAnswer ? '🎉' : '💡'}
                            </div>
                            <div className="flex-1 text-sm font-medium">
                                <p className="font-black text-lg font-heading tracking-tight flex items-center space-x-1.5">
                                    <span>{isCorrectAnswer ? 'Hebat Sekali! Jawabanmu Benar!' : 'Yah, Kurang Tepat...'}</span>
                                    {isCorrectAnswer && <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />}
                                </p>
                                <p className="mt-1 text-xs sm:text-sm leading-relaxed opacity-95">
                                    {isCorrectAnswer
                                        ? (currentQuestion.explanation || 'Kamu pintar banget, teruskan petualangan belajarmu!')
                                        : (currentQuestion.explanation || 'Jangan berkecil hati, ayo pelajari dan coba soal berikutnya!')
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tombol Lanjut ke Soal Berikutnya */}
                <div className="mt-6 flex justify-end">
                    {isAnswered && (
                        <button
                            type="button"
                            onClick={handleNextQuestion}
                            disabled={isSubmitting}
                            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-lg rounded-2xl shadow-[0_6px_0_#C2410C] hover:shadow-[0_8px_0_#C2410C] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60 animate-bounce-in"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Menghitung Hasil...</span>
                                </>
                            ) : (
                                <>
                                    <span>{currentIndex + 1 < questions.length ? 'Soal Berikutnya' : 'Lihat Hasil Bintang'}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </main>
        </ParallaxBackground>
    );
}
