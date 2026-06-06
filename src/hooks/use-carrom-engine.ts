'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  useFirestore, 
  useDoc, 
  updateDocumentNonBlocking 
} from '@/firebase';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  arrayUnion, 
  increment,
  runTransaction
} from 'firebase/firestore';
import { CarromGameState, CarromPiece, CarromPlayer } from '@/lib/types';
import { updatePhysics } from '@/lib/carrom-physics';

/**
 * Carrom Master Multiplayer Engine.
 * Handles state machine transitions, physics sync, and matchmaking.
 */
export function useCarromEngine(roomId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const gameDocRef = useMemo(() => (!firestore || !roomId) ? null : doc(firestore, 'games', `carrom_${roomId}`), [firestore, roomId]);
  const { data: gameState, isLoading } = useDoc(gameDocRef);

  const [localPieces, setLocalPieces] = useState<CarromPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (gameState?.pieces && !isAnimating) {
      setLocalPieces(gameState.pieces);
    }
  }, [gameState?.pieces, isAnimating]);

  const initializeGame = useCallback(async (force = false) => {
    if (!gameDocRef || !userId || isLoading) return;
    
    // Initialize if doesn't exist OR forced
    if (!gameState || force) {
      await setDoc(gameDocRef, {
        id: `carrom_${roomId}`,
        roomId,
        players: [],
        turn: '',
        strikerPos: 50,
        pieces: [],
        status: 'loading',
        mode: 'none',
        updatedAt: serverTimestamp()
      });
      
      // Artificial delay for loading feel
      setTimeout(async () => {
        await updateDocumentNonBlocking(gameDocRef, { status: 'mode_select' });
      }, 2000);
    }
  }, [gameDocRef, userId, gameState, roomId, isLoading]);

  const selectMode = useCallback(async (mode: 'freestyle' | 'professional', entryFee: number = 0) => {
    if (!gameDocRef) return;
    await updateDocumentNonBlocking(gameDocRef, { 
      status: 'lobby',
      mode,
      entryFee,
      players: [],
      pieces: [],
      turn: '',
      strikerPos: 50,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef]);

  const joinArena = useCallback(async (userProfile: any) => {
    if (!gameDocRef || !userId || !userProfile || isLoading) {
      console.log("Carrom: joinArena blocked", { gameDocRef: !!gameDocRef, userId, hasProfile: !!userProfile, isLoading });
      return;
    }

    // Read entry fee from game doc
    const entryFee = gameState?.entryFee || 0;
    if (entryFee > 0) {
      const wallet = (userProfile as any)?.wallet;
      const userCoins = wallet?.coins ?? 0;
      if (userCoins < entryFee) {
        alert("Insufficient coins to join this professional match!");
        return;
      }
    }

    if (gameState?.status !== 'lobby') return;

    const existingPlayer = gameState.players.find((p: any) => p.uid === userId);
    if (existingPlayer) {
      console.log("Carrom: User already in lobby");
      return;
    }

    if (gameState.players.length >= 4) return;

    // 2. Atomic Join (NO FEE)
    try {
      console.log("Carrom: Starting join transaction (FREE)...");
      await runTransaction(firestore!, async (transaction) => {
        const userRef = doc(firestore!, 'users', userId);
        const profileRef = doc(firestore!, 'users', userId, 'profile', userId);

        // Coin deduction
        if (entryFee > 0) {
          transaction.update(userRef, { coins: increment(-entryFee) });
          transaction.update(profileRef, { 'wallet.coins': increment(-entryFee) });
        }

        const newPlayer: CarromPlayer = {
          uid: userId,
          username: userProfile.username || 'P',
          avatarUrl: userProfile.avatarUrl || '',
          score: 0,
          isReady: false
        };

        transaction.update(gameDocRef, {
          players: arrayUnion(newPlayer),
          updatedAt: serverTimestamp()
        });
      });
      console.log("Carrom: Join transaction successful");
    } catch (err) {
      console.error("Failed to join arena:", err);
    }
  }, [gameDocRef, userId, gameState, firestore, roomId, isLoading]);

  const startMatch = useCallback(async () => {
    if (!gameDocRef || !gameState || gameState.status !== 'lobby') return;
    if (gameState.players.length < 2) return;

    // Initialize Board with Coins
    const initialPieces: CarromPiece[] = [
      { id: 'queen', type: 'queen', position: { x: 50, y: 50 }, velocity: { x: 0, y: 0 }, isPocketed: false },
      // Ring 1 (6 coins: 3 white, 3 black)
      ...[...Array(6)].map((_, i) => ({
        id: `r1-${i}`,
        type: (i % 2 === 0 ? 'white' : 'black') as 'white' | 'black',
        position: { x: 50 + Math.cos(i * 60 * Math.PI / 180) * 8, y: 50 + Math.sin(i * 60 * Math.PI / 180) * 8 },
        velocity: { x: 0, y: 0 },
        isPocketed: false
      })),
      // Ring 2 (12 coins: 6 white, 6 black = 9 white, 9 black total + queen)
      ...[...Array(12)].map((_, i) => ({
        id: `r2-${i}`,
        type: (i % 2 === 0 ? 'white' : 'black') as 'white' | 'black',
        position: { x: 50 + Math.cos(i * 30 * Math.PI / 180) * 16, y: 50 + Math.sin(i * 30 * Math.PI / 180) * 16 },
        velocity: { x: 0, y: 0 },
        isPocketed: false
      })),
      // Striker (Initially at bottom)
      { id: 'striker', type: 'striker', position: { x: 50, y: 85 }, velocity: { x: 0, y: 0 }, isPocketed: false }
    ];

    await updateDocumentNonBlocking(gameDocRef, {
      status: 'playing',
      pieces: initialPieces,
      turn: gameState.players[0].uid,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState]);

  const updateStriker = useCallback(async (pos: number) => {
    if (!gameDocRef || !gameState || gameState.turn !== userId || gameState.status !== 'playing') return;
    
    // Update striker X position within current turn boundaries
    updateDocumentNonBlocking(gameDocRef, { strikerPos: pos });
  }, [gameDocRef, gameState, userId]);

  const endMatch = useCallback(async (winnerId: string) => {
    if (!gameDocRef || !gameState || gameState.status !== 'playing') return;

    try {
      await runTransaction(firestore!, async (transaction) => {
        const gameSnap = await transaction.get(gameDocRef);
        if (!gameSnap.exists()) return;

        const entryFee = gameSnap.data().entryFee || 0;
        const totalPlayers = gameSnap.data().players.length;
        const totalPool = entryFee * totalPlayers;
        const prize = Math.floor(totalPool * 0.9); // 10% Platform Rake

        if (prize > 0) {
          const winnerRef = doc(firestore!, 'users', winnerId);
          const winnerProfileRef = doc(firestore!, 'users', winnerId, 'profile', winnerId);
          const walletRef = doc(firestore!, 'walletTransactions', `win_${winnerId}_${Date.now()}`);

          transaction.update(winnerRef, { coins: increment(prize) });
          transaction.update(winnerProfileRef, { coins: increment(prize) });
          transaction.set(walletRef, {
            userId: winnerId,
            amount: prize,
            type: 'game_win',
            gameId: `carrom_${roomId}`,
            timestamp: serverTimestamp()
          });
        }

        transaction.update(gameDocRef, {
          status: 'ended',
          winner: winnerId,
          prize,
          updatedAt: serverTimestamp()
        });
      });
    } catch (err) {
      console.error("Failed to end match and pay winner:", err);
    }
  }, [gameDocRef, gameState, firestore, roomId]);

  const strike = useCallback(async (angle: number, power: number) => {
    if (!gameDocRef || !gameState || gameState.turn !== userId || gameState.status !== 'playing' || isAnimating) return;
    
    setIsAnimating(true);

    const pieces = gameState.pieces.map((p: any) => {
      if (p.id === 'striker') {
        return {
          ...p,
          position: { x: gameState.strikerPos ?? 50, y: p.position.y }
        };
      }
      return p;
    });
    const striker = pieces.find((p: any) => p.id === 'striker');
    if (!striker) {
      setIsAnimating(false);
      return;
    }

    const rad = (angle - 90) * Math.PI / 180;
    striker.velocity = {
      x: Math.cos(rad) * power,
      y: Math.sin(rad) * power
    };

    let currentPieces = pieces;
    let frameCount = 0;
    const maxFrames = 300;

    const animateFrame = () => {
      frameCount++;
      const { pieces: nextPieces, hasMovement } = updatePhysics(currentPieces);
      currentPieces = nextPieces;
      setLocalPieces(currentPieces);

      if (hasMovement && frameCount < maxFrames) {
        requestAnimationFrame(animateFrame);
      } else {
        finalizeStrike(currentPieces);
      }
    };

    const finalizeStrike = async (finalPhysicsPieces: CarromPiece[]) => {
      let scoreGained = 0;
      let pocketedThisTurn = false;
      
      finalPhysicsPieces.forEach((p: any) => {
        const oldPiece = pieces.find((oldP: any) => oldP.id === p.id);
        if (p.isPocketed && oldPiece && !oldPiece.isPocketed) {
          if (p.id === 'striker') {
            scoreGained -= 10;
          } else {
            pocketedThisTurn = true;
            if (p.type === 'white') scoreGained += 20;
            if (p.type === 'black') scoreGained += 10;
            if (p.type === 'queen') scoreGained += 50;
          }
        }
      });

      const finalPieces = finalPhysicsPieces.map((p: any) => {
        if (p.id === 'striker') {
          return { ...p, position: { x: 50, y: 85 }, velocity: { x: 0, y: 0 }, isPocketed: false };
        }
        return p;
      });

      const currentPlayerIndex = gameState.players.findIndex((p: any) => p.uid === userId);
      const updatedPlayers = [...gameState.players];
      updatedPlayers[currentPlayerIndex] = {
        ...updatedPlayers[currentPlayerIndex],
        score: Math.max(0, updatedPlayers[currentPlayerIndex].score + scoreGained)
      };

      const piecesRemaining = finalPieces.some((p: any) => p.id !== 'striker' && !p.isPocketed);
      const nextTurn = pocketedThisTurn ? userId : gameState.players[(currentPlayerIndex + 1) % gameState.players.length].uid;

      try {
        await updateDocumentNonBlocking(gameDocRef, {
          pieces: finalPieces,
          players: updatedPlayers,
          turn: nextTurn,
          strikerPos: 50,
          updatedAt: serverTimestamp()
        });
        
        if (!piecesRemaining) {
          const winner = updatedPlayers.reduce((prev, current) => (prev.score > current.score) ? prev : current);
          await endMatch(winner.uid);
        }
      } catch (e) {
        console.error('Strike update failed', e);
      } finally {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animateFrame);
  }, [gameDocRef, gameState, userId, isAnimating, endMatch]);

  return {
    gameState: gameState as CarromGameState | undefined,
    localPieces,
    isLoading,
    initializeGame,
    selectMode,
    joinArena,
    startMatch,
    updateStriker,
    strike,
    endMatch
  };
}
