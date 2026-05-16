import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'biometric_auth_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const SecureStorage = {
  async setToken(token: string): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  },

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  },

  async removeToken(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
  },

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: enabled.toString() });
  },

  async isBiometricEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    return value === 'true';
  },

  async clearAll(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY });
  },
};
