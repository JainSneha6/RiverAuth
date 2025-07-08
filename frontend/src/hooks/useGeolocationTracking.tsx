import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface GeolocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
}

interface IpData {
  ip: string;
  region: string;
  country: string;
}

const apiKey = 'cff0abb5a0b26b596f806c1b53c13c40';

export const useGeolocationTracking = (send: (payload: unknown) => void, isConnected: boolean) => {
  const [pendingGeoData, setPendingGeoData] = useState<GeolocationData[]>([]);
  const [pendingIpData, setPendingIpData] = useState<IpData[]>([]);

  const sendData = (type: 'geolocation' | 'ip', data: GeolocationData | IpData) => {
    if (isConnected) {
      const payload = {
        type,
        timestamp: Date.now(),
        data,
      };
      try {
        send(payload);
        if (type === 'geolocation') {
          setPendingGeoData([]); // Clear pending geolocation data
        } else {
          setPendingIpData([]); // Clear pending IP data
        }
      } catch (sendError) {
        console.error(`Error sending ${type} data to backend:`, sendError);
        if (type === 'geolocation') {
          setPendingGeoData((prev) => [...prev, data as GeolocationData]);
        } else {
          setPendingIpData((prev) => [...prev, data as IpData]);
        }
      }
    } else {
      console.warn(`WebSocket connection not established, queuing ${type} data.`);
      if (type === 'geolocation') {
        setPendingGeoData((prev) => [...prev, data as GeolocationData]);
      } else {
        setPendingIpData((prev) => [...prev, data as IpData]);
      }
    }
  };

  useEffect(() => {
    let watchId: string | null = null;
    let ipInterval: NodeJS.Timeout | null = null;

    const startTracking = async () => {
      try {
        await Geolocation.requestPermissions();

        // Watch position for geolocation updates
        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000 },
          (position, err) => {
            if (err) {
              console.error('Geolocation error:', err);
              return;
            }
            if (position) {
              const geoData: GeolocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                altitude: position.coords.altitude || null,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed || null,
              };
              sendData('geolocation', geoData);
            }
          }
        );

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
              const ipData: IpData = {
                ip: data.ip,
                region: currentRegion,
                country: data.country_name,
              };
              sendData('ip', ipData);
              lastRegion = currentRegion;
            }
          } catch (error) {
            console.error('Failed to fetch IP data:', error);
          }
        }, 360); // Check every hour
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

  // Send pending data when connection is established
  useEffect(() => {
    if (isConnected) {
      if (pendingGeoData.length > 0) {
        pendingGeoData.forEach((data) => sendData('geolocation', data));
      }
      if (pendingIpData.length > 0) {
        pendingIpData.forEach((data) => sendData('ip', data));
      }
    }
  }, [isConnected, pendingGeoData, pendingIpData]);

  return { pendingGeoData, pendingIpData };
};