import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonLabel,
  IonButton,
  IonToast,
  IonIcon,
  IonText,
} from '@ionic/react';
import { personAdd, lockClosed, mail } from 'ionicons/icons';
import { useState } from 'react';

const LoginPage: React.FC = () => {
  // ────────────────────────────────────────────────────────────────────────────────
  // Local state
  // ────────────────────────────────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // ────────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────────────────────
  const passwordsMatch = password === confirm;
  const allFilled = name && email && password && confirm;

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
    // TODO: call your signup API here
    setToastMsg('Account created! 🎉');
    setShowToast(true);
  };

  // ────────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────────
  return (
    <IonPage className="h-full">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
     

      {/* ── Content ─────────────────────────────────────────────────────────────── */}
      <IonContent fullscreen >
        
        <div className="flex flex-col items-center bg-white">
        <img src="/LoginHeader.png" alt="Logo" className="w-full" />
        <div className="w-full max-w-md px-6 py-8">
          {/* Name */}
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

          

          {/* Password */}
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


          {/* Signup button */}
          <IonButton
            expand="block"
            className="h-12 rounded-lg bg-indigo-600 text-base font-semibold hover:bg-indigo-700"
            onClick={handleSignup}
          >
            Sign Up
          </IonButton>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            New here?{' '}
            <a href="#" className="font-medium text-indigo-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>

        {/* Toast feedback */}
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
