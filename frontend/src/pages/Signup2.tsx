import { IonContent, IonInput, IonPage } from '@ionic/react';
import React, { useRef, useState } from 'react';
import {
  Fingerprint,
  IdCard,
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const Signup2: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    aadhaar: '',
    pan: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  
  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081'); 
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);

  return (
    <Layout background='bg-white' contentRef={contentRef}>
      <div className="w-full max-w-xl mx-auto flex flex-col gap-8 mt-6">
        <div className="text-black text-3xl font-bold mb-4">Sign Up</div>
        {/* Progress Bar */}
        <div className="flex flex-row gap-2 mb-10 w-full">
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded border border-blue-600 bg-white"></div>
        </div>

        <div className="flex flex-col gap-4 justify-center">
          {/* Name */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <User className="h-4 w-4" /> First Name
              </label>
              <IonInput
                value={formData.firstName}
                onIonInput={e => handleChange('firstName', e.detail.value!)}
                placeholder="First Name"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <User className="h-4 w-4" /> Last Name
              </label>
              <IonInput
                value={formData.lastName}
                onIonInput={e => handleChange('lastName', e.detail.value!)}
                placeholder="Last Name"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Mail className="h-4 w-4" /> Email Address
              </label>
              <IonInput
                value={formData.email}
                onIonInput={e => handleChange('email', e.detail.value!)}
                placeholder="Email Address"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Phone className="h-4 w-4" /> Phone Number
              </label>
              <IonInput
                value={formData.phone}
                onIonInput={e => handleChange('phone', e.detail.value!)}
                placeholder="Phone Number"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Aadhaar */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Fingerprint className="h-4 w-4" /> Aadhaar Number
              </label>
              <IonInput
                value={formData.aadhaar}
                onIonInput={e => handleChange('aadhaar', e.detail.value!)}
                placeholder="Aadhaar Number"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* PAN */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <IdCard className="h-4 w-4" /> PAN Number
              </label>
              <IonInput
                value={formData.pan}
                onIonInput={e => handleChange('pan', e.detail.value!)}
                placeholder="PAN Number"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Lock className="h-4 w-4" /> Password
              </label>
              <IonInput
                value={formData.password}
                onIonInput={e => handleChange('password', e.detail.value!)}
                placeholder="Password"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <KeyRound className="h-4 w-4" /> Confirm Password
              </label>
              <IonInput
                value={formData.confirmPassword}
                onIonInput={e => handleChange('confirmPassword', e.detail.value! )}
                placeholder="Confirm Password"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex w-full justify-center gap-1 my-2">
            <button
              className="bg-blue-600 text-white font-bold py-4 w-full rounded-lg hover:bg-blue-700 transition shadow-lg"
              style={{ minHeight: '30px' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Signup2;