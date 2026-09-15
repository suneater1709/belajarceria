import React, { useEffect, useState } from 'react';

/**
 * Parallax Background dengan 4 Layer Visual (Design.md § 5)
 * Layer 0: Warna dasar / gradient modul (statis)
 * Layer 1: Elemen jauh (awan, bintang) - bergerak lambat
 * Layer 2: Elemen tengah (buku melayang, bukit, planet) - bergerak sedang
 * Layer 3: Elemen dekat (partikel kilau, bunga) - bergerak halus
 * Layer 4: Foreground (anak komponen/konten interaktif - SELALU STATIS)
 */
export default function ParallaxBackground({ moduleColor = '#6366F1', children }) {
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        const handleMediaChange = (e) => setPrefersReducedMotion(e.matches);
        mediaQuery.addEventListener('change', handleMediaChange);

        const handleMouseMove = (e) => {
            if (prefersReducedMotion) return;
            const { innerWidth, innerHeight } = window;
            const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
            setMouseOffset({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            mediaQuery.removeEventListener('change', handleMediaChange);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [prefersReducedMotion]);

    // Hitung transform per layer
    const layer1Transform = prefersReducedMotion ? 'none' : `translate(${mouseOffset.x * 10}px, ${mouseOffset.y * 8}px)`;
    const layer2Transform = prefersReducedMotion ? 'none' : `translate(${mouseOffset.x * 20}px, ${mouseOffset.y * 15}px)`;
    const layer3Transform = prefersReducedMotion ? 'none' : `translate(${mouseOffset.x * 32}px, ${mouseOffset.y * 24}px)`;

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-[#FFFBF5]">
            {/* Layer 0: Gradient Statis sesuai Tema Modul */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-15 transition-colors duration-700"
                style={{
                    background: `radial-gradient(circle at 50% 30%, ${moduleColor} 0%, #FFFBF5 75%)`
                }}
            />

            {/* Layer 1: Awan & Bintang Jauh (Bergerak Lambat) */}
            <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-300 ease-out"
                style={{ transform: layer1Transform }}
            >
                <div className="absolute top-12 left-10 w-32 h-16 bg-white/70 rounded-full blur-sm animate-float-slow shadow-sm" />
                <div className="absolute top-28 right-16 w-44 h-20 bg-white/60 rounded-full blur-sm animate-float-medium shadow-sm" />
                <div className="absolute top-60 left-1/4 w-28 h-14 bg-white/50 rounded-full blur-xs animate-float-slow" />
                <span className="absolute top-20 right-1/3 text-2xl opacity-40 select-none animate-pulse-gentle">✨</span>
                <span className="absolute top-48 left-16 text-xl opacity-30 select-none animate-pulse-gentle">⭐</span>
            </div>

            {/* Layer 2: Elemen Tematik Tengah (Bergerak Sedang) */}
            <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-200 ease-out"
                style={{ transform: layer2Transform }}
            >
                <div 
                    className="absolute bottom-20 -left-12 w-64 h-64 rounded-full opacity-10 blur-xl"
                    style={{ backgroundColor: moduleColor }}
                />
                <div 
                    className="absolute -top-10 -right-10 w-72 h-72 rounded-full opacity-10 blur-2xl"
                    style={{ backgroundColor: moduleColor }}
                />
                <span className="absolute bottom-36 left-12 text-3xl opacity-35 select-none animate-float-medium">🎈</span>
                <span className="absolute top-40 right-20 text-3xl opacity-35 select-none animate-float-slow">🌈</span>
            </div>

            {/* Layer 3: Partikel Kilau Dekat (Bergerak Lebih Cepat) */}
            <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-100 ease-out"
                style={{ transform: layer3Transform }}
            >
                <span className="absolute top-1/3 right-1/4 text-xl opacity-50 select-none animate-float-fast">⭐</span>
                <span className="absolute bottom-1/4 left-1/3 text-2xl opacity-50 select-none animate-float-fast">✨</span>
            </div>

            {/* Layer 4: Konten Interaktif Foreground (TIDAK PARALLAX - SELALU STABIL) */}
            <div className="relative z-10 w-full min-h-screen flex flex-col">
                {children}
            </div>
        </div>
    );
}
