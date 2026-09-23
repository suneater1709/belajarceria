import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { sound } from '../../services/audio';
import { api, setAuthSession, isAuthenticated } from '../../services/api';
import AuthCarousel from '../../components/common/AuthCarousel';

export default function ParentLoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isAuthenticated()) {
            navigate('/belajarceria');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        sound.playPop();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const res = await api.login({ email, password });
            if (res.data && res.data.token) {
                setAuthSession(res.data.token, res.data.user);
                sound.playCorrect();
                navigate('/belajarceria');
            }
        } catch (err) {
            sound.playWrong();
            setErrorMsg(err.message || 'Login gagal, periksa email dan password Anda.');
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
                    <div className="mb-6 sm:mb-8 text-left">
                        <Link 
                            to="/belajarceria" 
                            onClick={() => sound.playPop()}
                            className="inline-flex items-center gap-2.5 mb-4 group"
                        >
                            <img 
                                src="/belajarceria.png" 
                                alt="Logo BelajarCeria" 
                                className="w-12 h-12 object-contain rounded-2xl shadow-md shadow-amber-200/80 bg-white p-1 group-hover:scale-105 transition-transform" 
                            />
                            <div>
                                <span className="text-lg font-black font-heading tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                                    BelajarCeria
                                </span>
                                <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-widest -mt-0.5">
                                    Area Orang Tua
                                </span>
                            </div>
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2E2A4A] tracking-tight font-heading flex items-center gap-2">
                            Welcome back <span className="inline-block animate-bounce-short">👋</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">
                            Please enter your details.
                        </p>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="mb-5 p-3.5 bg-red-50/90 border border-red-200/80 rounded-2xl text-xs font-semibold text-red-600 flex items-center space-x-2 animate-fade-in">
                            <span>⚠️</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Social / Quick Action */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => {
                                sound.playPop();
                                setEmail('orangtua@belajarceria.id');
                                setPassword('password123');
                            }}
                            className="w-full py-3 px-4 rounded-full border border-gray-200 hover:border-gray-400 bg-white hover:bg-gray-50 text-[#2E2A4A] text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer active:scale-98"
                        >
                            <KeyRound className="w-4 h-4 text-amber-500" />
                            <span>Isi Otomatis Kredensial Demo</span>
                        </button>

                        <div className="flex items-center my-5">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="px-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">or</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>
                    </div>

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
                                    className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="Email"
                                />
                                <Mail className="w-4 h-4 text-gray-400 absolute right-4 top-4 pointer-events-none" />
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
                                    className="w-full px-4 py-3.5 pr-11 rounded-2xl border border-gray-200 hover:border-gray-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 focus:outline-none text-sm text-gray-800 placeholder-gray-400 font-medium transition-all"
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between pt-1 text-xs">
                            <label className="flex items-center gap-2 text-gray-500 font-medium cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-gray-300 cursor-pointer"
                                />
                                <span>Remember for 30 days</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => {
                                    sound.playPop();
                                    alert('Silakan hubungi administrator atau gunakan PIN orang tua untuk mereset akun.');
                                }}
                                className="font-semibold text-gray-500 hover:text-amber-600 transition-colors"
                            >
                                Forgot password?
                            </button>
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
                                    <span>Memeriksa Akun...</span>
                                </>
                            ) : (
                                <span>Log In</span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs sm:text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link 
                                to="/orangtua/daftar" 
                                onClick={() => sound.playPop()}
                                className="font-bold text-[#2E2A4A] hover:text-amber-600 transition-colors"
                            >
                                Sign Up
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
