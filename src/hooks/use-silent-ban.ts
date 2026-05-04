import { useFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { useDeviceId } from './use-device-id';

export function useSilentBan() {
  const { firestore, isHydrated } = useFirebase();
  const deviceId = useDeviceId();

  const banRef = useMemo(() => {
    if (!firestore || !deviceId || !isHydrated) return null;
    return doc(firestore, 'system_config', 'silent_bans', 'devices', deviceId);
  }, [firestore, deviceId, isHydrated]);

  const { data, isLoading } = useDoc<any>(banRef);

  return {
    isSilentBanned: !!data?.isBanned,
    isLoading: isLoading || (isHydrated && !deviceId)
  };
}
