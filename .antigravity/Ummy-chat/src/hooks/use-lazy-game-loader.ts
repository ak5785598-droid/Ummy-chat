'use client';

import { useState, useCallback } from 'react';

interface GameEngine {
  id: string;
  name: string;
  load: () => Promise<any>;
}

const gameEngines: GameEngine[] = [
  {
    id: 'forest-party',
    name: 'Forest Party Game',
    load: () => import('@/components/games/forest-party-game')
  },
  {
    id: 'fruit-party',
    name: 'Fruit Party Game',
    load: () => import('@/components/games/fruit-party-game')
  }
];

export function useLazyGameLoader() {
  const [loadedEngines, setLoadedEngines] = useState<Set<string>>(new Set());
  const [loadingEngines, setLoadingEngines] = useState<Set<string>>(new Set());

  const loadGameEngine = useCallback(async (gameId: string) => {
    if (loadedEngines.has(gameId)) {
      return;
    }

    const engine = gameEngines.find(e => e.id === gameId);
    if (!engine) {
      throw new Error(`Game engine ${gameId} not found`);
    }

    setLoadingEngines(prev => new Set(prev).add(gameId));
    
    try {
      await engine.load();
      setLoadedEngines(prev => new Set(prev).add(gameId));
    } catch (error) {
      console.error(`Failed to load ${engine.name}:`, error);
      throw error;
    } finally {
      setLoadingEngines(prev => {
        const next = new Set(prev);
        next.delete(gameId);
        return next;
      });
    }
  }, [loadedEngines]);

  const isEngineLoaded = useCallback((gameId: string) => {
    return loadedEngines.has(gameId);
  }, [loadedEngines]);

  const isEngineLoading = useCallback((gameId: string) => {
    return loadingEngines.has(gameId);
  }, [loadingEngines]);

  return {
    loadGameEngine,
    isEngineLoaded,
    isEngineLoading,
    availableEngines: gameEngines.map(e => ({ id: e.id, name: e.name }))
  };
}
