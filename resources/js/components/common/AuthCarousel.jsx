import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
    {
        id: 1,
        image: '/images/slides/slide-1.jpg',
        title: 'Eksplorasi Sains & Tubuh Manusia',
        subtitle: 'Mengenal keajaiban alam dan sains dengan cara ceria dan interaktif.'
    },
    {
        id: 2,
        image: '/images/slides/slide-2.jpg',
        title: 'Belajar Huruf & Kosakata Ceria',
        subtitle: 'Media pembelajaran interaktif yang ramah anak dan penuh warna.'
    },
    {
        id: 3,
        image: '/images/slides/slide-3.jpg',
        title: 'Petualangan Angka & Dunia Luas',
        subtitle: 'Mengasah logika, matematika, dan wawasan dunia dengan menyenangkan.'
    }
];

export default function AuthCarousel({ autoPlayInterval = 4500 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDES.length);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [isHovered, autoPlayInterval]);

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex - 1 + SLIDES.length) % SLIDES.length);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex + 1) % SLIDES.length);
    };

    return (
        <div 
            className="hidden md:block relative w-full h-full min-h-[480px] lg:min-h-[580px] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-inner bg-amber-100 group select-none"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Slides container */}
            <div className="relative w-full h-full">
                {SLIDES.map((slide, index) => {
                    const isActive = index === currentIndex;
                    return (
                        <div
                            key={slide.id}
                            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                                isActive 
                                    ? 'opacity-100 scale-100 z-10' 
                                    : 'opacity-0 scale-105 pointer-events-none z-0'
                            }`}
                        >
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="w-full h-full object-cover object-center"
                            />
                            {/* Subtle dark gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                            {/* Caption Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white z-20 transform transition-transform duration-700">
                                <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase mb-2 border border-white/30 text-amber-200">
                                    BelajarCeria Kids
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black font-heading tracking-wide drop-shadow-md">
                                    {slide.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-white/85 mt-1 max-w-sm drop-shadow line-clamp-2">
                                    {slide.subtitle}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Arrows (visible on hover) */}
            <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                title="Slide Sebelumnya"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                title="Slide Berikutnya"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-4 right-6 sm:right-8 z-30 flex items-center space-x-2">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                            currentIndex === index 
                                ? 'w-7 bg-amber-400 shadow-md shadow-amber-400/50' 
                                : 'w-2 bg-white/50 hover:bg-white/80'
                        }`}
                        title={`Slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
