import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Shield, Plus, Sparkles, UserPlus, LogIn, Loader2, X, LogOut } from 'lucide-react';
import ParallaxBackground from '../../components/common/ParallaxBackground';
import ParentalGateModal from '../../components/common/ParentalGateModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { sound } from '../../services/audio';
import { setActiveChild, api, isAuthenticated, removeAuthToken } from '../../services/api';

const AVATAR_OPTIONS = [
    { id: 'owl', emoji: '🦉', label: 'Burung Hantu' },
    { id: 'cat', emoji: '🐱', label: 'Kucing Ceria' },
    { id: 'rabbit', emoji: '🐰', label: 'Kelinci Lincah' },
    { id: 'lion', emoji: '🦁', label: 'Singa Cilik' },
    { id: 'bear', emoji: '🐻', label: 'Beruang Ramah' },
];

export default function ProfileSelectPage() {
    const navigate = useNavigate();
    const [childrenList, setChildrenList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGateOpen, setIsGateOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    
    // Modal Tambah Profil Anak (Poin 5: Usia 3-6 Tahun)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [childName, setChildName] = useState('');
    const [childAge, setChildAge] = useState('3-4'); // Poin 5: Default rentang 3-6 thn
    const [childAvatar, setChildAvatar] = useState('owl');
    const [isSavingChild, setIsSavingChild] = useState(false);
    const [formError, setFormError] = useState('');

    const loadProfiles = async () => {
        setIsLoading(true);
        // Poin 1: Wajib terautentikasi akun orang tua
        if (!isAuthenticated()) {
            navigate('/orangtua/login', { replace: true });
            return;
        }

        try {
            const res = await api.getParentChildren();
            setChildrenList(res.data || []);
        } catch (err) {
            console.error('Error fetching parent children:', err);
            if (err.status === 401) {
                removeAuthToken();
                navigate('/orangtua/login', { replace: true });
            }
            setChildrenList([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const handleSelectChild = (child) => {
        sound.playPop();
        setActiveChild(child);
        navigate('/belajarceria/peta');
    };

    const handleLogoutParent = async () => {
        sound.playPop();
        try {
            await api.logout();
        } catch (e) {
            // Abaikan jika sudah tidak valid
        }
        removeAuthToken();
        setIsLogoutModalOpen(false);
        navigate('/orangtua/login', { replace: true });
    };

    const handleSaveChild = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!childName.trim()) {
            setFormError('Nama anak wajib diisi.');
            return;
        }

        setIsSavingChild(true);
        sound.playPop();

        try {
            const res = await api.createChild({
                name: childName.trim(),
                age_level: childAge,
                avatar: childAvatar,
            });

            sound.playSparkle();
            setIsAddModalOpen(false);
            setChildName('');
            
            // Reload list dan otomatis pilih profil baru
            await loadProfiles();
            if (res.data) {
                setActiveChild(res.data);
                navigate('/belajarceria/peta');
            }
        } catch (err) {
            setFormError(err.message || 'Gagal menambahkan profil anak.');
        } finally {
            setIsSavingChild(false);
        }
    };

    const renderAvatarEmoji = (avatarKey) => {
        const found = AVATAR_OPTIONS.find(a => a.id === avatarKey);
        return found ? found.emoji : '🦉';
    };

    return (
        <ParallaxBackground moduleColor="#8B5CF6">
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full">
                {/* Judul & Maskot Sambutan */}
                <div className="text-center mb-6 sm:mb-8 flex flex-col items-center">
                    <img 
                        src="/belajarceria.png" 
                        alt="Logo BelajarCeria" 
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-3xl bg-white/80 p-2 shadow-xl shadow-orange-200/80 mb-3 animate-bounce-short border-2 border-amber-200/60" 
                    />
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-[#2E2A4A] font-heading tracking-tight">
                        Halo Sahabat Ceria!
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1 font-medium max-w-md mx-auto">
                        Siapa yang mau berpetualang dan belajar hari ini?
                    </p>
                </div>

                {/* State Loading */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <p className="text-gray-500 font-bold text-sm">Memuat profil anak Anda...</p>
                    </div>
                ) : childrenList.length === 0 ? (
                    /* State Kosong Jika Orang Tua Belum Punya Profil Anak (Poin 1) */
                    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 border-3 border-amber-200 shadow-2xl max-w-lg w-full text-center">
                        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl animate-pulse">
                            🐣
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-[#2E2A4A] font-heading mb-2">
                            Belum Ada Profil Anak
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                            Ayah/Bunda belum menambahkan profil anak di akun ini. Yuk buat profil pertama si kecil untuk memulai petualangan seru!
                        </p>

                        <button
                            onClick={() => { sound.playPop(); setIsAddModalOpen(true); }}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-200 hover:scale-102 transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[48px]"
                        >
                            <Plus className="w-6 h-6" />
                            <span>Tambah Profil Anak Sekarang</span>
                        </button>
                    </div>
                ) : (
                    /* Daftar Kartu Profil Anak Milik Orang Tua (Responsif Mobile Poin 7) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-4xl">
                        {childrenList.map((child) => (
                            <div
                                key={child.id}
                                onClick={() => handleSelectChild(child)}
                                className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-6 border-3 border-amber-200/80 hover:border-amber-400 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all cursor-pointer flex flex-col items-center text-center group min-h-[220px] justify-between"
                            >
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-amber-100 flex items-center justify-center text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform shadow-inner">
                                        {renderAvatarEmoji(child.avatar)}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading">
                                        {child.name}
                                    </h2>
                                    <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full mt-1">
                                        Usia {child.age_level} Tahun
                                    </span>
                                </div>

                                <div className="mt-4 flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full text-amber-700 font-extrabold text-xs sm:text-sm">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                                    <span>{child.total_stars ?? 0} Bintang</span>
                                </div>
                            </div>
                        ))}

                        {/* Kartu Tambah Anak Baru */}
                        <div
                            onClick={() => { sound.playPop(); setIsAddModalOpen(true); }}
                            className="bg-white/60 hover:bg-white/95 border-3 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[220px]"
                        >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2.5 group-hover:scale-110 transition-transform">
                                <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-gray-700 font-heading">
                                Tambah Profil Anak
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Daftarkan si kecil lainnya
                            </p>
                        </div>
                    </div>
                )}

                {/* Tombol Aksi Bawah: Area Orang Tua & Logout Akun */}
                <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => { sound.playPop(); setIsGateOpen(true); }}
                        className="w-full sm:w-auto px-6 py-3.5 bg-white/90 hover:bg-white text-gray-700 rounded-2xl border-2 border-gray-200 font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[44px]"
                    >
                        <Shield className="w-4 h-4 text-amber-500" />
                        <span>Area Orang Tua (Kelola Profil)</span>
                    </button>

                    <button
                        onClick={() => { sound.playPop(); setIsLogoutModalOpen(true); }}
                        className="w-full sm:w-auto px-5 py-3.5 bg-white/70 hover:bg-white text-rose-600 hover:text-rose-700 rounded-2xl border-2 border-rose-100 hover:border-rose-300 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer min-h-[44px]"
                        title="Ganti atau Keluar dari Akun Orang Tua"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Ganti Akun / Keluar</span>
                    </button>
                </div>
            </div>

            {/* Modal Tambah Profil Anak (Poin 5: Usia dibatasi 3-6 tahun) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-amber-200 animate-scale-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading flex items-center gap-2">
                                <span>🐣</span> Tambah Profil Anak
                            </h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSaveChild} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Nama Anak
                                </label>
                                <input
                                    type="text"
                                    value={childName}
                                    onChange={(e) => setChildName(e.target.value)}
                                    placeholder="Contoh: Rian"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none font-bold text-gray-800 text-sm"
                                    required
                                />
                            </div>

                            {/* Poin 5: Pilihan Usia Anak Dibatasi 3–6 Tahun */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Kelompok Usia (Rentang 3–6 Tahun)
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {[
                                        { id: '3-4', label: '3-4 Tahun', sub: 'Batita / PAUD' },
                                        { id: '5-6', label: '5-6 Tahun', sub: 'TK / Prasekolah' },
                                    ].map((age) => (
                                        <button
                                            key={age.id}
                                            type="button"
                                            onClick={() => setChildAge(age.id)}
                                            className={`p-3 rounded-2xl border-2 font-bold transition-all cursor-pointer min-h-[52px] text-left ${
                                                childAge === age.id
                                                    ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className="block text-sm font-extrabold">{age.label}</span>
                                            <span className="block text-[10px] text-gray-500">{age.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">
                                    Pilih Avatar Sahabat
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {AVATAR_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setChildAvatar(opt.id)}
                                            className={`p-2 rounded-2xl border-2 text-2xl flex flex-col items-center justify-center transition-all cursor-pointer min-h-[48px] ${
                                                childAvatar === opt.id
                                                    ? 'border-amber-500 bg-amber-100 scale-105 shadow-md shadow-amber-200'
                                                    : 'border-gray-200 bg-gray-50 hover:bg-white'
                                            }`}
                                            title={opt.label}
                                        >
                                            <span>{opt.emoji}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer min-h-[44px]"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingChild}
                                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold rounded-xl shadow-md shadow-orange-200 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 min-h-[44px]"
                                >
                                    {isSavingChild ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>Simpan Profil</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Parental Gate */}
            <ParentalGateModal
                isOpen={isGateOpen}
                onClose={() => setIsGateOpen(false)}
                onSuccess={() => {
                    setIsGateOpen(false);
                    navigate('/orangtua/dashboard');
                }}
            />

            {/* Modal Konfirmasi Logout */}
            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                title="Keluar dari Akun Orang Tua?"
                description="Sesi orang tua akan ditutup dan Anda harus masuk kembali untuk mengakses profil anak."
                confirmText="Keluar"
                isDanger={false}
                onConfirm={handleLogoutParent}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </ParallaxBackground>
    );
}
