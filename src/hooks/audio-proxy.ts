import { IRemoteAudioTrack } from 'agora-rtc-sdk-ng';

class AudioProxy {
  private context: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private sources: Map<string, MediaStreamAudioSourceNode> = new Map();
  private masterAudio: HTMLAudioElement | null = null;

  private init() {
    if (typeof window === 'undefined') return;
    if (this.context) return;
    
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive'
      });
      this.destination = this.context.createMediaStreamDestination();
      console.log('[AudioProxy] Web Audio Context Initialized');
    } catch (e) {
      console.error('[AudioProxy] Initialization Failed:', e);
    }
  }

  /**
   * Connects the mixed stream to a hidden HTMLAudioElement for hardware playback.
   */
  public registerMasterAudio(element: HTMLAudioElement) {
    this.init();
    this.masterAudio = element;
    if (this.destination && this.masterAudio) {
      this.masterAudio.srcObject = this.destination.stream;
      this.masterAudio.play().catch(e => {
        console.warn('[AudioProxy] Autoplay blocked, awaiting interaction:', e.name);
      });
    }
  }

  /**
   * Adds a remote Agora track to the central mix.
   */
  public addRemoteTrack(uid: string, track: IRemoteAudioTrack) {
    this.init();
    if (!this.context || !this.destination) {
      console.warn('[AudioProxy] Cannot add track - Context not ready');
      return;
    }

    // Remove existing if any (refresh)
    this.removeRemoteTrack(uid);

    try {
      const mediaStreamTrack = track.getMediaStreamTrack();
      const stream = new MediaStream([mediaStreamTrack]);
      const source = this.context.createMediaStreamSource(stream);
      
      // Connect to the common destination (Mix)
      source.connect(this.destination);
      this.sources.set(uid, source);
      
      console.log(`[AudioProxy] User ${uid} added to mix. Total active sources: ${this.sources.size}`);
      
      // Ensure master is playing after new track addition
      if (this.masterAudio?.paused) {
        this.masterAudio.play().catch(() => {});
      }
    } catch (e) {
      console.error(`[AudioProxy] Failed to add track for ${uid}:`, e);
    }
  }

  /**
   * Removes a user from the mix.
   */
  public removeRemoteTrack(uid: string) {
    const source = this.sources.get(uid);
    if (source) {
      try {
        source.disconnect();
      } catch (e) {}
      this.sources.delete(uid);
      console.log(`[AudioProxy] User ${uid} removed from mix.`);
    }
  }

  /**
   * Full cleanup
   */
  public clear() {
    this.sources.forEach(source => {
      try { source.disconnect(); } catch(e) {}
    });
    this.sources.clear();
    console.log('[AudioProxy] Mix cleared.');
  }
}

export const audioProxy = new AudioProxy();
