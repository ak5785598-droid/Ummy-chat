'use client';

import { useState, useEffect } from 'react';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader, Phone, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * Beautiful Ummy Login Portal - Purple Gradient Design
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  
  // Phone Login State
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState<'number' | 'code'>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Global Branding Sync
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const splashBg = config?.splashScreenUrl;
  const loginBg = config?.loginBackgroundUrl;
  const fallbackBg = PlaceHolderImages.find(img => img.id === 'login-bg')?.imageUrl;
  
  const activeBg = loginBg || splashBg || fallbackBg;

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/rooms');
    }
  }, [user, isUserLoading, router]);

  const syncUserIdentity = async (uid: string, email: string | null, displayName: string | null) => {
    if (!firestore || !uid) return;
    
    const userRef = doc(firestore, 'users', uid);
    const profileRef = doc(firestore, 'users', uid, 'profile', uid);
    
    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
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
      }
    } catch (err) {
      console.error("[Identity Sync] Error:", err);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        console.log("✅ User logged in with Google:", result.user);
        await syncUserIdentity(result.user.uid, result.user.email, result.user.displayName);
        router.push('/rooms');
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("❌ Google Login Error:", error.code, error.message);
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: 'Could not sign in with Google. Please try again.',
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      const provider = new FacebookAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        console.log("✅ User logged in with Facebook:", result.user);
        await syncUserIdentity(result.user.uid, result.user.email, result.user.displayName);
        router.push('/rooms');
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error("❌ Facebook Login Error:", error.code, error.message);
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: 'Could not sign in with Facebook. Please try again.',
        });
      }
    } finally {
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
    setIsSigningIn(true);
    try {
      const verifier = initRecaptcha();
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${cleanNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(result);
      setPhoneLoginStep('code');
      toast({ title: 'Code Sent', description: 'OTP dispatched via SMS.' });
    } catch (error: any) {
      console.error("Phone Auth Error", error);
      (window as any).recaptchaVerifier = null;
      toast({ variant: 'destructive', title: 'Failed to Send Code', description: error.message });
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handleVerifyCode = async () => {
    if (!confirmationResult) return;
    setIsSigningIn(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
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

  if (isUserLoading || user) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
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
      <div className="absolute inset-0 bg-black/40" />
      <div id="recaptcha-container" />

      <div className="relative z-20 w-full max-w-md p-5">
        <div className="w-full rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl p-6 space-y-6 text-center">
          <div className="mx-auto h-20 w-20 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
            <img src="/images/ummy-logon.png" alt="Ummy logo" className="h-16 w-16 object-contain" />
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Ummy</h1>
            <p className="text-sm text-white/80">Find your vibe. Connect with your Tribe</p>
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
          <div className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-b from-[#2a004a] to-[#140028] border border-white/10 shadow-2xl p-6 md:p-8 flex flex-col items-center">
            
            <button 
              onClick={() => { setShowPhonePopup(false); setPhoneLoginStep('number'); }}
              className="absolute top-4 right-4 p-2 bg-white/5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white/70" />
            </button>
            
            <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/20">
              <Phone className="w-7 h-7 text-[#FFCC00]" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
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
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSigningIn}
                    className="w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-4 text-white text-lg font-bold text-center focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 placeholder:text-white/20"
                  />
                  <button
                    onClick={handlePhoneSignIn}
                    disabled={isSigningIn || !phoneNumber}
                    className="w-full h-14 rounded-2xl bg-[#FFCC00] text-black font-black text-[17px] shadow-[0_0_20px_rgba(255,204,0,0.3)] hover:bg-[#FFD633] disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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
                    className="w-full h-14 bg-black/30 border border-white/10 rounded-2xl px-4 text-white text-2xl tracking-[0.4em] font-black text-center focus:outline-none focus:border-[#FFCC00] focus:ring-1 focus:ring-[#FFCC00]/50 placeholder:text-white/20"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={isSigningIn || verificationCode.length < 6}
                    className="w-full h-14 rounded-2xl bg-white text-[#140028] font-black text-[17px] shadow-lg hover:bg-gray-100 disabled:opacity-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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
    </div>
  );
}