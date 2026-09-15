import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { sound } from '../../services/audio';

/**
 * Modal Konfirmasi untuk Aksi Kritis & Destruktif (Design.md § 7)
 */
export default function ConfirmationModal({
    isOpen,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    isDanger = true,
    onConfirm,
    onCancel,
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const cancelBtnRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setErrorMessage('');
            setIsLoading(false);
            // Default focus pada tombol Batal agar tidak terjadi ketidaksengajaan
            setTimeout(() => {
                if (cancelBtnRef.current) {
                    cancelBtnRef.current.focus();
                }
            }, 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        sound.playPop();
        setIsLoading(true);
        setErrorMessage('');
        try {
            await onConfirm();
            // Sukses: pemanggil akan menutup modal
        } catch (err) {
            setIsLoading(false);
            setErrorMessage(err.message || 'Terjadi kesalahan saat memproses aksi.');
        }
    };

    const handleCancel = () => {
        sound.playPop();
        onCancel();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
            <div 
                className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 flex flex-col space-y-4"
                role="dialog"
                aria-modal="true"
            >
                {/* Header dengan Ikon Peringatan */}
                <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-2xl shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#2E2A4A] font-heading">{title}</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{description}</p>
                    </div>
                </div>

                {/* Pesan Error Merah jika API Gagal (Design.md § 7.4 & § 2.3) */}
                {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center space-x-2">
                        <span>⚠️</span>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Dua Tombol Sejajar: Batal (Kiri) & Konfirmasi (Kanan) */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                    <button
                        ref={cancelBtnRef}
                        type="button"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2.5 rounded-2xl text-white font-semibold text-sm transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-60 ${
                            isDanger 
                                ? 'bg-[#DC2626] hover:bg-red-700 shadow-md shadow-red-200' 
                                : 'bg-[#6366F1] hover:bg-indigo-700 shadow-md shadow-indigo-200'
                        }`}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
