'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import { useLazyGameLoader } from '@/hooks/use-lazy-game-loader';

interface LazyGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameName: string;
}

export function LazyGameModal({ isOpen, onClose, gameId, gameName }: LazyGameModalProps) {
  const [GameComponent, setGameComponent] = useState<any>(null);
  const { loadGameEngine, isEngineLoading, isEngineLoaded } = useLazyGameLoader();

  const handleGameLoad = async () => {
    if (!isEngineLoaded(gameId)) {
      try {
        await loadGameEngine(gameId);
        
        // Dynamically import the game component
        let gameComponent;
        switch (gameId) {
          case 'forest-party':
            gameComponent = (await import('@/components/games/forest-party-game')).default;
            break;
          case 'fruit-party':
            gameComponent = (await import('@/components/games/fruit-party-game')).default;
            break;
          default:
            throw new Error(`Unknown game: ${gameId}`);
        }
        
        setGameComponent(() => gameComponent);
      } catch (error) {
        console.error(`Failed to load ${gameName}:`, error);
      }
    }
  };

  const GameComponentToRender = GameComponent;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {gameName}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="min-h-[400px] flex items-center justify-center">
          {!isEngineLoaded(gameId) ? (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto" />
              <p className="text-lg font-medium">Loading {gameName}...</p>
              <p className="text-sm text-muted-foreground">This won't take long!</p>
              {!isEngineLoading(gameId) && (
                <Button onClick={handleGameLoad}>
                  Start Game
                </Button>
              )}
            </div>
          ) : GameComponentToRender ? (
            <GameComponentToRender onClose={onClose} />
          ) : (
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Game loading failed</p>
              <Button onClick={handleGameLoad} variant="outline">
                Retry
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
