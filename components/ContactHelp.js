'use client';
import { useState } from 'react';
import { Crimson_Text } from 'next/font/google';

const crimson = Crimson_Text({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
});

export default function ContactHelp() {
    const [showContactModal, setShowContactModal] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <button
                onClick={() => setShowContactModal(!showContactModal)}
                className="bg-blue-900/70 hover:bg-blue-800/90 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all hover:scale-105"
                aria-label="Contact support"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-help-circle">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                </svg>
            </button>

            {showContactModal && (
                <div className="absolute bottom-16 right-0 w-72 bg-slate-900/95 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl p-4 animate-fadeIn">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className={`text-white text-lg ${crimson.className}`}>Need help?</h4>
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="text-white/60 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="space-y-3 mb-2">
                        <div>
                            <p className="text-white/80 text-sm mb-1">Contact:</p>
                            <div className="flex gap-1 flex-col">
                                <a href="tel:+919966707911" className="text-blue-300 hover:text-blue-200 text-sm">+91 99667 07911</a>
                                <a href="tel:+919966707911" className="text-blue-300 hover:text-blue-200 text-sm">+91 91001 32572</a>
                            </div>
                        </div>
                    </div>
                    <div className="text-white/50 text-xs mt-2 border-t border-white/10 pt-2">
                        Contact for help / Report any bugs
                    </div>
                </div>
            )}
        </div>
    );
}