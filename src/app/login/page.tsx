'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader, Phone, Smartphone, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * High-Fidelity Identity Portal.
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
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
      console.error("[Identity Sync] Handshake Error:", err);
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
        await syncUserIdentity(result.user.uid, result.user.email, result.user.displayName);
      }
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description: error.message || 'Could not sign in with Google.',
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handlePhoneSignIn = async () => {
    if (!auth) return;
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      toast({ variant: 'destructive', title: 'Invalid Number', description: 'Enter full number with country code.' });
      return;
    }
    setIsSigningIn(true);
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const verifier = (window as any).recaptchaVerifier;
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(result);
      setPhoneLoginStep('code');
      toast({ title: 'Code Sent', description: 'Verification dispatched via SMS.' });
    } catch (error: any) {
      (window as any).recaptchaVerifier = null;
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
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
        await syncUserIdentity(result.user.uid, null, null);
      }
      toast({ title: 'Identity Verified', description: 'Synchronizing with tribal graph...' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Invalid Code', description: 'Incorrect verification code.' });
    } finally {
        setIsSigningIn(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#140028]">
        <UmmyLogoIcon className="h-24 w-24 animate-pulse logo-glow" />
      </div>
    );
  }

  return (
    <div 
      className="relative flex h-[100dvh] w-full items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('${activeBg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div id="recaptcha-container" />

      <div className="relative z-20 flex w-full max-w-md p-4">
        <div className="w-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl p-6 text-center space-y-6">
          <div className="mx-auto h-24 w-24 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center">
            <UmmyLogoIcon className="h-16 w-16 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Ummy</h1>
            <p className="text-sm font-light text-white/80">Find your vibe. Connect with your Tribe</p>
          </div>

          {showPhoneInput ? (
            <div className="space-y-4">
              <div className="bg-black/20 backdrop-blur-lg rounded-2xl border border-white/15 p-4 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider text-white/70">Phone Login</span>
                  <button onClick={() => { setShowPhoneInput(false); setPhoneLoginStep('number'); }} className="text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                {phoneLoginStep === 'number' ? (
                  <>
                    <Input
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSigningIn}
                      className="h-14 w-full bg-white/10 border-white/20 text-white rounded-xl text-center text-lg focus:ring-primary/30 placeholder:text-white/30 font-semibold"
                    />
                    <Button
                      onClick={handlePhoneSignIn}
                      disabled={isSigningIn || !phoneNumber}
                      className="w-full h-12 rounded-xl bg-white text-black font-bold shadow-lg border-none active:scale-95 transition-all"
                    >
                      {isSigningIn ? <Loader className="animate-spin h-5 w-5" /> : 'Get OTP'}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-white/70 text-center">Code for {phoneNumber}</p>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      disabled={isSigningIn}
                      className="h-14 w-full bg-white/10 border-white/20 text-white rounded-xl text-center text-lg font-bold tracking-[0.25em]"
                      maxLength={6}
                    />
                    <Button
                      onClick={handleVerifyCode}
                      disabled={isSigningIn || !verificationCode}
                      className="w-full h-12 rounded-xl bg-white text-black font-bold shadow-lg border-none active:scale-95 transition-all"
                    >
                      {isSigningIn ? <Loader className="animate-spin h-5 w-5" /> : 'Verify OTP'}
                    </Button>
                    <button onClick={() => setPhoneLoginStep('number')} className="w-full text-xs font-semibold text-white/70 hover:text-white">Change Number</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-11/12 max-w-[260px] h-12 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FcGoogle className="h-5 w-5" />
                Continue with Facebook
              </Button>

              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-11/12 max-w-[260px] h-12 rounded-xl bg-white/20 text-white border border-white/20 hover:bg-white/30 font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSigningIn ? <Loader className="animate-spin h-5 w-5" /> : <FcGoogle className="h-5 w-5" />}
                Sign in with Google
              </Button>

              <div className="flex items-center gap-2 w-11/12 max-w-[260px]">
                <span className="h-px flex-1 bg-white/30" />
                <span className="text-xs uppercase tracking-wider text-white/70">OR</span>
                <span className="h-px flex-1 bg-white/30" />
              </div>

              <Button
                onClick={() => setShowPhoneInput(true)}
                className="w-11/12 max-w-[260px] h-12 rounded-xl bg-white/20 text-white border border-white/20 hover:bg-white/30 font-bold shadow-lg active:scale-95 transition-all"
              >
                Phone Login
              </Button>
            </div>
          )}

          <p className="text-[11px] text-white/70 leading-snug">
            By continuing you agree to the <Link href="/help-center" className="underline">User Agreement</Link> & <Link href="/help-center" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
