'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { useRouter } from 'next/navigation';
import { Crimson_Text, Inter } from 'next/font/google';
import { Lock, AlertCircle, Check } from 'lucide-react';
import Link from 'next/link';

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

export default function CompanyLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        console.log("Attempting login for:", email);

        try {
            // Sign in with email and password
            const result = await signInWithEmailAndPassword(auth, email, password);
            console.log("Auth successful, user ID:", result.user.uid);

            // Important: Set cookies and localStorage right after successful auth
            document.cookie = `token=${result.user.uid}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
            document.cookie = `accountType=company; path=/; max-age=${60 * 60 * 24 * 7}`;
            localStorage.setItem('accountType', 'company');

            try {
                // Check if this user is actually a company account
                const companyRef = doc(db, 'companies', result.user.uid);
                const userDoc = await getDoc(companyRef);
                console.log("Company document exists:", userDoc.exists());

                if (!userDoc.exists()) {
                    // This is not a company account
                    await auth.signOut();
                    setError('This account is not authorized as a company. Please use a company account.');
                    setLoading(false);
                    return;
                }

                // Verify account is active
                if (userDoc.data().status !== 'active') {
                    await auth.signOut();
                    setError('This company account has been deactivated. Please contact the administrator.');
                    setLoading(false);
                    return;
                }

                // Update last login time in Firestore - wrap in try/catch to avoid blocking login
                try {
                    await updateDoc(doc(db, 'companies', result.user.uid), {
                        lastLogin: new Date()
                    });
                } catch (updateErr) {
                    console.error("Failed to update last login:", updateErr);
                    // Continue with login despite this error
                }

                // Company login successful
                setSuccess('Login successful! Redirecting to dashboard...');

                // Redirect to company dashboard
                setTimeout(() => {
                    router.push('/company/dashboard');
                }, 1500);

            } catch (docErr) {
                console.error("Error checking company document:", docErr);

                if (docErr.code === 'permission-denied') {
                    setError('Your account does not have permission to access the company portal. Please contact the administrator.');

                    // Important debugging info to console
                    console.log("Auth UID:", result.user.uid);
                    console.log("Email:", result.user.email);

                    // Sign out since this isn't a company account
                    await auth.signOut();
                } else {
                    setError('Error verifying company account. Please try again later.');
                }

                setLoading(false);
            }

        } catch (err) {
            console.error('Login error:', err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(err.message || 'Failed to login. Please check your credentials.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900/30 backdrop-blur-sm border border-white/10 rounded-lg p-8 shadow-lg">
                <div className="text-center mb-8">
                    <h1 className={`text-3xl text-white font-bold ${crimson.className}`}>Company Portal</h1>
                    <p className={`text-white/70 mt-2 ${inter.variable} font-inter`}>
                        Log in to manage your company news and updates
                    </p>
                </div>

                <form onSubmit={handleLogin} className={`space-y-6 ${inter.variable} font-inter`}>
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
                            placeholder="••••••••"
                            required
                        />
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
                                Logging in...
                            </>
                        ) : (
                            <>
                                <Lock size={18} className="mr-2" />
                                Log In
                            </>
                        )}
                    </button>

                    <div className="text-center text-white/50 text-sm">
                        <p>
                            Not a company? <Link href="/login" className="text-blue-400 hover:text-blue-300">Trader Login</Link>
                        </p>
                        <p className="mt-1">
                            Need company access? <Link href="/contact" className="text-blue-400 hover:text-blue-300">Contact Admin</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}