import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { sound } from '../../services/audio';
import { api, setAuthSession, isAuthenticated } from '../../services/api';
import AuthCarousel from '../../components/common/AuthCarousel';

export default function ParentRegisterPage() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [pin, setPin] = useState('1234');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/belajarceria');
        }
    }, [navigate]);

    const handleRegister = async (e) => {
        e.preventDefault();
        sound.playPop();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const res = await api.register({
                name,
                email,
                password,
                phone,
                parental_pin: pin,
            });
            if (res.data && res.data.token) {
                setAuthSession(res.data.token, res.data.user);
                sound.playCorrect();
                navigate('/belajarceria');
            }
        } catch (err) {
            sound.playWrong();
            setErrorMsg(err.message || 'Pendaftaran gagal. Periksa input data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full animated-bg-dynamic flex items-center justify-center p-3 sm:p-6 lg:p-10 transition-colors duration-1000">
            {/* Main Card Container */}
            <div className="w-full max-w-5xl bg-white/95 backdrop-blur-xl rounded-[32px] sm:rounded-[40px] shadow-2xl shadow-amber-900/10 border border-white/80 overflow-hidden grid grid-cols-1 md:grid-cols-2 p-3 sm:p-5 lg:p-6 gap-6 sm:gap-8">
                
                {/* Left Side: Form Section */}
                <div className="flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
                    {/* Header */}
                    <div className="mb-5 sm:mb-6 text-left">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2E2A4A] tracking-tight font-heading flex items-center gap-2">
                            Create account <span className="inline-block animate-bounce-short">✨</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">
                            Daftarkan akun orang tua untuk mengelola belajar si kecil.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50/90 border border-red-200/80 rounded-2xl text-xs font-semibold text-red-600 flex items-center space-x-2 animate-fade-in">
                            <span>⚠️</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-3.5">
                        {/* Nama */}
                        <div>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="Nama Lengkap Orang Tua (Ayah/Bunda)"
                                />
                                <User className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="Email"
                                />
                                <Mail className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                            </div>
                        </div>

                        {/* No HP */}
                        <div>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="No. WhatsApp / HP (Opsional)"
                                />
                                <Phone className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 pr-11 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="Password (Minimal 6 karakter)"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* PIN */}
                        <div>
                            <div className="flex items-center justify-between mb-1 px-1">
                                <label className="text-[11px] font-bold text-gray-500 uppercase">PIN Pengaman Orang Tua (4 Digit)</label>
                                <span className="text-[10px] text-gray-400">Default: 1234</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    maxLength={4}
                                    required
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-bold tracking-widest transition-all"
                                    placeholder="1234"
                                />
                                <KeyRound className="w-4 h-4 text-gray-400 absolute right-4 top-3.5 pointer-events-none" />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-2 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-98 text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 min-h-[48px]"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Mendaftarkan Akun...</span>
                                </>
                            ) : (
                                <span>Sign Up & Masuk Portal</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs sm:text-sm text-gray-500">
                            Already have an account?{' '}
                            <Link 
                                to="/orangtua/login" 
                                onClick={() => sound.playPop()}
                                className="font-bold text-[#2E2A4A] hover:text-amber-600 transition-colors"
                            >
                                Log In
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right Side: Hero Auto-sliding Carousel Card */}
                <AuthCarousel autoPlayInterval={4500} />

            </div>
        </div>
    );
}
