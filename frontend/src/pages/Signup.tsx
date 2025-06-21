import React, { useState, useRef, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonBackButton,
  IonButtons
} from '@ionic/react';
import {
  personOutline,
  mailOutline,
  callOutline,
  locationOutline,
  cardOutline,
  lockClosedOutline,
  businessOutline,
  chevronBackOutline
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';

const BankSignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
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
    agreeTerms: false
  });

  const [errors, setErrors] = useState<any>({});

  const contentRef = useRef<HTMLIonContentElement>(null);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#667eea' });
    }

    if (Capacitor.isNativePlatform()) {
      Keyboard.setAccessoryBarVisible({ isVisible: true });
      Keyboard.addListener('keyboardWillShow', () => {
        if (contentRef.current) {
          contentRef.current.scrollToBottom(300);
        }
      });
    }

    const contentElement = contentRef.current;
    if (contentElement) {
      const handlePointerEvent = (event: PointerEvent) => {
        const {
          clientX, clientY, pressure, pointerType, timeStamp, pointerId, width, height,
          tiltX, tiltY, tangentialPressure, twist, isPrimary, screenX, screenY, pageX, pageY,
          offsetX, offsetY, movementX, movementY, button, buttons, target
        } = event;

        const targetInfo = target ? `${(target as HTMLElement).tagName}${target.id ? `#${target.id}` : ''}` : 'N/A';

        const eventType = event.type === 'pointerdown' ? 'Touch Down' :
          event.type === 'pointerup' ? 'Touch Up' :
            'Touch Move';

        const logMessage = `
${eventType} Event Details:
Coordinates:
  clientX: ${clientX}, clientY: ${clientY}
  screenX: ${screenX}, screenY: ${screenY}
  pageX: ${pageX}, pageY: ${pageY}
  offsetX: ${offsetX}, offsetY: ${offsetY}
Pressure: ${pressure}
Pointer Type: ${pointerType}
Timestamp: ${timeStamp}
Pointer ID: ${pointerId}
Width: ${width}, Height: ${height}
Tilt: tiltX=${tiltX}, tiltY=${tiltY}
Tangential Pressure: ${tangentialPressure}
Twist: ${twist}
Is Primary: ${isPrimary}
Movement: movementX=${movementX}, movementY=${movementY}
Button: ${button}, Buttons: ${buttons}
Target Element: ${targetInfo}
        `.trim();

        console.log(logMessage);
      };

      contentElement.addEventListener('pointerdown', handlePointerEvent);
      contentElement.addEventListener('pointerup', handlePointerEvent);
      contentElement.addEventListener('pointermove', handlePointerEvent);

      return () => {
        contentElement.removeEventListener('pointerdown', handlePointerEvent);
        contentElement.removeEventListener('pointerup', handlePointerEvent);
        contentElement.removeEventListener('pointermove', handlePointerEvent);
      };
    }
  }, []);

  const labelStyle = { color: 'black' };
  const inputStyle = { color: 'black', '--placeholder-color': 'black' };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    if (!formData.aadhar.trim()) {
      newErrors.aadhar = 'Aadhar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhar)) {
      newErrors.aadhar = 'Aadhar number must be 12 digits';
    }
    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) {
      newErrors.pan = 'Invalid PAN format';
    }
    if (!formData.accountType) newErrors.accountType = 'Account type is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      console.log('Form submitted:', formData);
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      console.log('Success: Account registration successful! You will receive a confirmation email shortly.');
    }
  };

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
  ];

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
        ref={contentRef}
        style={{ '--background': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}
      >
        <div style={{
          minHeight: '100vh',
          padding: '20px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <IonCard style={{
            marginTop: '10px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)'
          }}>
            <IonCardHeader style={{ textAlign: 'center', paddingBottom: '10px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                margin: '0 auto 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
              }}>
                <IonIcon icon={businessOutline} style={{ fontSize: '36px', color: 'white' }} />
              </div>
              <IonCardTitle style={{
                color: 'black',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                Open Your Bank Account
              </IonCardTitle>
              <IonText style={{ color: '#7f8c8d', fontSize: '14px' }}>
                Join millions of Indians banking with trust and security
              </IonText>
            </IonCardHeader>

            <IonCardContent>
              <IonGrid>
                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: 'black', marginBottom: '16px', fontSize: '18px' }}>
                      Personal Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={personOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>First Name *</IonLabel>
                      <IonInput
                        value={formData.firstName}
                        onIonInput={(e) => handleInputChange('firstName', e.detail.value!)}
                        placeholder="Enter your first name"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.firstName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.firstName}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={personOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Last Name *</IonLabel>
                      <IonInput
                        value={formData.lastName}
                        onIonInput={(e) => handleInputChange('lastName', e.detail.value!)}
                        placeholder="Enter your last name"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.lastName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.lastName}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={mailOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Email Address *</IonLabel>
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                        placeholder="Enter your email"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.email && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.email}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={callOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Phone Number *</IonLabel>
                      <IonInput
                        type="tel"
                        value={formData.phone}
                        onIonInput={(e) => handleInputChange('phone', e.detail.value!)}
                        placeholder="Enter your phone number"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.phone && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.phone}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Aadhar Number *</IonLabel>
                      <IonInput
                        value={formData.aadhar}
                        onIonInput={(e) => handleInputChange('aadhar', e.detail.value!)}
                        placeholder="Enter your Aadhar number"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.aadhar && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.aadhar}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>PAN Number *</IonLabel>
                      <IonInput
                        value={formData.pan}
                        onIonInput={(e) => handleInputChange('pan', e.detail.value!)}
                        placeholder="Enter your PAN number"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.pan && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.pan}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: 'black', marginBottom: '16px', fontSize: '18px' }}>
                      Address Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Address</IonLabel>
                      <IonInput
                        value={formData.address}
                        onIonInput={(e) => handleInputChange('address', e.detail.value!)}
                        placeholder="Enter your address"
                        style={inputStyle}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>City</IonLabel>
                      <IonInput
                        value={formData.city}
                        onIonInput={(e) => handleInputChange('city', e.detail.value!)}
                        placeholder="Enter your city"
                        style={inputStyle}
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>State</IonLabel>
                      <IonSelect
                        value={formData.state}
                        onIonChange={(e) => handleInputChange('state', e.detail.value!)}
                        placeholder="Select your state"
                        style={inputStyle}
                      >
                        {states.map(state => (
                          <IonSelectOption key={state} value={state}>{state}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="4">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={locationOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Pincode</IonLabel>
                      <IonInput
                        value={formData.pincode}
                        onIonInput={(e) => handleInputChange('pincode', e.detail.value!)}
                        placeholder="Enter your pincode"
                        style={inputStyle}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <h3 style={{ color: 'black', marginBottom: '16px', fontSize: '18px' }}>
                      Account Information
                    </h3>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={businessOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Occupation</IonLabel>
                      <IonInput
                        value={formData.occupation}
                        onIonInput={(e) => handleInputChange('occupation', e.detail.value!)}
                        placeholder="Enter your occupation"
                        style={inputStyle}
                      />
                    </IonItem>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Annual Income</IonLabel>
                      <IonInput
                        type="number"
                        value={formData.income}
                        onIonInput={(e) => handleInputChange('income', e.detail.value!)}
                        placeholder="Enter your annual income"
                        style={inputStyle}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Account Type *</IonLabel>
                      <IonSelect
                        value={formData.accountType}
                        onIonChange={(e) => handleInputChange('accountType', e.detail.value!)}
                        placeholder="Select account type"
                        style={inputStyle}
                      >
                        <IonSelectOption value="savings">Savings Account</IonSelectOption>
                        <IonSelectOption value="current">Current Account</IonSelectOption>
                        <IonSelectOption value="fixed">Fixed Deposit</IonSelectOption>
                      </IonSelect>
                    </IonItem>
                    {errors.accountType && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.accountType}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={lockClosedOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={formData.password}
                        onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                        placeholder="Enter your password"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.password && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.password}</IonText>}
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={lockClosedOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Confirm Password *</IonLabel>
                      <IonInput
                        type="password"
                        value={formData.confirmPassword}
                        onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
                        placeholder="Confirm your password"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.confirmPassword && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.confirmPassword}</IonText>}
                  </IonCol>
                </IonRow>

                <IonRow>
                  <IonCol size="12">
                    <IonItem style={{ '--background': 'transparent', marginTop: '16px' }}>
                      <IonCheckbox
                        slot="start"
                        checked={formData.agreeTerms}
                        onIonChange={(e) => handleInputChange('agreeTerms', e.detail.checked)}
                        style={{ '--checkbox-background-checked': '#667eea' }}
                      />
                      <IonLabel style={{ color: 'black', fontSize: '14px' }}>
                        I agree to the <span style={{ color: '#667eea', textDecoration: 'underline' }}>Terms & Conditions</span>
                      </IonLabel>
                    </IonItem>
                    {errors.agreeTerms && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.agreeTerms}</IonText>}
                  </IonCol>
                </IonRow>

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
                        boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)'
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

          <IonCard style={{
            marginTop: '16px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(102, 126, 234, 0.2)'
          }}>
            <IonCardContent style={{ padding: '16px', textAlign: 'center' }}>
              <IonText style={{ color: '#7f8c8d', fontSize: '12px', lineHeight: '1.5' }}>
                🔒 Your information is secure and encrypted. We follow RBI guidelines and use bank-grade security to protect your data.
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BankSignupPage;