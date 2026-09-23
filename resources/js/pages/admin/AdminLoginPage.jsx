import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { sound } from '../../services/audio';
import { api, setAuthToken } from '../../services/api';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        sound.playPop();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const res = await api.login({ email, password });
            if (res.data && res.data.token) {
                if (res.data.user.role !== 'admin') {
                    throw new Error('Akun Anda bukan akun administrator.');
                }
                setAuthToken(res.data.token);
                sound.playCorrect();
                navigate('/admin/dashboard');
            }
        } catch (err) {
            sound.playWrong();
            setErrorMsg(err.message || 'Login admin gagal. Periksa email dan password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full animated-bg-admin flex items-center justify-center p-3 sm:p-6 lg:p-10 transition-colors duration-1000">
            {/* Main Card Container (Bright & Soft Theme) */}
            <div className="w-full max-w-5xl bg-white/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-indigo-100/90 border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-2 p-3 sm:p-5 lg:p-6 gap-6 sm:gap-8">
                
                {/* Left Side: Form Section */}
                <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8 text-slate-800">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8 text-left">
                        <div className="flex items-center gap-3 mb-4">
                            <img 
                                src="/belajarceria.png" 
                                alt="Logo BelajarCeria" 
                                className="w-12 h-12 object-contain rounded-2xl shadow-md shadow-indigo-100 bg-white p-1" 
                            />
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Authorized Personnel Only</span>
                            </div>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#2E2A4A] tracking-tight font-heading flex items-center gap-2">
                            Selamat Datang <span className="inline-block animate-bounce-short">👋</span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-2 font-medium">
                            BelajarCeria CMS & Manajemen Pembelajaran
                        </p>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center space-x-2 animate-fade-in">
                            <span>⚠️</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email Input */}
                        <div>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none text-sm text-slate-900 placeholder-slate-400 font-medium transition-all"
                                    placeholder="Email Admin"
                                />
                                <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none text-sm text-slate-900 placeholder-slate-400 font-medium transition-all"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 focus:outline-none transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Security Info */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 bg-white cursor-pointer"
                                />
                                <span>Ingat saya selama 30 hari</span>
                            </label>
                            <span className="text-slate-400 text-[11px] font-semibold">
                                Terenkripsi & Aman
                            </span>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-98 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 min-h-[48px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Memeriksa Akses Admin...</span>
                                </>
                            ) : (
                                <span>Masuk ke Panel Admin</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center flex items-center justify-between text-xs text-slate-400">
                        <Link 
                            to="/belajarceria" 
                            onClick={() => sound.playPop()}
                            className="hover:text-indigo-600 font-bold flex items-center space-x-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                        <span>BelajarCeria v1.0</span>
                    </div>
                </div>

                {/* Right Side: Hero Illustration Card (Light & Soft) */}
                <div className="hidden md:block relative w-full h-full min-h-[480px] lg:min-h-[560px] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-inner bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50 border border-slate-200/60 p-8 flex flex-col justify-between">
                    <div className="space-y-3">
                        <img 
                            src="/belajarceria.png" 
                            alt="Logo BelajarCeria" 
                            className="w-14 h-14 object-contain rounded-2xl bg-white shadow-md shadow-indigo-100 p-1.5" 
                        />
                        <h2 className="text-2xl font-black text-[#2E2A4A] font-heading">
                            Pusat Kontrol Pembelajaran Digital Anak
                        </h2>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Kelola 7 modul interaktif, bank soal dengan AI generator, cerita digital, gamifikasi lencana, dan pantau aktivitas belajar anak secara terpusat.
                        </p>
                    </div>

                    <div className="space-y-3 my-auto py-6">
                        <div className="p-3.5 rounded-2xl bg-white/90 border border-indigo-100 shadow-xs flex items-center space-x-3">
                            <span className="text-xl">📚</span>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">7 Modul Kurikulum</h4>
                                <p className="text-[11px] text-slate-500">Cerita, Bahasa, Matematika, Sains, dll</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-100 shadow-xs flex items-center space-x-3">
                            <span className="text-xl">✨</span>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">AI Soal & Cerita Interaktif</h4>
                                <p className="text-[11px] text-slate-500">Generate materi edukasi instan untuk anak</p>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/90 border border-purple-100 shadow-xs flex items-center space-x-3">
                            <span className="text-xl">🏆</span>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800">Gamifikasi Lencana & Bintang</h4>
                                <p className="text-[11px] text-slate-500">Motivasi belajar ceria tanpa rasa bosan</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-[11px] text-slate-400 text-center">
                        © 2026 BelajarCeria • Panel Administrasi Terpusat
                    </div>
                </div>

            </div>
        </div>
    );
}
