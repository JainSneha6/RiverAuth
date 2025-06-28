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
  const { sendJSON, readyState } = useSingletonWebSocket('ws://localhost:8080');

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
     7.  UI (unchanged apart from the submit handler)
  ---------------------------------------------------------------- */
  return (
    <IonPage>
      {/* header, content, form sections … */}
      <IonContent ref={contentRef as any} fullscreen>
        <IonGrid>
          {/* sections */}
          <IonRow>
            <IonCol size="12">
              <IonButton expand="block" size="large" onClick={handleSubmit}>
                <IonRippleEffect />
                Create My Account
                <IonIcon
                  icon={checkmarkCircleOutline}
                  style={{ marginLeft: 8, fontSize: 20 }}
                />
              </IonButton>
            </IonCol>
          </IonRow>
          {readyState() !== WebSocket.OPEN && (
            <IonText color="danger" style={{ fontSize: 14 }}>
              WebSocket not connected – data will not be sent.
            </IonText>
          )}
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default BankSignupPage;
