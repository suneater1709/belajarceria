import React, { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { sound } from '../../services/audio';
import { api } from '../../services/api';

/**
 * Parental Gate Modal (PRD.md § 7.4)
 * Mencegah anak mengakses area pengaturan / orang tua secara tidak sengaja.
 */
export default function ParentalGateModal({ isOpen, onClose, onSuccess }) {
    const [num1, setNum1] = useState(3);
    const [num2, setNum2] = useState(4);
    const [answerInput, setAnswerInput] = useState('');
    const [pinInput, setPinInput] = useState('');
    const [isPinMode, setIsPinMode] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Acak pertanyaan matematika ramah orang tua
            const n1 = Math.floor(Math.random() * 8) + 3;
            const n2 = Math.floor(Math.random() * 7) + 2;
            setNum1(n1);
            setNum2(n2);
            setAnswerInput('');
            setPinInput('');
            setErrorMsg('');
            setIsPinMode(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmitMath = async (e) => {
        e.preventDefault();
        sound.playPop();
        setErrorMsg('');

        const expected = num1 * num2;
        if (parseInt(answerInput, 10) === expected) {
            sound.playCorrect();
            onSuccess();
        } else {
            sound.playWrong();
            setErrorMsg('Jawaban belum tepat. Silakan coba lagi.');
            setAnswerInput('');
        }
    };

    const handleSubmitPin = async (e) => {
        e.preventDefault();
        sound.playPop();
        setErrorMsg('');
        setIsLoading(true);

        try {
            await api.verifyParentalGate({ pin: pinInput });
            sound.playCorrect();
            onSuccess();
        } catch (err) {
            sound.playWrong();
            setErrorMsg(err.message || 'PIN yang dimasukkan salah.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-indigo-100 flex flex-col relative">
                <button
                    onClick={() => { sound.playPop(); onClose(); }}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#2E2A4A] font-heading">Area Khusus Dewasa</h3>
                        <p className="text-xs text-gray-500">Kunci keamanan orang tua</p>
                    </div>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
                        {errorMsg}
                    </div>
                )}

                {!isPinMode ? (
                    <form onSubmit={handleSubmitMath} className="space-y-4">
                        <div className="bg-amber-50/70 p-4 rounded-2xl text-center border border-amber-200/50">
                            <p className="text-sm text-gray-700 mb-2">Buktikan kamu adalah orang tua:</p>
                            <p className="text-2xl font-extrabold text-[#2E2A4A] font-heading tracking-wider">
                                {num1} × {num2} = ?
                            </p>
                        </div>

                        <input
                            type="number"
                            autoFocus
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                            placeholder="Ketik jawaban..."
                            className="w-full px-4 py-3 text-center text-lg font-bold rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-hidden transition-all"
                        />

                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
                        >
                            Masuk ke Dashboard Orang Tua
                        </button>

                        <button
                            type="button"
                            onClick={() => { sound.playPop(); setIsPinMode(true); }}
                            className="w-full text-center text-xs text-indigo-600 font-semibold hover:underline"
                        >
                            Gunakan PIN Rahasia
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmitPin} className="space-y-4">
                        <div className="bg-indigo-50/70 p-4 rounded-2xl text-center border border-indigo-200/50">
                            <p className="text-sm text-gray-700 mb-1">Masukkan PIN Orang Tua:</p>
                            <p className="text-xs text-gray-500">(Default: 1234)</p>
                        </div>

                        <input
                            type="password"
                            maxLength={6}
                            autoFocus
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            placeholder="PIN 4–6 digit"
                            className="w-full px-4 py-3 text-center text-xl font-bold tracking-widest rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-hidden transition-all"
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {isLoading ? 'Memverifikasi...' : 'Buka Kunci'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { sound.playPop(); setIsPinMode(false); }}
                            className="w-full text-center text-xs text-gray-500 hover:underline"
                        >
                            Kembali ke Tantangan Matematika
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
