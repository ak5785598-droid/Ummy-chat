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
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not sign in with Google.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const handlePhoneSignIn = async () => {
    if (!auth) return;
    setIsSigningIn(true);
    try {
      // Lazy initialization of RecaptchaVerifier to avoid "auth/argument-error" 
      // and "already rendered" issues often caused by React 18's strict mode useEffect.
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      
      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, `+${phoneNumber}`, verifier);
      setConfirmationResult(result);
      setPhoneLoginStep('code');
      toast({
        title: 'Verification Code Sent',
        description: 'Please check your phone for the code.',
      });
    } catch (error: any) {
      console.error(error);
      // Reset reCAPTCHA on error if it was rendered
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.render().then((widgetId: any) => {
           if((window as any).grecaptcha){
               (window as any).grecaptcha.reset(widgetId);
           }
        });
      }
      toast({
        variant: 'destructive',
        title: 'Failed to send code',
        description: error.message || 'Could not send verification code.',
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
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Invalid Code',
            description: error.message || 'The code you entered is incorrect.',
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
      <div id="recaptcha-container"></div>
      <div className="flex flex-col items-center text-center">
        <UmmyLogoIcon className="h-24 w-24 text-primary" />
        <h1 className="mt-4 font-headline text-6xl font-bold text-primary">
          Ummy
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Find your vibe, connect with your tribe.
        </p>
      </div>

      <div className="mt-16 w-full max-w-sm space-y-4">
        {phoneLoginStep === 'number' ? (
           <>
            <div className="flex gap-2">
                <Input
                    type="tel"
                    placeholder="Phone Number (e.g. 15551234567)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isSigningIn}
                />
                 <Button onClick={handlePhoneSignIn} disabled={isSigningIn || !phoneNumber}>
                    {isSigningIn ? <Loader className="h-4 w-4 animate-spin" /> : 'Send Code'}
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
              className="w-full justify-center gap-4 bg-white text-black hover:bg-gray-200"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              <FcGoogle className="h-5 w-5" />
              Sign in with Google
            </Button>
          </>
        ) : (
             <div className="space-y-4">
                <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    disabled={isSigningIn}
                />
                <Button onClick={handleVerifyCode} disabled={isSigningIn || !verificationCode} className="w-full">
                    {isSigningIn ? <Loader className="h-4 w-4 animate-spin" /> : 'Verify and Sign In'}
                </Button>
                <Button variant="link" onClick={() => setPhoneLoginStep('number')}>
                    Back to phone number entry
                </Button>
            </div>
        )}
      </div>

      <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
        <p>By signing in, you agree to our</p>
        <Link href="/terms" className="underline">
          Terms & Privacy
        </Link>
      </div>
    </div>
  );
}
