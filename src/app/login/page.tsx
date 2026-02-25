'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader, Phone, ShieldCheck } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isLoading: isUserLoading } = useUser();
  const { toast } = useToast();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [phoneLoginStep, setPhoneLoginStep] = useState<'number' | 'code'>(
    'number'
  );
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);

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
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'Could not sign in with Google.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handlePhoneSignIn = async () => {
    if (!auth) return;
    
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Number',
        description: 'Please enter a full phone number with country code.',
      });
      return;
    }

    setIsSigningIn(true);
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      
      const verifier = (window as any).recaptchaVerifier;
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(result);
      setPhoneLoginStep('code');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Code',
        description: error.message,
      });
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handleVerifyCode = async () => {
    if (!confirmationResult) return;
    setIsSigningIn(true);
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Invalid Code',
            description: 'The verification code is incorrect.',
        });
    } finally {
        setIsSigningIn(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FFCC00]">
        <UmmyLogoIcon className="h-24 w-24 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-foreground font-sans">
      <div id="recaptcha-container"></div>
      
      <div className="flex flex-col items-center text-center space-y-4 mb-12 animate-in fade-in duration-1000">
        <div className="relative">
           <UmmyLogoIcon className="h-32 w-32 relative z-10 drop-shadow-xl" />
        </div>
        <h1 className="font-headline text-6xl font-black italic uppercase tracking-tighter text-[#FFCC00] drop-shadow-sm mt-4">
          Ummy
        </h1>
        <p className="text-muted-foreground font-body text-lg uppercase tracking-widest opacity-60">
          Connecting Vibe
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        {phoneLoginStep === 'number' ? (
           <>
            <div className="space-y-3">
                <div className="relative">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                   <Input
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSigningIn}
                      className="h-14 pl-10 text-lg rounded-2xl border-2 focus:border-[#FFCC00] transition-all"
                   />
                </div>
                <Button onClick={handlePhoneSignIn} disabled={isSigningIn || !phoneNumber} className="w-full h-14 text-lg font-black uppercase italic rounded-2xl bg-[#FFCC00] text-white hover:bg-[#FFCC00]/90 shadow-xl shadow-yellow-500/20">
                    {isSigningIn ? <Loader className="h-5 w-5 animate-spin" /> : 'Join the Frequency'}
                </Button>
            </div>

            <div className="relative flex items-center gap-4 py-2">
              <span className="flex-1 border-t border-gray-100" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Secure Portal</span>
              <span className="flex-1 border-t border-gray-100" />
            </div>

            <Button
              variant="outline"
              className="w-full h-14 justify-center gap-4 bg-white text-black hover:bg-gray-50 border-2 rounded-2xl font-black uppercase italic transition-all"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              <FcGoogle className="h-6 w-6" />
              Sign in with Google
            </Button>
          </>
        ) : (
             <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="text-center space-y-1">
                   <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Identity Sync</p>
                   <p className="text-xs text-muted-foreground">Sent to {phoneNumber}</p>
                </div>
                <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isSigningIn}
                    className="h-16 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 focus:border-[#FFCC00]"
                    maxLength={6}
                />
                <Button onClick={handleVerifyCode} disabled={isSigningIn || !verificationCode} className="w-full h-14 text-lg font-black uppercase italic rounded-2xl bg-[#FFCC00] text-white">
                    {isSigningIn ? <Loader className="h-5 w-5 animate-spin" /> : 'Enter Frequency'}
                </Button>
                <button onClick={() => setPhoneLoginStep('number')} className="w-full text-muted-foreground font-black uppercase text-[10px] tracking-widest hover:text-foreground transition-colors">
                    Wrong Number?
                </button>
            </div>
        )}
      </div>

      <div className="mt-16 flex flex-col items-center gap-4 text-center">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-[#FFCC00]" />
            <span>End-to-End Frequency Encryption</span>
         </div>
         <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[200px]">
            By continuing, you join the official Ummy tribe. <Link href="/terms" className="underline font-bold text-foreground">Terms & Privacy</Link>.
         </p>
      </div>
    </div>
  );
}
