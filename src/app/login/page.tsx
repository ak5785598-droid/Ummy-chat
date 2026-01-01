'use client';

import { Button } from '@/components/ui/button';
import { UmmyLogoIcon } from '@/components/icons';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // Navigate to the main app page on login
    router.push('/rooms');
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
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
        <Button
          variant="outline"
          className="w-full justify-center gap-4 bg-white text-black hover:bg-gray-200"
          onClick={handleLogin}
        >
          <Phone className="h-5 w-5" />
          sign in with phone
        </Button>
        <Button
          variant="outline"
          className="w-full justify-center gap-4 bg-white text-black hover:bg-gray-200"
          onClick={handleLogin}
        >
          <FcGoogle className="h-5 w-5" />
          sign in with google
        </Button>
        <Button
          variant="outline"
          className="w-full justify-center gap-4 bg-[#1877F2] text-white hover:bg-[#166fe5]"
          onClick={handleLogin}
        >
          <FaFacebook className="h-5 w-5" />
          Facebook sign in
        </Button>
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
