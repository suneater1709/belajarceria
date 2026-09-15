import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, Plus, Calendar, Scale, Ruler, AlertTriangle, CheckCircle2, 
    Trash2, Edit2, Loader2, Sparkles, HelpCircle, ChevronDown, ChevronUp, 
    Info, HeartPulse, CheckSquare, Square, History, TrendingUp, X
} from 'lucide-react';
import ConfirmationModal from '../common/ConfirmationModal';
import { sound } from '../../services/audio';
import { api } from '../../services/api';

/**
 * Komponen Grafik Garis SVG Interaktif Sederhana
 */
function GrowthLineChart({ data, valueKey, unit, color, gradientId, label, emptyMessage }) {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!data || data.length === 0) {
        return (
            <div className="h-56 flex flex-col items-center justify-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 p-4 text-center">
                <Activity className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">{emptyMessage || 'Belum ada data pengukuran.'}</p>
            </div>
        );
    }

    // Chart Dimensions
    const width = 500;
    const height = 220;
    const padding = { top: 25, right: 30, bottom: 40, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => d[valueKey]);
    const minValRaw = Math.min(...values);
    const maxValRaw = Math.max(...values);
    
    // Berikan margin atas-bawah agar grafik tidak menempel
    const margin = (maxValRaw - minValRaw) > 0 ? (maxValRaw - minValRaw) * 0.2 : 2;
    const minY = Math.max(0, Math.floor((minValRaw - margin) * 10) / 10);
    const maxY = Math.ceil((maxValRaw + margin) * 10) / 10;
    const rangeY = (maxY - minY) || 1;

    // Koordinat Titik
    const points = data.map((d, index) => {
        const x = data.length === 1 
            ? padding.left + chartWidth / 2 
            : padding.left + (index / (data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - ((d[valueKey] - minY) / rangeY) * chartHeight;
        return { x, y, data: d, index };
    });

    const pathD = points.reduce((acc, p, idx) => {
        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
        : '';

    // 4 Garis Grid Horizontal
    const gridLines = [0, 0.33, 0.66, 1].map(ratio => {
        const val = minY + ratio * rangeY;
        const yPos = padding.top + chartHeight - ratio * chartHeight;
        return { val: val.toFixed(1), yPos };
    });

    return (
        <div className="relative w-full">
            <svg 
                viewBox={`0 0 ${width} ${height}`} 
                className="w-full h-auto overflow-visible select-none"
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                    </linearGradient>
                </defs>

                {/* Garis Grid Horizontal & Label Sumbu Y */}
                {gridLines.map((grid, idx) => (
                    <g key={idx}>
                        <line
                            x1={padding.left}
                            y1={grid.yPos}
                            x2={width - padding.right}
                            y2={grid.yPos}
                            stroke="#E5E7EB"
                            strokeDasharray="4 4"
                            strokeWidth="1"
                        />
                        <text
                            x={padding.left - 8}
                            y={grid.yPos + 3}
                            textAnchor="end"
                            className="text-[10px] fill-gray-400 font-semibold"
                        >
                            {grid.val}
                        </text>
                    </g>
                ))}

                {/* Area Gradient di bawah garis */}
                {points.length > 1 && (
                    <path d={areaD} fill={`url(#${gradientId})`} />
                )}

                {/* Garis Tren Pertumbuhan */}
                {points.length > 1 && (
                    <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Titik Data & Interaksi */}
                {points.map((p, idx) => {
                    const isHovered = hoveredPoint?.index === idx;
                    return (
                        <g key={idx}>
                            {/* Titik Lingkaran */}
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={isHovered ? 7 : 4.5}
                                fill="#FFFFFF"
                                stroke={color}
                                strokeWidth={isHovered ? 3.5 : 2.5}
                                className="cursor-pointer transition-all duration-150"
                                onMouseEnter={() => setHoveredPoint(p)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />

                            {/* Label Sumbu X (Tanggal) */}
                            <text
                                x={p.x}
                                y={height - 12}
                                textAnchor="middle"
                                className="text-[9px] fill-gray-500 font-semibold"
                            >
                                {p.data.tanggal_formatted ? p.data.tanggal_formatted.split(' ').slice(0, 2).join(' ') : p.data.tanggal}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip Hover Titik Data */}
            {hoveredPoint && (
                <div 
                    className="absolute z-20 pointer-events-none bg-[#2E2A4A] text-white text-[11px] px-2.5 py-1.5 rounded-xl shadow-lg transform -translate-x-1/2 -translate-y-full mb-2 whitespace-nowrap"
                    style={{
                        left: `${(hoveredPoint.x / width) * 100}%`,
                        top: `${(hoveredPoint.y / height) * 100}%`,
                    }}
                >
                    <p className="font-black text-amber-300">
                        {hoveredPoint.data[valueKey]} {unit}
                    </p>
                    <p className="text-[10px] text-gray-300">
                        {hoveredPoint.data.tanggal_formatted || hoveredPoint.data.tanggal}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ChildGrowthTab({
    childrenList,
    selectedChildId,
    onSelectChild,
}) {
    // State Data
    const [growthData, setGrowthData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    // Modal Form Pengukuran (Tambah / Edit)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showHeadDetail, setShowHeadDetail] = useState(false);
    const [editingRecordId, setEditingRecordId] = useState(null);
    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        berat_kg: '',
        tinggi_cm: '',
        lingkar_kepala_cm: '',
    });

    // Modal Hapus Pengukuran
    const [recordToDelete, setRecordToDelete] = useState(null);

    // Toast Notifikasi Error Milestone
    const [toastMessage, setToastMessage] = useState(null);

    // Animasi Checklist Milestone Selesai (Auto-disappear)
    const [completingKeys, setCompletingKeys] = useState(new Set());
    const [showAchievedHistory, setShowAchievedHistory] = useState(false);

    // Filter Kategori Milestone pada Riwayat
    const [selectedMilestoneCategory, setSelectedMilestoneCategory] = useState('all');

    useEffect(() => {
        if (selectedChildId) {
            loadGrowthData(selectedChildId);
        }
    }, [selectedChildId]);

    const loadGrowthData = async (childId) => {
        setIsLoading(true);
        setErrorMsg('');
        try {
            const res = await api.getChildGrowth(childId);
            setGrowthData(res.data);
        } catch (err) {
            console.error(err);
            setErrorMsg(err.message || 'Gagal memuat data tumbuh kembang.');
        } finally {
            setIsLoading(false);
        }
    };

    // Buka Modal Tambah Pengukuran
    const handleOpenAddModal = () => {
        sound.playPop();
        setEditingRecordId(null);
        setShowHeadDetail(false);
        setFormData({
            tanggal: new Date().toISOString().split('T')[0],
            berat_kg: '',
            tinggi_cm: '',
            lingkar_kepala_cm: '',
        });
        setIsFormModalOpen(true);
    };

    // Buka Modal Edit Pengukuran
    const handleOpenEditModal = (record) => {
        sound.playPop();
        setEditingRecordId(record.id);
        setShowHeadDetail(!!record.lingkar_kepala_cm);
        setFormData({
            tanggal: record.tanggal,
            berat_kg: record.berat_kg,
            tinggi_cm: record.tinggi_cm,
            lingkar_kepala_cm: record.lingkar_kepala_cm || '',
        });
        setIsFormModalOpen(true);
    };

    // Simpan Data Pengukuran (Tambah / Update)
    const handleSaveMeasurement = async (e) => {
        e.preventDefault();
        sound.playPop();
        setIsSubmitting(true);

        const payload = {
            tanggal: formData.tanggal,
            berat_kg: parseFloat(formData.berat_kg),
            tinggi_cm: parseFloat(formData.tinggi_cm),
            lingkar_kepala_cm: formData.lingkar_kepala_cm ? parseFloat(formData.lingkar_kepala_cm) : null,
        };

        try {
            if (editingRecordId) {
                await api.updateGrowthMeasurement(editingRecordId, payload);
            } else {
                await api.createGrowthMeasurement(selectedChildId, payload);
            }
            setIsFormModalOpen(false);
            await loadGrowthData(selectedChildId);
        } catch (err) {
            alert(err.message || 'Gagal menyimpan data pengukuran.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Konfirmasi Hapus Data Pengukuran
    const handleConfirmDeleteRecord = async () => {
        if (!recordToDelete) return;
        await api.deleteGrowthMeasurement(recordToDelete.id);
        setRecordToDelete(null);
        await loadGrowthData(selectedChildId);
    };

    // Selesaikan Checklist Milestone Harian (Auto-disappear & Permanently Recorded)
    const handleCompleteMilestone = async (milestone) => {
        if (completingKeys.has(milestone.key)) return;

        sound.playSparkle();
        setCompletingKeys(prev => new Set(prev).add(milestone.key));

        const previousGrowthData = growthData;

        // Beri waktu 350ms agar animasi visual checklist terasa responsif lalu task otomatis hilang dari daftar harian
        setTimeout(async () => {
            setGrowthData(prev => {
                if (!prev) return prev;
                const nextDaily = (prev.daily_milestones || []).filter(m => m.key !== milestone.key);
                const achievedItem = {
                    ...milestone,
                    tercapai: true,
                    tanggal_tercapai: 'Hari ini',
                };
                const nextCompletedToday = [...(prev.completed_today || []), achievedItem];
                const nextAllAchieved = [...(prev.all_achieved || []), achievedItem];

                const updatedMilestones = (prev.milestones || []).map(m => {
                    if (m.key === milestone.key) {
                        return {
                            ...m,
                            tercapai: true,
                            tanggal_tercapai: 'Hari ini',
                        };
                    }
                    return m;
                });

                const total = updatedMilestones.length;
                const completed = updatedMilestones.filter(m => m.tercapai).length;
                const allCompletedToday = nextDaily.length === 0;

                let nextStatusBadge = 'empty';
                let nextStatusLabel = 'Belum Ada Data';
                let nextStatusNote = 'Belum ada data capaian milestone atau pengukuran fisik yang dicatat.';

                if (completed > 0) {
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                    nextStatusBadge = 'normal';
                    if (percent >= 70) {
                        nextStatusLabel = `Sangat Baik (${completed}/${total} Capaian)`;
                        nextStatusNote = `Anak telah menguasai ${completed} dari ${total} milestone perkembangan usianya dengan sangat optimal.`;
                    } else if (percent >= 30) {
                        nextStatusLabel = `Sesuai Tahapan (${completed}/${total} Capaian)`;
                        nextStatusNote = `Perkembangan anak berjalan baik (${completed} capaian tercapai) dan terus menunjukkan kemajuan positif.`;
                    } else {
                        nextStatusLabel = `Mulai Berkembang (${completed}/${total} Capaian)`;
                        nextStatusNote = `Anak mulai menunjukkan kemandirian dan capaian milestone dasar (${completed} tercapai).`;
                    }
                } else if (prev.chart_data && prev.chart_data.length > 0) {
                    nextStatusBadge = 'normal';
                    nextStatusLabel = 'Data Fisik Tercatat';
                    nextStatusNote = 'Data pengukuran berat dan tinggi telah dicatat. Yuk lengkapi juga checklist milestone di bawah.';
                }

                return {
                    ...prev,
                    daily_milestones: nextDaily,
                    completed_today: nextCompletedToday,
                    all_achieved: nextAllAchieved,
                    all_completed_today: allCompletedToday,
                    milestones: updatedMilestones,
                    summary: {
                        ...prev.summary,
                        status_badge: nextStatusBadge,
                        status_label: nextStatusLabel,
                        status_note: nextStatusNote,
                        milestone_stats: {
                            total,
                            completed,
                            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
                        },
                    },
                };
            });

            setCompletingKeys(prev => {
                const next = new Set(prev);
                next.delete(milestone.key);
                return next;
            });

            try {
                await api.toggleChildMilestone(selectedChildId, milestone.key, true);
            } catch (err) {
                console.error('Gagal menyimpan capaian milestone:', err);
                if (previousGrowthData) {
                    setGrowthData(previousGrowthData);
                }
                setToastMessage('Gagal menyimpan capaian milestone. Silakan periksa koneksi dan coba lagi.');
                setTimeout(() => setToastMessage(null), 4000);
            }
        }, 350);
    };

    // Filter Kategori Milestone pada Riwayat Capaian
    const milestoneCategories = useMemo(() => {
        if (!growthData?.milestones) return [];
        const cats = Array.from(new Set(growthData.milestones.map(m => m.category)));
        return ['all', ...cats];
    }, [growthData?.milestones]);

    const allAchievedList = useMemo(() => {
        if (!growthData?.milestones) return [];
        return growthData.milestones.filter(m => m.tercapai);
    }, [growthData?.milestones]);

    const filteredAchievedMilestones = useMemo(() => {
        if (selectedMilestoneCategory === 'all') return allAchievedList;
        return allAchievedList.filter(m => m.category === selectedMilestoneCategory);
    }, [allAchievedList, selectedMilestoneCategory]);

    const selectedChild = childrenList.find(c => c.id === selectedChildId);

    if (childrenList.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-10 border border-gray-200/80 shadow-xs text-center space-y-3">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                    🌱
                </div>
                <h3 className="text-lg font-black font-heading text-[#2E2A4A]">Belum Ada Profil Anak</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Silakan tambahkan profil anak terlebih dahulu di tab <strong>Kelola Profil Anak</strong> untuk mulai memantau tumbuh kembang si kecil.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 1. Switcher Pilihan Anak & Tombol Tambah Pengukuran */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Switcher Tab Anak */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {childrenList.map(c => (
                        <button
                            key={c.id}
                            onClick={() => {
                                sound.playPop();
                                onSelectChild(c.id);
                            }}
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

                {/* Tombol Aksi Tambah Data Pengukuran */}
                <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2 cursor-pointer self-start sm:self-auto shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    <span>Catat Pengukuran</span>
                </button>
            </div>

            {/* 2. State Loading & Error */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-2">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <p className="text-xs text-gray-500 font-semibold">Memuat data tumbuh kembang...</p>
                </div>
            )}

            {errorMsg && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {!isLoading && growthData && (
                <>
                    {/* 3. Pengingat Ringan (Reminder 30 Hari) */}
                    {growthData.summary.needs_reminder && (
                        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-300/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-3">
                                <div className="p-2.5 bg-amber-500 text-white rounded-2xl shrink-0 shadow-xs">
                                    <HeartPulse className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-black text-[#2E2A4A] font-heading">
                                        Pengingat Pemantauan Rutin
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {growthData.summary.reminder_text}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleOpenAddModal}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                            >
                                Update Sekarang
                            </button>
                        </div>
                    )}

                    {/* 4. Kartu Ringkasan Metrik (4 Kartu) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Usia Terkini */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold mb-2">
                                <Calendar className="w-4 h-4" />
                                <span>Usia Terkini</span>
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading leading-tight">
                                    {growthData.child.calculated_age}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    {growthData.child.birth_date_formatted ? `Lahir: ${growthData.child.birth_date_formatted}` : `Rentang: ${growthData.child.age_level} Tahun`}
                                </p>
                            </div>
                        </div>

                        {/* Berat Badan Terkini */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center space-x-2 text-amber-500 text-xs font-bold mb-2">
                                <Scale className="w-4 h-4" />
                                <span>Berat Terbaru</span>
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading leading-tight">
                                    {growthData.summary.latest_weight !== null ? `${growthData.summary.latest_weight}` : '-'}
                                    <span className="text-xs text-gray-400 font-normal ml-1">kg</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    {growthData.summary.latest_date ? `Tercatat: ${growthData.summary.latest_date}` : 'Belum diukur'}
                                </p>
                            </div>
                        </div>

                        {/* Tinggi Badan Terkini */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center space-x-2 text-emerald-600 text-xs font-bold mb-2">
                                <Ruler className="w-4 h-4" />
                                <span>Tinggi Terbaru</span>
                            </div>
                            <div>
                                <p className="text-xl sm:text-2xl font-black text-[#2E2A4A] font-heading leading-tight">
                                    {growthData.summary.latest_height !== null ? `${growthData.summary.latest_height}` : '-'}
                                    <span className="text-xs text-gray-400 font-normal ml-1">cm</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    {growthData.summary.latest_head_circumference 
                                        ? `LK: ${growthData.summary.latest_head_circumference} cm` 
                                        : (growthData.summary.latest_date ? `Tercatat: ${growthData.summary.latest_date}` : 'Belum diukur')}
                                </p>
                            </div>
                        </div>

                        {/* Status Perkembangan */}
                        <div className="bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                            <div className="flex items-center space-x-2 text-purple-600 text-xs font-bold mb-2">
                                <Activity className="w-4 h-4" />
                                <span>Status Perkembangan</span>
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    {growthData.summary.status_badge === 'normal' && (
                                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span className="line-clamp-1">{growthData.summary.status_label || 'Normal'}</span>
                                        </span>
                                    )}
                                    {growthData.summary.status_badge === 'warning' && (
                                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-xl text-xs font-black">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            <span className="line-clamp-1">{growthData.summary.status_label || 'Perlu Dipantau'}</span>
                                        </span>
                                    )}
                                    {growthData.summary.status_badge === 'empty' && (
                                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-xl text-xs font-black">
                                            <span>{growthData.summary.status_label || 'Belum Ada Data'}</span>
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 italic leading-tight">
                                    {growthData.summary.disclaimer}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Catatan Status / Rekomendasi Perkembangan Real-Time */}
                    {growthData.summary.status_note && (
                        <div className={`p-4 rounded-2xl text-xs flex items-start space-x-3 border ${
                            growthData.summary.status_badge === 'warning'
                                ? 'bg-amber-50 border-amber-200 text-amber-900'
                                : growthData.summary.status_badge === 'normal'
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}>
                            <Info className={`w-4 h-4 shrink-0 mt-0.5 ${
                                growthData.summary.status_badge === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                            }`} />
                            <div>
                                <strong className="font-bold">Info Perkembangan Anak: </strong>
                                <span>{growthData.summary.status_note}</span>
                            </div>
                        </div>
                    )}

                    {/* 5. Grafik Pertumbuhan (2 Grafik: Berat & Tinggi) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Grafik Berat Badan */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                        <Scale className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-[#2E2A4A] font-heading">
                                            Pertumbuhan Berat Badan (kg)
                                        </h3>
                                        <p className="text-[11px] text-gray-400">Tren berat badan dari waktu ke waktu</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                                    {growthData.summary.latest_weight ? `${growthData.summary.latest_weight} kg` : '-'}
                                </span>
                            </div>

                            <GrowthLineChart 
                                data={growthData.chart_data}
                                valueKey="berat_kg"
                                unit="kg"
                                color="#F59E0B"
                                gradientId="weightGradient"
                                label="Berat Badan"
                                emptyMessage="Belum ada riwayat berat badan."
                            />
                        </div>

                        {/* Grafik Tinggi Badan */}
                        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Ruler className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-[#2E2A4A] font-heading">
                                            Pertumbuhan Tinggi Badan (cm)
                                        </h3>
                                        <p className="text-[11px] text-gray-400">Tren tinggi badan dari waktu ke waktu</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                                    {growthData.summary.latest_height ? `${growthData.summary.latest_height} cm` : '-'}
                                </span>
                            </div>

                            <GrowthLineChart 
                                data={growthData.chart_data}
                                valueKey="tinggi_cm"
                                unit="cm"
                                color="#6366F1"
                                gradientId="heightGradient"
                                label="Tinggi Badan"
                                emptyMessage="Belum ada riwayat tinggi badan."
                            />
                        </div>
                    </div>

                    {/* 6. Checklist Milestone Perkembangan Harian Dinamis (Usia 3-6 Tahun) */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-6">
                        {/* Header Target Harian */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h3 className="text-base font-black text-[#2E2A4A] font-heading flex items-center gap-2">
                                        Target Capaian Perkembangan Hari Ini
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            🎲 Acak Harian
                                        </span>
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Centang capaian yang sudah dikuasai anak hari ini. Task yang telah dicapai akan otomatis tuntas dan hilang dari daftar harian.
                                </p>
                            </div>

                            {/* Progres Milestone Total */}
                            <div className="bg-gray-50 border border-gray-200 px-4 py-2 rounded-2xl flex items-center space-x-3 shrink-0">
                                <div className="text-right">
                                    <p className="text-[11px] text-gray-400 font-bold">Total Capaian</p>
                                    <p className="text-xs font-black text-[#2E2A4A]">
                                        {growthData.summary.milestone_stats.completed}/{growthData.summary.milestone_stats.total}
                                    </p>
                                </div>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                        style={{ width: `${growthData.summary.milestone_stats.percent}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Konten Target Harian: Selesai Semua vs Daftar Task Aktif */}
                        {growthData.all_completed_today || !growthData.daily_milestones || growthData.daily_milestones.length === 0 ? (
                            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-200/80 rounded-3xl p-8 text-center space-y-3 shadow-xs animate-in fade-in duration-300">
                                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-sm">
                                    🎉
                                </div>
                                <h4 className="text-xl font-black text-[#2E2A4A] font-heading">
                                    Semua Capaian Hari Ini Telah Tuntas!
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed font-medium">
                                    Hebat! Seluruh target capaian perkembangan hari ini telah berhasil dituntaskan. Capaian baru yang bervariasi akan muncul kembali besok pagi. Tetap pantau dan dampingi si kecil ya! 🌅
                                </p>
                                {growthData.completed_today && growthData.completed_today.length > 0 && (
                                    <div className="pt-2">
                                        <span className="inline-block px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold shadow-2xs">
                                            ✨ {growthData.completed_today.length} Capaian Berhasil Diselesaikan Hari Ini
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="font-bold">
                                        Pilih capaian yang sudah diamati pada si kecil ({growthData.daily_milestones.length} target tersisa hari ini):
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {growthData.daily_milestones.map(m => {
                                        const isCompleting = completingKeys.has(m.key);

                                        return (
                                            <div
                                                key={m.key}
                                                onClick={() => handleCompleteMilestone(m)}
                                                className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-start space-x-3 select-none ${
                                                    isCompleting
                                                        ? 'bg-emerald-100 border-emerald-400 scale-98 shadow-md opacity-80'
                                                        : 'bg-gray-50/70 border-gray-200/80 hover:bg-emerald-50/40 hover:border-emerald-300 hover:shadow-xs'
                                                }`}
                                            >
                                                <div className="pt-0.5 shrink-0">
                                                    {isCompleting ? (
                                                        <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs animate-scale-up">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-lg border-2 border-gray-300 bg-white group-hover:border-emerald-500 transition-colors" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-black text-[#2E2A4A] leading-tight">
                                                            {m.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                                                        <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                                                            {m.category}
                                                        </span>
                                                        <span className="text-gray-400 font-medium">
                                                            🎯 Rekomendasi: {m.age_recommendation}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Collapsible: Riwayat Capaian yang Telah Dikuasai */}
                        <div className="pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    sound.playPop();
                                    setShowAchievedHistory(prev => !prev);
                                }}
                                className="w-full py-3 px-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-xs font-bold text-gray-700 cursor-pointer"
                            >
                                <div className="flex items-center space-x-2">
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    <span>
                                        Riwayat Semua Capaian yang Telah Dikuasai ({allAchievedList.length} dari {growthData.milestones?.length || 24} Capaian)
                                    </span>
                                </div>
                                {showAchievedHistory ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>

                            {showAchievedHistory && (
                                <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                                    {/* Filter Kategori Riwayat */}
                                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
                                        {milestoneCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => {
                                                    sound.playPop();
                                                    setSelectedMilestoneCategory(cat);
                                                }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                                                    selectedMilestoneCategory === cat
                                                        ? 'bg-emerald-600 text-white shadow-xs'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {cat === 'all' ? 'Semua Capaian' : cat}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Daftar Riwayat Capaian */}
                                    {filteredAchievedMilestones.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400 text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                            Belum ada capaian yang tercatat pada kategori ini.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {filteredAchievedMilestones.map(m => (
                                                <div
                                                    key={m.key}
                                                    className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start space-x-3"
                                                >
                                                    <div className="pt-0.5 shrink-0">
                                                        <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-xs font-bold text-[#2E2A4A] leading-tight block">
                                                            {m.title}
                                                        </span>
                                                        <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                                                            <span className="text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                                                                {m.category}
                                                            </span>
                                                            <span className="text-emerald-700 font-semibold">
                                                                ✅ {m.tanggal_tercapai || 'Tercapai'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Toast Error Rollback Notification */}
                        {toastMessage && (
                            <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center space-x-2 animate-in fade-in">
                                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>{toastMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* 7. Riwayat Data Pengukuran */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-base font-black text-[#2E2A4A] font-heading">
                                    Riwayat Data Pengukuran
                                </h3>
                            </div>
                            <span className="text-xs text-gray-400 font-semibold">
                                Total: {growthData.history.length} Catatan
                            </span>
                        </div>

                        {growthData.history.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 space-y-2">
                                <Scale className="w-8 h-8 mx-auto opacity-30" />
                                <p className="text-xs font-semibold">Belum ada riwayat data pengukuran.</p>
                                <button
                                    onClick={handleOpenAddModal}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold underline cursor-pointer"
                                >
                                    + Tambah Pengukuran Pertama
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                            <th className="pb-3 px-3">Tanggal</th>
                                            <th className="pb-3 px-3">Berat (kg)</th>
                                            <th className="pb-3 px-3">Tinggi (cm)</th>
                                            <th className="pb-3 px-3">Lingkar Kepala</th>
                                            <th className="pb-3 px-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {growthData.history.map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="py-3 px-3 font-semibold text-gray-800">
                                                    {record.tanggal_formatted}
                                                </td>
                                                <td className="py-3 px-3 font-extrabold text-[#2E2A4A]">
                                                    {record.berat_kg} kg
                                                </td>
                                                <td className="py-3 px-3 font-extrabold text-[#2E2A4A]">
                                                    {record.tinggi_cm} cm
                                                </td>
                                                <td className="py-3 px-3 text-gray-500 font-medium">
                                                    {record.lingkar_kepala_cm ? `${record.lingkar_kepala_cm} cm` : '-'}
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <div className="inline-flex items-center space-x-1">
                                                        <button
                                                            onClick={() => handleOpenEditModal(record)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Catatan"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                sound.playPop();
                                                                setRecordToDelete(record);
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                            title="Hapus Catatan"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* 8. MODAL TAMBAH / EDIT DATA PENGUKURAN */}
            {isFormModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 flex flex-col space-y-4"
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="flex items-center space-x-2.5">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                    <Scale className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black font-heading text-[#2E2A4A]">
                                        {editingRecordId ? 'Edit Data Pengukuran' : 'Tambah Data Pengukuran'}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Untuk {selectedChild?.name || 'Anak'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    sound.playPop();
                                    setIsFormModalOpen(false);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSaveMeasurement} className="space-y-4">
                            {/* Tanggal Pengukuran */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Tanggal Pengukuran <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    value={formData.tanggal}
                                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* 2 Kolom: Berat & Tinggi */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Berat Badan (kg) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="1"
                                        max="100"
                                        required
                                        placeholder="Contoh: 15.5"
                                        value={formData.berat_kg}
                                        onChange={(e) => setFormData({ ...formData, berat_kg: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">
                                        Tinggi Badan (cm) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="30"
                                        max="200"
                                        required
                                        placeholder="Contoh: 102.5"
                                        value={formData.tinggi_cm}
                                        onChange={(e) => setFormData({ ...formData, tinggi_cm: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>

                            {/* Toggle Opsional Detail Lingkar Kepala */}
                            <div className="pt-1">
                                {!showHeadDetail ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowHeadDetail(true)}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>+ Tambah detail (Lingkar Kepala)</span>
                                    </button>
                                ) : (
                                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold text-gray-700">
                                                Lingkar Kepala (cm) — Opsional
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowHeadDetail(false);
                                                    setFormData({ ...formData, lingkar_kepala_cm: '' });
                                                }}
                                                className="text-[10px] text-gray-400 hover:text-rose-600 cursor-pointer"
                                            >
                                                Batal
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="20"
                                            max="100"
                                            placeholder="Contoh: 48.5"
                                            value={formData.lingkar_kepala_cm}
                                            onChange={(e) => setFormData({ ...formData, lingkar_kepala_cm: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Tombol Simpan & Batal */}
                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        sound.playPop();
                                        setIsFormModalOpen(false);
                                    }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-200 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                                >
                                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    <span>{editingRecordId ? 'Simpan Perubahan' : 'Simpan Pengukuran'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 9. MODAL KONFIRMASI HAPUS PENGUKURAN */}
            <ConfirmationModal
                isOpen={!!recordToDelete}
                title="Hapus Data Pengukuran?"
                description={`Apakah Anda yakin ingin menghapus data pengukuran pada tanggal ${recordToDelete?.tanggal_formatted || recordToDelete?.tanggal}? Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Hapus Pengukuran"
                cancelText="Batal"
                isDanger={true}
                onConfirm={handleConfirmDeleteRecord}
                onCancel={() => setRecordToDelete(null)}
            />
        </div>
    );
}
