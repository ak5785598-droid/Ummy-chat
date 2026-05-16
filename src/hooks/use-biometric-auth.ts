import { useState, useEffect, useCallback } from 'react';
import { CapacitorBiometricAuth } from 'capacitor-biometric-auth';
import { SecureStorage } from '@/lib/secure-storage';
import { Capacitor } from '@capacitor/core';

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
        const result = await CapacitorBiometricAuth.isAvailable();
        const enabled = await SecureStorage.isBiometricEnabled();
        setState(prev => ({
          ...prev,
          isAvailable: result.available || false,
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
      const result = await CapacitorBiometricAuth.authenticate({
        title: 'Login to Ummy',
        subtitle: 'Use your biometric credential to login',
        description: 'Authenticate to access your account',
      });

      if (result.success) {
        const token = await SecureStorage.getToken();
        setState(prev => ({ ...prev, isLoading: false }));
        return token;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.message || 'Authentication failed',
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
