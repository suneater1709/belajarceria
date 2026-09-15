import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CheckCircle, ArrowRight, BookOpen } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import ParallaxBackground from '../../components/common/ParallaxBackground';
import AppIcon from '../../components/common/AppIcon';
import { sound } from '../../services/audio';
import { api, getActiveChild } from '../../services/api';

export default function ModuleMapPage() {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [child, setChild] = useState(getActiveChild());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const activeChild = getActiveChild();
        if (!activeChild) {
            navigate('/belajarceria');
            return;
        }
        setChild(activeChild);

        const loadData = async () => {
            try {
                const res = await api.getChildHome(activeChild.id);
                if (res.data && res.data.modules) {
                    setModules(res.data.modules);
                    if (res.data.child) {
                        setChild(res.data.child);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [navigate]);

    const handleSelectModule = (mod) => {
        sound.playPop();
        navigate(`/belajarceria/${mod.code}`);
    };

    return (
        <ParallaxBackground moduleColor="#6366F1">
            <Navbar />

            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 flex flex-col">
                {/* Banner Sapaan Petualangan */}
                <div className="text-center mb-8">
                    <span className="inline-block px-4 py-1.5 bg-amber-100/90 text-amber-800 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 shadow-xs">
                        🗺️ Peta Petualangan 7 Modul Ceria
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-black text-[#2E2A4A] font-heading">
                        Ayo Berpetualang, {child ? child.name : 'Sahabat'}!
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 max-w-lg mx-auto font-medium">
                        Pilih modul pembelajaran yang ingin kamu jelajahi hari ini. Kumpulkan bintang dan lencana keren!
                    </p>
                </div>

                {/* Grid 7 Modul (PRD.md § 6 - Tepat 7 Modul) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {modules.map((mod) => {
                        const isCerita = mod.code === 'cerita' || mod.is_story_module;
                        const isCompleted = mod.progress_percent === 100;

                        return (
                            <div
                                key={mod.id}
                                onClick={() => handleSelectModule(mod)}
                                className="relative bg-white/95 rounded-3xl p-6 border-3 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer flex flex-col justify-between group overflow-hidden"
                                style={{ borderColor: `${mod.color_theme}40` }}
                            >
                                {/* Aksesori Latar Kartu */}
                                <div 
                                    className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-15 transition-transform group-hover:scale-150"
                                    style={{ backgroundColor: mod.color_theme }}
                                />

                                <div>
                                    {/* Icon & Badge Selesai */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div 
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                                            style={{ 
                                                backgroundColor: `${mod.color_theme}20`,
                                                color: mod.color_theme
                                            }}
                                        >
                                            <AppIcon icon={mod.icon} className="w-8 h-8" emojiSize="text-3xl" />
                                        </div>

                                        {isCompleted ? (
                                            <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                <span>Lengkap</span>
                                            </div>
                                        ) : isCerita ? (
                                            <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                <span>Buku Cerita</span>
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Judul Modul */}
                                    <h2 className="text-xl font-black text-[#2E2A4A] font-heading group-hover:text-indigo-600 transition-colors">
                                        {mod.name}
                                    </h2>
                                    {isCerita ? (
                                        <p className="text-xs text-purple-600 mt-1 font-bold">
                                            {mod.completed_topics ?? 0} dari {mod.total_stories ?? mod.total_topics ?? 0} cerita dibaca
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-1 font-semibold">
                                            {mod.completed_topics} dari {mod.total_topics} topik selesai
                                        </p>
                                    )}
                                </div>

                                {/* Progress Bar & Tombol Masuk */}
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                                        <span className="text-gray-500">Progres</span>
                                        <span style={{ color: mod.color_theme }}>{mod.progress_percent}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ 
                                                width: `${mod.progress_percent}%`,
                                                backgroundColor: mod.color_theme 
                                            }}
                                        />
                                    </div>

                                    <div className="mt-4 flex items-center justify-between text-xs font-extrabold" style={{ color: mod.color_theme }}>
                                        <span>{isCerita ? 'Buka Rak Cerita' : 'Buka Modul'}</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </ParallaxBackground>
    );
}
