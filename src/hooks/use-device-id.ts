import { Device } from '@capacitor/device';
import { useEffect, useState } from 'react';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeviceId() {
      try {
        const info = await Device.getId();
        setDeviceId(info.identifier);
      } catch (e) {
        console.error('[Device] Failed to get ID:', e);
      }
    }
    fetchDeviceId();
  }, []);

  return deviceId;
}
