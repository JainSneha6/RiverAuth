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
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';

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

  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081');
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);
  const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking(send, isConnected);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Layout background="bg-white" contentRef={contentRef}>
      <div className="w-full max-w-xl mx-auto flex flex-col gap-8 mt-6">
        <div className="text-black text-3xl font-bold mb-4">Sign Up</div>
        {/* Progress Bar */}
        <div className="flex flex-row gap-2 mb-10 w-full">
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded border border-blue-600 bg-white"></div>
        </div>

        <div className="flex flex-col gap-4 justify-center">
          {/* First Name */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <User className="h-4 w-4" /> First Name
              </label>
              <IonInput
                value={formData.firstName}
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('firstName', newValue);
                  onInputChange('firstName')(e as CustomEvent<{ value: string }>);
                }}
                placeholder="First Name"
                style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
            {/* Last Name */}
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <User className="h-4 w-4" /> Last Name
              </label>
              <IonInput
                value={formData.lastName}
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('lastName', newValue);
                  onInputChange('lastName')(e as CustomEvent<{ value: string }>);
                }}
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
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('email', newValue);
                  onInputChange('email')(e as CustomEvent<{ value: string }>);
                }}
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
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('phone', newValue);
                  onInputChange('phone')(e as CustomEvent<{ value: string }>);
                }}
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
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('aadhaar', newValue);
                  onInputChange('aadhaar')(e as CustomEvent<{ value: string }>);
                }}
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
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('pan', newValue);
                  onInputChange('pan')(e as CustomEvent<{ value: string }>);
                }}
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
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('password', newValue);
                  onInputChange('password')(e as CustomEvent<{ value: string }>);
                }}
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
                onIonInput={e => {
                  const newValue = e.detail.value || '';
                  handleChange('confirmPassword', newValue);
                  onInputChange('confirmPassword')(e as CustomEvent<{ value: string }>);
                }}
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