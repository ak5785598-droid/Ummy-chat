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
import { LudoGameState, LudoPlayer, LudoPiece } from '@/lib/types';

/**
 * Ludo Engine Hook for Real-Time Multiplayer Sync.
 */
export function useLudoEngine(roomId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const gameDocRef = useMemo(() => (!firestore || !roomId) ? null : doc(firestore, 'games', `ludo_${roomId}`), [firestore, roomId]);
  const { data: gameState, isLoading } = useDoc(gameDocRef);

  const joinLobby = useCallback(async (userProfile: any) => {
    if (!gameDocRef || !userId || !userProfile || isLoading) {
      console.log("Ludo: joinLobby blocked", { gameDocRef: !!gameDocRef, userId, hasProfile: !!userProfile, isLoading });
      return;
    }

    if (!gameState) {
      // Create new game instance
      console.log("Ludo: Initializing new game instance for roomId:", roomId);
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
      return;
    }

    // Join existing lobby
    console.log("Ludo: Attempting to join existing lobby", { status: gameState.status, playerCount: gameState.players.length });
    
    if (gameState.status !== 'lobby') return;
    const inLobby = gameState.players.some(p => p.uid === userId);
    if (inLobby) {
      console.log("Ludo: User already in lobby");
      return;
    }
    if (gameState.players.length >= 4) return;

    // FREE ENTRY OVERRIDE
    const entryFee = 0; 
    const userCoins = 999999; // Mock balance for free entry
    
    if (userCoins < entryFee) {
      console.log("Ludo: Insufficient coins", { userCoins, entryFee });
      alert("Insufficient coins to join this match!");
      return;
    }

    const assignedColor = ['red', 'green', 'yellow', 'blue'][gameState.players.length] as any;
    
    try {
      console.log("Ludo: Starting join transaction (FREE)...");
      await runTransaction(firestore!, async (transaction) => {
         const userRef = doc(firestore!, 'users', userId);
         const profileRef = doc(firestore!, 'users', userId, 'profile', userId);

         // Coin deduction skipped for Free Mode

         transaction.update(gameDocRef, {
           players: arrayUnion({
            uid: userId,
            username: userProfile.username || `Player ${gameState.players.length + 1}`,
            avatarUrl: userProfile.avatarUrl || '',
            color: assignedColor,
            isReady: true,
            isActive: true
          }),
          updatedAt: serverTimestamp()
         });
      });
      console.log("Ludo: Join transaction successful");
    } catch (err) {
      console.error("Failed to join Ludo lobby:", err);
    }
  }, [gameDocRef, userId, gameState, roomId, firestore, isLoading]);

  const startMatch = useCallback(async () => {
    if (!gameDocRef || !gameState) return;
    if (gameState.players.length < 2) return;
    
    await updateDocumentNonBlocking(gameDocRef, {
      status: 'playing',
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState]);

  const rollDice = useCallback(async () => {
    if (!gameDocRef || !gameState || gameState.turn !== userId || gameState.diceRolled) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    await updateDocumentNonBlocking(gameDocRef, {
      dice: roll,
      diceRolled: true,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState, userId]);

  const endMatch = useCallback(async (winnerId: string) => {
    if (!gameDocRef || !gameState) return;

    try {
      await runTransaction(firestore!, async (transaction) => {
        const gameSnap = await transaction.get(gameDocRef);
        if (!gameSnap.exists()) return;

        const entryFee = gameSnap.data().entryFee || 0;
        const totalPlayers = gameSnap.data().players.length;
        const totalPool = entryFee * totalPlayers;
        const prize = Math.floor(totalPool * 0.9); // 10% Plat Rake

        if (prize > 0) {
          const winnerRef = doc(firestore!, 'users', winnerId);
          const winnerProfileRef = doc(firestore!, 'users', winnerId, 'profile', winnerId);
          const walletRef = doc(firestore!, 'walletTransactions', `win_ludo_${winnerId}_${Date.now()}`);

          transaction.update(winnerRef, { coins: increment(prize) });
          transaction.update(winnerProfileRef, { coins: increment(prize) });
          transaction.set(walletRef, {
            userId: winnerId,
            amount: prize,
            type: 'game_win',
            gameId: `ludo_${roomId}`,
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
      console.error("Failed to pay Ludo winner:", err);
    }
  }, [gameDocRef, gameState, firestore, roomId]);

  const movePiece = useCallback(async (pieceId: string) => {
    if (!gameDocRef || !gameState || gameState.turn !== userId || !gameState.diceRolled) return;

    const dice = gameState.dice || 0;
    const pieceIndex = gameState.pieces.findIndex((p: any) => p.id === pieceId);
    if (pieceIndex === -1) return;

    const piece = gameState.pieces[pieceIndex];
    let currentPos = piece.position;
    let newPos = currentPos;

    // Movement Logic
    if (currentPos === 0) {
      if (dice === 6) newPos = 1; // Out of base on 6
      else return; // Can't move if not 6 and in base
    } else if (currentPos >= 1 && currentPos <= 51) {
      newPos = currentPos + dice;
    } else if (currentPos >= 52 && currentPos < 57) {
      newPos = currentPos + dice;
    } else if (currentPos === 57) {
      return; // Already finished
    }

    // Goal Check
    if (newPos > 57) return; // Over-roll

    const updatedPieces = [...gameState.pieces];
    
    // Check for "Killing" (Capture)
    // Only happens on shared path 1-51 and NOT on safe spots
    const isSharedPath = newPos >= 1 && newPos <= 51;
    let killedSomeone = false;

    if (isSharedPath) {
       // Convert relative newPos to a Universal Index (0-51) for collision check
       const getUniversalIndex = (pos: number, color: string) => {
         const offsets: any = { blue: 1, red: 14, green: 27, yellow: 40 };
         return (offsets[color] + (pos - 1)) % 52;
       };

       const myGlobalIdx = getUniversalIndex(newPos, piece.color);
       
       // Safe spots in Universal Indices
       const SAFE_INDICES = [1, 9, 14, 22, 27, 35, 40, 48]; // Star/Entry points

       if (!SAFE_INDICES.includes(myGlobalIdx)) {
         // Check other players' pieces
         updatedPieces.forEach((p, idx) => {
            if (p.color !== piece.color && p.position >= 1 && p.position <= 51) {
               const otherGlobalIdx = getUniversalIndex(p.position, p.color);
               if (otherGlobalIdx === myGlobalIdx) {
                  // KILL! Send back to base (pos 0)
                  updatedPieces[idx] = { ...p, position: 0 };
                  killedSomeone = true;
               }
            }
          });
       }
    }

    updatedPieces[pieceIndex] = { ...piece, position: newPos };

    // Win condition - Check if all 4 pieces of a color are at 57
    const playerColor = piece.color;
    const playerPieces = updatedPieces.filter(p => p.color === playerColor);
    const hasWon = playerPieces.every(p => p.position === 57);

    if (hasWon) {
      await endMatch(userId!);
      return;
    }

    // Turn change logic
    const currentPlayerIndex = gameState.players.findIndex((p: any) => p.uid === userId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameState.players.length;
    const nextTurn = gameState.players[nextPlayerIndex].uid;

    await updateDocumentNonBlocking(gameDocRef, {
      pieces: updatedPieces,
      turn: (dice === 6 || killedSomeone) ? userId : nextTurn, // Extra turn on 6 or Kill
      dice: null,
      diceRolled: false,
      updatedAt: serverTimestamp()
    });
  }, [gameDocRef, gameState, userId, endMatch]);

  return {
    gameState: gameState as LudoGameState | undefined,
    isLoading,
    joinLobby,
    startMatch,
    rollDice,
    movePiece,
    endMatch
  };
}
