'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase';

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Redirect to user's dashboard
                router.push(`/dashboard/${user.uid}`);
            } else {
                // No user logged in, redirect to home
                router.push('/');
            }
        });

        return () => unsubscribe();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
}