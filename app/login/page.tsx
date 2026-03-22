'use client';

import { useState, useEffect } from 'react';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { Loader, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
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
        backgroundImage: `url('${activeBg || '/images/login_bg.png'}')`,
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
            onClick={() => router.push('/phone-login')}
            className="w-20 h-12 rounded-xl bg-white/20 text-white border border-white/30 font-bold hover:bg-white/30 transition-all active:scale-95 mx-auto"
          >
            Phone
          </button>

          <p className="text-[11px] text-white/70 leading-snug">
            By continuing you agree to the <Link href="/help-center" className="underline">User Agreement</Link> & <Link href="/help-center" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}