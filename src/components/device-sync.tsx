'use client';

import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useDeviceId } from '@/hooks/use-device-id';

/**
 * Silently synchronizes the physical device identifier with the user profile.
 * This enables the 'Silent Ghosting' security layer.
 */
export function DeviceSync() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const deviceId = useDeviceId();

  useEffect(() => {
    if (!user?.uid || !firestore || !deviceId) return;

    const syncDevice = async () => {
      try {
        const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
        await updateDoc(profileRef, {
          lastDeviceId: deviceId,
          // We keep a history of devices used by this account
          devices: [deviceId] 
        });
      } catch (e) {
        // Fail silently to keep the 'Ghosting' invisible
      }
    };

    syncDevice();
  }, [user?.uid, firestore, deviceId]);

  return null;
}
