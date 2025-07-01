import { useEffect } from 'react';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

export const useDeviceTracking = (send: (payload: unknown) => void) => {
    useEffect(() => {
        const trackDevice = async () => {
            try {
                // Device Consistency: Get and track device ID changes
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

                const payload = {
                    type: 'device',
                    timestamp: Date.now(),
                    deviceId: currentDeviceId,
                    deviceChangeCount,
                    osVersion: currentOsVersion,
                    osChangeCount,
                    isEmulator,
                    emulatorDetectionCount,
                };
                send(payload);
            } catch (error) {
                console.error('Error in device tracking:', error);

            }
        };

        trackDevice();
    }, [send]);
};