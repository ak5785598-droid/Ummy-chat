'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audiooutput' | 'audioinput';
}

interface AudioOutputState {
  devices: AudioDevice[];
  selectedOutput: string | null;
  isSpeaker: boolean;
  hasBluetooth: boolean;
  hasWired: boolean;
}

export function useAudioOutput() {
  const [state, setState] = useState<AudioOutputState>({
    devices: [],
    selectedOutput: null,
    isSpeaker: true,
    hasBluetooth: false,
    hasWired: false,
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get all audio output devices
  const refreshDevices = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({
          deviceId: d.deviceId,
          label: d.label || (d.deviceId === 'default' ? 'Default' : `Device ${d.deviceId.slice(0, 8)}...`),
          kind: d.kind as 'audiooutput',
        }));

      const hasBluetooth = audioOutputs.some(d => 
        d.label.toLowerCase().includes('bluetooth') || 
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('wireless')
      );

      const hasWired = audioOutputs.some(d => 
        d.label.toLowerCase().includes('headphone') || 
        d.label.toLowerCase().includes('headset') ||
        d.label.toLowerCase().includes('earphone') ||
        d.label.toLowerCase().includes('type-c') ||
        d.label.toLowerCase().includes('usb')
      );

      setState(prev => ({
        ...prev,
        devices: audioOutputs,
        hasBluetooth,
        hasWired,
      }));
    } catch (e) {
      console.warn('[AudioOutput] Device enumeration failed:', e);
    }
  }, []);

  // Set audio output device for HTML audio element
  const setOutputDevice = useCallback(async (deviceId: string, audioElement?: HTMLAudioElement | null) => {
    const audio = audioElement || audioRef.current;
    if (!audio) return;

    try {
      // @ts-ignore - setSinkId is not in standard HTMLAudioElement type yet
      if (audio.setSinkId) {
        // @ts-ignore
        await audio.setSinkId(deviceId);
        console.log('[AudioOutput] Routed to:', deviceId);
        
        const selectedDevice = state.devices.find(d => d.deviceId === deviceId);
        const isSpeakerDevice = deviceId === 'default' || 
                          (selectedDevice?.label.toLowerCase().includes('speaker') ?? false);
        
        setState(prev => ({
          ...prev,
          selectedOutput: deviceId,
          isSpeaker: isSpeakerDevice,
        }));
      } else {
        console.warn('[AudioOutput] setSinkId not supported in this browser');
      }
    } catch (e) {
      console.error('[AudioOutput] Failed to set output:', e);
    }
  }, [state.devices]);

  // Toggle between speaker and earbuds/headphones
  const toggleOutput = useCallback(async (audioElement?: HTMLAudioElement | null) => {
    const audio = audioElement || audioRef.current;
    if (!audio) return;

    if (state.isSpeaker) {
      // Try to find earbuds/headphones
      const earbudDevice = state.devices.find(d => 
        d.label.toLowerCase().includes('bluetooth') || 
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('headphone') ||
        d.label.toLowerCase().includes('headset')
      );

      if (earbudDevice) {
        await setOutputDevice(earbudDevice.deviceId, audio);
      } else {
        // Try non-default device
        const nonDefault = state.devices.find(d => d.deviceId !== 'default' && d.deviceId !== '');
        if (nonDefault) {
          await setOutputDevice(nonDefault.deviceId, audio);
        }
      }
    } else {
      // Switch to default (speaker)
      await setOutputDevice('default', audio);
    }
  }, [state.isSpeaker, state.devices, setOutputDevice]);

  // Force earbuds if available
  const forceEarbuds = useCallback(async (audioElement?: HTMLAudioElement | null) => {
    const audio = audioElement || audioRef.current;
    if (!audio) return;

    // Try to find any non-speaker device
    const earbudDevice = state.devices.find(d => 
      d.label.toLowerCase().includes('bluetooth') || 
      d.label.toLowerCase().includes('airpods') ||
      d.label.toLowerCase().includes('buds') ||
      d.label.toLowerCase().includes('headphone') ||
      d.label.toLowerCase().includes('headset') ||
      d.label.toLowerCase().includes('earphone') ||
      d.deviceId !== 'default'
    );

    if (earbudDevice) {
      await setOutputDevice(earbudDevice.deviceId, audio);
      return true;
    }
    return false;
  }, [state.devices, setOutputDevice]);

  // Register audio element
  const registerAudioElement = useCallback((element: HTMLAudioElement | null) => {
    audioRef.current = element;
  }, []);

  // Listen for device changes
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    refreshDevices();

    navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
    };
  }, [refreshDevices]);

  return {
    ...state,
    refreshDevices,
    setOutputDevice,
    toggleOutput,
    forceEarbuds,
    registerAudioElement,
    audioRef,
  };
}
