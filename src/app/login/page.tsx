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

/**
 * High-Fidelity Identity Portal.
 * Synchronized with the Deep-Purple Ummy palette.
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
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#1B0033]">
        <UmmyLogoIcon className="h-24 w-24 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] w-full flex-col items-center justify-center bg-gradient-to-br from-[#140028] via-[#2a0050] to-[#3d0073] p-8 overflow-hidden font-headline">
      <div id="recaptcha-container"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm space-y-10 animate-in fade-in zoom-in duration-700">
        {!showPhoneInput && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group bg-transparent">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <UmmyLogoIcon className="h-24 w-24 relative z-10 drop-shadow-[0_0_35px_rgba(255,79,163,0.8)]" />
            </div>
            <div className="space-y-1">
              <h1 className="text-6xl font-black uppercase tracking-tighter text-white drop-shadow-sm">
                Ummy
              </h1>
              <p className="text-primary text-sm font-bold tracking-[0.05em] uppercase">
                Find your vibe, connect with your tribe
              </p>
            </div>
          </div>
        )}

        <div className="w-full space-y-4">
          {!showPhoneInput ? (
            <>
              <Button
                onClick={() => setShowPhoneInput(true)}
                className="w-full h-14 bg-white text-[#1B0033] hover:bg-white/90 rounded-full font-bold uppercase text-lg shadow-xl border-none transition-all active:scale-95"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Phone Login
              </Button>

              <Button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="w-full h-14 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-full font-bold uppercase text-lg shadow-xl border border-white/20 transition-all active:scale-95"
              >
                {isSigningIn ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <FcGoogle className="h-6 w-6 mr-2" />}
                Sign in with Google
              </Button>
            </>
          ) : (
            <div className="space-y-6 animate-in zoom-in duration-300 bg-black/20 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl w-full">
              <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2 text-white/80">
                    <Phone className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Phone Entry</span>
                 </div>
                 <button onClick={() => { setShowPhoneInput(false); setPhoneLoginStep('number'); }} className="text-white/60 hover:text-white"><X className="h-5 w-5" /></button>
              </div>

              {phoneLoginStep === 'number' ? (
                <div className="space-y-4">
                  <Input
                    type="tel"
                    placeholder="+91 00000 00000"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSigningIn}
                    className="h-14 bg-white/5 border-white/10 text-white rounded-2xl text-center text-lg focus:ring-primary/20 placeholder:text-white/20"
                  />
                  <Button 
                    onClick={handlePhoneSignIn} 
                    disabled={isSigningIn || !phoneNumber} 
                    className="w-full h-14 bg-primary text-black font-black uppercase rounded-2xl shadow-xl border-none"
                  >
                    {isSigningIn ? <Loader className="h-5 w-5 animate-spin" /> : 'Get OTP'}
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
                    className="h-16 bg-white/5 border-white/10 text-white rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:ring-primary/20"
                    maxLength={6}
                  />
                  <Button 
                    onClick={handleVerifyCode} 
                    disabled={isSigningIn || !verificationCode} 
                    className="w-full h-14 bg-primary text-black font-black uppercase rounded-2xl shadow-xl border-none"
                  >
                    {isSigningIn ? <Loader className="h-5 w-5 animate-spin" /> : 'Enter Ummy'}
                  </Button>
                  <button onClick={() => setPhoneLoginStep('number')} className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white">Back</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="text-[10px] text-white/40 leading-relaxed max-w-[240px] uppercase tracking-tighter">
            By continuing you agree to the<br/>
            <Link href="/help-center" className="underline font-bold text-white/60">User Agreement</Link> & <Link href="/help-center" className="underline font-bold text-white/60">Privacy Policy</Link>
          </div>
          <div className="flex items-center gap-2 opacity-20">
             <div className="h-[1px] w-8 bg-white" />
             <span className="text-[8px] font-black uppercase tracking-widest text-white">Secured Tribal Portal</span>
             <div className="h-[1px] w-8 bg-white" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-8 z-10">
        <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-primary backdrop-blur-md border border-white/5">
          <Zap className="h-5 w-5" />
        </div>
      </div>
      <div className="absolute bottom-10 right-8 z-10">
        <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center text-primary backdrop-blur-md border border-white/5">
          <Activity className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
