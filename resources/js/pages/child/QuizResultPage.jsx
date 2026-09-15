import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Star, Award, ArrowRight, Map } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ParallaxBackground from '../../components/common/ParallaxBackground';
import BadgeIcon from '../../components/common/BadgeIcon';
import { sound } from '../../services/audio';
import { api, getActiveChild, setActiveChild } from '../../services/api';

export default function QuizResultPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { modul, topicId } = useParams();
    const result = location.state?.result;
    const child = getActiveChild();

    const [nextTopic, setNextTopic] = useState(null);
    const [isLoadingNextTopic, setIsLoadingNextTopic] = useState(true);

    useEffect(() => {
        // Mainkan Fanfare dan Ledakan Confetti Ceria!
        sound.playFanfare();

        // Ledakan Confetti
        const count = 200;
        const defaults = {
            origin: { y: 0.6 }
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });

        // Update bintang anak di local storage jika ada
        const currentChild = getActiveChild();
        if (result && result.total_stars !== undefined && currentChild) {
            setActiveChild({
                ...currentChild,
                total_stars: result.total_stars,
            });
        }

        // Cari topik berikutnya dalam modul yang sama
        const fetchTopics = async () => {
            try {
                const res = await api.getModuleTopics(modul, child?.id);
                const topics = res.data?.topics || [];
                const currentIndex = topics.findIndex(t => String(t.id) === String(topicId));
                if (currentIndex !== -1 && currentIndex < topics.length - 1) {
                    setNextTopic(topics[currentIndex + 1]);
                } else {
                    setNextTopic(null); // Terakhir di modul
                }
            } catch (err) {
                console.error('Gagal mengambil daftar topik modul:', err);
                setNextTopic(null);
            } finally {
                setIsLoadingNextTopic(false);
            }
        };

        if (modul) {
            fetchTopics();
        } else {
            setIsLoadingNextTopic(false);
        }
    }, [result, modul, topicId]);

    if (!result) {
        return (
            <ParallaxBackground>
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xl font-bold mb-4">Tidak ada data hasil kuis.</p>
                    <button
                        onClick={() => navigate('/belajarceria/peta')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold cursor-pointer"
                    >
                        Kembali ke Peta Modul
                    </button>
                </div>
            </ParallaxBackground>
        );
    }

    const { score, stars_earned, correct_count, total_questions, newly_unlocked_badges } = result;

    const handleNextAction = () => {
        sound.playPop();
        if (nextTopic) {
            navigate(`/belajarceria/${modul}/${nextTopic.id}`);
        } else {
            navigate('/belajarceria/peta');
        }
    };

    return (
        <ParallaxBackground moduleColor="#8B5CF6">
            <Navbar />

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 flex flex-col items-center justify-center text-center">
                {/* Kartu Hasil Kemenangan */}
                <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-8 border-3 border-amber-300 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                    <span className="px-4 py-1.5 bg-amber-100 text-amber-800 text-xs font-extrabold uppercase rounded-full tracking-wider mb-2">
                        🎉 Petualangan Selesai!
                    </span>

                    <h1 className="text-3xl sm:text-4xl font-black text-[#2E2A4A] font-heading mt-1">
                        Luar Biasa, {child ? child.name : 'Kamu Hebat'}!
                    </h1>

                    {/* Bintang Animasi (0 - 3 Bintang) */}
                    <div className="flex items-center justify-center space-x-3 my-6">
                        {[1, 2, 3].map((num) => {
                            const isFilled = num <= stars_earned;
                            return (
                                <div 
                                    key={num}
                                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-4xl shadow-md transition-all duration-500 ${
                                        isFilled 
                                            ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 scale-110 rotate-3 shadow-amber-300 animate-pulse-gentle' 
                                            : 'bg-gray-100 text-gray-300'
                                    }`}
                                >
                                    <Star className={`w-10 h-10 ${isFilled ? 'fill-white text-white drop-shadow-md' : 'text-gray-300'}`} />
                                </div>
                            );
                        })}
                    </div>

                    {/* Skor Angka & Ringkasan */}
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl px-6 py-4 w-full max-w-sm mb-6 flex items-center justify-around">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Skor Kamu</span>
                            <p className="text-3xl font-black text-indigo-600 font-heading">{score}</p>
                        </div>
                        <div className="w-px h-10 bg-amber-200" />
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase">Benar</span>
                            <p className="text-3xl font-black text-emerald-600 font-heading">{correct_count} / {total_questions}</p>
                        </div>
                    </div>

                    {/* Lencana Baru yang Didapat (Jika Ada) */}
                    {newly_unlocked_badges && newly_unlocked_badges.length > 0 && (
                        <div className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 mb-6 text-center animate-bounce-short">
                            <div className="inline-flex items-center space-x-2 text-indigo-800 font-extrabold text-sm mb-2">
                                <Award className="w-5 h-5 text-indigo-600" />
                                <span>Lencana Baru Terbuka!</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {newly_unlocked_badges.map(b => (
                                    <div key={b.id} className="bg-white px-4 py-2 rounded-xl shadow-xs border border-indigo-100 text-xs font-bold text-gray-800 flex items-center space-x-2">
                                        <BadgeIcon icon={b.icon} className="w-5 h-5 text-indigo-600" emojiSize="text-lg" />
                                        <span>{b.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tombol Aksi Lanjut ke Topik Berikutnya / Kembali ke Peta */}
                    <div className="w-full max-w-sm pt-2">
                        <button
                            onClick={handleNextAction}
                            disabled={isLoadingNextTopic}
                            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-95 text-white font-extrabold text-base shadow-xl shadow-indigo-200 transition-all transform hover:scale-102 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                            {nextTopic ? (
                                <>
                                    <span>Topik Berikutnya</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            ) : (
                                <>
                                    <span>Selesai, Kembali ke Peta</span>
                                    <Map className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Link Kecil Kembali ke Peta Petualangan Modul */}
                    <button
                        onClick={() => { sound.playPop(); navigate('/belajarceria/peta'); }}
                        className="mt-5 text-xs font-bold text-gray-500 hover:text-indigo-600 flex items-center space-x-1 underline cursor-pointer transition-colors"
                    >
                        <Map className="w-3.5 h-3.5" />
                        <span>Kembali ke Peta Petualangan Modul</span>
                    </button>
                </div>
            </main>
        </ParallaxBackground>
    );
}
