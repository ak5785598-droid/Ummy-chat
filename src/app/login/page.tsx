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
 * Features dynamic background sync managed via the Admin Portal.
 * Re-engineered with robust Identity Handshake to prevent permission errors.
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
  const customBg = config?.loginBackgroundUrl;
  const fallbackBg = PlaceHolderImages.find(img => img.id === 'login-bg')?.imageUrl;
  const activeBg = customBg || fallbackBg;

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/rooms');
    }
  }, [user, isUserLoading, router]);

  /**
   * SOVEREIGN IDENTITY HANDSHAKE
   * Ensures new users have their Firestore documents created immediately upon authentication.
   */
  const syncUserIdentity = async (uid: string, email: string | null, displayName: string | null) => {
    if (!firestore) return;
    
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
          tags: []
        });
        
        console.log(`[Identity Sync] Established new frequency for: ${uid}`);
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
      className="relative flex h-[100dvh] w-full flex-col items-center justify-between p-8 overflow-hidden font-headline"
      style={{
        backgroundImage: `url('${activeBg}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div id="recaptcha-container"></div>
      <div className="absolute inset-0 bg-black/40" />

      <header className="relative z-20 flex flex-col items-center text-center mt-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative mb-4">
          <div className="h-28 w-28 relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10">
            <UmmyLogoIcon className="h-full w-full" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white drop-shadow-lg tracking-tight">
            Ummy
          </h1>
          <p className="text-white text-sm font-medium opacity-90">
            Find your vibe. Connect with your Tribe
          </p>
        </div>
      </header>

      <main className="relative z-20 w-full max-w-sm flex flex-col items-center gap-4 mb-16 animate-in fade-in zoom-in duration-700">
        {!showPhoneInput ? (
          <>
            <Button
              onClick={() => setShowPhoneInput(true)}
              className="w-full h-14 bg-white text-black hover:bg-slate-50 rounded-full font-black text-lg shadow-xl border-none transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <Smartphone className="h-6 w-6" />
              Phone Login
            </Button>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full h-14 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-full font-black text-lg shadow-lg transition-all active:scale-95 border border-white/20 flex items-center justify-center gap-3"
            >
              {isSigningIn ? <Loader className="animate-spin h-6 w-6" /> : <FcGoogle className="h-6 w-6" />}
              Sign in with Google
            </Button>
          </>
        ) : (
          <div className="space-y-6 animate-in zoom-in duration-300 w-full bg-black/20 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2 text-white/80">
                  <Phone className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Phone Entry</span>
               </div>
               <button onClick={() => { setShowPhoneInput(false); setPhoneLoginStep('number'); }} className="text-white/60 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
            </div>

            {phoneLoginStep === 'number' ? (
              <div className="space-y-4">
                <Input
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isSigningIn}
                  className="h-14 bg-white/5 border-white/10 text-white rounded-xl text-center text-lg focus:ring-primary/20 placeholder:text-white/20 font-bold italic"
                />
                <Button 
                  onClick={handlePhoneSignIn} 
                  disabled={isSigningIn || !phoneNumber} 
                  className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-full shadow-xl border-none active:scale-95 transition-all"
                >
                  {isSigningIn ? <Loader className="animate-spin h-6 w-6" /> : 'Get OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-white/60 text-center uppercase font-bold">Code for {phoneNumber}</p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  disabled={isSigningIn}
                  className="h-16 bg-white/5 border-white/10 text-white rounded-xl text-center text-3xl font-black tracking-[0.5em] focus:ring-primary/20 italic"
                  maxLength={6}
                />
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isSigningIn || !verificationCode} 
                  className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-full shadow-xl border-none active:scale-95 transition-all"
                >
                  {isSigningIn ? <Loader className="animate-spin h-6 w-6" /> : 'Verify Sync'}
                </Button>
                <button onClick={() => setPhoneLoginStep('number')} className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white">Change Number</button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-20 flex flex-col items-center space-y-4 text-center mb-10 animate-in fade-in duration-1000">
        <div className="text-[10px] text-white/80 leading-relaxed max-w-[240px] font-medium drop-shadow-md">
          By continuing you agree to the <Link href="/help-center" className="underline font-bold">User Agreement</Link> & <Link href="/help-center" className="underline font-bold">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}