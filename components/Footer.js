'use client';
import Image from 'next/image';
import { Inter, Crimson_Text } from 'next/font/google';
import { Instagram, Linkedin } from 'lucide-react';

const crimson = Crimson_Text({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export default function Footer() {
    return (
        <footer className="z-10 relative bg-[#000016]/80 backdrop-blur-sm py-8 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-10 md:px-15">
                {/* For desktop: row layout with 3 items in a row */}
                <div className="hidden md:flex items-center justify-between">
                    {/* Left - MCSE Logo */}
                    <div className="flex-shrink-0">
                        <Image
                            src="/mcsebanner.png"
                            alt="MCSE Logo"
                            width={200}
                            height={100}
                            className="object-contain"
                        />
                    </div>

                    {/* Center - Copyright Text */}
                    <div className="text-center">
                        <p className={`text-white/60 text-sm ${inter.variable} font-inter`}>
                            © {new Date().getFullYear()} All Rights Reserved. MU Mathematics Society.
                        </p>
                    </div>

                    {/* Right - Mathsoc Logo and Social Links */}
                    <div className="flex items-center">
                        <div className="mr-4">
                            <Image
                                src="/mathsoclogo.png"
                                alt="Mathsoc Logo"
                                width={70}
                                height={70}
                                className="object-contain"
                            />
                        </div>
                        <div className="text-white flex flex-col items-start">
                            <p className={`${crimson.className} text-sm font-semibold`}>
                                {"With <3"}
                            </p>
                            <p className={`${crimson.className} text-lg font-semibold mb-2`}>Mathsoc</p>
                            <div className="flex space-x-3">
                                <a
                                    href="https://www.instagram.com/mathsoc.mu/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/70 hover:text-white transition-colors"
                                >
                                    <Instagram size={18} />
                                </a>
                                <a
                                    href="https://www.linkedin.com/company/mathematics-club-mu/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white/70 hover:text-white transition-colors"
                                >
                                    <Linkedin size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                {/* For mobile: column layout with logos side by side */}
                <div className="md:hidden flex flex-col items-center space-y-6">
                    {/* Both logos side by side */}
                    <div className="flex justify-center items-center space-x-8 w-full">
                        <div className="flex-shrink-0">
                            <Image
                                src="/mcsebanner.png"
                                alt="MCSE Logo"
                                width={150}
                                height={75}
                                className="object-contain"
                            />
                        </div>

                        <div className="flex items-center">
                            <div className="mr-3">
                                <Image
                                    src="/mathsoclogo.png"
                                    alt="Mathsoc Logo"
                                    width={60}
                                    height={60}
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-white flex flex-col items-start">
                                <p className={`${crimson.className} text-sm font-semibold`}>
                                    {"With <3"}
                                </p>
                                <p className={`${crimson.className} text-lg font-semibold mb-1`}>Mathsoc</p>
                                <div className="flex space-x-3">
                                    <a
                                        href="https://www.instagram.com/mathsoc.mu/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white transition-colors"
                                    >
                                        <Instagram size={16} />
                                    </a>
                                    <a
                                        href="https://www.linkedin.com/company/mathematics-club-mu/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white transition-colors"
                                    >
                                        <Linkedin size={16} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Copyright text below */}
                    <div className="text-center">
                        <p className={`text-white/60 text-sm ${inter.variable} font-inter`}>
                            © {new Date().getFullYear()} All Rights Reserved. MU Mathematics Society.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}