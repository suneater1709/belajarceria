import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Loader2, ChevronLeft, ChevronRight, CheckCircle2, Bookmark, Star } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../../components/common/Navbar';
import ParallaxBackground from '../../components/common/ParallaxBackground';
import { sound } from '../../services/audio';
import { api, getActiveChild } from '../../services/api';

export default function StoryDetailPage() {
    const { storyId } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [turnDirection, setTurnDirection] = useState('next'); // 'next' | 'prev'
    const activeChild = getActiveChild();

    useEffect(() => {
        const loadStory = async () => {
            try {
                const res = await api.getStoryDetail(storyId);
                setStory(res.data);
            } catch (err) {
                console.error(err);
                alert('Gagal memuat cerita.');
                navigate('/belajarceria/cerita');
            } finally {
                setIsLoading(false);
            }
        };

        sound.setContext('calm');
        loadStory();

        return () => {
            sound.setContext('default');
        };
    }, [storyId, navigate]);

    // Keyboard arrow keys for realistic page turning
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                handleNextPage();
            } else if (e.key === 'ArrowLeft') {
                handlePrevPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    if (isLoading || !story) {
        return (
            <ParallaxBackground moduleColor="#8B5CF6">
                <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                </div>
            </ParallaxBackground>
        );
    }

    // Memecah isi cerita menjadi lembaran buku per lembar
    const rawContent = story.content || story.description || '';
    const rawParagraphs = rawContent
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    // Buat lembaran halaman cerita (maksimal 2 paragraf per halaman agar nyaman dan pas dibaca)
    const contentPages = [];
    if (rawParagraphs.length === 0) {
        contentPages.push([story.description || 'Cerita seru untuk anak-anak cerdas!']);
    } else {
        for (let i = 0; i < rawParagraphs.length; i += 2) {
            contentPages.push(rawParagraphs.slice(i, i + 2));
        }
    }

    // Total Halaman: 1 Cover Depan + N Halaman Cerita + 1 Halaman Kosakata & Penutup
    const totalPages = 1 + contentPages.length + 1;
    const isCoverPage = currentPage === 0;
    const isLastPage = currentPage === totalPages - 1;
    const isStoryPage = currentPage > 0 && currentPage < totalPages - 1;

    const recordCompletion = async () => {
        if (activeChild && story) {
            try {
                await api.completeStory(story.id, activeChild.id);
            } catch (err) {
                console.error('Error saving story completion:', err);
            }
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            sound.playPop();
            setTurnDirection('next');
            setCurrentPage(prev => {
                const next = prev + 1;
                if (next === totalPages - 1) {
                    recordCompletion();
                    try {
                        confetti({
                            particleCount: 60,
                            spread: 80,
                            origin: { y: 0.6 }
                        });
                        sound.playSparkle();
                    } catch (e) {
                        // ignore
                    }
                }
                return next;
            });
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            sound.playPop();
            setTurnDirection('prev');
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleFinishReading = async () => {
        sound.playFanfare();
        await recordCompletion();
        navigate('/belajarceria/cerita');
    };

    return (
        <ParallaxBackground moduleColor="#8B5CF6">
            <Navbar />

            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col justify-between items-center">
                {/* Top Bar: Navigasi Kembali & Indikator Halaman */}
                <div className="w-full flex items-center justify-between gap-3 mb-4 max-w-xl">
                    <button
                        onClick={() => { sound.playPop(); navigate('/belajarceria/cerita'); }}
                        className="px-3.5 py-2 rounded-2xl bg-white/95 hover:bg-white text-gray-700 shadow-md border border-gray-200/80 transition-all cursor-pointer flex items-center space-x-1.5 font-bold text-xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Daftar Cerita</span>
                    </button>

                    {/* Indikator Lembar Buku */}
                    <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-purple-200 shadow-sm text-xs font-black text-purple-900">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        <span>
                            {isCoverPage ? 'Sampul Depan' : isLastPage ? 'Penutup & Kosakata' : `Lembar ${currentPage} dari ${totalPages - 2}`}
                        </span>
                    </div>
                </div>

                {/* Wadah Buku Vertikal (Bentuk Buku Fisik Per Lembar) */}
                <div className="w-full max-w-xl relative my-auto">
                    {/* Efek Bayangan Hardcover 3D Buku Fisik */}
                    <div className="absolute inset-0 rounded-[32px] bg-purple-950/15 transform translate-y-4 translate-x-1 blur-xl -z-10" />
                    <div className="absolute inset-0 rounded-[32px] bg-amber-950/20 transform translate-y-2 blur-md -z-10" />

                    {/* Lembar Buku Fisik */}
                    <div 
                        key={currentPage}
                        className={`w-full bg-[#FFFDF8] rounded-[32px] border-4 ${
                            isCoverPage 
                                ? 'border-amber-300/90 shadow-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FFFBF2] to-[#FFF8E7]' 
                                : 'border-amber-200/80 shadow-xl'
                        } p-6 sm:p-9 min-h-[540px] sm:min-h-[580px] flex flex-col justify-between relative overflow-hidden transition-all ${
                            turnDirection === 'next' ? 'animate-page-next' : 'animate-page-prev'
                        }`}
                        style={{
                            backgroundImage: 'radial-gradient(#FDE68A 0.75px, transparent 0.75px)',
                            backgroundSize: '24px 24px'
                        }}
                    >
                        {/* Jilidan Buku Fisik (Spine Binding di sisi Kiri) */}
                        <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r from-amber-300/60 via-amber-200/30 to-transparent border-r border-amber-300/30 pointer-events-none" />
                        <div className="absolute top-0 bottom-0 left-2 w-0.5 border-r border-dashed border-amber-400/40 pointer-events-none" />

                        {/* Bookmark Ribbon Hiasan */}
                        <div className="absolute top-0 right-8 w-7 h-12 bg-gradient-to-b from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md rounded-b-md z-10">
                            <Bookmark className="w-3.5 h-3.5 fill-white" />
                        </div>

                        {/* ======================================================== */}
                        {/* 1. COVER DEPAN BUKU (FRONT BOOK COVER) */}
                        {/* ======================================================== */}
                        {isCoverPage && (
                            <div className="flex flex-col items-center text-center justify-between flex-1 py-2 pl-2">
                                {/* Header Cover */}
                                <div className="space-y-2 max-w-md pt-2">
                                    <span className="inline-flex items-center gap-1 px-3.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Buku Cerita • Level {story.level}</span>
                                    </span>
                                    <h1 className="text-2xl sm:text-3xl font-black text-[#2E2A4A] font-heading leading-tight pt-1">
                                        {story.title}
                                    </h1>
                                </div>

                                {/* Frame Ilustrasi Cover Buku yang Proporsional */}
                                <div className="my-4 w-full max-w-[280px] sm:max-w-[320px]">
                                    {story.cover_image_url ? (
                                        <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-amber-50 aspect-4/3 flex items-center justify-center transform hover:scale-102 transition-transform">
                                            <img 
                                                src={story.cover_image_url} 
                                                alt={story.title} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-3xl bg-gradient-to-br from-purple-100 via-amber-100 to-rose-100 border-4 border-white shadow-lg flex items-center justify-center text-6xl shadow-inner">
                                            📚
                                        </div>
                                    )}
                                </div>

                                {/* Ringkasan Cerita */}
                                <div className="space-y-4 max-w-md">
                                    <p className="text-xs sm:text-sm text-gray-600 italic font-medium leading-relaxed px-3">
                                        "{story.description}"
                                    </p>

                                    {/* Tombol Buka & Mulai Membaca */}
                                    <button
                                        onClick={handleNextPage}
                                        className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_5px_0_#4C1D95] hover:shadow-[0_6px_0_#4C1D95] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2 cursor-pointer"
                                    >
                                        <span>Buka & Mulai Membaca</span>
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* 2. LEMBARAN ISI CERITA (STORY PAGES) */}
                        {/* ======================================================== */}
                        {isStoryPage && (
                            <div className="flex flex-col justify-between flex-1 py-1 pl-2">
                                <div className="space-y-5">
                                    {/* Header Lembar */}
                                    <div className="flex items-center justify-between pb-3 border-b-2 border-amber-100/80">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-base">📖</span>
                                            <h3 className="text-xs sm:text-sm font-black text-purple-900 font-heading truncate max-w-[200px] sm:max-w-[280px]">
                                                {story.title}
                                            </h3>
                                        </div>
                                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full">
                                            Lembar {currentPage}
                                        </span>
                                    </div>

                                    {/* Isi Teks Lembar Cerita dengan Tipografi Ramah Anak */}
                                    <div className="space-y-4 text-gray-800 text-base sm:text-lg font-heading leading-relaxed font-medium pt-2">
                                        {contentPages[currentPage - 1]?.map((paragraph, pIdx) => (
                                            <p 
                                                key={pIdx} 
                                                className="first-letter:text-3xl sm:first-letter:text-4xl first-letter:font-black first-letter:text-purple-600 first-letter:mr-1 leading-loose text-justify sm:text-left"
                                            >
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {/* Penomoran Lembar di Bawah */}
                                <div className="text-center pt-4 text-xs font-bold text-amber-700/80">
                                    ~ Lembar {currentPage} dari {totalPages - 2} ~
                                </div>
                            </div>
                        )}

                        {/* ======================================================== */}
                        {/* 3. LEMBAR PENUTUP & KOSAKATA BARU */}
                        {/* ======================================================== */}
                        {isLastPage && (
                            <div className="flex flex-col justify-between flex-1 py-2 pl-2 space-y-4">
                                <div className="text-center space-y-2 pt-1">
                                    <div className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase shadow-xs">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        <span>Hore! Selesai Membaca! 🎉</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading">
                                        Kosakata Baru Hari Ini
                                    </h2>
                                    <p className="text-xs text-gray-600 max-w-sm mx-auto">
                                        Hebat! Sekarang kamu telah mengenal kata-kata baru yang memperkaya bahasamu.
                                    </p>
                                </div>

                                {story.vocabularies && story.vocabularies.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                                        {story.vocabularies.map((vocab) => (
                                            <div
                                                key={vocab.id}
                                                className="p-3 sm:p-3.5 rounded-2xl bg-purple-50/90 border-2 border-purple-200/80 shadow-xs flex items-center space-x-3"
                                            >
                                                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-200/70 text-purple-800 font-black text-sm flex items-center justify-center shrink-0">
                                                    ✨
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm sm:text-base font-black text-purple-950 font-heading block truncate">
                                                        {vocab.word}
                                                    </span>
                                                    <span className="text-xs text-purple-800 font-medium mt-0.5 block leading-tight">
                                                        {vocab.meaning}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-purple-50/50 rounded-2xl border border-purple-100">
                                        <p className="text-sm font-medium text-purple-900">Kamu telah membaca seluruh cerita dengan sangat baik! 📖✨</p>
                                    </div>
                                )}

                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={handleFinishReading}
                                        className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-[0_5px_0_#065F46] hover:shadow-[0_6px_0_#065F46] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2 cursor-pointer"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                        <span>Selesai & Kembali ke Rak Cerita</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Bar: Kontrol Navigasi Membalik Halaman & Dot Stepper */}
                <div className="w-full max-w-xl mt-5 flex items-center justify-between gap-2">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="px-4 sm:px-5 py-2.5 rounded-2xl bg-white/95 hover:bg-white text-gray-700 font-black text-xs sm:text-sm border-2 border-purple-200 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center space-x-1"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Sebelumnya</span>
                    </button>

                    {/* Dot Progress Stepper */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto px-2">
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    sound.playPop();
                                    setTurnDirection(idx > currentPage ? 'next' : 'prev');
                                    setCurrentPage(idx);
                                }}
                                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                                    currentPage === idx 
                                        ? 'w-7 bg-purple-600' 
                                        : 'w-2.5 bg-purple-200 hover:bg-purple-300'
                                }`}
                                title={idx === 0 ? 'Sampul Depan' : idx === totalPages - 1 ? 'Penutup' : `Halaman ${idx}`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={currentPage === totalPages - 1 ? handleFinishReading : handleNextPage}
                        className="px-4 sm:px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center space-x-1"
                    >
                        <span>{currentPage === totalPages - 1 ? 'Selesai' : currentPage === 0 ? 'Buka Buku' : 'Berikutnya'}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </main>
        </ParallaxBackground>
    );
}
