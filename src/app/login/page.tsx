'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader, Phone, Smartphone, X, Zap, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
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
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * High-Fidelity Identity Portal.
 * Redesigned for a modern social app experience inspired by Wafa, Mico, and Tango.
 * Features a full-screen abstract neon background with blur overlay and glassmorphism.
 */
export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState<'number' | 'code'>('number');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const loginBg = PlaceHolderImages.find(img => img.id === 'login-bg');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/rooms');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
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
      await confirmationResult.confirm(verificationCode);
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
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-between p-8 overflow-hidden font-headline">
      <div id="recaptcha-container"></div>
      
      {/* Immersive Background Synchronization layer */}
      <div className="absolute inset-0 -z-10">
        {loginBg && (
          <Image 
            src={loginBg.imageUrl}
            alt="Background"
            fill
            className="object-cover"
            priority
            unoptimized
            data-ai-hint={loginBg.imageHint}
          />
        )}
        {/* Depth Overlay Protocol */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      </div>

      {/* Header Section: Sovereign Branding */}
      <header className="relative z-20 flex flex-col items-center text-center mt-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="relative group mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-[3rem] blur-3xl group-hover:scale-110 transition-transform duration-700" />
          <UmmyLogoIcon className="h-28 w-28 relative z-10 logo-glow" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black uppercase tracking-tighter text-white drop-shadow-2xl">
            UMMY
          </h1>
          <p className="text-white/80 text-sm font-bold tracking-widest uppercase italic">
            Find your vibe, connect with your tribe
          </p>
        </div>
      </header>

      {/* Main Interaction Hub: Glassmorphism Sync */}
      <main className="relative z-20 w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in duration-700">
        <div className="w-full glass-card p-8 rounded-[20px] shadow-2xl flex flex-col gap-6 bg-black/20 border-white/10 backdrop-blur-xl">
          {!showPhoneInput ? (
            <>
              {/* Primary Interaction: Login with Phone */}
              <Button
                onClick={() => setShowPhoneInput(true)}
                className="w-full h-16 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-indigo-900/40 border-none transition-all active:scale-95"
              >
                <Smartphone className="mr-3 h-6 w-6" />
                Login with Phone
              </Button>

              {/* Secondary Interaction: Continue with Google */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full h-16 bg-white text-black hover:bg-slate-50 rounded-2xl font-black uppercase italic text-lg shadow-lg transition-all active:scale-95 border-none"
              >
                {isSigningIn ? <Loader className="animate-spin h-6 w-6 mr-3 text-primary" /> : <FcGoogle className="h-7 w-7 mr-3" />}
                Continue with Google
              </Button>
            </>
          ) : (
            <div className="space-y-6 animate-in zoom-in duration-300 w-full">
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2 text-white/80">
                    <Phone className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Phone Entry Sync</span>
                 </div>
                 <button onClick={() => { setShowPhoneInput(false); setPhoneLoginStep('number'); }} className="text-white/60 hover:text-white p-1 transition-colors"><X className="h-5 w-5" /></button>
              </div>

              {phoneLoginStep === 'number' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      type="tel"
                      placeholder="+91 00000 00000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSigningIn}
                      className="h-14 bg-black/40 border-white/10 text-white rounded-2xl text-center text-lg focus:ring-primary/20 placeholder:text-white/20 transition-all font-black italic"
                    />
                  </div>
                  <Button 
                    onClick={handlePhoneSignIn} 
                    disabled={isSigningIn || !phoneNumber} 
                    className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl shadow-xl border-none active:scale-95 transition-all"
                  >
                    {isSigningIn ? <Loader className="h-5 w-5 animate-spin" /> : 'Get OTP Sync'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] text-white/60 text-center uppercase font-bold">Enter code sent to {phoneNumber}</p>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isSigningIn}
                    className="h-16 bg-black/40 border-white/10 text-white rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:ring-primary/20 italic"
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={isSigningIn || !verificationCode} 
                    className="w-full h-14 bg-primary text-black font-black uppercase italic rounded-2xl shadow-xl border-none active:scale-95 transition-all"
                  >
                    {isSigningIn ? <Loader className="animate-spin h-6 w-6" /> : 'Synchronize Identity'}
                  </Button>
                  <button onClick={() => setPhoneLoginStep('number')} className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Back to Frequency</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Section: Compliance Ledger */}
      <footer className="relative z-20 flex flex-col items-center space-y-6 text-center mb-8 animate-in fade-in duration-1000 delay-500">
        <div className="text-[10px] text-white/60 leading-relaxed max-w-[240px] uppercase tracking-tighter font-bold">
          By continuing you agree to the<br/>
          <Link href="/help-center" className="underline font-black text-white hover:text-primary transition-colors">User Agreement</Link> & <Link href="/help-center" className="underline font-black text-white hover:text-primary transition-colors">Privacy Policy</Link>
        </div>
        
        <div className="flex items-center gap-3 opacity-30">
           <div className="h-[1px] w-12 bg-white" />
           <UmmyLogoIcon className="h-4 w-4 grayscale brightness-200" />
           <div className="h-[1px] w-12 bg-white" />
        </div>
      </footer>
    </div>
  );
}
