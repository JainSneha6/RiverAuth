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
import { useState,useRef, useEffect } from 'react';
import { useGestureTracking } from '../hooks/useGestureTracking';

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

  const contentRef = useRef<IonContentElement | null>(null);

  const [send, setSend] = useState<(payload: unknown) => void>(() => () => {});

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
    setToastMsg('Account created! 🎉');
    setShowToast(true);
  };

  useEffect(() => {
    const ws = new WebSocket('ws://your-websocket-url'); // Replace with actual WebSocket URL

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSend(() => (payload: unknown) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(payload));
        }
      });
    };

    ws.onmessage = (event) => {
      console.log('Received:', event.data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => {
      ws.close();
    };
  }, []); 

  const { taps } = useGestureTracking(contentRef, send);
  console.log(taps);

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
              onIonChange={(e) => setName(e.detail.value ?? '')}
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
              onIonChange={(e) => setPassword(e.detail.value ?? '')}
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
