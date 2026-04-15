// TypeScript wrapper for cordova-plugin-audioroute
// This provides native audio routing for Android/iOS

declare global {
  interface Window {
    AudioRoute?: {
      overrideOutputToEarbuds(success: () => void, error: (err: string) => void): void;
      overrideOutputToSpeaker(success: () => void, error: (err: string) => void): void;
      getCurrentAudioRoute(success: (route: string) => void, error: (err: string) => void): void;
    };
    plugins?: {
      audioRoute?: {
        overrideOutputToEarbuds(success: () => void, error: (err: string) => void): void;
        overrideOutputToSpeaker(success: () => void, error: (err: string) => void): void;
        getCurrentAudioRoute(success: (route: string) => void, error: (err: string) => void): void;
      };
    };
  }
}

export interface AudioRoutePlugin {
  /**
   * Force audio output to earpiece/headset (earbuds)
   */
  forceEarbuds(): Promise<void>;
  
  /**
   * Force audio output to speaker
   */
  resetAudio(): Promise<void>;
  
  /**
   * Get current audio route
   */
  getCurrentRoute(): Promise<string>;
  
  /**
   * Check if plugin is available
   */
  isAvailable(): boolean;
}

// Cordova plugin wrapper
const CordovaAudioRoute: AudioRoutePlugin = {
  forceEarbuds(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try window.AudioRoute first
      if (window.AudioRoute?.overrideOutputToEarbuds) {
        window.AudioRoute.overrideOutputToEarbuds(resolve, reject);
        return;
      }
      
      // Try window.plugins.audioRoute
      if (window.plugins?.audioRoute?.overrideOutputToEarbuds) {
        window.plugins.audioRoute.overrideOutputToEarbuds(resolve, reject);
        return;
      }
      
      reject('AudioRoute plugin not available');
    });
  },

  resetAudio(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.AudioRoute?.overrideOutputToSpeaker) {
        window.AudioRoute.overrideOutputToSpeaker(resolve, reject);
        return;
      }
      
      if (window.plugins?.audioRoute?.overrideOutputToSpeaker) {
        window.plugins.audioRoute.overrideOutputToSpeaker(resolve, reject);
        return;
      }
      
      reject('AudioRoute plugin not available');
    });
  },

  getCurrentRoute(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (window.AudioRoute?.getCurrentAudioRoute) {
        window.AudioRoute.getCurrentAudioRoute(resolve, reject);
        return;
      }
      
      if (window.plugins?.audioRoute?.getCurrentAudioRoute) {
        window.plugins.audioRoute.getCurrentAudioRoute(resolve, reject);
        return;
      }
      
      reject('AudioRoute plugin not available');
    });
  },

  isAvailable(): boolean {
    return !!(
      window.AudioRoute?.overrideOutputToEarbuds ||
      window.plugins?.audioRoute?.overrideOutputToEarbuds
    );
  }
};

export { CordovaAudioRoute };
export default CordovaAudioRoute;
