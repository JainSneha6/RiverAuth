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
  IonRippleEffect,
  IonBadge,
  IonChip,
  IonLabel,
} from '@ionic/react';
import { businessOutline, chevronBackOutline, shieldCheckmarkOutline, lockClosedOutline, checkmarkCircleOutline } from 'ionicons/icons';
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
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#1a1b3a' });
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
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #11998e 100%)',
            '--color': 'white',
            '--border-color': 'transparent',
            'height': '60px'
          }}
        >
          <IonButtons slot="start">
            <IonBackButton
              defaultHref="/"
              icon={chevronBackOutline}
              style={{
                '--color': 'rgba(255,255,255,0.9)',
                '--border-radius': '12px',
                '--padding': '8px'
              }}
            />
          </IonButtons>
          <IonTitle style={{
            color: 'white',
            fontWeight: '700',
            fontSize: '20px',
            letterSpacing: '0.5px'
          }}>
            Create Account
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        ref={contentRef as React.RefObject<HTMLIonContentElement>}
        style={{
          '--background': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #cbd5e1 100%)',
          '--padding-top': '0px'
        }}
        fullscreen
      >
        <div
          style={{
            minHeight: '100vh',
            padding: '24px 16px 32px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 30%, #cbd5e1 100%)',
          }}
        >
          {/* Hero Section */}
          <IonCard
            style={{
              marginTop: '20px',
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(26, 27, 58, 0.15), 0 8px 24px rgba(26, 27, 58, 0.1)',
              border: 'none',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
              backdropFilter: 'blur(20px)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Decorative elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              background: 'linear-gradient(135deg, #11998e20, #1a1b3a20)',
              borderRadius: '50%',
              opacity: 0.6,
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              left: '-30px',
              width: '100px',
              height: '100px',
              background: 'linear-gradient(135deg, #2d1b6920, #11998e20)',
              borderRadius: '50%',
              opacity: 0.4,
            }} />

            <IonCardHeader style={{
              textAlign: 'center',
              padding: '32px 24px 16px',
              position: 'relative',
              zIndex: 2
            }}>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  background: 'linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #11998e 100%)',
                  borderRadius: '28px',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 12px 32px rgba(26, 27, 58, 0.3), 0 4px 16px rgba(17, 153, 142, 0.2)',
                  transform: 'rotate(-5deg)',
                  transition: 'transform 0.3s ease',
                }}
              >
                <IonIcon
                  icon={businessOutline}
                  style={{
                    fontSize: '42px',
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  }}
                />
              </div>

              <IonCardTitle
                style={{
                  color: '#1a1b3a',
                  fontSize: '28px',
                  fontWeight: '800',
                  marginBottom: '12px',
                  letterSpacing: '-0.5px',
                  lineHeight: '1.2'
                }}
              >
                Open Your Dream Account
              </IonCardTitle>

              <IonText style={{
                color: '#64748b',
                fontSize: '16px',
                fontWeight: '500',
                lineHeight: '1.5'
              }}>
                Join millions of Indians banking with
                <br />
                <span style={{ color: '#11998e', fontWeight: '600' }}>trust and security</span>
              </IonText>


            </IonCardHeader>

            <IonCardContent style={{ padding: '0 24px 32px' }}>
              <IonGrid style={{ padding: '0' }}>
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
                        '--background': 'linear-gradient(135deg, #1a1b3a 0%, #2d1b69 50%, #11998e 100%)',
                        '--color': 'white',
                        '--border-radius': '16px',
                        '--box-shadow': '0 8px 24px rgba(26, 27, 58, 0.3), 0 4px 12px rgba(17, 153, 142, 0.2)',
                        '--padding-top': '16px',
                        '--padding-bottom': '16px',
                        height: '56px',
                        fontSize: '18px',
                        fontWeight: '700',
                        marginTop: '32px',
                        textTransform: 'none',
                        letterSpacing: '0.5px',
                        position: 'relative',
                        overflow: 'hidden'
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

                <IonRow>
                  <IonCol size="12" style={{ textAlign: 'center', marginTop: '24px' }}>
                    <IonText style={{
                      color: '#64748b',
                      fontSize: '15px',
                      fontWeight: '500'
                    }}>
                      Already have an account?{' '}
                      <span style={{
                        color: '#11998e',
                        fontWeight: '700',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        borderBottom: '2px solid transparent',
                        transition: 'border-color 0.2s ease'
                      }}>
                        Sign In
                      </span>
                    </IonText>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>


        </div>
      </IonContent>
    </IonPage>
  );
};

export default BankSignupPage;