'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function LoginPage() {
  const [authFlow, setAuthFlow] = useState<'main' | 'phone'>('main');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is logged in, redirect to rooms
    if (!isUserLoading && user) {
      router.push('/rooms');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
          },
        }
      );
    }
  }, [auth]);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/rooms');
    } catch (error) {
      console.error('Error signing in with Google: ', error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: (error as Error).message,
      });
    }
  };

  const handleFacebookSignIn = async () => {
    if (!auth) return;
    const provider = new FacebookAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/rooms');
    } catch (error) {
      console.error('Error signing in with Facebook: ', error);
      toast({
        variant: 'destructive',
        title: 'Facebook Sign-In Failed',
        description: (error as Error).message,
      });
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !window.recaptchaVerifier) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Authentication service is not ready. Please try again in a moment.',
      });
      return;
    }
    setIsSendingCode(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+${phoneNumber}`,
        window.recaptchaVerifier
      );
      window.confirmationResult = confirmationResult;
      toast({
        title: 'Verification code sent!',
        description: `A code has been sent to +${phoneNumber}`,
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Could not send verification code. Please check the number and try again.',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirmationResult) {
      console.error('No confirmation result available.');
      toast({
        variant: 'destructive',
        title: 'Verification Error',
        description: 'Please request a new code.',
      });
      return;
    }
    setIsVerifyingCode(true);
    try {
      await window.confirmationResult.confirm(code);
      router.push('/rooms');
    } catch (error) {
      console.error('Error verifying code: ', error);
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'The code you entered is incorrect. Please try again.',
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
      <div id="recaptcha-container"></div>
      <div className="flex flex-col items-center text-center">
        <UmmyLogoIcon className="h-24 w-24" />
        <h1 className="mt-4 font-headline text-6xl font-bold text-foreground">
          Ummy
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          connect raho dilsey....
        </p>
      </div>

      <div className="mt-16 w-full max-w-sm space-y-4">
        {authFlow === 'main' && (
          <>
            <Button
              variant="outline"
              className="w-full justify-center gap-4 bg-white text-black hover:bg-gray-200"
              onClick={() => setAuthFlow('phone')}
            >
              <Phone className="h-5 w-5" />
              sign in with phone
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-4 bg-white text-black hover:bg-gray-200"
              onClick={handleGoogleSignIn}
            >
              <FcGoogle className="h-5 w-5" />
              sign in with google
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-4 bg-[#1877F2] text-white hover:bg-[#166fe5]"
              onClick={handleFacebookSignIn}
            >
              <FaFacebook className="h-5 w-5" />
              Facebook sign in
            </Button>
          </>
        )}

        {authFlow === 'phone' && (
          <div className="space-y-4 animate-in fade-in-20">
            {!window.confirmationResult ? (
              <form onSubmit={handlePhoneSignIn} className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Enter your phone number with country code.
                </p>
                <Input
                  type="tel"
                  placeholder="e.g. 919876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={isSendingCode}>
                  {isSendingCode ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Enter the 6-digit code sent to your phone.
                </p>
                <Input
                  type="text"
                  placeholder="Verification Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isVerifyingCode}
                >
                  {isVerifyingCode ? 'Verifying...' : 'Verify and Sign In'}
                </Button>
              </form>
            )}
            <Button
              variant="link"
              onClick={() => {
                setAuthFlow('main');
                window.confirmationResult = undefined;
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to other sign-in options
            </Button>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
        <p>By signing in, you agree to our</p>
        <Link href="/terms" className="underline">
          Term & privacy
        </Link>
      </div>
    </div>
  );
}
