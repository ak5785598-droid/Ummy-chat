
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Directly redirect to login page for simplicity
    router.replace('/login');
  }, [router]);

  return null;
}
