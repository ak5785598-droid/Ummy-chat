'use client';

import { useState, useEffect, useRef } from 'react';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader, Phone, X, ChevronDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  FacebookAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BanDialog } from '@/components/ban-dialog';
import Script from 'next/script';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';
const GOOGLE_CLIENT_ID = '373109833688-655nmcl2juhrn5kop38geb4khuu3dsl5.apps.googleusercontent.com';

/**
 * Beautiful Ummy Login Portal - Purple Gradient Design
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isLoading: isAuthLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading, error: profileError } = useUserProfile(user?.uid || undefined, { suppressGlobalError: true });
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [banInfo, setBanInfo] = useState<{ isBanned: boolean; bannedUntil: any } | null>(null);

  // Country Selection Data
  const COUNTRIES = [
    { name: 'India', code: '+91', flag: '🇮🇳', id: 'IN' },
    { name: 'Pakistan', code: '+92', flag: '🇵🇰', id: 'PK' },
    { name: 'Bangladesh', code: '+880', flag: '🇧🇩', id: 'BD' },
    { name: 'UAE', code: '+971', flag: '🇦🇪', id: 'AE' },
    { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦', id: 'SA' },
    { name: 'USA', code: '+1', flag: '🇺🇸', id: 'US' },
    { name: 'UK', code: '+44', flag: '🇬🇧', id: 'GB' },
    { name: 'Canada', code: '+1', flag: '🇨🇦', id: 'CA' },
    { name: 'Turkey', code: '+90', flag: '🇹🇷', id: 'TR' },
    { name: 'Egypt', code: '+20', flag: '🇪🇬', id: 'EG' },
    { name: 'Jordan', code: '+962', flag: '🇯🇴', id: 'JO' },
    { name: 'Palestine', code: '+970', flag: '🇵🇸', id: 'PS' },
    { name: 'Pakistan', code: '+92', flag: '🇵🇰', id: 'PK' },
    { name: 'Bahrain', code: '+973', flag: '🇧🇭', id: 'BH' },
    { name: 'Kuwait', code: '+965', flag: '🇰🇼', id: 'KW' },
    { name: 'Oman', code: '+968', flag: '🇴🇲', id: 'OM' },
    { name: 'Qatar', code: '+974', flag: '🇶🇦', id: 'QA' },
    { name: 'Iraq', code: '+964', flag: '🇮🇶', id: 'IQ' },
    { name: 'Syria', code: '+963', flag: '🇸🇾', id: 'SY' },
    { name: 'Lebanon', code: '+961', flag: '🇱🇧', id: 'LB' },
    { name: 'Yemen', code: '+967', flag: '🇾🇪', id: 'YE' },
    { name: 'Algeria', code: '+213', flag: '🇩🇿', id: 'DZ' },
    { name: 'Morocco', code: '+212', flag: '🇲🇦', id: 'MA' },
    { name: 'Libya', code: '+218', flag: '🇱🇾', id: 'LY' },
    { name: 'Tunisia', code: '+216', flag: '🇹🇳', id: 'TN' },
  ];

  // Country Picker State
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  // Phone Login State
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState<'number' | 'code'>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [nativeVerificationId, setNativeVerificationId] = useState<string | null>(null);

  // Global Branding Sync
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const splashBg = config?.splashScreenUrl;
  const loginBg = config?.loginBackgroundUrl;
  const fallbackBg = PlaceHolderImages.find(img => img.id === 'login-bg')?.imageUrl;

  const activeBg = loginBg || splashBg || fallbackBg;

  // Global script ref to prevent multiple initializations
  const hasInitializedGoogle = useRef(false);

  // Initialize Google One Tap - run ONCE when user is not logged in
  useEffect(() => {
    if (isAuthLoading || user || !auth || hasInitializedGoogle.current) return;
    if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return;

    const handleOneTapResponse = async (response: any) => {
      setIsSigningIn(true);
      try {
        const credential = GoogleAuthProvider.credential(response.credential);
        const result = await signInWithCredential(auth, credential);
        if (result.user) {
          await syncUserIdentity(result.user.uid, result.user.email, result.user.displayName);
          router.replace('/rooms');
        }
      } catch (error: any) {
        console.error('One Tap Login Error:', error);
        toast({ variant: 'destructive', title: 'Sign In Failed', description: 'Native login failed. Please use the button below.' });
      } finally {
        setIsSigningIn(false);
      }
    };

    const initializeGIS = () => {
      // @ts-ignore
      const gapi = window.google?.accounts?.id;
      if (!gapi) return false;

      if (!hasInitializedGoogle.current) {
        gapi.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleOneTapResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          itp_support: true
        });
        hasInitializedGoogle.current = true;
      }

      gapi.prompt();
      return true;
    };

    const timer = setInterval(() => {
      if (initializeGIS()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, isAuthLoading, auth]);

  // Handle Firebase Redirect Result (Fix for Mobile White Screen)
  useEffect(() => {
    if (!auth || isAuthLoading || user) return;

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("✅ User logged in via Redirect:", result.user.uid);
          setIsSigningIn(true);
          await syncUserIdentity(result.user.uid, result.user.email, result.user.displayName);
          router.replace('/rooms');
        }
      } catch (error: any) {
        console.error("❌ Redirect Login Error:", error);
        toast({
          variant: 'destructive',
          title: 'Login Error',
          description: 'Failed to complete sign in. Please try again.',
        });
      } finally {
        setIsSigningIn(false);
      }
    };

    checkRedirect();
  }, [auth, isAuthLoading, user]);

  // SILENT BAN DETECTION & REDIRECT LOGIC
  useEffect(() => {
    // 1. Handle definitive Permission Denied (High chance of ban)
    if (profileError && (profileError.message.includes('permission') || profileError.message.includes('insufficient'))) {
      console.log(`[Presence-Ban] Permission denied on profile read. Triggering silent ban check...`);
      setBanInfo({ isBanned: true, bannedUntil: null }); // Showing generic ban if we can't read the duration
      return;
    }

    // 2. Wait until both user and profile are loaded (or definitively failed)
    if (isAuthLoading || isProfileLoading) return;

    if (user && userProfile) {
      console.log(`[Login] Checking Ban Status for: ${user.uid}`);
      if (userProfile.banStatus?.isBanned) {
        const until = userProfile.banStatus.bannedUntil?.toDate?.() || null;
        if (!until || until > new Date()) {
          console.log(`[Login] User IS BANNED. Showing modal.`);
          setBanInfo({ isBanned: true, bannedUntil: userProfile.banStatus.bannedUntil });
          return;
        } else {
          console.log(`[Login] Ban EXPIRED. Allowing entry.`);
        }
      }

      console.log(`[Login] Authorized. Navigating to discovery.`);
      router.replace('/rooms');
    }
  }, [user, isAuthLoading, userProfile, isProfileLoading, profileError, router]);

  // Native Phone Auth Listeners
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const phoneCodeSentListener = FirebaseAuthentication.addListener('phoneCodeSent', (event) => {
      console.log("[Native-Auth] Phone Code Sent. ID:", event.verificationId);
      setNativeVerificationId(event.verificationId);
      setPhoneLoginStep('code');
      setIsSigningIn(false);
      toast({ title: 'Code Sent', description: 'OTP dispatched via native SMS.' });
    });

    const phoneVerificationCompletedListener = FirebaseAuthentication.addListener('phoneVerificationCompleted', async (event: any) => {
      console.log("[Native-Auth] Phone Verification Completed Instantly.");
      if (event.result?.user) {
        setIsSigningIn(true);
        await syncUserIdentity(event.result.user.uid, event.result.user.phoneNumber || null, null);
        setShowPhonePopup(false);
        router.push('/rooms');
      }
    });

    const phoneVerificationFailedListener = FirebaseAuthentication.addListener('phoneVerificationFailed', (event) => {
      console.error("[Native-Auth] Phone Verification Failed:", event.message);
      setIsSigningIn(false);
      toast({ variant: 'destructive', title: 'Verification Failed', description: event.message });
    });

    return () => {
      phoneCodeSentListener.then(l => l.remove());
      phoneVerificationCompletedListener.then(l => l.remove());
      phoneVerificationFailedListener.then(l => l.remove());
    };
  }, [auth, router]);

  const syncUserIdentity = async (uid: string, email: string | null, displayName: string | null) => {
    if (!firestore || !uid) return;

    const userRef = doc(firestore, 'users', uid);
    const profileRef = doc(firestore, 'users', uid, 'profile', uid);
    const counterRef = doc(firestore, 'appConfig', 'counters');

    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.banStatus?.isBanned) {
          const until = userData.banStatus.bannedUntil?.toDate();
          if (!until || until > new Date()) {
            setBanInfo({ isBanned: true, bannedUntil: userData.banStatus.bannedUntil });
            setIsSigningIn(false);
            return;
          }
        }
      } else {
        // Create new user with sequential ID
        const accountNumber: string = await runTransaction(firestore, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          let nextUserId = 1;

          if (uid === CREATOR_ID) {
            nextUserId = 0;
          } else {
            const lastId = counterDoc.data()?.lastUserId || 0;
            nextUserId = lastId + 1;
          }

          transaction.set(counterRef, { lastUserId: nextUserId }, { merge: true });
          const paddedId = nextUserId < 10000 ? nextUserId.toString().padStart(4, '0') : nextUserId.toString();
          return paddedId;
        });

        const baseData = {
          id: uid,
          username: displayName || `Tribe_${accountNumber.slice(-4)}`,
          accountNumber,
          avatarUrl: '',
          wallet: {
            coins: 0,
            diamonds: 0,
            totalSpent: 0,
            dailySpent: 0,
            weeklySpent: 0,
            monthlySpent: 0
          },
          level: { rich: 1, charm: 1 },
          banStatus: { isBanned: false, bannedUntil: null, reason: '' },
          isOnline: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userRef, baseData);
        await setDoc(profileRef, {
          ...baseData,
          email: email || '',
          bio: 'Find your vibe, connect with your tribe.',
          inventory: { ownedItems: [], activeFrame: 'None' },
          tags: [],
          stats: {
            followers: 0,
            fans: 0,
            totalGifts: 0,
            dailyFans: 0,
            dailyGiftsReceived: 0,
            weeklyGiftsReceived: 0,
            monthlyGiftsReceived: 0,
            dailyGameWins: 0,
            weeklyGameWins: 0,
            monthlyGameWins: 0,
            friends: 0,
            following: 0
          }
        });
        console.log(`✅ Profile created with Internal ID: ${accountNumber}`);
      }
    } catch (err) {
      console.error("[Identity Sync] Error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    
    try {
      const isNative = Capacitor.isNativePlatform();
      console.log("[Auth-Debug] Sign In Started. Native Platform:", isNative);
      
      if (isNative) {
        try {
          if (!FirebaseAuthentication) {
             throw new Error("Native Plugin not loaded");
          }
          
          const result = await (FirebaseAuthentication as any).signInWithGoogle({
            webClientId: '373109833688-655nmcl2juhrn5kop38geb4khuu3dsl5.apps.googleusercontent.com'
          });
          
          if (result.credential?.idToken) {
            const credential = GoogleAuthProvider.credential(result.credential.idToken);
            const userCredential = await signInWithCredential(auth, credential);

            if (userCredential.user) {
              await syncUserIdentity(
                userCredential.user.uid,
                userCredential.user.email,
                userCredential.user.displayName
              );
              router.replace('/rooms');
              return; // Success
            }
          } else {
            console.warn("[Auth-Debug] Native ID Token missing, falling back to Web.");
          }
        } catch (nativeError: any) {
          console.error("[Auth-Debug] Native Sign-In failed, falling back to Web:", nativeError);
          // Auto-fallback to web-based login below
        }
      }

      // Web-based Google Sign-In (Used on web OR as fallback for native)
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithRedirect(auth, provider);
      
    } catch (error: any) {
      console.error("❌ Google Login Error:", error.code, error.message);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Could not sign in with Google. Please try again.',
      });
      setIsSigningIn(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      const provider = new FacebookAuthProvider();
      // Use Redirect for Mobile/WebView compatibility
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("❌ Facebook Login Error:", error.code, error.message);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Could not sign in with Facebook. Please try again.',
      });
      setIsSigningIn(false);
    }
  };

  const initRecaptcha = () => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
    return (window as any).recaptchaVerifier;
  };

  const handlePhoneSignIn = async () => {
    if (!auth) return;
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length < 10) {
      toast({ variant: 'destructive', title: 'Invalid Number', description: 'Enter a valid phone number with country code.' });
      return;
    }
    console.log("[Auth-Debug] Phone Sign-In Clicked. Native Platform:", Capacitor.isNativePlatform());
    setIsSigningIn(true);
    try {
      const formattedNumber = `${selectedCountry.code}${cleanNumber}`;
      console.log("[Auth-Debug] Formatted Number:", formattedNumber);

      if (Capacitor.isNativePlatform()) {
        console.log("[Auth-Debug] Attempting Native Phone Sign-In...");
        try {
          await FirebaseAuthentication.signInWithPhoneNumber({ phoneNumber: formattedNumber });
          console.log("[Auth-Debug] Native Phone Sign-In call successful. Waiting for listeners...");
          // Native response is handled via listeners
          return;
        } catch (nativeError: any) {
          console.error("[Auth-Debug] Native Phone Sign-In failed, falling back to Web:", nativeError);
        }
      }

      const verifier = initRecaptcha();
      const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(result);
      setPhoneLoginStep('code');
      toast({ title: 'Code Sent', description: 'OTP dispatched via SMS.' });
    } catch (error: any) {
      console.error("Phone Auth Error", error);
      toast({ variant: 'destructive', title: 'Failed to Send Code', description: error.message });
    } finally {
      if (!Capacitor.isNativePlatform()) {
        setIsSigningIn(false);
      }
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult && !nativeVerificationId) return;
    setIsSigningIn(true);
    try {
      if (Capacitor.isNativePlatform() && nativeVerificationId) {
        const result = await FirebaseAuthentication.confirmVerificationCode({
          verificationId: nativeVerificationId,
          verificationCode: verificationCode
        });
        if (result.user) {
          await syncUserIdentity(result.user.uid, result.user.phoneNumber || null, null);
          setShowPhonePopup(false);
          router.push('/rooms');
        }
        return;
      }

      const result = await confirmationResult!.confirm(verificationCode);
      if (result.user) {
        await syncUserIdentity(result.user.uid, result.user.phoneNumber, null);
        setShowPhonePopup(false);
        router.push('/rooms');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Incorrect or expired verification code.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  if (isAuthLoading || user) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-[#ff8ebb] via-[#ffade0] to-[#f472b6]">
        <UmmyLogoIcon className="h-24 w-24 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('/images/login_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div id="recaptcha-container" />

      <div className="relative z-20 w-full max-w-md p-5">
        <div className="w-full rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl p-6 space-y-6 text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
            <img src="/images/ummy-logon.png" alt="Ummy logo" className="h-16 w-16 object-contain" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Ummy</h1>
            <p className="text-sm text-white/80 font-medium">Find your vibe. Connect with your Tribe</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleFacebookSignIn}
              disabled={isSigningIn}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              Continue with Facebook
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full h-12 rounded-xl bg-white text-black font-bold text-base shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isSigningIn ? <Loader className="animate-spin h-5 w-5" /> : <FcGoogle className="h-5 w-5" />}
              Sign in with Google
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-white/30" />
            <span className="text-xs text-white/70 uppercase">OR</span>
            <span className="h-px flex-1 bg-white/30" />
          </div>

          <button
            onClick={() => setShowPhonePopup(true)}
            className="w-20 h-12 rounded-xl bg-white/20 text-white border border-white/30 font-bold hover:bg-white/30 transition-all active:scale-95 mx-auto flex items-center justify-center"
          >
            Phone
          </button>

          <p className="text-[11px] text-white/70 leading-snug">
            By continuing you agree to the <Link href="/help-center" className="underline">User Agreement</Link> & <Link href="/help-center" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Phone Login Popup Modal */}
      {showPhonePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-b from-[#FF91B5] to-[#f472b6] border border-white/20 shadow-2xl p-6 md:p-8 flex flex-col items-center">

            <button
              onClick={() => { setShowPhonePopup(false); setPhoneLoginStep('number'); }}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>

            <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/20">
              <Phone className="w-7 h-7 text-[#FFCC00]" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
              {phoneLoginStep === 'number' ? 'Enter Phone Number' : 'Enter OTP Code'}
            </h2>
            <p className="text-sm font-medium text-white/60 text-center mb-8 px-2">
              {phoneLoginStep === 'number'
                ? 'We will send you a verification code to authenticate your account securely.'
                : `A 6-digit code was sent to ${phoneNumber}`
              }
            </p>

            <div className="w-full space-y-4">
              {phoneLoginStep === 'number' ? (
                <>
                  <div className="flex gap-2 w-full">
                    {/* Country Selector Button */}
                    <button
                      onClick={() => setIsCountryDropdownOpen(true)}
                      className="flex-shrink-0 h-14 w-[85px] bg-black/20 border border-white/10 rounded-2xl px-2 flex items-center justify-between text-white hover:bg-black/30 transition-colors"
                    >
                      <span className="text-xl">{selectedCountry.flag}</span>
                      <span className="font-bold text-xs">{selectedCountry.code}</span>
                      <ChevronDown className="w-3 h-3 text-white/50" />
                    </button>

                    {/* Phone Number Input */}
                    <input
                      type="tel"
                      placeholder="Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSigningIn}
                      autoComplete="off"
                      className="flex-1 min-w-0 h-14 bg-black/20 border border-white/10 rounded-2xl px-4 text-white text-lg font-bold focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 placeholder:text-white/20"
                    />
                  </div>

                  <button
                    onClick={handlePhoneSignIn}
                    disabled={isSigningIn || !phoneNumber}
                    className="w-full h-14 rounded-2xl bg-[#FFCC00] text-black font-bold text-[17px] shadow-[0_0_20px_rgba(255,204,0,0.3)] hover:bg-[#FFD633] disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSigningIn ? <Loader className="animate-spin w-5 h-5" /> : 'Send Code'}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isSigningIn}
                    className="w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-4 text-white text-2xl tracking-[0.4em] font-bold text-center focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 placeholder:text-white/20"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={isSigningIn || verificationCode.length < 6}
                    className="w-full h-14 rounded-2xl bg-white text-[#140028] font-bold text-[17px] shadow-lg hover:bg-gray-100 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSigningIn ? <Loader className="animate-spin w-5 h-5" /> : 'Verify & Login'}
                  </button>
                  <button
                    onClick={() => setPhoneLoginStep('number')}
                    className="w-full mt-4 text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
                  >
                    Change Phone Number
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Premium Ban Dialog */}
      <BanDialog
        isOpen={!!banInfo}
        onClose={async () => {
          if (auth) await signOut(auth);
          setBanInfo(null);
        }}
        bannedUntil={banInfo?.bannedUntil}
        accountNumber={userProfile?.accountNumber}
      />

      {/* Country Selector Modal Dropdown */}
      {isCountryDropdownOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm h-[80vh] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Select Country</h3>
                <button 
                  onClick={() => setIsCountryDropdownOpen(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search country/code"
                  value={countrySearchQuery}
                  onChange={(e) => setCountrySearchQuery(e.target.value)}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/30 transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Country List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {COUNTRIES.filter(c => 
                c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || 
                c.code.includes(countrySearchQuery)
              ).map((country) => (
                <button
                  key={`${country.id}-${country.code}`}
                  onClick={() => {
                    setSelectedCountry(country);
                    setIsCountryDropdownOpen(false);
                    setCountrySearchQuery('');
                  }}
                  className={`w-full h-16 rounded-3xl px-4 flex items-center justify-between transition-all group ${
                    selectedCountry.id === country.id && selectedCountry.code === country.code ? 'bg-[#FFCC00]/10 ring-1 ring-[#FFCC00]/30' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl w-8 text-center">{country.flag}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white group-hover:text-[#FFCC00] transition-colors">{country.name}</p>
                      <p className="text-xs text-white/50">{country.id}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-white/70">{country.code}</span>
                </button>
              ))}
            </div>

            {/* Support hint */}
            <div className="p-4 bg-black/40 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Supported via Firebase Auth</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}