import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    Users, BarChart3, Settings, LogOut, Plus, Star, Award, Clock, 
    AlertCircle, ArrowRight, Trash2, Edit2, CheckCircle2, ChevronRight, Loader2,
    Sparkles, ShoppingBag, ExternalLink, X, Activity
} from 'lucide-react';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import ChildGrowthTab from '../../components/parent/ChildGrowthTab';
import { sound } from '../../services/audio';
import { api, removeAuthToken } from '../../services/api';

export default function ParentDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('report'); // 'report' | 'children' | 'growth' | 'settings'

    // Data State
    const [children, setChildren] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [timeRange, setTimeRange] = useState('week'); // 'week' | 'month' | 'all'
    const [accountData, setAccountData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [childToDelete, setChildToDelete] = useState(null);
    const [isChildFormOpen, setIsChildFormOpen] = useState(false);
    const [childFormData, setChildFormData] = useState({ id: null, name: '', avatar: 'owl', age_level: '3-4' });

    // Lynk.id Banner State (Poin 6)
    const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
        return localStorage.getItem('bc_dismiss_lynk_banner') === 'true';
    });

    const handleDismissBanner = () => {
        sound.playPop();
        localStorage.setItem('bc_dismiss_lynk_banner', 'true');
        setIsBannerDismissed(true);
    };

    // Settings Form
    const [parentPin, setParentPin] = useState('');
    const [pinSuccessMsg, setPinSuccessMsg] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [childRes, accRes] = await Promise.all([
                api.getParentChildren(),
                api.getParentAccount(),
            ]);

            setChildren(childRes.data || []);
            setAccountData(accRes.data || null);

            if (childRes.data && childRes.data.length > 0) {
                const firstId = childRes.data[0].id;
                setSelectedChildId(firstId);
                loadChildReport(firstId, timeRange);
            } else {
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            if (err.status === 401) {
                navigate('/orangtua/login');
            }
            setIsLoading(false);
        }
    };

    const loadChildReport = async (childId, range) => {
        try {
            const res = await api.getChildReport(childId, range);
            setReportData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectChild = (id) => {
        sound.playPop();
        setSelectedChildId(id);
        setIsLoading(true);
        loadChildReport(id, timeRange);
    };

    const handleChangeTimeRange = (range) => {
        sound.playPop();
        setTimeRange(range);
        if (selectedChildId) {
            setIsLoading(true);
            loadChildReport(selectedChildId, range);
        }
    };

    // Logout
    const handleConfirmLogout = async () => {
        try {
            await api.logout();
        } catch (e) {
            // Abaikan error token
        }
        removeAuthToken();
        setIsLogoutOpen(false);
        navigate('/orangtua/login', { replace: true });
    };

    // Hapus Anak
    const handleConfirmDeleteChild = async () => {
        if (!childToDelete) return;
        await api.deleteChild(childToDelete.id);
        setChildren(prev => prev.filter(c => c.id !== childToDelete.id));
        setChildToDelete(null);
        if (selectedChildId === childToDelete.id) {
            const remaining = children.filter(c => c.id !== childToDelete.id);
            if (remaining.length > 0) {
                setSelectedChildId(remaining[0].id);
                loadChildReport(remaining[0].id, timeRange);
            } else {
                setReportData(null);
            }
        }
    };

    // Simpan Anak (Tambah / Edit)
    const handleSaveChild = async (e) => {
        e.preventDefault();
        sound.playPop();

        try {
            if (childFormData.id) {
                const res = await api.updateChild(childFormData.id, childFormData);
                setChildren(prev => prev.map(c => c.id === childFormData.id ? res.data : c));
            } else {
                const res = await api.createChild(childFormData);
                setChildren(prev => [...prev, res.data]);
                if (!selectedChildId) {
                    setSelectedChildId(res.data.id);
                    loadChildReport(res.data.id, timeRange);
                }
            }
            setIsChildFormOpen(false);
        } catch (err) {
            alert(err.message || 'Gagal menyimpan data anak.');
        }
    };

    // Simpan PIN
    const handleSavePin = async (e) => {
        e.preventDefault();
        sound.playPop();
        setPinSuccessMsg('');

        try {
            await api.updateParentPin(parentPin);
            setPinSuccessMsg('PIN Parental Gate berhasil diperbarui!');
            setParentPin('');
        } catch (err) {
            alert(err.message || 'Gagal mengubah PIN.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] text-[#2E2A4A] flex flex-col">
            {/* Top Bar Header Orang Tua */}
            <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
                <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link 
                            to="/belajarceria" 
                            onClick={() => sound.playPop()}
                            className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-sm overflow-hidden p-0.5 hover:scale-105 transition-transform"
                            title="Ke Area Bermain Anak"
                        >
                            <img 
                                src="/belajarceria.png" 
                                alt="Logo BelajarCeria" 
                                className="w-full h-full object-contain" 
                            />
                        </Link>
                        <div>
                            <h1 className="text-lg font-black font-heading leading-tight">Dashboard Orang Tua</h1>
                            <p className="text-xs text-gray-500">
                                {accountData ? `Akun: ${accountData.name}` : 'Portal Pemantauan Belajar'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Link
                            to="/belajarceria"
                            onClick={() => sound.playPop()}
                            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors flex items-center space-x-1"
                        >
                            <span>Kembali ke Area Anak</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                            onClick={() => { sound.playPop(); setIsLogoutOpen(true); }}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Keluar"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigasi Tab */}
            <div className="max-w-6xl mx-auto w-full px-4 pt-6">
                <div className="border-b border-gray-200 pb-2 overflow-x-auto scrollbar-none">
                    <div className="flex space-x-2 min-w-max">
                        <button
                            onClick={() => { sound.playPop(); setActiveTab('report'); }}
                            className={`min-h-[44px] px-4 py-2 rounded-xl font-heading text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                                activeTab === 'report' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Laporan Belajar</span>
                        </button>

                        <button
                            onClick={() => { sound.playPop(); setActiveTab('children'); }}
                            className={`min-h-[44px] px-4 py-2 rounded-xl font-heading text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                                activeTab === 'children' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>Kelola Profil Anak ({children.length})</span>
                        </button>

                        <button
                            onClick={() => { sound.playPop(); setActiveTab('growth'); }}
                            className={`min-h-[44px] px-4 py-2 rounded-xl font-heading text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                                activeTab === 'growth' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Activity className="w-4 h-4" />
                            <span>Tumbuh Kembang Anak</span>
                        </button>

                        <button
                            onClick={() => { sound.playPop(); setActiveTab('settings'); }}
                            className={`min-h-[44px] px-4 py-2 rounded-xl font-heading text-sm font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                                activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <Settings className="w-4 h-4" />
                            <span>Keamanan & PIN</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Isi Tab */}
            <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
                {/* BANNER / SECTION PRODUK DIGITAL LYNK.ID (Poin 6) */}
                {!isBannerDismissed && (
                    <div className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-orange-500/15 mb-6">
                        {/* Tombol Tutup Banner (✕) */}
                        <button
                            onClick={handleDismissBanner}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Tutup banner sementara"
                            aria-label="Tutup banner"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pr-8 sm:pr-0">
                            <div className="max-w-xl space-y-2">
                                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wide uppercase">
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                                    <span>Rekomendasi Eksklusif Orang Tua</span>
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black font-heading leading-tight">
                                    Koleksi Lembar Kerja & Aktivitas Edukatif Ceria
                                </h3>
                                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                                    Dukung stimulasi sensorik-motorik si kecil dengan worksheet printable, kartu belajar (flashcard), dan panduan bermain usia 3–6 tahun karya <strong>Anhumad</strong>.
                                </p>
                                <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold">
                                    <span className="bg-white/15 px-2.5 py-1 rounded-lg">📄 Printable Worksheet</span>
                                    <span className="bg-white/15 px-2.5 py-1 rounded-lg">🃏 Kartu Belajar (Flashcard)</span>
                                    <span className="bg-white/15 px-2.5 py-1 rounded-lg">🎨 Kreasi & Mewarnai</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                                <a
                                    href="https://lynk.id/anhumad"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => sound.playPop()}
                                    className="px-6 py-3.5 bg-white text-orange-600 hover:bg-orange-50 font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-black/10 transition-all flex items-center justify-center space-x-2 cursor-pointer group"
                                >
                                    <ShoppingBag className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                                    <span>Jelajahi Lembar Kerja di Lynk.id</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {isBannerDismissed && (
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={() => {
                                localStorage.removeItem('bc_dismiss_lynk_banner');
                                setIsBannerDismissed(false);
                            }}
                            className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Tampilkan Rekomendasi Lynk.id</span>
                        </button>
                    </div>
                )}

                {/* TAB 1: LAPORAN BELAJAR */}
                {activeTab === 'report' && (
                    <div className="space-y-6">
                        {/* Filter Anak & Waktu */}
                        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            {/* Pilihan Anak */}
                            <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                                {children.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleSelectChild(c.id)}
                                        className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-2 ${
                                            selectedChildId === c.id 
                                                ? 'bg-amber-500 text-white shadow-md shadow-amber-200' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span>{c.avatar === 'cat' ? '🐱' : '🦉'}</span>
                                        <span>{c.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Pilihan Rentang Waktu */}
                            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-2xl text-xs font-bold self-start sm:self-auto">
                                <button
                                    onClick={() => handleChangeTimeRange('week')}
                                    className={`px-3 py-1.5 rounded-xl cursor-pointer ${timeRange === 'week' ? 'bg-white shadow-xs text-indigo-600' : 'text-gray-500'}`}
                                >
                                    7 Hari Terakhir
                                </button>
                                <button
                                    onClick={() => handleChangeTimeRange('month')}
                                    className={`px-3 py-1.5 rounded-xl cursor-pointer ${timeRange === 'month' ? 'bg-white shadow-xs text-indigo-600' : 'text-gray-500'}`}
                                >
                                    30 Hari
                                </button>
                                <button
                                    onClick={() => handleChangeTimeRange('all')}
                                    className={`px-3 py-1.5 rounded-xl cursor-pointer ${timeRange === 'all' ? 'bg-white shadow-xs text-indigo-600' : 'text-gray-500'}`}
                                >
                                    Semua
                                </button>
                            </div>
                        </div>

                        {reportData ? (
                            <>
                                {/* 4 Kartu Ringkasan Metrik */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
                                        <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold mb-2">
                                            <Award className="w-4 h-4" />
                                            <span>Rata-rata Skor</span>
                                        </div>
                                        <p className="text-3xl font-black text-[#2E2A4A] font-heading">
                                            {reportData.summary.average_score}
                                            <span className="text-xs text-gray-400 font-normal ml-1">/ 100</span>
                                        </p>
                                    </div>

                                    <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
                                        <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold mb-2">
                                            <Star className="w-4 h-4 fill-amber-400" />
                                            <span>Total Bintang</span>
                                        </div>
                                        <p className="text-3xl font-black text-[#2E2A4A] font-heading">
                                            {reportData.summary.total_stars}
                                        </p>
                                    </div>

                                    <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
                                        <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold mb-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Kuis Selesai</span>
                                        </div>
                                        <p className="text-3xl font-black text-[#2E2A4A] font-heading">
                                            {reportData.summary.total_attempts}
                                            <span className="text-xs text-gray-400 font-normal ml-1">Sesi</span>
                                        </p>
                                    </div>

                                    <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
                                        <div className="flex items-center space-x-2 text-purple-600 text-xs font-bold mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span>Waktu Belajar</span>
                                        </div>
                                        <p className="text-3xl font-black text-[#2E2A4A] font-heading">
                                            ~{reportData.summary.estimated_minutes}
                                            <span className="text-xs text-gray-400 font-normal ml-1">Menit</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Bagian Topik yang Perlu Diulang & Riwayat */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Kolom Kiri (2 Kolom): Progres 7 Modul */}
                                    <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                                        <h3 className="text-lg font-black text-[#2E2A4A] font-heading mb-4">
                                            Progres Belajar 7 Modul
                                        </h3>
                                        <div className="space-y-4">
                                            {reportData.module_progress.map(mod => (
                                                <div key={mod.id}>
                                                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                                                        <span className="flex items-center space-x-1.5 text-gray-800">
                                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mod.color_theme }} />
                                                            <span>{mod.name}</span>
                                                        </span>
                                                        <span className="text-gray-500">
                                                            {mod.completed_topics}/{mod.total_topics} Topik • {mod.percent}%
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${mod.percent}%`, backgroundColor: mod.color_theme }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kolom Kanan: Topik Lemah (Rekomendasi Ulang) */}
                                    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center space-x-2 text-rose-600 mb-3">
                                                <AlertCircle className="w-5 h-5" />
                                                <h3 className="text-lg font-black font-heading text-[#2E2A4A]">
                                                    Perlu Diulang
                                                </h3>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-4">
                                                Topik dengan skor di bawah 70 yang disarankan untuk dilatih kembali bersama anak.
                                            </p>

                                            {reportData.weak_topics.length === 0 ? (
                                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Hebat! Tidak ada topik yang nilainya rendah saat ini.</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {reportData.weak_topics.map(t => (
                                                        <div key={t.topic_id} className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs">
                                                            <div>
                                                                <p className="font-bold text-gray-900">{t.topic_name}</p>
                                                                <p className="text-gray-500">{t.module_name}</p>
                                                            </div>
                                                            <span className="font-extrabold text-rose-600 text-sm">
                                                                {t.average_score} pts
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Riwayat Terbaru */}
                                        <div className="mt-6 pt-4 border-t border-gray-100">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Riwayat Kuis Terkini</h4>
                                            <div className="space-y-2">
                                                {reportData.recent_attempts.map(a => (
                                                    <div key={a.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                                                        <span className="font-semibold text-gray-700 truncate max-w-[150px]">{a.topic_name}</span>
                                                        <span className="font-bold text-indigo-600">{a.score} pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-16 text-gray-400">
                                <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                <p>Belum ada anak yang dipilih atau belum ada aktivitas belajar.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: KELOLA PROFIL ANAK */}
                {activeTab === 'children' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-[#2E2A4A] font-heading">
                                Profil Anak Terdaftar
                            </h2>
                            <button
                                onClick={() => {
                                    sound.playPop();
                                    setChildFormData({ id: null, name: '', avatar: 'owl', age_level: '3-4' });
                                    setIsChildFormOpen(true);
                                }}
                                className="min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Profil Anak</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {children.map(child => (
                                <div key={child.id} className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-3xl flex items-center justify-center shrink-0">
                                            {child.avatar === 'cat' ? '🐱' : '🦉'}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#2E2A4A] font-heading">{child.name}</h3>
                                            <span className="text-xs text-gray-500 font-semibold block">
                                                Usia {child.age_level} Tahun
                                            </span>
                                            <div className="flex items-center space-x-1 text-amber-600 font-extrabold text-xs mt-1">
                                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                                <span>{child.total_stars ?? 0} Bintang</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end space-x-2 mt-6 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                sound.playPop();
                                                setChildFormData(child);
                                                setIsChildFormOpen(true);
                                            }}
                                            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
                                            title="Edit Profil"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                sound.playPop();
                                                setChildToDelete(child);
                                            }}
                                            className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Hapus Profil"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Section Rekomendasi Produk Edukatif Lynk.id (antara Profil Anak & Pengaturan) */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-dashed border-amber-200/80">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start space-x-4">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/20">
                                        🎁
                                    </div>
                                    <div>
                                        <h4 className="font-heading font-black text-[#2E2A4A] text-base">
                                            Aktivitas Fisik & Lembar Kerja Cetak Pendamping Belajar
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1 max-w-xl leading-relaxed">
                                            Kombinasikan kuis interaktif di BelajarCeria dengan lembar kerja fisik (worksheet), kartu gunting tempel, dan panduan stimulasi pra-membaca & berhitung dari toko digital <strong>Lynk.id/anhumad</strong>.
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href="https://lynk.id/anhumad"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => sound.playPop()}
                                    className="min-h-[44px] px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5 shrink-0"
                                >
                                    <span>Buka Katalog Lynk.id</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: TUMBUH KEMBANG ANAK */}
                {activeTab === 'growth' && (
                    <ChildGrowthTab
                        childrenList={children}
                        selectedChildId={selectedChildId}
                        onSelectChild={setSelectedChildId}
                    />
                )}

                {/* TAB 4: PENGATURAN PIN & AKUN */}
                {activeTab === 'settings' && (
                    <div className="max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-xs space-y-6">
                        <div>
                            <h2 className="text-xl font-black text-[#2E2A4A] font-heading">
                                Atur PIN Parental Gate
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                PIN ini digunakan untuk memverifikasi saat Anda ingin mengakses Dashboard Orang Tua dari area bermain anak.
                            </p>
                        </div>

                        {pinSuccessMsg && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-2xl flex items-center space-x-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{pinSuccessMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSavePin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                                    PIN Baru (4–6 Digit)
                                </label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    required
                                    value={parentPin}
                                    onChange={(e) => setParentPin(e.target.value)}
                                    placeholder="Contoh: 1234"
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-hidden font-bold text-center tracking-widest text-lg"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
                            >
                                Simpan PIN Baru
                            </button>
                        </form>
                    </div>
                )}
            </main>

            {/* MODAL 1: KONFIRMASI LOGOUT (Design.md § 7 - Risiko Sedang) */}
            <ConfirmationModal
                isOpen={isLogoutOpen}
                title="Keluar dari akun?"
                description="Sesi Anda akan diakhiri dan Anda perlu login kembali untuk mengakses data perkembangan anak."
                confirmText="Keluar"
                isDanger={false}
                onConfirm={handleConfirmLogout}
                onCancel={() => setIsLogoutOpen(false)}
            />

            {/* MODAL 2: KONFIRMASI HAPUS PROFIL ANAK (Design.md § 7 - Risiko Tinggi) */}
            <ConfirmationModal
                isOpen={!!childToDelete}
                title={`Hapus profil anak "${childToDelete ? childToDelete.name : ''}"?`}
                description="Semua data progres, riwayat bintang, dan hasil kuis anak ini akan ikut terhapus secara permanen dan tidak dapat dikembalikan."
                confirmText="Hapus Permanen"
                isDanger={true}
                onConfirm={handleConfirmDeleteChild}
                onCancel={() => setChildToDelete(null)}
            />

            {/* MODAL 3: FORM TAMBAH / EDIT ANAK */}
            {isChildFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
                        <h3 className="text-xl font-bold font-heading mb-4">
                            {childFormData.id ? 'Edit Profil Anak' : 'Tambah Profil Anak Baru'}
                        </h3>
                        <form onSubmit={handleSaveChild} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Panggilan</label>
                                <input
                                    type="text"
                                    required
                                    value={childFormData.name}
                                    onChange={e => setChildFormData({ ...childFormData, name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-bold"
                                    placeholder="Nama anak..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Avatar Maskot</label>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setChildFormData({ ...childFormData, avatar: 'owl' })}
                                        className={`flex-1 p-3 rounded-2xl border-2 text-2xl flex items-center justify-center ${
                                            childFormData.avatar === 'owl' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                                        }`}
                                    >
                                        🦉
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChildFormData({ ...childFormData, avatar: 'cat' })}
                                        className={`flex-1 p-3 rounded-2xl border-2 text-2xl flex items-center justify-center ${
                                            childFormData.avatar === 'cat' ? 'border-amber-500 bg-amber-50' : 'border-gray-200'
                                        }`}
                                    >
                                        🐱
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                                    Rentang Usia (3–6 Tahun)
                                </label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setChildFormData({ ...childFormData, age_level: '3-4' })}
                                        className={`min-h-[44px] p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left flex flex-col justify-center cursor-pointer ${
                                            childFormData.age_level === '3-4'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="font-heading text-sm">3–4 Tahun</span>
                                        <span className="text-[10px] text-gray-500 font-normal">Kelompok Bermain / PAUD</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setChildFormData({ ...childFormData, age_level: '5-6' })}
                                        className={`min-h-[44px] p-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left flex flex-col justify-center cursor-pointer ${
                                            childFormData.age_level === '5-6'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className="font-heading text-sm">5–6 Tahun</span>
                                        <span className="text-[10px] text-gray-500 font-normal">Taman Kanak-kanak (TK)</span>
                                    </button>
                                </div>
                                {childFormData.age_level && !['3-4', '5-6'].includes(childFormData.age_level) && (
                                    <p className="text-[10px] text-amber-600 mt-1 font-semibold">
                                        Usia saat ini: {childFormData.age_level} tahun (pilih 3–4 atau 5–6 tahun untuk memperbarui).
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsChildFormOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-200"
                                >
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
