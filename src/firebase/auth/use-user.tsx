'use client';

import { useContext } from 'react';
import { FirebaseContext, type UserHookResult } from '@/firebase/provider';

/**
 * A hook to access the current authenticated user's state.
 *
 * @example
 * const { user, isUserLoading, userError } = useUser();
 * if (isUserLoading) return <p>Loading...</p>;
 * if (userError) return <p>Error: {userError.message}</p>;
 * if (!user) return <p>Please sign in.</p>;
 * return <p>Welcome, {user.displayName}</p>;
 *
 * @returns {UserHookResult} An object containing the user object, loading state, and any potential error.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }

  // This hook specifically returns only the user-related state from the broader context.
  const { user, isUserLoading, userError } = context;
  return { user, isUserLoading, userError };
};
