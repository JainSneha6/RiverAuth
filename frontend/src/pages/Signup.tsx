import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonRippleEffect,
  IonText,
} from '@ionic/react';
import { chevronBackOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';
import PersonalInfoSection from '../components/PersonalInfoSection';
import AddressInfoSection from '../components/AddressInfoSection';
import AccountInfoSection from '../components/AccountInfoSection';
import { useSingletonWebSocket } from '../hooks/useSingletonWebsocket'; // ← typo fixed: WebSocket

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

/* ------- form + error types (unchanged) -------------------------- */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  aadhar: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  occupation: string;
  income: string;
  accountType: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}
interface Errors {
  [key: string]: string;
}

/* ================================================================ */
const BankSignupPage: React.FC = () => {
  /* ----------------------------------------------------------------
     1.  WebSocket (must be inside the component!)
  ---------------------------------------------------------------- */
  const { sendJSON, readyState } = useSingletonWebSocket('ws://localhost:8081');

  /* ----------------------------------------------------------------
     2. Gesture & typing hooks
  ---------------------------------------------------------------- */
  const contentRef = useRef<IonContentElement | null>(null);
  const { swipes, taps, downEvents, upEvents, moveEvents } =
    useGestureTracking(contentRef, sendJSON);
  const { typingEvents, onInputChange, recordTypingEvent } =
    useTypingSpeedTracking(sendJSON);

  /* ----------------------------------------------------------------
     3. Local state
  ---------------------------------------------------------------- */
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    aadhar: '',
    pan: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    income: '',
    accountType: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Errors>({});

  /* ----------------------------------------------------------------
     4. Native tweaks (status bar, keyboard)
  ---------------------------------------------------------------- */
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#1a1b3a' });
      Keyboard.setAccessoryBarVisible({ isVisible: true });
      Keyboard.addListener('keyboardWillShow', () => {
        contentRef.current?.scrollToBottom(300).catch(console.error);
      });
    }
    return () => {
      if (Capacitor.isNativePlatform()) Keyboard.removeAllListeners();
    };
  }, []);

  /* ----------------------------------------------------------------
     5. Helpers
  ---------------------------------------------------------------- */
  const handleInputChange =
    (field: keyof FormData) => (e: CustomEvent<{ value: string }>) => {
      const value = e.detail.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      onInputChange(field)(e);
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleCheckboxChange = (field: keyof FormData, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleInputBlur = (field: keyof FormData) => () => {
    const v = formData[field];
    recordTypingEvent(field, typeof v === 'string' ? v : v.toString());
  };

  const validateForm = () => {
    const err: Errors = {};
    if (!formData.firstName.trim()) err.firstName = 'First name is required';
    if (!formData.lastName.trim()) err.lastName = 'Last name is required';
    if (!formData.email.trim()) err.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) err.email = 'Email is invalid';
    if (!formData.phone.trim()) err.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone))
      err.phone = 'Phone number must be 10 digits';
    if (!formData.aadhar.trim()) err.aadhar = 'Aadhar number is required';
    else if (!/^\d{12}$/.test(formData.aadhar))
      err.aadhar = 'Aadhar number must be 12 digits';
    if (!formData.pan.trim()) err.pan = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan))
      err.pan = 'Invalid PAN format';
    if (!formData.accountType) err.accountType = 'Account type is required';
    if (!formData.password) err.password = 'Password is required';
    else if (formData.password.length < 8)
      err.password = 'At least 8 characters';
    if (formData.password !== formData.confirmPassword)
      err.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms)
      err.agreeTerms = 'You must agree to the terms and conditions';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  /* ----------------------------------------------------------------
     6. Submit: build payload + sendJSON
  ---------------------------------------------------------------- */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      type: 'signup',
      ts: Date.now(),
      form: formData,
      gestures: { swipes, taps, downEvents, upEvents, moveEvents },
      typing: typingEvents,
    };

    if (readyState() === WebSocket.OPEN) {
      sendJSON(payload);
      console.log('✅ Sent over WebSocket', payload);
    } else {
      console.warn('WS not open; data not sent');
    }

    if (Capacitor.isNativePlatform())
      await Haptics.impact({ style: ImpactStyle.Medium });
  };

  /* ----------------------------------------------------------------
     7.  Complete UI with header, form sections, and submit button
  ---------------------------------------------------------------- */
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{
          '--background': 'linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #11998e 100%)',
          '--color': 'white'
        }}>
          <IonButtons slot="start">
            <IonBackButton 
              icon={chevronBackOutline} 
              defaultHref="/" 
              style={{ color: 'white' }}
            />
          </IonButtons>
          <IonTitle style={{ 
            fontWeight: '700', 
            fontSize: '20px',
            textAlign: 'center'
          }}>
            Create Account
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent 
        ref={contentRef as any} 
        fullscreen
        style={{
          '--background': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
      >
        <div style={{
          minHeight: '100vh',
          padding: '20px 0'
        }}>
          <IonGrid style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Personal Information Section */}
            <PersonalInfoSection
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleInputBlur={handleInputBlur}
            />

            {/* Address Information Section */}
            <AddressInfoSection
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleInputBlur={handleInputBlur}
            />

            {/* Account Information Section */}
            <AccountInfoSection
              formData={formData}
              errors={errors}
              handleInputChange={handleInputChange}
              handleInputBlur={handleInputBlur}
              handleCheckboxChange={handleCheckboxChange}
            />

            {/* Submit Button */}
            <IonRow style={{ marginTop: '32px' }}>
              <IonCol size="12">
                <IonButton 
                  expand="block" 
                  size="large" 
                  onClick={handleSubmit}
                  disabled={readyState() !== WebSocket.OPEN}
                  style={{
                    '--background': readyState() === WebSocket.OPEN 
                      ? 'linear-gradient(135deg, #1a1b3a 0%, #11998e 100%)'
                      : '#94a3b8',
                    '--color': 'white',
                    '--border-radius': '16px',
                    '--box-shadow': '0 8px 25px rgba(26, 27, 58, 0.3)',
                    height: '56px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textTransform: 'none'
                  }}
                >
                  <IonRippleEffect />
                  Create My Account
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    style={{ marginLeft: '8px', fontSize: '20px' }}
                  />
                </IonButton>
              </IonCol>
            </IonRow>

            {/* Connection Status */}
            <IonRow>
              <IonCol size="12" style={{ textAlign: 'center', marginTop: '16px' }}>
                {readyState() === WebSocket.OPEN ? (
                  <IonText style={{ color: '#10b981', fontSize: '14px', fontWeight: '500' }}>
                    🟢 Connected to server
                  </IonText>
                ) : (
                  <IonText style={{ color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>
                    🔴 Disconnected from server
                  </IonText>
                )}
              </IonCol>
            </IonRow>

          </IonGrid>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BankSignupPage;
