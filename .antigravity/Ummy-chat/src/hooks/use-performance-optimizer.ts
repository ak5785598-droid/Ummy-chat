'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceCapabilities {
  isLowEnd: boolean;
  isMobile: boolean;
  memory: number;
  cores: number;
  connectionSpeed: 'slow' | 'fast';
}

export function usePerformanceOptimizer() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isLowEnd: false,
    isMobile: false,
    memory: 4,
    cores: 4,
    connectionSpeed: 'fast'
  });

  const [settings, setSettings] = useState({
    animationsEnabled: true,
    liveBackgroundEnabled: true,
    highQualityImages: true,
    preloadGames: false,
    maxConcurrentConnections: 10
  });

  useEffect(() => {
    // Detect device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 4;
    const isLowEnd = isMobile && (cores <= 4 || memory <= 4);

    // Detect connection speed
    const connection = (navigator as any).connection;
    const connectionSpeed = connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g' ? 'slow' : 'fast';

    setCapabilities({
      isLowEnd,
      isMobile,
      memory,
      cores,
      connectionSpeed
    });

    // Auto-adjust settings based on device
    setSettings({
      animationsEnabled: !isLowEnd,
      liveBackgroundEnabled: !isLowEnd,
      highQualityImages: connectionSpeed === 'fast',
      preloadGames: !isMobile,
      maxConcurrentConnections: isLowEnd ? 5 : 10
    });
  }, []);

  const shouldUseLowQuality = useCallback(() => {
    return !settings.highQualityImages || capabilities.isLowEnd;
  }, [settings.highQualityImages, capabilities.isLowEnd]);

  const shouldDisableAnimations = useCallback(() => {
    return !settings.animationsEnabled;
  }, [settings.animationsEnabled]);

  const shouldPreload = useCallback((resourceType: 'game' | 'theme' | 'audio') => {
    if (resourceType === 'game') return settings.preloadGames;
    if (resourceType === 'theme') return !capabilities.isLowEnd;
    if (resourceType === 'audio') return capabilities.connectionSpeed === 'fast';
    return false;
  }, [settings.preloadGames, capabilities.isLowEnd, capabilities.connectionSpeed]);

  const getMaxConnections = useCallback(() => {
    return settings.maxConcurrentConnections;
  }, [settings.maxConcurrentConnections]);

  return {
    capabilities,
    settings,
    shouldUseLowQuality,
    shouldDisableAnimations,
    shouldPreload,
    getMaxConnections,
    updateSettings: setSettings
  };
}
