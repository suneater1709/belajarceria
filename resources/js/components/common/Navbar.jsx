import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Music2, Star, Shield, Users } from 'lucide-react';
import { sound } from '../../services/audio';
import { getActiveChild } from '../../services/api';
import ParentalGateModal from './ParentalGateModal';

export default function Navbar() {
    const navigate = useNavigate();
    const [musicOn, setMusicOn] = useState(sound.musicEnabled);
    const [isGateOpen, setIsGateOpen] = useState(false);
    const activeChild = getActiveChild();

    const toggleMusic = () => {
        const next = !musicOn;
        setMusicOn(next);
        sound.setMusicEnabled(next);
        sound.playPop();
    };

    const handleOpenParentArea = () => {
        sound.playPop();
        setIsGateOpen(true);
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full px-4 py-3 glass-card border-b border-orange-100/60 shadow-xs">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    {/* Brand Logo & Maskot Ceri */}
                    <Link 
                        to="/belajarceria" 
                        onClick={() => sound.playPop()}
                        className="flex items-center space-x-2.5 group"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-xl shadow-md shadow-orange-200 group-hover:scale-105 transition-transform">
                            🦉
                        </div>
                        <div>
                            <span className="text-xl font-black font-heading tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                                BelajarCeria
                            </span>
                            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest -mt-1">
                                Petualangan Belajar
                            </span>
                        </div>
                    </Link>

                    {/* Tengah: Anak Aktif & Bintang */}
                    {activeChild && (
                        <div className="hidden md:flex items-center space-x-2 bg-amber-100/70 border border-amber-300/60 px-3.5 py-1.5 rounded-full shadow-xs">
                            <span className="text-lg">
                                {activeChild.avatar === 'cat' ? '🐱' : '🦉'}
                            </span>
                            <span className="text-sm font-bold text-gray-800 font-heading">
                                {activeChild.name}
                            </span>
                            <div className="flex items-center space-x-1 pl-1.5 border-l border-amber-300/60 text-amber-700 font-extrabold text-sm">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                                <span>{activeChild.total_stars ?? 0}</span>
                            </div>
                        </div>
                    )}

                    {/* Kanan: Kontrol Musik & Tombol Orang Tua */}
                    <div className="flex items-center space-x-2">
                        {/* Ganti Profil Anak */}
                        <Link
                            to="/belajarceria"
                            onClick={() => sound.playPop()}
                            className="p-2.5 rounded-2xl bg-white hover:bg-gray-100 text-gray-600 border border-gray-200/80 shadow-xs transition-colors flex items-center space-x-1 text-xs font-bold"
                            title="Ganti Profil Anak"
                        >
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span className="hidden sm:inline">Pilih Profil</span>
                        </Link>

                        {/* Toggle Musik Latar (BGM) */}
                        <button
                            onClick={toggleMusic}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                                musicOn 
                                    ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100' 
                                    : 'bg-gray-100 border-gray-300 text-gray-400'
                            }`}
                            title={musicOn ? 'Matikan Musik' : 'Nyalakan Musik'}
                        >
                            {musicOn ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4 opacity-40" />}
                        </button>

                        {/* Parental Gate Button */}
                        <button
                            onClick={handleOpenParentArea}
                            className="px-3 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-200 transition-all flex items-center space-x-1 cursor-pointer"
                            title="Masuk Area Orang Tua"
                        >
                            <Shield className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Orang Tua</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Modal Parental Gate */}
            <ParentalGateModal
                isOpen={isGateOpen}
                onClose={() => setIsGateOpen(false)}
                onSuccess={() => {
                    setIsGateOpen(false);
                    navigate('/orangtua/dashboard');
                }}
            />
        </>
    );
}
