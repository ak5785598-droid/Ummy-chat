'use client';

import React, { useState, useEffect } from 'react';

/**
 * Hydration Boundary.
 * Ensures the component tree only renders on the client after the initial mount to prevent React hook mismatches (#310).
 */
export function HydrationBoundary({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
