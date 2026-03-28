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
  increment 
} from 'firebase/firestore';
import { CarromGameState, CarromPiece } from '@/lib/types';

/**
 * Carrom Master Multiplayer Engine.
 * Handles matchmaking, physics state sync, and turns.
 */
export function useCarromEngine(roomId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const gameDocRef = useMemo(() => (!firestore || !roomId) ? null : doc(firestore, 'games', `carrom_${roomId}`), [firestore, roomId]);
  const { data: gameState, isLoading } = useDoc(gameDocRef);

  const joinArena = useCallback(async (userProfile: any) => {
    if (!gameDocRef || !userId || !userProfile) return;

    if (!gameState) {
      // Initialize Board with Coins
      const initialPieces: CarromPiece[] = [
        { id: 'queen', type: 'queen', position: { x: 50, y: 50 }, isPocketed: false },
        // Ring 1 (6 coins)
        ...[...Array(6)].map((_, i) => ({
          id: `r1-${i}`,
          type: i % 2 === 0 ? 'white' : 'black' as any,
          position: { x: 50 + Math.cos(i * 60 * Math.PI / 180) * 8, y: 50 + Math.sin(i * 60 * Math.PI / 180) * 8 },
          isPocketed: false
        })),
        // Ring 2 (12 coins)
        ...[...Array(12)].map((_, i) => ({
          id: `r2-${i}`,
          type: i % 3 === 0 ? 'white' : 'black' as any,
          position: { x: 50 + Math.cos(i * 30 * Math.PI / 180) * 16, y: 50 + Math.sin(i * 30 * Math.PI / 180) * 16 },
          isPocketed: false
        }))
      ];

      await setDoc(gameDocRef, {
        id: `carrom_${roomId}`,
        roomId,
        player1: {
          uid: userId,
          username: userProfile.username || 'P1',
          avatarUrl: userProfile.avatarUrl || '',
          score: 0
        },
        player2: null,
        turn: userId,
        strikerPos: 50,
        pieces: initialPieces,
        status: 'lobby',
        updatedAt: serverTimestamp()
      });
    } else if (gameState.status === 'lobby' && !gameState.player1?.uid && gameState.player1?.uid !== userId) {
        // This case shouldn't happen unless player1 left
    } else if (gameState.status === 'lobby' && !gameState.player2 && gameState.player1?.uid !== userId) {
      await updateDocumentNonBlocking(gameDocRef, {
        player2: {
          uid: userId,
          username: userProfile.username || 'P2',
          avatarUrl: userProfile.avatarUrl || '',
          score: 0
        },
        status: 'playing'
      });
    }
  }, [gameDocRef, userId, gameState, roomId]);

  const updateStriker = useCallback(async (pos: number) => {
    if (!gameDocRef || !gameState || gameState.turn !== userId) return;
    updateDocumentNonBlocking(gameDocRef, { strikerPos: pos });
  }, [gameDocRef, gameState, userId]);

  const strike = useCallback(async () => {
    if (!gameDocRef || !gameState || gameState.turn !== userId) return;

    // Logic: In a real app we'd trigger a physics calculation.
    // Here we simulate a turn switch for the prototype.
    const nextTurn = gameState.player1?.uid === userId ? gameState.player2?.uid : gameState.player1?.uid;

    if (nextTurn) {
      await updateDocumentNonBlocking(gameDocRef, {
        turn: nextTurn,
        updatedAt: serverTimestamp()
      });
    }
  }, [gameDocRef, gameState, userId]);

  return {
    gameState: gameState as CarromGameState | undefined,
    isLoading,
    joinArena,
    updateStriker,
    strike
  };
}
