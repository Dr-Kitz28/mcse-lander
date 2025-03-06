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
  deleteUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, deleteDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../firebase';

function PageLoader() {
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
          {/* Use fixed classes instead of random values */}
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
        {/* <div className="h-0.5 w-24 bg-white/30 mx-auto mt-2"></div>
        <p className="text-white/70 text-sm mt-3"></p> */}
      </div>
    </div>
  );
}

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [university, setUniversity] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [universityName, setUniversityName] = useState('');

  // Registration and verification states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrationStep, setRegistrationStep] = useState('form'); // form, verifying, payment
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: '',
    remarks: '',
    screenshot: null
  });
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  // Add these new state variables with your other state declarations:
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [showContactModal, setShowContactModal] = useState(false);



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
        console.log("Checking username availability for:", debouncedUsername);

        // Check if username exists in the usernames collection
        const usernameDoc = await getDoc(doc(db, 'usernames', debouncedUsername));

        if (usernameDoc.exists()) {
          setUsernameError('This username is already taken');
        } else {
          setUsernameError(null);
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 200); // Increase to 800ms for a more noticeable debounce

    return () => clearTimeout(timer);
  }, [debouncedUsername]);


  const handlePasswordReset = async () => {
    if (!loginEmail) {
      setError("Please enter your email address first");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setResetEmailSent(true);
      setError(null);
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError(`Failed to send reset email: ${err.message}`);
      }
    }
    setLoading(false);
  };

  // Add this function to handle signing out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();

      // Reset all form state
      setRegistrationStep('form');
      setShowLoginForm(false);
      setUser(null);
      setName('');
      setEmail('');
      setUsername('');
      setUniversity('');
      setUniversityName('');
      setPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);
      setPaymentDetails({
        transactionId: '',
        remarks: '',
        screenshot: null
      });
      setPaymentSuccess(false);
      setError(null);

      console.log("User signed out successfully");
    } catch (err) {
      console.error("Error signing out:", err);
      setError(`Failed to sign out: ${err.message}`);
    }
    setLoading(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      const existingUser = userCredential.user;
      setUser(existingUser);

      console.log("Login successful", existingUser);

      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', existingUser.uid));

        if (userDoc.exists()) {
          // User has completed profile setup
          const userData = userDoc.data();
          setUsername(userData.username || '');
          setName(userData.name || '');
          setUniversity(userData.university || '');
          setPaymentStatus(userData.paymentStatus || 'pending');
          setPaymentSuccess(!!userData.paymentDetails);
          setRegistrationStep('payment');
        } else {
          // User is verified but hasn't set up profile
          if (existingUser.emailVerified) {
            setRegistrationStep('profile-setup');
          } else {
            setRegistrationStep('verifying');
          }
        }
      } catch (firestoreErr) {
        console.error("Firestore error:", firestoreErr);
        // Default flow based on verification
        if (existingUser.emailVerified) {
          setRegistrationStep('profile-setup');
        } else {
          setRegistrationStep('verifying');
        }
      }
    } catch (err) {
      console.error("Auth error:", err);

      if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials.');
      } else {
        setError(`Sign-in failed: ${err.message}`);
      }
    }

    setLoading(false);
  };
  // Add a handler function
  const handleUniversityChange = (e) => {
    setUniversity(e.target.value);
  };

  const commonEmailDomains = [
    'gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com',
    'tutanota.com', 'skiff.com', 'icloud.com', 'protonmail.com',
    'aol.com', 'zoho.com', 'mail.com', 'yandex.com', 'gmx.com'
  ];

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/g) && pass.match(/[A-Z]/g)) strength++;
    if (pass.match(/[0-9]/g)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/g)) strength++;
    setPasswordStrength(strength);
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
    if (confirmPassword) {
      setPasswordsMatch(confirmPassword === newPassword);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const confirmPass = e.target.value;
    setConfirmPassword(confirmPass);
    setPasswordsMatch(password === confirmPass);
  };

  useEffect(() => {
    // Normal auth state change listener without refresh reset
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        // Check if user is verified and get payment status if applicable
        if (currentUser.emailVerified) {
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();

              // Set payment status from Firestore
              if (userData.paymentStatus) {
                setPaymentStatus(userData.paymentStatus);
              }

              // Set university value for rendering the correct UI
              if (userData.university) {
                setUniversity(userData.university);
              }

              // Check if they have submitted payment details already
              if (userData.paymentDetails) {
                setPaymentSuccess(true);
              }

              setRegistrationStep('payment');
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else {
          setRegistrationStep('verifying');
        }
      } else {
        // User is not logged in, show the form
        setRegistrationStep('form');
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

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
            console.log("Email verified!");
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
              console.error("Error checking user profile:", err);
              // Default to profile setup if there's any error
              setRegistrationStep('profile-setup');
            }
          }
        } catch (err) {
          console.error("Error checking verification:", err);
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
      console.log("Checking username availability for:", username);

      // Check directly in the usernames collection
      const usernameDoc = await getDoc(doc(db, 'usernames', username));

      // If document doesn't exist, username is available
      const isAvailable = !usernameDoc.exists();
      console.log("Username is available:", isAvailable);

      return isAvailable;
    } catch (err) {
      console.error("Error checking username:", err);
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
  const handleUsernameChange = (e) => {
    const value = e.target.value.trim().toLowerCase();
    setUsername(value);

    // Set checking state immediately when typing
    setIsCheckingUsername(true);

    // Basic validation
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsCheckingUsername(false); // No need to check if too short
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
      setUsernameError('Only letters, numbers, underscore, dots, and hyphens allowed');
      setIsCheckingUsername(false); // No need to check if invalid chars
    } else {
      // Only update debouncedUsername if the input is potentially valid
      // This will trigger the useEffect above with a delay
      setTimeout(() => {
        setDebouncedUsername(value);
      }, 400); // Add a small delay before updating debouncedUsername
    }
  };

  // Handle registration form submission
  const handleRegistration = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!passwordsMatch || passwordStrength < 3) {
      setError('Please ensure your password is strong and matches the confirmation');
      return;
    }

    // Check if the email is a university email
    if (!isValidUniversityEmail(email)) {
      setError('Please use your university email address, not a common email provider.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the user auth account with only email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Send verification email FIRST
      try {
        await sendEmailVerification(newUser);
        console.log("Verification email sent successfully");
      } catch (emailErr) {
        console.error("Error sending verification email:", emailErr);
        setError("Account created but there was a problem sending the verification email. Please try signing in and requesting a new verification email.");
      }

      // Set user state and move to verification step
      setUser(newUser);
      setRegistrationStep('verifying');

    } catch (err) {
      console.error("Registration error:", err);

      if (err.code === 'auth/email-already-in-use') {
        try {
          // Try to sign in with the provided credentials
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const existingUser = userCredential.user;
          setUser(existingUser);

          if (existingUser.emailVerified) {
            // Check if user has completed profile setup
            const userDoc = await getDoc(doc(db, 'users', existingUser.uid));

            if (userDoc.exists()) {
              // User has completed profile setup
              const userData = userDoc.data();
              setUsername(userData.username || '');
              setName(userData.name || '');
              setUniversity(userData.university || '');

              // Set payment status from Firestore
              if (userData.paymentStatus) {
                setPaymentStatus(userData.paymentStatus);
              }
              setRegistrationStep('payment');
            } else {
              // User is verified but hasn't set up profile yet
              setRegistrationStep('profile-setup');
            }
          } else {
            // Email exists but not verified
            await sendEmailVerification(existingUser);
            setRegistrationStep('verifying');
          }
        } catch (signInErr) {
          // Wrong password for existing account
          setError('This email is already registered. Please use the correct password.');
          setShowLoginForm(true);
          setLoginEmail(email);
        }
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please follow the password requirements.');
      } else {
        setError(`Registration failed: ${err.message}`);
      }
    }

    setLoading(false);
  };



  // Resend verification email
  const handleResendVerification = async () => {
    setLoading(true);
    setError(null); // Clear previous errors

    try {
      if (user) {
        // Make sure the user object is fresh
        await user.reload();

        // Check if already verified to avoid unnecessary attempts
        if (auth.currentUser.emailVerified) {
          setRegistrationStep('payment');
          setLoading(false);
          return;
        }

        // Send verification email
        await sendEmailVerification(auth.currentUser);
        setError('Verification email sent! Please check your inbox and spam folder.');
      } else {
        setError('You need to be logged in to resend the verification email');
      }
    } catch (err) {
      console.error("Error resending verification:", err);

      // Provide better error messages
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait before requesting another verification email.');
      } else if (err.code === 'auth/internal-error') {
        setError('Unable to send verification email due to a server error. Please try again later.');
      } else {
        setError(`Failed to send verification email: ${err.message}`);
      }
    }

    setLoading(false);
  };

  // Handle payment submission without Firebase Storage
  const handlePaymentSubmission = async (e) => {
    e.preventDefault();

    if (!user) return;

    setLoading(true);
    setPaymentError(null);

    try {
      let screenshotData = null;
      if (paymentDetails.screenshot && paymentDetails.screenshot.file) {
        // Convert screenshot to base64 string (works for small files)
        const reader = new FileReader();

        // Create a promise to handle the async FileReader
        const getBase64 = new Promise((resolve) => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(paymentDetails.screenshot.file);
        });

        screenshotData = await getBase64;
      }

      // Update user document with payment details
      await setDoc(doc(db, 'users', user.uid), {
        paymentStatus: 'pending', // Always start with pending
        paymentDetails: {
          transactionId: paymentDetails.transactionId,
          remarks: paymentDetails.remarks,
          screenshotName: paymentDetails.screenshot ? paymentDetails.screenshot.name : null,
          screenshotData: screenshotData, // Store base64 data directly in Firestore
          submittedAt: new Date().toISOString()
        }
      }, { merge: true });

      // Update local state
      setPaymentStatus('pending');
      setPaymentSuccess(true); // This is crucial - marks that they've submitted payment
    } catch (err) {
      console.error(err);
      setPaymentError(`Failed to submit payment details: ${err.message}`);
    }

    setLoading(false);
  };

  const handleProfileSetup = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("You need to be signed in to complete registration");
      return;
    }

    // Ensure the user's email is verified before proceeding
    if (!user.emailVerified) {
      setError("Your email must be verified before completing registration");
      setRegistrationStep('verifying');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check username availability one last time
      if (username.length < 3) {
        setError('Username must be at least 3 characters long');
        setLoading(false);
        return;
      }

      if (usernameError) {
        setError(`Username issue: ${usernameError}`);
        setLoading(false);
        return;
      }

      // Verify username is available
      const usernameDoc = await getDoc(doc(db, 'usernames', username));
      if (usernameDoc.exists()) {
        setError('This username was just taken by someone else. Please choose another.');
        setLoading(false);
        return;
      }

      // Create user document in Firestore
      const userData = {
        name,
        email: user.email,
        username,
        university,
        universityName: university === 'other' ? universityName : 'Mahindra University',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        paymentStatus: 'pending',
        paymentRequired: university === 'other'
      };

      // Use a batch write to ensure both documents are created atomically
      const batch = writeBatch(db);

      // Add the user document
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, userData);

      // Reserve the username
      const usernameRef = doc(db, 'usernames', username);
      batch.set(usernameRef, { uid: user.uid });

      // Commit both writes in a single atomic operation
      await batch.commit();

      console.log("User profile created successfully");

      // Move to payment step
      setRegistrationStep('payment');
    } catch (err) {
      console.error("Error setting up profile:", err);
      setError(`Failed to complete profile setup: ${err.message}`);
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
            console.log("Email verified, proceeding to profile setup");
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
              console.error("Error checking user profile:", firestoreErr);
              // Default to profile setup
              setRegistrationStep('profile-setup');
            }
          }
        } catch (err) {
          console.error("Error checking verification:", err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [registrationStep, user]);

  // Modified screenshot handler - just store file metadata for now
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Make sure the file size is reasonable (< 1MB) since we're storing in Firestore
      if (file.size > 1024 * 1024) {
        setPaymentError("Screenshot is too large. Please upload an image smaller than 1MB.");
        return;
      }

      // Store file metadata and the file itself
      setPaymentDetails({
        ...paymentDetails,
        screenshot: {
          name: file.name,
          type: file.type,
          size: file.size,
          file: file // Store the actual file for later base64 conversion
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <PageLoader />
      {/* <div className="fixed inset-0 bg-gradient-to-br from-[#000016] to-[#01003D] z-0" /> */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute w-full h-full object-cover opacity-80"
        >
          <source src="/bgfinal.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/10"></div> {/* Overlay to darken the video */}
      </div>

      {/* Navbar */}
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
            <Link href="#about" className="text-white hover:text-blue-300 transition-colors text-2xl">
              About
            </Link>
            <Link href="#how-to" className="text-white hover:text-blue-300 transition-colors text-2xl">
              How to
            </Link>
            <Link href="#register">
              <button className="px-5 py-2 bg-blue-950/80 hover:bg-blue-900 text-white rounded-lg transition-colors text-2xl">
                Register
              </button>
            </Link>
          </div>

          {/* Mobile - Only Register Button */}
          <div className="md:hidden flex">
            <Link href="#register">
              <button className={`px-5 py-2 bg-blue-950/80 hover:bg-blue-900 text-white rounded-lg transition-colors text-xl ${crimson.className}`}>
                Register
              </button>
            </Link>
          </div>
        </div>
      </nav>

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
            <div className="text-center backdrop-blur-sm p-8 rounded-lg border border-blue-500/20 shadow-lg bg-blue-900/10">
              <div className="flex justify-center mb-6">
                <TrendingUp size={48} className="text-blue-300" />
              </div>
              <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>
                What we offer
              </h3>
              <p className={`text-white/80 ${inter.variable} font-inter leading-relaxed`}>
                Engage in a simulated stock market environment where you can compete with other clubs
                and learn real-time trading strategies. Build your portfolio, analyze market trends,
                and make strategic investment decisions to maximize your returns.
              </p>
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
                {/* Vertical line */}
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-blue-500/30"></div>

                {/* Timeline items */}
                <div className={`${inter.variable} font-inter`}>
                  {/* Item 1 */}
                  <div className="relative flex items-center justify-between mb-10">
                    <div className="w-5/12 pr-4 text-right">
                      <p className="font-medium text-white">Registration opens</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                      {/* Fix the pulsing animation to be properly centered */}
                      <div className="relative flex items-center justify-center">
                        {/* Centered pulsing circle with proper positioning */}
                        <div className="absolute w-6 h-6 rounded-full bg-green-500/30 animate-ping"></div>
                        {/* Static inner circle centered inside */}
                        <div className="relative w-4 h-4 rounded-full bg-green-500 border-2 border-green-300"></div>
                      </div>
                    </div>
                    <div className="w-5/12 pl-4 text-left">
                      <p className="text-white/70">September 1, 2023</p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="relative flex items-center justify-between mb-10">
                    <div className="w-5/12 pr-4 text-right">
                      <p className="font-medium text-white">Competition begins</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300 z-10"></div>
                    <div className="w-5/12 pl-4 text-left">
                      <p className="text-white/70">September 15, 2023</p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="relative flex items-center justify-between">
                    <div className="w-5/12 pr-4 text-right">
                      <p className="font-medium text-white">Final results</p>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-blue-300 z-10"></div>
                    <div className="w-5/12 pl-4 text-left">
                      <p className="text-white/70">November 30, 2023</p>
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

            {/* Login/Register Chooser */}
            {registrationStep === 'form' && (
              <div className="mb-8">
                <div className="flex border-b border-white/20 mb-6">
                  <button
                    onClick={() => setShowLoginForm(false)}
                    className={`py-3 px-6 font-medium text-lg transition-all relative ${!showLoginForm
                      ? "text-white"
                      : "text-white/50 hover:text-white/70"
                      }`}
                  >
                    Register
                    {!showLoginForm && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowLoginForm(true)}
                    className={`py-3 px-6 font-medium text-lg transition-all relative ${showLoginForm
                      ? "text-white"
                      : "text-white/50 hover:text-white/70"
                      }`}
                  >
                    Sign In
                    {showLoginForm && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-400"></span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Login Form */}
            {registrationStep === 'form' && showLoginForm && (
              <form className={`${inter.variable} font-inter animate-fadeIn`} onSubmit={handleLoginSubmit}>
                {/* Your existing login form fields */}
                <div className="space-y-6">
                  {/* Email field */}
                  <div>
                    <label htmlFor="loginEmail" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      id="loginEmail"
                      placeholder="123@university.edu.in"
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

                  {/* Submit button */}
                  <div className="pt-2 flex gap-10">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-9 py-3 bg-blue-950/60 ${crimson.className} hover:bg-blue-900 text-white rounded-lg transition-all text-xl font-medium shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg focus:ring-2 focus:ring-blue-900/50'
                        }`}
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
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={handlePasswordReset}
                        className={`text-blue-300 hover:text-blue-200 text-lg ${crimson.className}${loading || resetEmailSent ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        disabled={loading || resetEmailSent}
                      >
                        {loading && !resetEmailSent ? (
                          <span className="flex items-center">
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
              </form>
            )}

            {registrationStep === 'form' && !showLoginForm && (
              <form className={`${inter.variable} font-inter animate-fadeIn `} onSubmit={handleRegistration}>
                <div className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className={`block text-white text-lg font-medium mb-2 ${crimson.className} font-crimson`}>
                      Email (Only University mail)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        placeholder="123@university.edu.in"
                        className="w-full bg-slate-800/40 border border-white/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {email && !isValidUniversityEmail(email) && (
                      <p className="mt-1 text-xs text-red-400">Please use your university email address, not a common email provider.</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className={`block text-white text-lg font-medium mb-2 ${crimson.className} font-crimson`}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="password"
                        placeholder="Create a strong password"
                        className="w-full bg-slate-800/40 border border-white/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                        required
                        value={password}
                        onChange={handlePasswordChange}
                        minLength={8}
                      />
                    </div>

                    {/* Password Strength Indicator */}
                    <div className="mt-3">
                      <div className="h-1.5 w-full bg-gray-700/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength === 0
                            ? "bg-gray-600 w-0"
                            : passwordStrength === 1
                              ? "bg-red-500 w-1/4"
                              : passwordStrength === 2
                                ? "bg-yellow-500 w-2/4"
                                : passwordStrength === 3
                                  ? "bg-yellow-300 w-3/4"
                                  : "bg-green-500 w-full"
                            }`}
                        ></div>
                      </div>
                      <p className="text-xs text-white/60 mt-1.5 ml-1">
                        {passwordStrength === 0
                          ? "Strength Indicator"
                          : passwordStrength === 1
                            ? "Weak"
                            : passwordStrength === 2
                              ? "Fair"
                              : passwordStrength === 3
                                ? "Good"
                                : "Strong"}
                      </p>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className={`block text-white text-lg font-medium mb-2 ${crimson.className} font-crimson`}>
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        id="confirmPassword"
                        placeholder="Re-enter your password"
                        className={`w-full bg-slate-800/40 border rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:border-transparent transition-all ${confirmPassword && !passwordsMatch
                          ? "border-red-500 focus:ring-red-500/50"
                          : "border-white/20 focus:ring-blue-500/50"
                          }`}
                        required
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                      />
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="mt-1.5 ml-1 text-xs text-red-400">Passwords do not match</p>
                    )}
                  </div>

                  {/* Password Requirements */}
                  <div className="text-white/70 text-sm bg-slate-900/30 p-4 rounded-md border border-white/10 mt-2">
                    <p className="mb-3 font-medium text-white/80">Password requirements:</p>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <span className={`flex items-center ${password.length >= 8 ? "text-green-400" : "text-white/50"}`}>
                          {password.length >= 8 ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                          At least 8 characters
                        </span>
                      </li>
                      <li className="flex items-center">
                        <span className={`flex items-center ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? "text-green-400" : "text-white/50"}`}>
                          {/[A-Z]/.test(password) && /[a-z]/.test(password) ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                          Upper & lowercase letters
                        </span>
                      </li>
                      <li className="flex items-center">
                        <span className={`flex items-center ${/[0-9]/.test(password) ? "text-green-400" : "text-white/50"}`}>
                          {/[0-9]/.test(password) ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                          At least one number
                        </span>
                      </li>
                      <li className="flex items-center">
                        <span className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? "text-green-400" : "text-white/50"}`}>
                          {/[^A-Za-z0-9]/.test(password) ? <Check size={16} className="mr-2" /> : <X size={16} className="mr-2" />}
                          At least one special character
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Submit Button */}
                  <div className="mt-10">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-9 py-3 bg-blue-950/60 ${crimson.className} text-white rounded-lg transition-all text-xl font-medium shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-900 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-900/50'
                        }`}
                      disabled={loading || !isValidUniversityEmail(email) || !passwordsMatch || passwordStrength < 3}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying Email...
                        </span>
                      ) : 'Verify Email'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* New Profile Setup Step - Only shown after email verification */}
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

                <div className="mb-6 text-center">
                  <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl text-white font-semibold mb-2 ${crimson.className}`}>Email Verified!</h3>
                  <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                    Complete your profile to finish registration
                  </p>
                </div>

                <form className={`${inter.variable} font-inter`} onSubmit={handleProfileSetup}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Name Field */}
                    <div>
                      <label htmlFor="name" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                        Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="name"
                          placeholder="Your full name"
                          className="w-full bg-slate-800/40 border border-white/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

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

                    {/* University Selection */}
                    <div>
                      <label htmlFor="university" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                        University
                      </label>
                      <div className="relative">
                        <select
                          id="university"
                          className="w-full bg-slate-800/40 border border-white/20 rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none"
                          required
                          value={university}
                          onChange={handleUniversityChange}
                        >
                          <option value="" disabled>Select your university</option>
                          <option value="mahindra-university">Mahindra University</option>
                          <option value="other">Other University</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>

                      {university === 'other' && (
                        <div className="mt-3">
                          <label htmlFor="universityName" className={`block text-white text-sm font-medium mb-1 ${crimson.className}`}>
                            Please specify your university
                          </label>
                          <input
                            type="text"
                            id="universityName"
                            placeholder="Enter your university name"
                            className="w-full bg-slate-800/40 border border-white/20 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                            required={university === 'other'}
                            value={universityName}
                            onChange={(e) => setUniversityName(e.target.value)}
                          />
                          <p className="mt-2 text-xs text-amber-300">
                            Note: Registration for non-Mahindra University students requires a ₹25 fee.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="mt-10">
                    <button
                      type="submit"
                      className={`w-full md:w-auto px-9 py-3 bg-blue-950/60 ${crimson.className} text-white rounded-lg transition-all text-xl font-medium shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-900 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-900/50'
                        }`}
                      disabled={loading || isCheckingUsername || usernameError || !name || !username || !university}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Completing Registration...
                        </span>
                      ) : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Email Verification Screen */}
            {registrationStep === 'verifying' && (
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
                  <div className="w-20 h-20 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>Verify your email</h3>
                <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                  We&apos;ve sent a verification link to <span className="text-blue-300 font-medium">{user?.email}</span>.<br />
                  Please check your inbox and click the link to verify your account.
                </p>
                <p className={`text-white/60 text-sm ${inter.variable} font-inter mb-8`}>
                  This page will automatically update once your email is verified.<br />
                  If you don&apos;t see the email, check your spam folder.
                </p>

                <div className="flex flex-col items-center justify-center space-y-4">
                  <button
                    onClick={handleResendVerification}
                    className={`px-5 py-2 bg-blue-900/50 text-white rounded-lg transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800/50'
                      }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : 'Resend verification email'}
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-300"></div>
                    <span className="ml-2 text-white/70 text-sm">Waiting for verification...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Form */}
            {registrationStep === 'payment' && (
              <>
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
                  <h3 className={`text-2xl text-white font-semibold mb-2 ${crimson.className}`}>
                    {university === 'other' ? 'Registration Payment' : 'Registration Successful!'}
                  </h3>

                  {university === 'mahindra-university' ? (
                    <div className="py-8 text-center">
                      <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className={`text-white ${inter.variable} font-inter mb-6`}>
                        Your registration is complete! No payment required for Mahindra University students.
                      </p>
                      <p className={`text-white/70 ${inter.variable} font-inter`}>
                        We&apos;ll send you more information about the competition soon.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Non-Mahindra University Students Payment Flow */}
                      {paymentStatus === 'pending' && paymentSuccess && (
                        <div className="py-8 text-center">
                          <div className="w-20 h-20 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>Payment Processing</h3>
                          <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                            Thank you! Your payment details have been submitted and are being verified.
                          </p>
                          <p className={`text-white/60 text-sm ${inter.variable} font-inter`}>
                            Once verified, you will receive a confirmation email. This usually takes 1-2 business days.
                          </p>
                        </div>
                      )}

                      {paymentStatus === 'failed' && (
                        <div className="py-8 text-center">
                          <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>Payment Verification Failed</h3>
                          <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                            We couldn&apos;t verify your payment. This could be due to:
                          </p>
                          <ul className="text-left max-w-md mx-auto mb-8 text-white/70 space-y-1">
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Invalid transaction ID</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Transaction amount didn&apos;t match the required payment</span>
                            </li>
                            <li className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>Screenshot was unclear or didn&apos;t match the transaction ID</span>
                            </li>
                          </ul>
                          <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                            Please submit your payment details again.
                          </p>
                          <button
                            onClick={() => {
                              setPaymentSuccess(false);
                              setPaymentDetails({
                                transactionId: '',
                                remarks: '',
                                screenshot: null
                              });
                            }}
                            className="px-5 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      )}

                      {paymentStatus === 'success' && (
                        <div className="py-8 text-center">
                          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>Payment Verified Successfully</h3>
                          <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                            Great news! Your payment has been verified and your registration is now complete.
                          </p>
                          <p className={`text-white/60 text-sm ${inter.variable} font-inter`}>
                            We&apos;ll send you more information about the competition soon.
                          </p>
                        </div>
                      )}

                      {/* Show payment form only if not success AND not pending with submitted details */}
                      {(paymentStatus !== 'success' && !paymentSuccess) && (
                        <>
                          <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                            Please complete your registration by paying the ₹25 fee
                          </p>

                          {paymentError && (
                            <div className="bg-red-500/20 border border-red-500/40 text-white p-4 rounded-lg mb-6">
                              {paymentError}
                            </div>
                          )}

                          <div className="max-w-md mx-auto bg-slate-900/50 p-6 rounded-lg border border-white/10 mb-8">
                            <div className="mb-6">
                              <h4 className={`text-lg text-white font-medium mb-4 ${crimson.className}`}>Scan QR Code to Pay</h4>
                              <Image
                                src="/upi-qr.png"
                                alt="UPI Payment QR Code"
                                width={200}
                                height={200}
                                className="mx-auto"
                              />
                              <p className="text-sm text-white/70 mt-2">UPI ID: 9966707911@ptyes</p>
                            </div>

                            <form onSubmit={handlePaymentSubmission} className="space-y-4">
                              <div className='flex flex-col items-start'>
                                <label htmlFor="transactionId" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                                  Transaction ID/Reference Number
                                </label>
                                <input
                                  type="text"
                                  id="transactionId"
                                  placeholder="e.g. 123456789012"
                                  className="w-full bg-slate-800/40 border border-white/20 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                  required
                                  value={paymentDetails.transactionId}
                                  onChange={(e) => {
                                    // Allow only digits and limit to 12 characters
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    setPaymentDetails({ ...paymentDetails, transactionId: value });
                                  }}
                                />
                                {/* <p className="text-xs text-white/50 mt-1">
                                  Must be exactly 12 digits
                                </p> */}
                                {paymentDetails.transactionId && paymentDetails.transactionId.length !== 12 && (
                                  <p className="text-xs text-red-400 mt-1">
                                    Transaction ID must be exactly 12 digits
                                  </p>
                                )}
                              </div>

                              <div className='flex flex-col items-start'>
                                <label htmlFor="screenshot" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                                  Upload Payment Screenshot (Required)
                                </label>
                                <input
                                  type="file"
                                  id="screenshot"
                                  accept="image/*"
                                  className="w-full bg-slate-800/80 border border-white/20 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                  onChange={handleScreenshotChange}
                                  required
                                />
                                <p className="text-xs text-white/50 mt-1">
                                  Max file size: 1MB
                                </p>
                              </div>

                              <div className='flex flex-col items-start'>
                                <label htmlFor="remarks" className={`block text-white text-lg font-medium mb-2 ${crimson.className}`}>
                                  Remarks (Optional)
                                </label>
                                <textarea
                                  id="remarks"
                                  placeholder="Any additional information"
                                  className="w-full bg-slate-800/40 border border-white/20 rounded-md py-2 px-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                  rows={3}
                                  value={paymentDetails.remarks}
                                  onChange={(e) => setPaymentDetails({ ...paymentDetails, remarks: e.target.value })}
                                ></textarea>
                              </div>

                              <button
                                type="submit"
                                className={`w-full px-4 py-2 bg-blue-950/60 ${crimson.className} text-xl text-white rounded-md transition-colors ${loading || (paymentDetails.transactionId.length !== 12) || !paymentDetails.screenshot
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-blue-900'
                                  }`}
                                disabled={loading || paymentDetails.transactionId.length !== 12 || !paymentDetails.screenshot}
                              >
                                {loading ? (
                                  <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting...
                                  </span>
                                ) : 'Submit Payment Details'}
                              </button>
                            </form>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* Payment Success */}
            {paymentSuccess && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h3 className={`text-2xl text-white font-semibold mb-4 ${crimson.className}`}>Payment Submitted Successfully</h3>
                <p className={`text-white/80 ${inter.variable} font-inter mb-6`}>
                  Thank you! Your payment details have been submitted for verification.
                </p>
                <p className={`text-white/60 text-sm ${inter.variable} font-inter`}>
                  Once verified, you will receive a confirmation email with further instructions.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="z-10 relative bg-[#000016]/80 backdrop-blur-sm py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 md:px-15">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
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
        </div>
      </footer>
      {/* Help/Contact Button */}
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

        {/* Contact Modal */}
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
              {/* <div>
                <p className="text-white/80 text-sm mb-1">Email us:</p>
                <a href="mailto:mcse@mahindra.edu" className="text-blue-300 hover:text-blue-200 text-sm">mcse@mahindra.edu</a>
              </div> */}
              <div>
                <p className="text-white/80 text-sm mb-1">Contact:</p>
                <a href="tel:+919876543210" className="text-blue-300 hover:text-blue-200 text-sm">+91 99667 07911</a>
              </div>
              {/* <div>
                <p className="text-white/80 text-sm mb-1">Join our Discord:</p>
                <a href="https://discord.gg/mcse" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 text-sm">discord.gg/mcse</a>
              </div> */}
            </div>
            <div className="text-white/50 text-xs mt-2 border-t border-white/10 pt-2">
              Contact for help / Report any bugs
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
