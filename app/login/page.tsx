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
      className="relative flex h-[100dvh] w-full flex-col items-center justify-between p-6 overflow-hidden"
      style={{
        backgroundImage: `url('/login-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Animated starry background overlay */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Animated particles/sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20 animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 2 + 's'
            }}
          />
        ))}
      </div>

      {/* Header - Logo and Title */}
      <header className="relative z-20 flex flex-col items-center text-center mt-8 sm:mt-16">
        <div className="h-32 w-32 sm:h-40 sm:w-40 relative mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
          <UmmyLogoIcon className="h-full w-full drop-shadow-2xl" />
        </div>
        
        <h1 className="text-5xl sm:text-6xl font-black text-white drop-shadow-2xl mb-3 tracking-wider">
          Ummy
        </h1>
        <p className="text-white/90 text-base sm:text-lg font-medium drop-shadow-lg max-w-xs">
          Find your vibe. Connect with your Tribe
        </p>
      </header>

      {/* Main Authentication Section */}
      <main className="relative z-20 w-full max-w-sm px-4 mb-20 flex flex-col items-center gap-6">
        
        {/* Facebook Button */}
        <button
          onClick={handleFacebookSignIn}
          disabled={isSigningIn}
          className="w-full h-14 sm:h-16 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg sm:text-xl rounded-full shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="white" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continue with Facebook
        </button>

        {/* OR Divider */}
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1 h-px bg-white/30" />
          <span className="text-white/70 font-bold text-sm">OR</span>
          <div className="flex-1 h-px bg-white/30" />
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full h-14 sm:h-16 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg sm:text-xl rounded-full shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          {isSigningIn ? (
            <Loader className="w-6 h-6 sm:w-7 sm:h-7 animate-spin" />
          ) : (
            <FcGoogle className="w-6 h-6 sm:w-7 sm:h-7" />
          )}
          Sign in with Google
        </button>

        {/* Phone Button */}
        <button
          disabled={isSigningIn}
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center mx-auto"
        >
          <Phone className="w-7 h-7 sm:w-8 sm:h-8" />
        </button>
      </main>

      {/* Footer */}
      <footer className="relative z-20 text-center px-4 pb-6 sm:pb-8">
        <p className="text-white/80 text-xs sm:text-sm font-medium">
          By continuing you agree to the{' '}
          <Link href="/terms" className="text-white hover:text-white/90 underline">
            User Agreement
          </Link>
          {' & '}
          <Link href="/privacy" className="text-white hover:text-white/90 underline">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
}