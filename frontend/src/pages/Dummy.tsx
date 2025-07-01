import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonButton } from '@ionic/react';
import { useRef, useState } from 'react';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { useDeviceTracking } from '../hooks/useDeviceTracking';

// Define interfaces for data types
interface GeoData {
    type: 'geolocation';
    timestamp: number;
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    speed: number | null;
}

interface IpData {
    type: 'ip';
    timestamp: number;
    ip: string;
    region: string;
    country: string;
}

interface DeviceData {
    type: 'device';
    timestamp: number;
    deviceId: string;
    deviceChangeCount: number;
    osVersion: string;
    osChangeCount: number;
    isRooted: boolean;
    isRootedWithBusyBox: boolean;
    isEmulator: boolean;
    integrityCompromised: boolean;
}

const DummyPage: React.FC = () => {
    const contentRef = useRef<HTMLIonContentElement>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [latestGeoData, setLatestGeoData] = useState<GeoData | null>(null);
    const [latestIpData, setLatestIpData] = useState<IpData | null>(null);
    const [deviceData, setDeviceData] = useState<DeviceData | null>(null);

    // Send function to handle payloads and update state
    const send = (payload: unknown) => {
        if (typeof payload === 'object' && payload !== null && 'type' in payload) {
            switch (payload.type) {
                case 'geolocation':
                    setLatestGeoData(payload as GeoData);
                    break;
                case 'ip':
                    setLatestIpData(payload as IpData);
                    break;
                case 'device':
                    setDeviceData(payload as DeviceData);
                    break;
            }
        }
        console.log('Sending payload:', payload);
    };

    // Placeholder API key for ipstack (replace with your own)
    const apiKey = 'd37a7bae63fad2b608561af1a4ba41bd';

    const { swipes, taps, downEvents, upEvents, moveEvents } = useGestureTracking(contentRef, send);
    const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking(send);
    useGeolocationTracking(send, apiKey);
    useDeviceTracking(send);

    const handleInputChange = (e: CustomEvent) => {
        const value = e.detail.value as string;
        setInputValue(value);
        onInputChange('dummyInput')(e);
    };

    const handleBlur = () => {
        recordTypingEvent('dummyInput', inputValue);
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Dummy Page</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent ref={contentRef}>
                <div style={{ padding: '20px' }}>
                    <h2>Tracking Demo</h2>
                    <p>Interact with the page to see tracked events.</p>

                    <IonInput
                        placeholder="Type something here..."
                        value={inputValue}
                        onIonChange={handleInputChange}
                        onIonBlur={handleBlur}
                    />

                    <IonButton>Tap Me</IonButton>

                    <div style={{ height: '200px', background: '#f0f0f0', marginTop: '20px' }}>
                        Swipe here
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <h3>Event Counts</h3>
                        <p>Swipes: {swipes.length}</p>
                        <p>Taps: {taps.length}</p>
                        <p>Typing Events: {typingEvents.length}</p>
                    </div>

                    {latestGeoData && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Latest Geolocation</h3>
                            <p>Latitude: {latestGeoData.latitude}</p>
                            <p>Longitude: {latestGeoData.longitude}</p>
                            {latestGeoData.speed !== null && <p>Speed: {latestGeoData.speed} m/s</p>}
                        </div>
                    )}

                    {latestIpData && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Latest IP Data</h3>
                            <p>IP: {latestIpData.ip}</p>
                            <p>Region: {latestIpData.region}</p>
                            <p>Country: {latestIpData.country}</p>
                        </div>
                    )}

                    {deviceData && (
                        <div style={{ marginTop: '20px' }}>
                            <h3>Device Data</h3>
                            <p>Device ID: {deviceData.deviceId}</p>
                            <p>Device Change Count: {deviceData.deviceChangeCount}</p>
                            <p>OS Version: {deviceData.osVersion}</p>
                            <p>OS Change Count: {deviceData.osChangeCount}</p>
                            <p>Is Rooted: {deviceData.isRooted ? 'Yes' : 'No'}</p>
                            <p>Is Rooted with BusyBox: {deviceData.isRootedWithBusyBox ? 'Yes' : 'No'}</p>
                            <p>Is Emulator: {deviceData.isEmulator ? 'Yes' : 'No'}</p>
                            <p>Integrity Compromised: {deviceData.integrityCompromised ? 'Yes' : 'No'}</p>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DummyPage;