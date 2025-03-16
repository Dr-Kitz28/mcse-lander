'use client';

import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useRouter } from 'next/navigation';
import { Crimson_Text, Inter } from 'next/font/google';
import { UserPlus, AlertCircle, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'firebase/auth';

// Load fonts
const crimson = Crimson_Text({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-crimson',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export default function CreateCompanyAccount() {
    const router = useRouter();
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [authLoading, setAuthLoading] = useState(true);

    // Modify your useEffect:
    useEffect(() => {
        // Check if the user is authorized as admin
        const checkAuth = async () => {
            setAuthLoading(true); // Start loading
            try {
                // Wait a moment for Firebase Auth to initialize
                await new Promise(resolve => setTimeout(resolve, 500));

                const currentUser = auth.currentUser;

                if (!currentUser) {
                    console.log("No current user found");
                    router.push('/adm');
                    return;
                }

                console.log("Current user email:", currentUser.email); // Debug log

                // Check if admin email
                if (currentUser.email !== 'mcseattop@mcse.com' &&
                    currentUser.email !== 'admin@mathsocmu.com') {
                    // Not an admin
                    console.log("Not an admin email");
                    await signOut(auth);
                    router.push('/adm');
                    return;
                }

                console.log("Admin authentication successful");
                setAuthLoading(false); // Auth check complete
            } catch (error) {
                console.error("Auth check error:", error);
                router.push('/adm');
            }
        };

        checkAuth();
    }, [router]);

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate symbol format (uppercase letters only)
        if (!/^[A-Z]{2,5}$/.test(symbol)) {
            setError('Symbol must be 2-5 uppercase letters (e.g., MATH, CYBR)');
            setLoading(false);
            return;
        }

        try {
            // Create the authentication account
            const result = await createUserWithEmailAndPassword(auth, email, password);

            // Create a company document in Firestore
            await setDoc(doc(db, 'companies', result.user.uid), {
                companyName,
                email,
                symbol,
                status: 'active',
                createdAt: new Date(),
                accountType: 'company', // This is important for validation
                isAdmin: false,
                lastLogin: null,
            });

            // Sign out the admin from this account immediately
            await auth.signOut();

            setSuccess(`Company account for ${companyName} (${symbol}) created successfully!`);

            // Clear form
            setCompanyName('');
            setEmail('');
            setPassword('');
            setSymbol('');
            setLoading(false);

        } catch (err) {
            console.error('Error creating company account:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already in use.');
            } else {
                setError(err.message || 'Failed to create company account.');
            }
            setLoading(false);
        }
    };

    // Add a loading state in your return:
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/adm" className="flex items-center text-white/70 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={16} className="mr-2" />
                    <span className={`${inter.variable} font-inter`}>Back to Admin Dashboard</span>
                </Link>

                <div className="bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg p-8 shadow-lg">
                    <div className="mb-6">
                        <h1 className={`text-2xl text-white font-bold ${crimson.className}`}>Create Company Account</h1>
                        <p className={`text-white/70 mt-1 ${inter.variable} font-inter`}>
                            Use this form to create new company accounts for news publication.
                        </p>
                    </div>

                    <form onSubmit={handleCreateCompany} className={`space-y-6 ${inter.variable} font-inter`}>
                        {error && (
                            <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-md flex items-center">
                                <AlertCircle size={20} className="mr-2" />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-900/30 border border-green-500/30 text-green-400 px-4 py-3 rounded-md flex items-center">
                                <Check size={20} className="mr-2" />
                                {success}
                            </div>
                        )}

                        <div>
                            <label className="block text-white mb-2">Company Name</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., Mathematics Society"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-2">Stock Symbol</label>
                            <input
                                type="text"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., MATH"
                                required
                                maxLength={5}
                            />
                            <p className="text-xs text-white/50 mt-1">2-5 uppercase letters only</p>
                        </div>

                        <div>
                            <label className="block text-white mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="company@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/60 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Strong password"
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-white/50 mt-1">Minimum 8 characters</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg transition-all backdrop-blur-sm text-white flex items-center justify-center ${loading ? 'bg-blue-600/30 cursor-not-allowed' : 'bg-blue-600/40 hover:bg-blue-500/40'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} className="mr-2" />
                                    Create Company Account
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}