'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Crimson_Text } from 'next/font/google';

// Load Crimson Text font
const crimson = Crimson_Text({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
});

export default function Navbar() {
    return (
        <nav className="relative z-10 w-full pt-10 px-10 md:px-15">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo */}
                <div className="flex-shrink-0">
                    <Link href="/">
                        <Image
                            src="/logo.png"
                            alt="MCSE Logo"
                            width={100}
                            height={100}
                            className="object-contain cursor-pointer"
                        />
                    </Link>
                </div>

                {/* Desktop Navigation Links */}
                <div className={`hidden md:flex items-center space-x-8 ${crimson.className}`}>
                    <Link href="/#about" className="text-white hover:text-blue-300 transition-colors text-2xl">
                        About
                    </Link>
                    <Link href="/#how-to" className="text-white hover:text-blue-300 transition-colors text-2xl">
                        How to
                    </Link>
                    <Link href="/#register">
                        <button className="px-5 py-2 bg-blue-950/80 hover:bg-blue-900 text-white rounded-lg transition-colors text-2xl">
                            Register
                        </button>
                    </Link>
                </div>

                {/* Mobile - Only Register Button */}
                <div className="md:hidden flex">
                    <Link href="/#register">
                        <button className={`px-5 py-2 bg-blue-950/80 hover:bg-blue-900 text-white rounded-lg transition-colors text-xl ${crimson.className}`}>
                            Sign In
                        </button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}