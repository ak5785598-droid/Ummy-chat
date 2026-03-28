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
} from 'firebase/firestore';
import { ChessGameState } from '@/lib/types';

/**
 * Grand Chess Multiplayer Engine.
 * Handles board state sync, turns, and matchmaking.
 */
export function useChessEngine(roomId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const gameDocRef = useMemo(() => (!firestore || !roomId) ? null : doc(firestore, 'games', `chess_${roomId}`), [firestore, roomId]);
  const { data: gameState, isLoading } = useDoc(gameDocRef);

  const startMatch = useCallback(async (userProfile: any) => {
    if (!gameDocRef || !userId || !userProfile) return;

    if (!gameState) {
      // Initialize Standard Board
      const initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
      
      await setDoc(gameDocRef, {
        id: `chess_${roomId}`,
        roomId,
        white: {
          uid: userId,
          username: userProfile.username || 'White',
          avatarUrl: userProfile.avatarUrl || ''
        },
        black: null,
        turn: 'w',
        fen: initialFen,
        status: 'lobby',
        updatedAt: serverTimestamp()
      });
    } else if (gameState.status === 'lobby' && !gameState.black && gameState.white?.uid !== userId) {
      await updateDocumentNonBlocking(gameDocRef, {
        black: {
          uid: userId,
          username: userProfile.username || 'Black',
          avatarUrl: userProfile.avatarUrl || ''
        },
        status: 'playing',
        updatedAt: serverTimestamp()
      });
    }
  }, [gameDocRef, userId, gameState, roomId]);

  const makeMove = useCallback(async (newFen: string) => {
    if (!gameDocRef || !gameState) return;

    const nextTurn = gameState.turn === 'w' ? 'b' : 'w';

    await updateDocumentNonBlocking(gameDocRef, {
      fen: newFen,
      turn: nextTurn,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState]);

  return {
    gameState: gameState as ChessGameState | undefined,
    isLoading,
    startMatch,
    makeMove
  };
}
