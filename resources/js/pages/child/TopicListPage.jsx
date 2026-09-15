import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Star, Lock, Play, CheckCircle, Sparkles, BookOpen, Flag, Compass, ChevronRight, Award, Trophy } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ParallaxBackground from '../../components/common/ParallaxBackground';
import AppIcon from '../../components/common/AppIcon';
import { sound } from '../../services/audio';
import { api, getActiveChild } from '../../services/api';

export default function TopicListPage() {
    const { modul } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(getActiveChild());

    const [moduleData, setModuleData] = useState(null);
    const [topics, setTopics] = useState([]);
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const activeChild = getActiveChild();
        if (!activeChild) {
            navigate('/belajarceria', { replace: true });
            return;
        }
        setChild(activeChild);

        let isMounted = true;
        const loadTopics = async () => {
            try {
                const res = await api.getModuleTopics(modul, activeChild.id);
                if (!isMounted) return;
                if (res.data) {
                    setModuleData(res.data.module);
                    setTopics(res.data.topics);
                }

                // Jika modul cerita, muat daftar buku cerita digital untuk anak aktif
                if (modul === 'cerita') {
                    const storyRes = await api.getStories(1, 50, null, activeChild.id);
                    if (!isMounted) return;
                    if (storyRes.data) {
                        setStories(storyRes.data);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadTopics();

        return () => {
            isMounted = false;
        };
    }, [modul, navigate]);

    const handleOpenTopic = (topic) => {
        if (topic.status === 'locked') {
            sound.playWrong();
            return;
        }

        sound.playPop();
        navigate(`/belajarceria/${modul}/${topic.id}`);
    };

    const handleOpenStory = (story) => {
        sound.playPop();
        navigate(`/belajarceria/cerita/baca/${story.id}`);
    };

    const themeColor = moduleData ? moduleData.color_theme : '#6366F1';
    const isCeritaModule = modul === 'cerita';

    const completedTopicsCount = topics.filter(t => t.status === 'completed').length;
    const completedStoriesCount = stories.filter(s => s.is_completed).length;
    const totalStarsInModule = topics.reduce((acc, t) => acc + (t.stars_earned || 0), 0);

    return (
        <ParallaxBackground moduleColor={themeColor}>
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-8 flex flex-col">
                {/* Tombol Navigasi Kembali ke Peta Modul */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => { sound.playPop(); navigate('/belajarceria/peta'); }}
                        className="px-4 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-gray-700 shadow-md border border-gray-200/80 transition-all cursor-pointer flex items-center space-x-2 font-bold text-xs sm:text-sm hover:-translate-x-0.5 active:translate-x-0"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Peta Modul</span>
                    </button>

                    {!isCeritaModule && topics.length > 0 && (
                        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-200 shadow-xs text-xs font-black text-amber-900">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                            <span>{totalStarsInModule} Bintang Terkumpul</span>
                        </div>
                    )}
                </div>

                {/* Header Modul Petualangan */}
                {moduleData && (
                    <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border-2 border-amber-200/80 shadow-lg mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                        <div className="flex items-center space-x-4 z-10">
                            <div 
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md"
                                style={{ backgroundColor: moduleData.color_theme || '#E77D56' }}
                            >
                                <AppIcon icon={moduleData.icon || 'flag'} className="w-8 h-8 text-white" emojiSize="text-3xl" />
                            </div>
                            <div>
                                <span className="text-xs font-black uppercase tracking-wider text-gray-500 block font-heading">
                                    {moduleData.name.toUpperCase()}
                                </span>
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#2E2A4A] font-heading mt-0.5">
                                    {isCeritaModule
                                        ? 'Koleksi Cerita Anak Digital'
                                        : `Ayo jelajahi ${topics.length} pos petualangan!`}
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">
                                    {isCeritaModule
                                        ? `${completedStoriesCount} dari ${stories.length} cerita berhasil dibaca.`
                                        : `${completedTopicsCount} dari ${topics.length} pos petualangan berhasil diselesaikan.`}
                                </p>
                            </div>
                        </div>

                        {isCeritaModule ? (
                            stories.length > 0 && (
                                <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 z-10">
                                    <div className="text-right">
                                        <span className="text-[11px] font-bold text-gray-500">Progres Membaca</span>
                                        <p className="text-sm font-black text-[#2E2A4A]">
                                            {Math.round((completedStoriesCount / stories.length) * 100)}% Selesai
                                        </p>
                                    </div>
                                    <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ 
                                                width: `${Math.round((completedStoriesCount / stories.length) * 100)}%`,
                                                backgroundColor: themeColor,
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        ) : topics.length > 0 && (
                            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2 z-10">
                                <div className="text-right">
                                    <span className="text-[11px] font-bold text-gray-500">Progres Modul</span>
                                    <p className="text-sm font-black text-[#2E2A4A]">
                                        {Math.round((completedTopicsCount / topics.length) * 100)}% Selesai
                                    </p>
                                </div>
                                <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                    <div 
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${Math.round((completedTopicsCount / topics.length) * 100)}%`,
                                            backgroundColor: themeColor,
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================================= */}
                {/* 1. KHUSUS MODUL CERITA ANAK DIGITAL (MURNI MEMBACA TANPA KUIS/SOAL) */}
                {/* ========================================================================= */}
                {isCeritaModule ? (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                            <h2 className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading">
                                Rak Buku Cerita Interaktif
                            </h2>
                        </div>

                        {stories.length === 0 && !isLoading ? (
                            <div className="bg-white/90 rounded-3xl p-12 text-center border-2 border-purple-100 shadow-md">
                                <BookOpen className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                                <h3 className="text-lg font-black text-[#2E2A4A] font-heading">Belum Ada Cerita Tersedia</h3>
                                <p className="text-xs text-gray-500 mt-1">Cerita baru akan segera hadir untuk dibaca bersama.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {stories.map((story) => (
                                    <div
                                        key={story.id}
                                        onClick={() => handleOpenStory(story)}
                                        className="bg-white/95 rounded-3xl p-5 sm:p-6 border-2 border-purple-200/90 shadow-md hover:shadow-2xl hover:-translate-y-1.5 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
                                    >
                                        <div className="flex space-x-4 items-start">
                                            {/* Cover Gambar / Thumbnail Buku */}
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-purple-100 to-amber-100 border-2 border-purple-200 flex items-center justify-center shrink-0 shadow-inner overflow-hidden">
                                                {story.cover_image_url ? (
                                                    <img 
                                                        src={story.cover_image_url} 
                                                        alt={story.title} 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <span className="text-4xl">📖</span>
                                                )}
                                            </div>

                                            {/* Info Cerita */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1.5">
                                                    <span className="text-[10px] font-black text-purple-800 bg-purple-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                                        Level {story.level}
                                                    </span>
                                                    {story.is_completed ? (
                                                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                            <span>Sudah Dibaca</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                                                            Membaca Santai
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-base sm:text-lg font-black text-[#2E2A4A] font-heading leading-tight group-hover:text-purple-600 transition-colors line-clamp-2">
                                                    {story.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                    {story.description}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tombol Mulai Membaca */}
                                        <div className="mt-5 pt-3 border-t border-purple-50 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-purple-600">
                                                Dilengkapi kosakata baru ✨
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenStory(story); }}
                                                className={`px-4 py-2 ${story.is_completed ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'} text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5 cursor-pointer group-hover:scale-105 transition-transform`}
                                            >
                                                <span>{story.is_completed ? 'Baca Lagi' : 'Buka Buku'}</span>
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ========================================================================= */
                    /* 2. PETA PETUALANGAN TOPIC/POS (ZIG-ZAG VERTIKAL SOLID MENYAMBUNG) */
                    /* ========================================================================= */
                    <div className="bg-white/85 backdrop-blur-md rounded-3xl p-6 sm:p-12 border-2 border-amber-200/80 shadow-xl relative overflow-hidden">
                        {/* Hiasan Dekorasi Peta Petualangan */}
                        <div className="absolute top-6 left-6 text-amber-300/40 text-5xl pointer-events-none select-none">
                            ☁️
                        </div>
                        <div className="absolute top-1/3 right-8 text-indigo-200/40 text-4xl pointer-events-none select-none">
                            ✨
                        </div>
                        <div className="absolute bottom-12 left-10 text-emerald-300/40 text-5xl pointer-events-none select-none">
                            🌿
                        </div>
                        <div className="absolute bottom-8 right-8 text-amber-300/50 text-5xl pointer-events-none select-none">
                            🏝️
                        </div>

                        {topics.length === 0 && !isLoading && (
                            <div className="text-center py-16">
                                <p className="text-gray-500 font-bold">Belum ada pos petualangan tersedia pada modul ini.</p>
                            </div>
                        )}

                        {/* Jalur Peta Mengular (Vertical Snaking Path) */}
                        <div className="relative max-w-xl mx-auto py-4">
                            {topics.map((topic, idx) => {
                                const isLocked = topic.status === 'locked';
                                const isCompleted = topic.status === 'completed';
                                const isNext = topic.status === 'unlocked' && !isCompleted;

                                // Pola Zig-zag vertikal: genap di kiri (atau tengah-kiri), ganjil di kanan (atau tengah-kanan)
                                const isEven = idx % 2 === 0;
                                const isLast = idx === topics.length - 1;

                                // Warna Tema Jalur Solid & Node
                                const nodeBorder = isCompleted
                                    ? 'border-emerald-400 bg-emerald-50 shadow-emerald-200/80 ring-4 ring-emerald-100'
                                    : isNext
                                    ? 'border-amber-400 bg-amber-50 shadow-amber-300/80 ring-4 ring-amber-200 animate-pulse'
                                    : 'border-slate-200 bg-slate-100 opacity-60';

                                const pathColor = isCompleted
                                    ? '#10B981' // Emerald solid
                                    : '#CBD5E1'; // Slate solid

                                return (
                                    <div key={topic.id} className="relative flex flex-col items-center">
                                        {/* Node Pos Petualangan */}
                                        <div 
                                            className={`w-full flex items-center gap-4 sm:gap-6 my-4 transition-all duration-300 ${
                                                isEven ? 'flex-row' : 'flex-row-reverse text-right'
                                            }`}
                                        >
                                            {/* Lingkaran Pos Utama (Island Node) */}
                                            <div
                                                onClick={() => handleOpenTopic(topic)}
                                                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 sm:border-6 ${nodeBorder} flex flex-col items-center justify-center p-2 shadow-lg transition-all duration-300 shrink-0 select-none z-20 ${
                                                    isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-108 hover:shadow-2xl'
                                                }`}
                                            >
                                                {/* Badge Status Pos di Atas */}
                                                {isCompleted ? (
                                                    <span className="absolute -top-3 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black text-white bg-emerald-600 shadow-md flex items-center space-x-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span>Selesai</span>
                                                    </span>
                                                ) : isNext ? (
                                                    <span className="absolute -top-3 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black text-white bg-amber-500 shadow-md flex items-center space-x-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>Siap Main!</span>
                                                    </span>
                                                ) : (
                                                    <span className="absolute -top-3 px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-500 bg-slate-200 shadow-xs flex items-center space-x-1">
                                                        <Lock className="w-3 h-3" />
                                                        <span>Terkunci</span>
                                                    </span>
                                                )}

                                                {/* Ikon Tengah */}
                                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white shadow-inner flex flex-col items-center justify-center">
                                                    {isLocked ? (
                                                        <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                                                    ) : (
                                                        <AppIcon icon={topic.icon || 'star'} className="w-7 h-7 sm:w-8 sm:h-8" emojiSize="text-2xl sm:text-3xl" />
                                                    )}
                                                </div>

                                                {/* Bintang yang Didapat */}
                                                {!isLocked && (
                                                    <div className="flex items-center space-x-1 mt-1 text-[11px] font-black text-gray-700">
                                                        <Star className={`w-3.5 h-3.5 ${topic.stars_earned > 0 ? 'fill-amber-400 text-amber-500' : 'text-gray-300'}`} />
                                                        <span>{topic.stars_earned || 0} ⭐</span>
                                                    </div>
                                                )}

                                                {/* Tombol Aksi di Bawah Node */}
                                                {!isLocked ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenTopic(topic); }}
                                                        className={`absolute -bottom-3 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-black text-white shadow-md cursor-pointer transition-transform hover:scale-105 flex items-center space-x-1 ${
                                                            isCompleted ? 'bg-teal-600 hover:bg-teal-700' : 'bg-orange-500 hover:bg-orange-600'
                                                        }`}
                                                    >
                                                        <span>{isCompleted ? 'Main Lagi' : 'Mulai'}</span>
                                                        <span className="text-[10px]">{isCompleted ? '🔄' : '▶'}</span>
                                                    </button>
                                                ) : (
                                                    <span className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-slate-500 bg-slate-200">
                                                        Pos {idx + 1}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Deskripsi & Keterangan Pos Topik */}
                                            <div className="flex-1 min-w-0 z-20">
                                                <div className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-0.5 rounded-full mb-1 ${
                                                    isCompleted 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : isNext 
                                                        ? 'bg-amber-100 text-amber-900' 
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <span>Pos Petualangan {idx + 1}</span>
                                                </div>

                                                <h3 
                                                    onClick={() => !isLocked && handleOpenTopic(topic)}
                                                    className={`text-base sm:text-lg font-black font-heading leading-tight transition-colors ${
                                                        isLocked ? 'text-slate-400' : 'text-[#2E2A4A] hover:text-indigo-600 cursor-pointer'
                                                    }`}
                                                >
                                                    {topic.name}
                                                </h3>

                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {topic.description || 'Selesaikan pos ini untuk membuka petualangan berikutnya.'}
                                                </p>

                                                <span className="inline-block text-[11px] font-bold text-indigo-600 mt-1.5 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    🎯 {topic.question_count || 5} Soal Seru
                                                </span>
                                            </div>
                                        </div>

                                        {/* GARIS JALUR PETA SOLID MENYAMBUNG KE POS BERIKUTNYA (SVG SOLID CURVED PATH) */}
                                        {!isLast && (
                                            <div className="w-full flex justify-center -my-3 sm:-my-2 relative z-10 pointer-events-none">
                                                <svg 
                                                    width="220" 
                                                    height="70" 
                                                    viewBox="0 0 220 70" 
                                                    fill="none" 
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-48 sm:w-64 h-16 sm:h-20"
                                                >
                                                    {/* Shadow Jalur */}
                                                    <path 
                                                        d={isEven 
                                                            ? "M 40 5 C 40 45, 180 25, 180 65" 
                                                            : "M 180 5 C 180 45, 40 25, 40 65"} 
                                                        stroke="rgba(0,0,0,0.06)" 
                                                        strokeWidth="12" 
                                                        strokeLinecap="round" 
                                                    />
                                                    {/* Jalur Solid Utama */}
                                                    <path 
                                                        d={isEven 
                                                            ? "M 40 5 C 40 45, 180 25, 180 65" 
                                                            : "M 180 5 C 180 45, 40 25, 40 65"} 
                                                        stroke={pathColor} 
                                                        strokeWidth="8" 
                                                        strokeLinecap="round" 
                                                    />
                                                    {/* Garis Aksen Tengah Jalur */}
                                                    <path 
                                                        d={isEven 
                                                            ? "M 40 5 C 40 45, 180 25, 180 65" 
                                                            : "M 180 5 C 180 45, 40 25, 40 65"} 
                                                        stroke="white" 
                                                        strokeWidth="2" 
                                                        strokeLinecap="round" 
                                                        strokeOpacity="0.7"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </ParallaxBackground>
    );
}
