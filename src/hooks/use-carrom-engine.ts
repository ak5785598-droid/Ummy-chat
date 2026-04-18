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

  const initializeGame = useCallback(async () => {
    if (!gameDocRef || !userId) return;
    
    // Initialize if doesn't exist
    if (!gameState) {
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
  }, [gameDocRef, userId, gameState, roomId]);

  const selectMode = useCallback(async (mode: 'freestyle' | 'professional', entryFee: number = 0) => {
    if (!gameDocRef || gameState?.status !== 'mode_select') return;
    await updateDocumentNonBlocking(gameDocRef, { 
      status: 'lobby',
      mode,
      entryFee,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState]);

  const joinArena = useCallback(async (userProfile: any) => {
    if (!gameDocRef || !userId || !userProfile || isLoading) {
      console.log("Carrom: joinArena blocked", { gameDocRef: !!gameDocRef, userId, hasProfile: !!userProfile, isLoading });
      return;
    }

    // 1. Minimum Balance Check (FREE OVERRIDE)
    const entryFee = 0;
    const userCoins = 999999;

    console.log("Carrom: Attempting to join lobby (FREE)", { status: gameState?.status, userCoins, entryFee });

    if (userCoins < entryFee) {
      console.log("Carrom: Insufficient coins", { userCoins, entryFee });
      alert("Insufficient coins to join this professional match!");
      return;
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

        // Coin deduction skipped for Free Mode

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
      // Ring 1 (6 coins)
      ...[...Array(6)].map((_, i) => ({
        id: `r1-${i}`,
        type: i % 2 === 0 ? 'white' : 'black' as any,
        position: { x: 50 + Math.cos(i * 60 * Math.PI / 180) * 8, y: 50 + Math.sin(i * 60 * Math.PI / 180) * 8 },
        velocity: { x: 0, y: 0 },
        isPocketed: false
      })),
      // Ring 2 (12 coins)
      ...[...Array(12)].map((_, i) => ({
        id: `r2-${i}`,
        type: i % 3 === 0 ? 'white' : 'black' as any,
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
    if (!gameDocRef || !gameState || gameState.turn !== userId || gameState.status !== 'playing') return;

    // Apply impulse to striker
    const pieces = [...gameState.pieces];
    const striker = pieces.find(p => p.id === 'striker');
    if (!striker) return;

    // Convert angle/power to velocity
    const rad = (angle - 90) * Math.PI / 180; // 0 is top
    striker.velocity = {
      x: Math.cos(rad) * power,
      y: Math.sin(rad) * power
    };

    // Simulate physics until stop
    let currentPieces = pieces;
    let iterations = 0;
    const MAX_ITER = 300;
    
    while (iterations < MAX_ITER) {
      const { pieces: nextPieces, hasMovement } = updatePhysics(currentPieces);
      currentPieces = nextPieces;
      if (!hasMovement) break;
      iterations++;
    }

    // Calculate newly pocketed pieces and score
    let scoreGained = 0;
    let pocketedThisTurn = false;
    
    currentPieces.forEach((p, idx) => {
      const oldPiece = pieces.find(oldP => oldP.id === p.id);
      if (p.isPocketed && oldPiece && !oldPiece.isPocketed) {
        if (p.id === 'striker') {
          scoreGained -= 10; // Foul
        } else {
          pocketedThisTurn = true;
          if (p.type === 'white') scoreGained += 20;
          if (p.type === 'black') scoreGained += 10;
          if (p.type === 'queen') scoreGained += 50;
        }
      }
    });

    // Reset striker for next turn
    const finalPieces = currentPieces.map(p => {
      if (p.id === 'striker') {
        return { ...p, position: { x: 50, y: 85 }, velocity: { x: 0, y: 0 }, isPocketed: false };
      }
      return p;
    });

    // Update Scores and Turn
    const currentPlayerIndex = gameState.players.findIndex((p: any) => p.uid === userId);
    const updatedPlayers = [...gameState.players];
    updatedPlayers[currentPlayerIndex] = {
      ...updatedPlayers[currentPlayerIndex],
      score: Math.max(0, updatedPlayers[currentPlayerIndex].score + scoreGained)
    };

    // Check if game ended (all pieces except striker pocketed)
    const piecesRemaining = finalPieces.some(p => p.id !== 'striker' && !p.isPocketed);
    
    if (!piecesRemaining) {
      const winner = updatedPlayers.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      await endMatch(winner.uid);
      return;
    }

    const nextTurn = pocketedThisTurn ? userId : gameState.players[(currentPlayerIndex + 1) % gameState.players.length].uid;

    await updateDocumentNonBlocking(gameDocRef, {
      pieces: finalPieces,
      players: updatedPlayers,
      turn: nextTurn,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState, userId, endMatch]);

  return {
    gameState: gameState as CarromGameState | undefined,
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
