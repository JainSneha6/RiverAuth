import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/react';
import { businessOutline, chevronBackOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';
import PersonalInfoSection from '../components/PersonalInfoSection';
import AddressInfoSection from '../components/AddressInfoSection';
import AccountInfoSection from '../components/AccountInfoSection';

// Define IonContentElement interface to match useGestureTracking
interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const BACKEND_URL = 'https://your-backend-api.com/gestures'; // Replace with your actual endpoint

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

const BankSignupPage: React.FC = () => {
  const contentRef = useRef<IonContentElement | null>(null);
  const { swipes, taps, downEvents, upEvents, moveEvents } = useGestureTracking(contentRef);
  const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking();

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

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#667eea' });
      Keyboard.setAccessoryBarVisible({ isVisible: true });
      Keyboard.addListener('keyboardWillShow', () => {
        if (contentRef.current) {
          contentRef.current.scrollToBottom(300).catch((err) => console.error('Scroll error:', err));
        }
      });
    }
    return () => {
      if (Capacitor.isNativePlatform()) {
        Keyboard.removeAllListeners();
      }
    };
  }, []);

  const handleInputChange = (field: string) => (e: CustomEvent) => {
    const value = e.detail.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    onInputChange(field)(e);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleCheckboxChange = (field: string, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleInputBlur = (field: string) => () => {
    recordTypingEvent(field, formData[field as keyof FormData] as string);
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone number must be 10 digits';
    if (!formData.aadhar.trim()) newErrors.aadhar = 'Aadhar number is required';
    else if (!/^\d{12}$/.test(formData.aadhar)) newErrors.aadhar = 'Aadhar number must be 12 digits';
    if (!formData.pan.trim()) newErrors.pan = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) newErrors.pan = 'Invalid PAN format';
    if (!formData.accountType) newErrors.accountType = 'Account type is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms and conditions';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    console.log('Form submitted:', formData);
    console.log('Swipe payload:', swipes);
    console.log('Tap payload:', taps);
    console.log('Down events:', downEvents);
    console.log('Up events:', upEvents);
    console.log('Move events:', moveEvents);
    console.log('Typing payload:', typingEvents);

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: formData,
          gestures: {
            swipes,
            taps,
            downEvents,
            upEvents,
            moveEvents,
          },
          typing: typingEvents,
        }),
      });
      if (!response.ok) console.error('Failed to send data:', response.statusText);
      else console.log('Data sent successfully');
    } catch (error) {
      console.error('Error sending data:', error);
    }

    if (Capacitor.isNativePlatform()) await Haptics.impact({ style: ImpactStyle.Medium });
    console.log('Success: Account registration successful!');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" icon={chevronBackOutline} />
          </IonButtons>
          <IonTitle style={{ color: 'white', fontWeight: 'bold' }}>Create Account</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent
        ref={contentRef as React.RefObject<HTMLIonContentElement>} // Type assertion to satisfy IonContent
        style={{ '--background': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
      >
        <div
          style={{
            minHeight: '100vh',
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <IonCard
            style={{
              marginTop: '10px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <IonCardHeader style={{ textAlign: 'center', paddingBottom: '10px' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                }}
              >
                <IonIcon icon={businessOutline} style={{ fontSize: '36px', color: 'white' }} />
              </div>
              <IonCardTitle
                style={{ color: 'black', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}
              >
                Open Your Bank Account
              </IonCardTitle>
              <IonText style={{ color: '#7f8c8d', fontSize: '14px' }}>
                Join millions of Indians banking with trust and security
              </IonText>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                <PersonalInfoSection
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  handleInputBlur={handleInputBlur}
                />
                <AddressInfoSection
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  handleInputBlur={handleInputBlur}
                />
                <AccountInfoSection
                  formData={formData}
                  errors={errors}
                  handleInputChange={handleInputChange}
                  handleInputBlur={handleInputBlur}
                  handleCheckboxChange={handleCheckboxChange}
                />
                <IonRow>
                  <IonCol size="12">
                    <IonButton
                      expand="block"
                      size="large"
                      onClick={handleSubmit}
                      style={{
                        '--background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '--color': 'white',
                        '--border-radius': '12px',
                        height: '50px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginTop: '24px',
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      Create My Account
                    </IonButton>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="12" style={{ textAlign: 'center', marginTop: '16px' }}>
                    <IonText style={{ color: '#7f8c8d', fontSize: '14px' }}>
                      Already have an account?{' '}
                      <span style={{ color: '#667eea', textDecoration: 'underline', cursor: 'pointer' }}>
                        Sign In
                      </span>
                    </IonText>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>
          <IonCard
            style={{
              marginTop: '16px',
              marginBottom: '20px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.9)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
            }}
          >
            <IonCardContent style={{ padding: '16px', textAlign: 'center' }}>
              <IonText style={{ color: '#7f8c8d', fontSize: '12px', lineHeight: '1.5' }}>
                🔒 Your information is secure and encrypted. We follow RBI guidelines and use
                bank-grade security to protect your data.
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BankSignupPage;