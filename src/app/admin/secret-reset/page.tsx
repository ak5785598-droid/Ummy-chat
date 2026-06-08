'use client';

import React, { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

export default function SecretResetPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleReset = async () => {
    if (!firestore || !user) return;
    setLoading(true);
    setStatus('Fetching users...');
    
    try {
      const usersSnap = await getDocs(collection(firestore, 'users'));
      setStatus(`Found ${usersSnap.size} users. Resetting...`);
      
      const batchArray = [writeBatch(firestore)];
      let batchIndex = 0;
      let operationCounter = 0;
      
      for (const userDoc of usersSnap.docs) {
        const uid = userDoc.id;
        const userRef = doc(firestore, 'users', uid);
        const profileRef = doc(firestore, 'users', uid, 'profile', uid);
        
        batchArray[batchIndex].update(userRef, {
          'wallet.coins': 0,
          'wallet.totalSpent': 0,
          'wallet.totalExp': 0
        });
        operationCounter++;
        
        if (operationCounter >= 490) {
          batchArray.push(writeBatch(firestore));
          batchIndex++;
          operationCounter = 0;
        }
        
        batchArray[batchIndex].update(profileRef, {
          'wallet.coins': 0,
          'wallet.totalSpent': 0,
          'wallet.totalExp': 0
        });
        operationCounter++;
        
        if (operationCounter >= 490) {
          batchArray.push(writeBatch(firestore));
          batchIndex++;
          operationCounter = 0;
        }
      }
      
      setStatus('Committing changes to database...');
      for (const batch of batchArray) {
        await batch.commit();
      }
      
      setStatus('SUCCESS! All user coins and EXP have been reset to 0.');
    } catch (e: any) {
      console.error(e);
      setStatus(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-10 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Secret Data Reset</h1>
      <p className="mb-8 text-gray-400">Warning: This will set all user coins and EXP to 0!</p>
      
      <button 
        onClick={handleReset} 
        disabled={loading}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'RESET ALL USERS NOW'}
      </button>
      
      {status && (
        <div className="mt-8 p-4 bg-gray-900 rounded-lg w-full max-w-md text-center border border-gray-700">
          <code className={status.includes('ERROR') ? 'text-red-400' : 'text-green-400'}>
            {status}
          </code>
        </div>
      )}
    </div>
  );
}
