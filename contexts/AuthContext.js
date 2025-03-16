'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Create the context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userType, setUserType] = useState(null); // 'admin', 'trader', 'company'
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    // Check if user is admin
                    if (user.email === 'mcseattop@mcse.com' || user.email === 'admin@mathsocmu.com') {
                        setUserType('admin');

                        // Get admin data if needed
                        const adminDoc = await getDoc(doc(db, 'users', user.uid));
                        setUserData(adminDoc.exists() ? adminDoc.data() : null);

                        // Set cookies and localStorage for admin
                        document.cookie = `accountType=admin; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
                        document.cookie = `token=${user.uid}; path=/; max-age=${60 * 60 * 24 * 7}`;
                        localStorage.setItem('accountType', 'admin');

                    } else {
                        // Check if user is a company
                        const companyDoc = await getDoc(doc(db, 'companies', user.uid));

                        if (companyDoc.exists()) {
                            setUserType('company');
                            setUserData(companyDoc.data());

                            // Set cookies and localStorage for company
                            document.cookie = `accountType=company; path=/; max-age=${60 * 60 * 24 * 7}`;
                            document.cookie = `token=${user.uid}; path=/; max-age=${60 * 60 * 24 * 7}`;
                            localStorage.setItem('accountType', 'company');

                        } else {
                            // Assume it's a trader
                            const userDoc = await getDoc(doc(db, 'users', user.uid));
                            setUserType('trader');
                            setUserData(userDoc.exists() ? userDoc.data() : null);

                            // Set cookies and localStorage for trader
                            document.cookie = `accountType=trader; path=/; max-age=${60 * 60 * 24 * 7}`;
                            document.cookie = `token=${user.uid}; path=/; max-age=${60 * 60 * 24 * 7}`;
                            localStorage.setItem('accountType', 'trader');
                        }
                    }

                } else {
                    // No user logged in
                    setUserType(null);
                    setUserData(null);

                    // Clear cookies and localStorage
                    document.cookie = "accountType=; path=/; max-age=0";
                    document.cookie = "token=; path=/; max-age=0";
                    localStorage.removeItem('accountType');
                }

                setCurrentUser(user);
            } catch (error) {
                console.error("Auth context error:", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const value = {
        currentUser,
        userType,
        userData,
        isAdmin: userType === 'admin',
        isCompany: userType === 'company',
        isTrader: userType === 'trader',
        isAuthenticated: !!currentUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use the auth context
export function useAuth() {
    return useContext(AuthContext);
}