'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Crimson_Text, Inter } from 'next/font/google';
import { UserPlus, TrendingUp, Bell, Check, X, Instagram, Linkedin, Heart } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, deleteDoc, writeBatch, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { sanitizeUsername, normalizeEmail } from '../utils/sanitize';

// Load Crimson Text font
const crimson = Crimson_Text({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-crimson',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function Home() {
  // Core mobile/UI states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  // Auth states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // New for success messages

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Profile setup states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Username validation states (keep existing)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [debouncedUsername, setDebouncedUsername] = useState('');

  // Registration flow control
  const [registrationStep, setRegistrationStep] = useState('login'); // login, profile-setup, success



  // Add effect to check username when debounced value changes
  useEffect(() => {
    // If no username or too short, skip check
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setIsCheckingUsername(false);
      return;
    }

    // Set checking state to true right away
    setIsCheckingUsername(true);

    // Create a timer that will delay the actual check
    const timer = setTimeout(async () => {
      try {

        // Check if username exists in the usernames collection
        const usernameDoc = await getDoc(doc(db, 'usernames', debouncedUsername));

        if (usernameDoc.exists()) {
          setUsernameError('This username is already taken');
        } else {
          setUsernameError(null);
        }
      } catch (err) {
      } finally {
        setIsCheckingUsername(false);
      }
    }, 200); // Increase to 800ms for a more noticeable debounce

    return () => clearTimeout(timer);
  }, [debouncedUsername]);


  // const handlePasswordReset = async () => {
  //   if (!loginEmail) {
  //     setError("Please enter your email address first");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // First check if this email is in the approved_emails collection
  //     const normalizedEmail = loginEmail.toLowerCase().trim();
  //     const approvedEmailDoc = await getDoc(doc(db, 'approved_emails', normalizedEmail));

  //     if (!approvedEmailDoc.exists()) {
  //       setError("This email is not registered. Please register through the Unifest site first.");
  //       setLoading(false);
  //       return;
  //     }

  //     // If email is approved, send the reset password email
  //     await sendPasswordResetEmail(auth, normalizedEmail);
  //     setResetEmailSent(true);
  //     setError(null);
  //     setSuccess("Password reset email sent! Please check your inbox and spam folder.");
  //   } catch (err) {

  //     // Handle specific Firebase Auth errors
  //     if (err.code === 'auth/user-not-found') {
  //       setError('This email is not registered. Please register through the Unifest site first.');
  //     } else if (err.code === 'auth/invalid-email') {
  //       setError('Please enter a valid email address.');
  //     } else if (err.code === 'auth/too-many-requests') {
  //       setError('Too many attempts. Please try again later.');
  //     } else {
  //       setError(`Failed to send reset email: ${err.message}`);
  //     }
  //   }
  //   setLoading(false);
  // };

  const handlePasswordReset = async () => {
    if (!loginEmail) {
      setError("Please enter your email address first");
      return;
    }

    // Check local storage for too many reset attempts
    const resetAttempts = JSON.parse(localStorage.getItem('resetAttempts') || '{"count": 0, "timestamp": 0}');
    const now = Date.now();

    // Reset counter after 24 hours
    if (now - resetAttempts.timestamp > 24 * 60 * 60 * 1000) {
      resetAttempts.count = 0;
    }

    // Limit to 3 attempts per day
    if (resetAttempts.count >= 3) {
      setError("Too many password reset attempts. Please try again tomorrow or contact support.");
      return;
    }

    setLoading(true);
    try {
      // Add small random delay to prevent timing attacks (200-500ms)
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      // Normalized and sanitized email
      const normalizedEmail = loginEmail.toLowerCase().trim();

      // First check if this email is in the approved_emails collection
      const approvedEmailDoc = await getDoc(doc(db, 'approved_emails', normalizedEmail));

      if (!approvedEmailDoc.exists()) {
        // Don't increment counter for non-registered emails
        setError("This email is not registered. Please register through the Unifest site first.");
        setLoading(false);
        return;
      }

      // If email is approved, send the reset password email
      await sendPasswordResetEmail(auth, normalizedEmail);

      // Increment reset attempt counter
      resetAttempts.count++;
      resetAttempts.timestamp = now;
      localStorage.setItem('resetAttempts', JSON.stringify(resetAttempts));

      setResetEmailSent(true);
      setError(null);
      setSuccess("Password reset email sent! Please check your inbox and spam folder.");


    } catch (err) {

      // Handle specific Firebase Auth errors
      if (err.code === 'auth/user-not-found') {
        setError('This email is not registered. Please register through the Unifest site first.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(`Failed to send reset email. Please try again later.`);
      }

      // Still increment counter for failed attempts
      resetAttempts.count++;
      resetAttempts.timestamp = now;
      localStorage.setItem('resetAttempts', JSON.stringify(resetAttempts));
    }
    setLoading(false);
  };

  // Add this function to handle signing out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      // Reset state
      setUser(null);
      setRegistrationStep('login');
      setIsFirstLogin(false);
      setName('');
      setUsername('');
      setSuccess(null);
      setError(null);
    } catch (err) {
      setError(`Failed to sign out: ${err.message}`);
    }
    setLoading(false);
  };

  // const handleLoginSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError(null);
  //   setSuccess(null);

  //   try {
  //     // Sign in with email and password
  //     const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
  //     const currentUser = userCredential.user;
  //     setUser(currentUser);

  //     // Auth state listener will handle the rest
  //   } catch (err) {

  //     if (err.code === 'auth/invalid-email') {
  //       setError('Please enter a valid email address');
  //     } else if (err.code === 'auth/user-not-found') {
  //       setError('No account found with this email. Please contact administrator.');
  //     } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
  //       setError('Incorrect email or password. Please try again.');
  //     } else if (err.code === 'auth/too-many-requests') {
  //       setError('Too many failed login attempts. Please try again later or reset your password.');
  //     } else {
  //       setError(`Login failed: ${err.message}`);
  //     }
  //   }

  //   setLoading(false);
  // };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Get login attempts from local storage
    const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{"count": 0, "timestamp": 0}');
    const now = Date.now();

    // Reset counter after 30 minutes
    if (now - loginAttempts.timestamp > 1800000) {
      loginAttempts.count = 0;
    }

    // Progressive delay for brute force protection
    if (loginAttempts.count >= 3) {
      const delayTime = Math.min(2000, loginAttempts.count * 500);
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }

    try {
      // Security: Always add a small random delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      // Sanitize and normalize email
      const sanitizedEmail = normalizeEmail(loginEmail);

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, loginPassword);
      const currentUser = userCredential.user;

      // Reset failed attempts on success
      localStorage.setItem('loginAttempts', JSON.stringify({ "count": 0, "timestamp": now }));

      setUser(currentUser);

    } catch (err) {
      // Update failed attempts
      loginAttempts.count++;
      loginAttempts.timestamp = now;
      localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

      // Generic error for first attempts, more specific for repeated failures
      if (loginAttempts.count >= 3) {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        if (err.code === 'auth/invalid-email') {
          setError('Please enter a valid email address');
        } else if (err.code === 'auth/user-not-found') {
          setError('No account found with this email. Please contact administrator.');
        } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('Incorrect email or password. Please try again.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many failed login attempts. Please try again later or reset your password.');
        } else {
          setError(`Login failed: ${err.message}`);
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        try {
          // First check if email is approved
          const approvedEmailDoc = await getDoc(doc(db, 'approved_emails', currentUser.email));

          if (!approvedEmailDoc.exists()) {
            setError("Your account is not authorized. Please contact administrator.");
            await auth.signOut();
            setUser(null);
            setRegistrationStep('login');
            return;
          }

          // Clean up email to lowercase for consistent querying
          const userEmail = currentUser.email.toLowerCase().trim();

          try {
            // Query user profiles by email field
            const profilesQuery = query(
              collection(db, 'user_profiles'),
              where('email', '==', userEmail),
              limit(1)
            );

            const profileSnapshot = await getDocs(profilesQuery);

            if (!profileSnapshot.empty) {
              // Profile exists, but need to check if username is set
              const profileDoc = profileSnapshot.docs[0];
              const userData = profileDoc.data();


              // Check if username exists
              if (userData.username) {
                // User has username set, proceed to success
                setUsername(userData.username);
                localStorage.setItem('userProfileId', profileDoc.id);
                localStorage.setItem('userUsername', userData.username);
                setRegistrationStep('success');
                setIsFirstLogin(false);
              } else {
                setRegistrationStep('profile-setup');
                setIsFirstLogin(true);
              }
            } else {
              setRegistrationStep('profile-setup');
              setIsFirstLogin(true);
            }
          } catch (profileError) {

            // Permission denied is expected for first-time users
            if (profileError.code === 'permission-denied') {
              setRegistrationStep('profile-setup');
              setIsFirstLogin(true);
            } else {
              setError(`Error retrieving profile: ${profileError.message}`);
            }
          }
        } catch (error) {
          setError("An error occurred. Please try again.");
        }
      } else {
        // User not logged in
        setUser(null);
        setRegistrationStep('login');
        setIsFirstLogin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Effect to refresh user state periodically when waiting for verification
  useEffect(() => {
    let interval;

    if (registrationStep === 'verifying' && user) {
      // Check for verification without any timer
      interval = setInterval(async () => {
        try {
          await user.reload();
          const updatedUser = auth.currentUser;

          if (updatedUser && updatedUser.emailVerified) {
            clearInterval(interval);

            try {
              // Check if user already has profile
              const userDoc = await getDoc(doc(db, 'users', updatedUser.uid));

              if (userDoc.exists()) {
                setRegistrationStep('payment');
              } else {
                // If no profile exists, go to profile setup screen
                setRegistrationStep('profile-setup');
              }

            } catch (err) {

              // Default to profile setup if there's any error
              setRegistrationStep('profile-setup');
            }
          }
        } catch (err) {

        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [registrationStep, user]);

  // Check if email domain is allowed
  const isValidUniversityEmail = (email) => {
    const domain = email.split('@')[1];
    return !commonEmailDomains.includes(domain);
  };

  // First, add this function at the top level of your component
  const checkUsernameAvailability = async (username) => {
    try {


      // Check directly in the usernames collection
      const usernameDoc = await getDoc(doc(db, 'usernames', username));

      // If document doesn't exist, username is available
      const isAvailable = !usernameDoc.exists();

      return isAvailable;
    } catch (err) {
      return null; // Indicate error
    }
  };

  // Add these functions to your component
  const updateUsername = async (username) => {
    setUsername(username);

    // Reset error and checking state
    setUsernameError(null);

    // Basic validation first
    if (!username) return;

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setUsernameError('Only letters, numbers, underscore, dots, and hyphens allowed');
      return;
    }

    // Start debounced check
    setIsCheckingUsername(true);

    // Update debounced username to trigger the useEffect
    setDebouncedUsername(username);
  };

  // Update the handleUsernameChange function
  // const handleUsernameChange = (e) => {
  //   const value = e.target.value.trim().toLowerCase();
  //   setUsername(value);

  //   // Set checking state immediately when typing
  //   setIsCheckingUsername(true);

  //   // Basic validation
  //   if (value.length < 3) {
  //     setUsernameError('Username must be at least 3 characters');
  //     setIsCheckingUsername(false); // No need to check if too short
  //   } else if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
  //     setUsernameError('Only letters, numbers, underscore, dots, and hyphens allowed');
  //     setIsCheckingUsername(false); // No need to check if invalid chars
  //   } else {
  //     // Only update debouncedUsername if the input is potentially valid
  //     // This will trigger the useEffect above with a delay
  //     setTimeout(() => {
  //       setDebouncedUsername(value);
  //     }, 400); // Add a small delay before updating debouncedUsername
  //   }
  // };

  const handleUsernameChange = (e) => {
    // Get raw value and sanitize it
    const rawValue = e.target.value;
    const value = sanitizeUsername(rawValue.trim().toLowerCase());

    // Update immediately if different (prevents weird states)
    if (value !== rawValue) {
      e.target.value = value;
    }

    setUsername(value);
    setIsCheckingUsername(true);

    // Basic validation
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsCheckingUsername(false);
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
      setUsernameError('Only letters, numbers, underscore, dots, and hyphens allowed');
      setIsCheckingUsername(false);
    } else {
      // Only update debouncedUsername for potentially valid usernames
      // This prevents unnecessary Firestore queries
      clearTimeout(window.usernameDebounceTimer);
      window.usernameDebounceTimer = setTimeout(() => {
        setDebouncedUsername(value);
      }, 400);
    }
  };

  // const handleProfileSetup = async (e) => {
  //   e.preventDefault();

  //   if (!user) {
  //     setError("You need to be signed in to complete profile setup");
  //     return;
  //   }

  //   // Validate username only
  //   if (username.length < 3) {
  //     setError('Username must be at least 3 characters long');
  //     return;
  //   }

  //   if (usernameError) {
  //     setError(`Username issue: ${usernameError}`);
  //     return;
  //   }

  //   setLoading(true);
  //   setError(null);

  //   try {
  //     // Check username availability one last time
  //     const usernameDoc = await getDoc(doc(db, 'usernames', username));
  //     if (usernameDoc.exists()) {
  //       setError('This username was just taken by someone else. Please choose another.');
  //       setLoading(false);
  //       return;
  //     }

  //     // Get normalized email
  //     const userEmail = user.email.toLowerCase().trim();

  //     // Check if the user profile already exists (we're just adding the username)
  //     const userProfiles = await getDocs(
  //       query(collection(db, 'user_profiles'), where('email', '==', userEmail), limit(1))
  //     );

  //     let profileId;
  //     const batch = writeBatch(db);

  //     if (!userProfiles.empty) {
  //       // User profile exists - UPDATE instead of CREATE
  //       const profileDoc = userProfiles.docs[0];
  //       profileId = profileDoc.id;

  //       // Update the existing profile with the username
  //       batch.update(doc(db, 'user_profiles', profileId), {
  //         username: username,
  //         updatedAt: new Date().toISOString()
  //       });
  //     } else {
  //       // Profile doesn't exist - CREATE a new one

  //       // Create profile data
  //       const profileData = {
  //         email: userEmail,
  //         username: username,
  //         registrationCompleted: true,
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString()
  //       };

  //       // Create a new profile document with auto ID
  //       const profileRef = doc(collection(db, 'user_profiles'));
  //       profileId = profileRef.id;
  //       batch.set(profileRef, profileData);
  //     }

  //     // Then create the username document linking to the profile
  //     const usernameRef = doc(db, 'usernames', username);
  //     batch.set(usernameRef, {
  //       email: userEmail,
  //       profileId: profileId,
  //       createdAt: new Date().toISOString()
  //     });

  //     // Ensure the email is approved
  //     batch.set(doc(db, 'approved_emails', userEmail), {
  //       registered: true,
  //       timestamp: new Date().toISOString()
  //     }, { merge: true });

  //     // Commit all changes
  //     await batch.commit();

  //     // Store in localStorage
  //     localStorage.setItem('userUsername', username);
  //     localStorage.setItem('userProfileId', profileId);
  //     localStorage.setItem('registrationComplete', 'true');

  //     // Success!
  //     setRegistrationStep('success');
  //     setIsFirstLogin(false);
  //     setSuccess("Username has been set successfully!");

  //   } catch (err) {
  //     setError(`Failed to complete setup: ${err.message}`);
  //   }

  //   setLoading(false);
  // };

  // Replace your handleProfileSetup function with this enhanced version
  const handleProfileSetup = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You need to be signed in to complete profile setup");
      return;
    }

    // Sanitize and validate username
    const sanitizedUsername = sanitizeUsername(username.trim().toLowerCase());
    if (sanitizedUsername !== username) {
      setUsername(sanitizedUsername);
    }

    if (sanitizedUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (usernameError) {
      setError(`Username issue: ${usernameError}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check for tampering with client-side validation
      if (!/^[a-zA-Z0-9_.-]+$/.test(sanitizedUsername)) {
        throw new Error('Invalid username format');
      }

      // Check username availability one last time
      const usernameDoc = await getDoc(doc(db, 'usernames', sanitizedUsername));
      if (usernameDoc.exists()) {
        setError('This username was just taken by someone else. Please choose another.');
        setLoading(false);
        return;
      }

      // Get normalized email
      const userEmail = normalizeEmail(user.email);

      // Add a transaction for atomicity
      const userProfiles = await getDocs(
        query(collection(db, 'user_profiles'), where('email', '==', userEmail), limit(1))
      );

      let profileId;
      let batch = writeBatch(db);

      // Check if too many profiles exist for this email (security check)
      const allUserProfiles = await getDocs(
        query(collection(db, 'user_profiles'), where('email', '==', userEmail))
      );

      if (allUserProfiles.size > 3) {
        throw new Error('Too many profiles associated with this email. Please contact support.');
      }

      if (!userProfiles.empty) {
        // Existing profile - UPDATE instead of CREATE
        const profileDoc = userProfiles.docs[0];
        profileId = profileDoc.id;

        // Don't use batch for this first operation
        try {
          await setDoc(doc(db, 'user_profiles', profileId), {
            username: sanitizedUsername,
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (updateError) {
          throw updateError;
        }
      } else {

        // Profile data
        const profileData = {
          email: userEmail,
          username: sanitizedUsername,
          registrationCompleted: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        try {
          // Create with separate operation
          const profileRef = await addDoc(collection(db, 'user_profiles'), profileData);
          profileId = profileRef.id;
        } catch (createError) {
          throw createError;
        }
      }

      // Create username separately
      try {
        await setDoc(doc(db, 'usernames', sanitizedUsername), {
          email: userEmail,
          profileId: profileId,
          createdAt: new Date().toISOString()
        });
      } catch (usernameError) {
        throw usernameError;
      }

      // Store securely in localStorage
      localStorage.setItem('userUsername', sanitizedUsername);
      localStorage.setItem('userProfileId', profileId);
      localStorage.setItem('registrationComplete', 'true');

      // Clear any stored attempt counters
      localStorage.removeItem('loginAttempts');
      localStorage.removeItem('resetAttempts');

      // Success!
      setRegistrationStep('success');
      setIsFirstLogin(false);
      setSuccess("Username has been set successfully!");

    } catch (err) {

      if (err.code === 'permission-denied') {
        setError("Permission denied. Please check your account permissions.");
      } else {
        setError(`Failed to complete setup: ${err.message}`);
      }
    }

    setLoading(false);
  };

  // Update the verification checker to move to profile setup instead of directly to payment
  useEffect(() => {
    let interval;

    if (registrationStep === 'verifying' && user) {
      // Same verification timer logic as before

      // Check for verification
      interval = setInterval(async () => {
        try {
          await user.reload();
          const updatedUser = auth.currentUser;

          if (updatedUser && updatedUser.emailVerified) {
            clearInterval(interval);

            try {
              // Check if the user already has a profile
              const userDoc = await getDoc(doc(db, 'users', updatedUser.uid));

              if (userDoc.exists()) {
                // User already has a profile, go to payment
                setRegistrationStep('payment');
              } else {
                // User doesn't have a profile yet, go to profile setup
                setRegistrationStep('profile-setup');
              }
            } catch (firestoreErr) {
              // Default to profile setup
              setRegistrationStep('profile-setup');
            }
          }
        } catch (err) {
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [registrationStep, user]);

  // Modified screenshot handler - just store file metadata for now
  // const handleScreenshotChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     // Make sure the file size is reasonable (< 1MB) since we're storing in Firestore
  //     if (file.size > 1024 * 1024) {
  //       setPaymentError("Screenshot is too large. Please upload an image smaller than 1MB.");
  //       return;
  //     }

  //     // Store file metadata and the file itself
  //     setPaymentDetails({
  //       ...paymentDetails,
  //       screenshot: {
  //         name: file.name,
  //         type: file.type,
  //         size: file.size,
  //         file: file // Store the actual file for later base64 conversion
  //       }
  //     });
  //   }
  // };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Main content - Hero Section */}
      <section className="min-h-[70vh] flex items-center justify-center z-10">
        <div className="max-w-4xl px-4 sm:px-10 md:px-15">
          <div className="text-white flex flex-col items-start">
            <h1 className={`text-6xl sm:text-7xl md:text-8xl mb-4 ${crimson.className} font-semibold px-4 sm:px-6 break-words`}>
              Markets move,<br />
              <span>clubs compete.</span>
            </h1>
            <div className="text-left px-4 sm:px-6">
              <h2 className={`text-2xl sm:text-3xl ${inter.variable} font-inter`}>
                @ Mahindra University
              </h2>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="z-10 relative bg-transparent py-16 selection:bg-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 md:px-15">
          <h2 className={`text-4xl md:text-5xl text-white font-bold mb-10 ${crimson.className} border-b border-dotted border-white inline-block pb-2`}>
            About
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Card - styled like How To cards */}
            <div className="text-center backdrop-blur-sm p-8 rounded-lg border border-blue-500/20 shadow-lg bg-blue-900/10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-center mb-6">
                  <TrendingUp size={48} className="text-blue-300" />
                </div>
                <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>
                  What we offer
                </h3>
                <p className={`text-white/80 ${inter.variable} font-inter leading-relaxed`}>
                  Compete in a dynamic stock market simulation where university clubs act as companies! Trade in real-time, analyze market trends, and refine your investment strategies to build the strongest portfolio. Experience fast-paced trading with live updates and strategic decision-making to maximize your returns over the 3-day event.
                </p>
              </div>

              {/* Visual bottom section to fill space */}
              <div className="mt-8 pt-4 border-t border-blue-500/20">
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">3</div>
                    <div className="text-white/60 text-sm">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">15+</div>
                    <div className="text-white/60 text-sm">Clubs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">₹50k+</div>
                    <div className="text-white/60 text-sm">Prize Pool</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card - styled like How To cards */}
            <div className="text-center backdrop-blur-sm p-8 rounded-lg border border-blue-500/20 shadow-lg bg-blue-900/10">
              <div className="flex justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <h3 className={`text-2xl text-white font-semibold mb-6 ${crimson.className}`}>
                Important dates
              </h3>

              {/* Timeline Design */}
              <div className="relative pt-2 pb-1">
                {/* Vertical timeline line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-blue-500/30"></div>

                <div className={`${inter.variable} font-inter text-sm`}>
                  {/* Registration Opens */}
                  <div className="relative flex items-center justify-between mb-8">
                    <div className="w-5/12 pr-2 text-right">
                      <p className="font-medium text-white">Registration opens</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-4 h-4 rounded-full bg-green-500/30 animate-ping"></div>
                        <div className="relative w-3 h-3 rounded-full bg-green-500 border-2 border-green-300"></div>
                      </div>
                    </div>
                    <div className="w-5/12 pl-2 text-left">
                      <p className="text-white/70">March 24</p>
                    </div>
                  </div>

                  {/* IPO Applications Open */}
                  <div className="relative flex items-center justify-between mb-8">
                    <div className="w-5/12 pr-2 text-right">
                      <p className="font-medium text-white">IPO Applications</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300 z-10"></div>
                    <div className="w-5/12 pl-2 text-left">
                      <p className="text-white/70">April 1-3</p>
                    </div>
                  </div>

                  {/* IPO Allotment */}
                  <div className="relative flex items-center justify-between mb-8">
                    <div className="w-5/12 pr-2 text-right">
                      <p className="font-medium text-white">IPO Allotment</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300 z-10"></div>
                    <div className="w-5/12 pl-2 text-left">
                      <p className="text-white/70">April 3</p>
                    </div>
                  </div>

                  {/* IPO Listing */}
                  <div className="relative flex items-center justify-between mb-8">
                    <div className="w-5/12 pr-2 text-right">
                      <p className="font-medium text-white">IPO Listing, Market Opens</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300 z-10"></div>
                    <div className="w-5/12 pl-2 text-left">
                      <p className="text-white/70">April 4</p>
                    </div>
                  </div>

                  {/* Closing Ceremony */}
                  <div className="relative flex items-center justify-between">
                    <div className="w-5/12 pr-2 text-right">
                      <p className="font-medium text-white">Closing Ceremony</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-300 z-10"></div>
                    <div className="w-5/12 pl-2 text-left">
                      <p className="text-white/70">April 6</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Section */}
      <section id="how-to" className="z-10 relative bg-transparent py-16 selection:bg-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 md:px-15">
          <h2 className={`text-4xl md:text-5xl text-white font-bold mb-10 ${crimson.className} border-b border-dotted border-white inline-block pb-2`}>
            How to
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Register */}
            <div className="text-center p-6">
              <div className="flex justify-center mb-6">
                <UserPlus size={48} className="text-blue-300" />
              </div>
              <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>
                Register
              </h3>
              <p className={`text-white/80 ${inter.variable} font-inter`}>
                Sign up with your university email to get started & Receive virtual currency
              </p>
            </div>

            {/* Card 2 - Start Trading */}
            <div className="text-center p-6">
              <div className="flex justify-center mb-6">
                <TrendingUp size={48} className="text-blue-300" />
              </div>
              <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>
                Start Trading
              </h3>
              <p className={`text-white/80 ${inter.variable} font-inter`}>
                Buy and sell club stocks accordingly to maximize your profits
              </p>
            </div>

            {/* Card 3 - More... */}
            <div className="text-center p-6">
              <div className="flex justify-center mb-6">
                <Bell size={48} className="text-blue-300" />
              </div>
              <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>
                More...
              </h3>
              <p className={`text-white/80 ${inter.variable} font-inter`}>
                Any updates and news will be published on this website and also through mail
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="register" className="z-10 relative bg-transparent py-16 selection:bg-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 md:px-15">
          <h2 className={`text-4xl md:text-5xl text-white font-bold mb-10 ${crimson.className} border-b border-dotted border-white inline-block pb-2`}>
            One step away
          </h2>

          <div className="max-w-3xl mx-auto bg-white/0 backdrop-blur-sm p-8 rounded-lg border border-white/20 shadow-lg">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/40 text-white p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/40 text-white p-4 rounded-lg mb-6">
                {success}
              </div>
            )}

            {/* Login Form */}
            {registrationStep === 'login' && (
              <form className={`${inter.variable} font-inter animate-fadeIn`} onSubmit={handleLoginSubmit}>
                <div className="mb-8 text-center">
                  <h2 className={`text-2xl text-white font-semibold ${crimson.className}`}>
                    Sign in to MCSE
                  </h2>
                  <p className="text-white/60 mt-2">
                    Your login credentials will be sent to you via email.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Email field */}
                  <div>
                    <label htmlFor="loginEmail" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      id="loginEmail"
                      placeholder="your.email@example.com"
                      className="w-full bg-slate-800/40 border border-white/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>

                  {/* Password field */}
                  <div>
                    <label htmlFor="loginPassword" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                      Password
                    </label>
                    <input
                      type="password"
                      id="loginPassword"
                      placeholder="Enter your password"
                      className="w-full bg-slate-800/40 border border-white/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                  </div>

                  {/* Submit and Reset Password buttons */}
                  <div className="pt-2 flex flex-col md:flex-row md:justify-between items-center">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-9 py-3 bg-blue-950/60 ${crimson.className} hover:bg-blue-900 text-white rounded-lg transition-all text-xl font-medium shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg focus:ring-2 focus:ring-blue-900/50'}`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing In...
                        </span>
                      ) : 'Sign In'}
                    </button>

                    <div className="text-center mt-4 md:mt-0">
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className={`text-blue-300 hover:text-blue-200 text-lg ${crimson.className} ${loading || resetEmailSent ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading || resetEmailSent}
                      >
                        {loading && !resetEmailSent ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </span>
                        ) : resetEmailSent ? 'Reset email sent' : 'Reset password?'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-white/50 text-sm text-center">
                    Don&apos;t have an account? Please contact administrator or visit
                    <a
                      href="https://unifest.in/fests/52?tab=competition&search=The%20Math%20Club%20Stock%20Exchange"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 ml-1"
                    >
                      the registration site
                    </a>.
                  </p>
                  <p className='text-white/50 text-sm text-center mt-2'>
                    If you have already registered, your account will be processed within one hour at most.
                  </p>
                </div>
              </form>
            )}

            {/* Profile Setup Form - Username only */}
            {registrationStep === 'profile-setup' && (
              <div className="py-8 relative">
                <div className="absolute top-0 right-0">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-3 py-1.5 bg-transparent border border-white/20 text-white/60 rounded-md hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>

                <div className="mb-8 text-center">
                  <div className="w-20 h-20 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl text-white font-semibold mb-2 ${crimson.className}`}>Choose a Username</h3>
                  <p className={`text-white/80 ${inter.variable} font-inter mb-2`}>
                    Select a unique username for your MCSE account
                  </p>
                  <p className={`text-white/60 ${inter.variable} font-inter text-sm mb-6`}>
                    Welcome, {user?.email}!
                  </p>
                </div>

                <form className={`${inter.variable} font-inter max-w-md mx-auto`} onSubmit={handleProfileSetup}>
                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                      Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="username"
                        placeholder="Choose a username"
                        className={`w-full bg-slate-800/40 border rounded-md py-3 px-4 text-white pr-10 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${isCheckingUsername
                          ? "border-yellow-500/50 focus:ring-yellow-500/30"
                          : usernameError
                            ? "border-red-500/50 focus:ring-red-500/30"
                            : username.length >= 3
                              ? "border-green-500/50 focus:ring-green-500/30"
                              : "border-white/20 focus:ring-blue-500/50"
                          }`}
                        required
                        value={username}
                        onChange={handleUsernameChange}
                        autoComplete="off"
                      />
                      {/* Status icon */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isCheckingUsername ? (
                          <svg className="animate-spin h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : usernameError ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        ) : username.length >= 3 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : null}
                      </div>
                    </div>
                    {/* Username feedback */}
                    {usernameError && (
                      <p className="mt-1 text-xs text-red-400">{usernameError}</p>
                    )}
                    {!usernameError && username.length >= 3 && !isCheckingUsername && (
                      <p className="mt-1 text-xs text-green-400">Username is available!</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <div className="mt-8">
                    <button
                      type="submit"
                      className={`w-full px-9 py-3 bg-blue-950/60 ${crimson.className} text-white rounded-lg transition-all text-xl font-medium shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-900 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-900/50'
                        }`}
                      disabled={loading || isCheckingUsername || usernameError || !username}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Setting Up...
                        </span>
                      ) : 'Complete Setup'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Success Screen */}
            {registrationStep === 'success' && (
              <div className="text-center py-8 relative">
                <div className="absolute top-0 right-0">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-3 py-1.5 bg-transparent border border-white/20 text-white/60 rounded-md hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign out
                  </button>
                </div>
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>Setup Complete!</h3>
                <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                  Welcome <span className="text-blue-300 font-medium">@{username}</span>!
                </p>

                {/* <div className="max-w-md mx-auto mt-4 mb-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                  <p className={`text-white/80 ${inter.variable} font-inter mb-4`}>
                    You can now proceed to the competition platform.
                  </p>
                  <a
                    href="https://your-competition-platform.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
                  >
                    Start Trading
                  </a>
                </div> */}

                {/* Password reset section */}
                <div className="mt-6 max-w-md mx-auto">
                  <button
                    onClick={handlePasswordReset}
                    className="px-5 py-2 bg-blue-900/50 text-white rounded-lg transition-colors hover:bg-blue-800/50 text-sm"
                  >
                    Need to reset your password?
                  </button>

                  {resetEmailSent && (
                    <p className="text-green-400 mt-2 text-sm">
                      Password reset email sent! Check your inbox.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};