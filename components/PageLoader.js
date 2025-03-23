'use client';
import { useState, useEffect } from 'react';
import { Crimson_Text } from 'next/font/google';

// Load Crimson Text font
const crimson = Crimson_Text({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
});

export default function PageLoader() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading delay and then fade out
        const timer = setTimeout(() => {
            const loader = document.querySelector('.page-loader');
            if (loader) {
                loader.classList.add('page-loader-fade-out');
            }

            // Set state after animation completes
            setTimeout(() => {
                setIsLoading(false);
            }, 700); // Match the animation duration
        }, 1800);

        return () => clearTimeout(timer);
    }, []);

    if (!isLoading) return null;

    // Use predefined classes for consistent server and client rendering
    return (
        <div className="page-loader">
            <div className="relative w-72 h-40 mb-8">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 100 50"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0,25 L10,30 L20,15 L30,25 L40,20 L50,10 L60,30 L70,20 L80,25 L90,5 L100,15"
                        fill="none"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeDasharray="300"
                        strokeDashoffset="300"
                        className="animate-draw-line"
                    />

                    <path
                        d="M0,30 L15,35 L25,20 L40,35 L55,25 L70,30 L85,15 L100,20"
                        fill="none"
                        stroke="white"
                        strokeWidth="0.8"
                        strokeOpacity="0.4"
                        className="animate-fade-line"
                        style={{ animationDelay: '0.3s' }}
                    />
                </svg>

                <div className="absolute inset-0 -z-10 opacity-30">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className={`absolute w-0.5 bg-white animate-grow bar-${i + 1}`}
                            style={{
                                left: `${5 + i * 8}%`,
                                bottom: `${10 + (i % 4) * 10}%`,
                                animationDuration: `${1.2 + (i % 3) * 0.3}s`,
                                opacity: 0.5
                            }}
                        ></div>
                    ))}
                </div>
            </div>

            <div className="text-center relative z-10">
                <h2 className={`text-5xl text-white font-semibold mb-3 ${crimson.className} animate-pulse-text`}>
                    MCSE
                </h2>
            </div>
        </div>
    );
}