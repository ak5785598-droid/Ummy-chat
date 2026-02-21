'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader } from 'lucide-react';
import Link from 'next/link';
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
      router.push('/rooms');
    }
  }, [user, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
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
    
    // Basic validation to prevent auth/invalid-phone-number (TOO_SHORT)
    if (phoneNumber.replace(/\D/g, '').length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Number',
        description: 'Please enter a full phone number with area code (at least 10 digits).',
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
      toast({
        title: 'Code Sent',
        description: 'Check your phone for the verification code.',
      });
    } catch (error: any) {
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
           if((window as any).grecaptcha){
               (window as any).grecaptcha.reset(widgetId);
           }
        });
      }
      toast({
        variant: 'destructive',
        title: 'Failed to Send Code',
        description: error.code === 'auth/invalid-phone-number' 
          ? 'The phone number format is invalid. Use e.g. 15551234567' 
          : error.message,
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
            description: 'The verification code is incorrect. Please try again.',
        });
    } finally {
        setIsSigningIn(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground text-sans">
      <div id="recaptcha-container"></div>
      <div className="flex flex-col items-center text-center">
        <UmmyLogoIcon className="h-24 w-24 text-primary" />
        <h1 className="mt-4 font-headline text-6xl font-bold text-primary">
          Ummy
        </h1>
        <p className="mt-2 text-lg text-muted-foreground font-serif">
          Find your vibe, connect with your tribe.
        </p>
      </div>

      <div className="mt-16 w-full max-w-sm space-y-4">
        {phoneLoginStep === 'number' ? (
           <>
            <div className="flex flex-col gap-2">
                <Input
                    type="tel"
                    placeholder="Phone (e.g. 15551234567)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSigningIn}
                    className="h-12 text-lg"
                />
                 <Button onClick={handlePhoneSignIn} disabled={isSigningIn || !phoneNumber} className="h-12 text-lg font-bold">
                    {isSigningIn ? <Loader className="h-4 w-4 animate-spin" /> : 'Send Verification Code'}
                </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 justify-center gap-4 bg-white text-black hover:bg-gray-200 border-2"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              <FcGoogle className="h-6 w-6" />
              Sign in with Google
            </Button>
          </>
        ) : (
             <div className="space-y-4">
                <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isSigningIn}
                    className="h-12 text-center text-2xl tracking-widest"
                    maxLength={6}
                />
                <Button onClick={handleVerifyCode} disabled={isSigningIn || !verificationCode} className="w-full h-12 text-lg font-bold">
                    {isSigningIn ? <Loader className="h-4 w-4 animate-spin" /> : 'Verify and Sign In'}
                </Button>
                <Button variant="link" onClick={() => setPhoneLoginStep('number')} className="w-full text-muted-foreground">
                    Edit Phone Number
                </Button>
            </div>
        )}
      </div>

      <div className="absolute bottom-8 text-center text-xs text-muted-foreground font-serif">
        <p>By signing in, you agree to our</p>
        <Link href="/terms" className="underline">
          Terms & Privacy
        </Link>
      </div>
    </div>
  );
}
