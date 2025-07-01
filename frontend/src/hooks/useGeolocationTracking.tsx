import { useEffect } from 'react';
import { Geolocation } from '@capacitor/geolocation';

export const useGeolocationTracking = (send: (payload: unknown) => void, apiKey: string) => {
    useEffect(() => {
        let watchId: string | null = null;
        let ipInterval: NodeJS.Timeout | null = null;

        const startTracking = async () => {
            try {
                // Request geolocation permissions
                // await Geolocation.requestPermissions();

                // // Watch position for geolocation updates
                // watchId = await Geolocation.watchPosition(
                //     { enableHighAccuracy: true, timeout: 10000 },
                //     (position, err) => {
                //         if (err) {
                //             console.error('Geolocation error:', err);
                //             return;
                //         }
                //         if (position) {
                //             const geoData = {
                //                 type: 'geolocation',
                //                 timestamp: Date.now(),
                //                 latitude: position.coords.latitude,
                //                 longitude: position.coords.longitude,
                //                 altitude: position.coords.altitude || null,
                //                 accuracy: position.coords.accuracy,
                //                 speed: position.coords.speed || null,
                //             };
                //             send(geoData); // Send geolocation data
                //         }
                //     }
                // );

                // Periodically fetch IP address and region using a secure API
                let lastRegion: string | null = null;
                ipInterval = setInterval(async () => {
                    try {
                        // Using ipstack as a secure API
                        const response = await fetch(`https://api.ipstack.com/check?access_key=${apiKey}`);
                        const data = await response.json();
                        const currentRegion = data.region_name;

                        // Send IP data only if region changes or it's the first fetch
                        if (lastRegion !== currentRegion || lastRegion === null) {
                            const ipData = {
                                type: 'ip',
                                timestamp: Date.now(),
                                ip: data.ip,
                                region: currentRegion,
                                country: data.country_name,
                            };
                            send(ipData); // Send IP data
                            lastRegion = currentRegion;
                        }
                    } catch (error) {
                        console.error('Failed to fetch IP data:', error);
                    }
                }, 360000); // Check every hour
            } catch (error) {
                console.error('Error starting geolocation tracking:', error);
            }
        };

        startTracking();

        return () => {
            if (watchId) {
                Geolocation.clearWatch({ id: watchId });
            }
            if (ipInterval) {
                clearInterval(ipInterval);
            }
        };
    }, [send, apiKey]);
};