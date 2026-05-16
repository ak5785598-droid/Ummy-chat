'use client';

import { useState } from 'react';
import { Loader, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BiometricLoginButtonProps {
  onClick: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  className?: string;
}

export function BiometricLoginButton({
  onClick,
  isLoading,
  error,
  className,
}: BiometricLoginButtonProps) {
  const [shake, setShake] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    try {
      await onClick();
    } catch {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600',
          'text-white font-bold text-base shadow-lg transition-all active:scale-95',
          'flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed',
          shake && 'animate-shake',
          className
        )}
      >
        {isLoading ? (
          <Loader className="h-6 w-6 animate-spin" />
        ) : (
          <Fingerprint className="h-6 w-6" />
        )}
        {isLoading ? 'Authenticating...' : 'Login with Biometric'}
      </button>
      {error && (
        <p className="text-xs text-red-400 text-center animate-in fade-in slide-in-from-top-2">
          {error}
        </p>
      )}
    </div>
  );
}
