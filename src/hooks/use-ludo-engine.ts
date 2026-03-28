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
import { LudoGameState, LudoPlayer, LudoPiece } from '@/lib/types';

/**
 * Ludo Engine Hook for Real-Time Multiplayer Sync.
 */
export function useLudoEngine(roomId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const gameDocRef = useMemo(() => (!firestore || !roomId) ? null : doc(firestore, 'games', `ludo_${roomId}`), [firestore, roomId]);
  const { data: gameState, isLoading } = useDoc(gameDocRef);

  const joinLobby = useCallback(async (userProfile: any) => {
    if (!gameDocRef || !userId || !userProfile) return;

    if (!gameState) {
      // Create new game instance
      const initialPieces: LudoPiece[] = [];
      const colors: ('red' | 'blue' | 'yellow' | 'green')[] = ['red', 'green', 'yellow', 'blue'];
      
      // Initialize 4 pieces per possible player
      colors.forEach(color => {
         for (let i = 0; i < 4; i++) {
           initialPieces.push({
             id: `${color}_${i}`,
             ownerUid: '', // Assign on start
             color,
             position: 0 // Home Base
           });
         }
      });

      await setDoc(gameDocRef, {
        id: `ludo_${roomId}`,
        roomId,
        players: [{
          uid: userId,
          username: userProfile.username || 'Player 1',
          avatarUrl: userProfile.avatarUrl || '',
          color: 'red',
          isReady: true,
          isActive: true
        }],
        pieces: initialPieces,
        turn: userId,
        dice: null,
        diceRolled: false,
        status: 'lobby',
        updatedAt: serverTimestamp()
      });
    } else if (gameState.status === 'lobby' && !gameState.players.find((p: any) => p.uid === userId)) {
      // Join existing lobby
      const assignedColor = ['red', 'green', 'yellow', 'blue'][gameState.players.length] as any;
      await updateDocumentNonBlocking(gameDocRef, {
        players: arrayUnion({
          uid: userId,
          username: userProfile.username || `Player ${gameState.players.length + 1}`,
          avatarUrl: userProfile.avatarUrl || '',
          color: assignedColor,
          isReady: true,
          isActive: true
        })
      });
    }
  }, [gameDocRef, userId, gameState, roomId]);

  const rollDice = useCallback(async () => {
    if (!gameDocRef || !gameState || gameState.turn !== userId || gameState.diceRolled) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    await updateDocumentNonBlocking(gameDocRef, {
      dice: roll,
      diceRolled: true,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState, userId]);

  const movePiece = useCallback(async (pieceId: string) => {
    if (!gameDocRef || !gameState || gameState.turn !== userId || !gameState.diceRolled) return;

    const dice = gameState.dice;
    const pieceIndex = gameState.pieces.findIndex((p: any) => p.id === pieceId);
    if (pieceIndex === -1) return;

    const piece = gameState.pieces[pieceIndex];
    let newPos = piece.position;

    // Movement Logic
    if (newPos === 0) {
      if (dice === 6) newPos = 1; // Out of base on 6
      else return; // Can't move if not 6 and in base
    } else {
      newPos += dice;
    }

    // Safety checks for home path (52-57)
    if (newPos > 57) return; // Over-roll

    const updatedPieces = [...gameState.pieces];
    updatedPieces[pieceIndex] = { ...piece, position: newPos };

    // Pass turn logic (placeholder)
    const nextPlayerIndex = (gameState.players.findIndex((p: any) => p.uid === userId) + 1) % gameState.players.length;
    const nextTurn = gameState.players[nextPlayerIndex].uid;

    await updateDocumentNonBlocking(gameDocRef, {
      pieces: updatedPieces,
      turn: dice === 6 ? userId : nextTurn, // Extra turn on 6
      dice: null,
      diceRolled: false,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState, userId]);

  return {
    gameState: gameState as LudoGameState | undefined,
    isLoading,
    joinLobby,
    rollDice,
    movePiece
  };
}
