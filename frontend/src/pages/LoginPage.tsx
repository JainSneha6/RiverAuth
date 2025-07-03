import {
  IonPage,
  IonContent,
  IonInput,
  IonLabel,
  IonButton,
  IonToast,
  IonIcon,
} from '@ionic/react';
import { personAdd, lockClosed } from 'ionicons/icons';
import { useState, useRef, useEffect } from 'react';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const passwordsMatch = password === confirm;
  const allFilled = name && email && password && confirm;

  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081');

  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);

  const handleSignup = () => {
    if (!allFilled) {
      setToastMsg('Please fill in all fields');
      setShowToast(true);
      return;
    }
    if (!passwordsMatch) {
      setToastMsg('Passwords do not match');
      setShowToast(true);
      return;
    }

    const formData = {
      type: 'form_submission',
      timestamp: Date.now(),
      username: name,
      email: email,
      passwordLength: password.length,
      fieldsCompleted: { name: !!name, email: !!email, password: !!password, confirm: !!confirm }
    };
    send(formData);

    setToastMsg('Account created! 🎉');
    setShowToast(true);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    const fieldData = {
      type: 'field_interaction',
      timestamp: Date.now(),
      field: fieldName,
      value: value,
      length: value.length
    };
    send(fieldData);
  };

  return (
    <IonPage className="h-full">
      <IonContent fullscreen ref={contentRef as any}>
        
        <div className="flex flex-col items-center bg-white">
        <img src="/LoginHeader.png" alt="Logo" className="w-full" />
        <div className="w-full max-w-md px-6 py-8">
          
          <div className='w-full text-center text-black font-bold text-3xl mb-10'>Banking that Knows It's <div className='text-blue-500'>You</div></div>
          <div className="mb-4">
            <IonLabel className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </IonLabel>
            <IonInput
              value={name}
              onIonChange={(e) => {
                const newValue = e.detail.value ?? '';
                setName(newValue);
                handleFieldChange('username', newValue);
              }}
              placeholder="John Doe"
              fill="outline"
              className="h-11 rounded-md border-gray-300 bg-white px-3 text-[15px]"
            >
              <IonIcon slot="start" icon={personAdd} />
            </IonInput>
          </div>

          <div className="mb-4">
            <IonLabel className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </IonLabel>
            <IonInput
              value={password}
              onIonChange={(e) => {
                const newValue = e.detail.value ?? '';
                setPassword(newValue);
                handleFieldChange('password', newValue);
              }}
              placeholder="••••••••"
              type="password"
              fill="outline"
              className="h-11 rounded-md border-gray-300 bg-white px-3 text-[15px]"
            >
              <IonIcon slot="start" icon={lockClosed} />
            </IonInput>
          </div>


          <IonButton
            expand="block"
            className="h-12 rounded-lg bg-indigo-600 text-base font-semibold hover:bg-indigo-700"
            onClick={handleSignup}
          >
            Login
          </IonButton>

          <p className="mt-6 text-center text-sm text-gray-600">
            New here?{' '}
            <a href="#" className="font-medium text-indigo-600 hover:underline">
              Signup
            </a>
          </p>
        </div>
        
        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2200}
          onDidDismiss={() => setShowToast(false)}
        />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default LoginPage;
