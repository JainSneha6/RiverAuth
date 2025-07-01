import { useEffect, useState } from 'react';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

interface DeviceInfo {
  deviceId: string;
  deviceChangeCount: number;
  osVersion: string;
  osChangeCount: number;
  isEmulator: boolean;
  emulatorDetectionCount: number;
}

export const useDeviceTracking = (send: (payload: unknown) => void) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const trackDevice = async () => {
      try {
        const deviceIdInfo = await Device.getId();
        const currentDeviceId = deviceIdInfo.identifier;
        const storedDeviceId = await Preferences.get({ key: 'deviceId' });
        let deviceChangeCount = 0;
        if (storedDeviceId.value) {
          if (storedDeviceId.value !== currentDeviceId) {
            deviceChangeCount = parseInt((await Preferences.get({ key: 'deviceChangeCount' })).value || '0') + 1;
            await Preferences.set({ key: 'deviceChangeCount', value: deviceChangeCount.toString() });
            await Preferences.set({ key: 'deviceId', value: currentDeviceId });
          } else {
            deviceChangeCount = parseInt((await Preferences.get({ key: 'deviceChangeCount' })).value || '0');
          }
        } else {
          await Preferences.set({ key: 'deviceId', value: currentDeviceId });
          await Preferences.set({ key: 'deviceChangeCount', value: '0' });
        }

        const deviceInfo = await Device.getInfo();
        const currentOsVersion = `${deviceInfo.operatingSystem} ${deviceInfo.osVersion}`;
        const storedOsVersion = await Preferences.get({ key: 'osVersion' });
        let osChangeCount = 0;
        if (storedOsVersion.value) {
          if (storedOsVersion.value !== currentOsVersion) {
            osChangeCount = parseInt((await Preferences.get({ key: 'osChangeCount' })).value || '0') + 1;
            await Preferences.set({ key: 'osChangeCount', value: osChangeCount.toString() });
            await Preferences.set({ key: 'osVersion', value: currentOsVersion });
          } else {
            osChangeCount = parseInt((await Preferences.get({ key: 'osChangeCount' })).value || '0');
          }
        } else {
          await Preferences.set({ key: 'osVersion', value: currentOsVersion });
          await Preferences.set({ key: 'osChangeCount', value: '0' });
        }

        const isEmulator = deviceInfo.isVirtual;
        const storedEmulatorCount = await Preferences.get({ key: 'emulatorDetectionCount' });
        let emulatorDetectionCount = parseInt(storedEmulatorCount.value || '0');
        if (isEmulator) {
          emulatorDetectionCount += 1;
          await Preferences.set({ key: 'emulatorDetectionCount', value: emulatorDetectionCount.toString() });
        }

        const deviceData: DeviceInfo = {
          deviceId: currentDeviceId,
          deviceChangeCount,
          osVersion: currentOsVersion,
          osChangeCount,
          isEmulator,
          emulatorDetectionCount,
        };

        setDeviceInfo(deviceData);

        const payload = {
          type: 'device',
          ts: Date.now(),
          data: deviceData,
        };

        send(payload);
      } catch (error) {
        console.error('Error in device tracking:', error);
      }
    };

    trackDevice();
  }, [send]);

  return { deviceInfo };
};