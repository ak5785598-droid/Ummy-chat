import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { SecureStorage } from '@/lib/secure-storage';

interface BiometricAuthPlugin {
  isAvailable: () => Promise<{ available: boolean }>;
  authenticate: (options?: { title?: string; subtitle?: string; description?: string }) => Promise<{ success: boolean; message?: string }>;
}

let BiometricAuth: BiometricAuthPlugin | null = null;
let pluginLoadAttempted = false;

// Lazy load the plugin only on native platforms
const loadBiometricPlugin = async (): Promise<BiometricAuthPlugin | null> => {
  if (!Capacitor.isNativePlatform()) return null;
  if (BiometricAuth || pluginLoadAttempted) return BiometricAuth;

  pluginLoadAttempted = true;

  try {
    // Try to dynamically import the biometric plugin
    // This will fail gracefully if plugin is not installed
    const module = await import('capacitor-biometric-auth');
    BiometricAuth = (module as any).CapacitorBiometricAuth || 
                    (module as any).BiometricAuth || 
                    (module as any).default || 
                    null;
    return BiometricAuth;
  } catch (error) {
    // Plugin not available - this is expected if capacitor-biometric-auth is not installed
    console.info('[Biometric] Plugin not available, using fallback login methods');
    return null;
  }
};

export interface BiometricAuthState {
  isAvailable: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    isEnabled: false,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setState(prev => ({ ...prev, isAvailable: false }));
      return;
    }

    const checkAvailability = async () => {
      try {
        const plugin = await loadBiometricPlugin();
        if (!plugin) {
          setState(prev => ({ ...prev, isAvailable: false }));
          return;
        }

        const result = await plugin.isAvailable();
        const enabled = await SecureStorage.isBiometricEnabled();
        setState(prev => ({
          ...prev,
          isAvailable: result?.available || false,
          isEnabled: enabled,
        }));
      } catch (error) {
        console.error('[Biometric] Availability check failed:', error);
        setState(prev => ({ ...prev, isAvailable: false }));
      }
    };

    checkAvailability();
  }, []);

  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!state.isAvailable) {
      setState(prev => ({ ...prev, error: 'Biometric authentication not available' }));
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const plugin = await loadBiometricPlugin();
      if (!plugin) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Biometric plugin not loaded',
        }));
        return null;
      }

      const result = await plugin.authenticate({
        title: 'Login to Ummy',
        subtitle: 'Use your biometric credential to login',
        description: 'Authenticate to access your account',
      });

      if (result?.success) {
        const token = await SecureStorage.getToken();
        setState(prev => ({ ...prev, isLoading: false }));
        return token;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result?.message || 'Authentication failed',
        }));
        return null;
      }
    } catch (error: any) {
      console.error('[Biometric] Authentication failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Authentication failed',
      }));
      return null;
    }
  }, [state.isAvailable]);

  const enable = useCallback(async (token: string): Promise<boolean> => {
    try {
      await SecureStorage.setToken(token);
      await SecureStorage.setBiometricEnabled(true);
      setState(prev => ({ ...prev, isEnabled: true }));
      return true;
    } catch (error) {
      console.error('[Biometric] Enable failed:', error);
      return false;
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    await SecureStorage.clearAll();
    setState(prev => ({ ...prev, isEnabled: false }));
  }, []);

  return {
    ...state,
    authenticate,
    enable,
    disable,
  };
}
