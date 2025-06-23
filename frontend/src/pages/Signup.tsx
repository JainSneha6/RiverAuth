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
  IonButtons,
  createGesture,
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

const BACKEND_URL = 'https://your-backend-api.com/gestures'; // replace with your actual endpoint

const BankSignupPage: React.FC = () => {
  // State for form data
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
  // Validation errors
  const [errors, setErrors] = useState<any>({});

  // Gesture data arrays
  const [swipeEvents, setSwipeEvents] = useState<any[]>([]);
  const [tapEvents, setTapEvents] = useState<any[]>([]);

  // Typing speed data
  const [typingEvents, setTypingEvents] = useState<any[]>([]);
  const typingDataRef = useRef<{ [field: string]: { start: number; last: number } }>({});

  // Refs for gesture detection
  const contentRef = useRef<HTMLIonContentElement>(null);
  const downDataRef = useRef<Map<number, { x: number; y: number; timestamp: number }>>(new Map());
  const swipeDataRef = useRef<{ startX: number; startY: number; startTime: number }>({
    startX: 0,
    startY: 0,
    startTime: 0
  });
  const gestureRef = useRef<any>(null);

  // Thresholds
  const HOLD_THRESHOLD = 10; // px movement threshold to consider tap/hold
  const SWIPE_DISTANCE_THRESHOLD = 15; // px for swipe
  const SWIPE_TIME_THRESHOLD = 1000; // ms max duration for swipe
  const TAP_TIME_THRESHOLD = 1000; // ms max duration for tap

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#667eea' });
      Keyboard.setAccessoryBarVisible({ isVisible: true });
      Keyboard.addListener('keyboardWillShow', () => {
        if (contentRef.current) {
          contentRef.current.scrollToBottom(300);
        }
      });
    }

    const contentEl = contentRef.current;
    if (!contentEl) return;

    // Detailed log (optional)
    const logEventDetails = (event: PointerEvent) => {
      const {
        clientX, clientY, pointerType, timeStamp, pointerId,
        screenX, screenY, pageX, pageY, offsetX, offsetY,
        movementX, movementY, button, buttons, target
      } = event;
      const targetInfo = target && (target as HTMLElement).tagName
        ? `${(target as HTMLElement).tagName}${(target as HTMLElement).id ? `#${(target as HTMLElement).id}` : ''}`
        : 'N/A';
      const eventType = event.type === 'pointerdown'
        ? 'Touch Down'
        : event.type === 'pointerup'
          ? 'Touch Up'
          : 'Touch Move';
      console.log(`${eventType}:
  pointerId: ${pointerId}
  clientX/Y: ${clientX}, ${clientY}
  screenX/Y: ${screenX}, ${screenY}
  pageX/Y: ${pageX}, ${pageY}
  offsetX/Y: ${offsetX}, ${offsetY}
  movementX/Y: ${movementX}, ${movementY}
  button/buttons: ${button}/${buttons}
  pointerType: ${pointerType}
  timestamp: ${timeStamp}
  target: ${targetInfo}`);
    };

    // Pointer down: record start coords/time
    const handlePointerDown = (event: PointerEvent) => {
      downDataRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        timestamp: event.timeStamp
      });
      logEventDetails(event);
    };
    // Pointer up: detect tap or swipe, record JSON
    const handlePointerUp = (event: PointerEvent) => {
      const downData = downDataRef.current.get(event.pointerId);
      if (downData) {
        const startX = downData.x;
        const startY = downData.y;
        const endX = event.clientX;
        const endY = event.clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = event.timeStamp - downData.timestamp;
        const timestamp = Date.now();

        console.log(`Pointer ${event.pointerId} up: distance=${distance.toFixed(2)}px, duration=${duration.toFixed(2)}ms`);

        if (distance < HOLD_THRESHOLD && duration < TAP_TIME_THRESHOLD) {
          // Tap detected
          const tapEvent = {
            pointerId: event.pointerId,
            x: endX,
            y: endY,
            duration,
            timestamp,
            pointerType: event.pointerType
          };
          setTapEvents(prev => [...prev, tapEvent]);
          console.log('Tap event recorded:', tapEvent);
        } else if (duration < SWIPE_TIME_THRESHOLD && distance > SWIPE_DISTANCE_THRESHOLD) {
          // Swipe detected
          const direction = Math.abs(deltaX) > Math.abs(deltaY)
            ? (deltaX > 0 ? 'right' : 'left')
            : (deltaY > 0 ? 'down' : 'up');
          const swipeEvent = {
            pointerId: event.pointerId,
            startX,
            startY,
            endX,
            endY,
            deltaX,
            deltaY,
            distance,
            duration,
            direction,
            timestamp,
            pointerType: event.pointerType
          };
          setSwipeEvents(prev => [...prev, swipeEvent]);
          console.log('Swipe event recorded:', swipeEvent);
        } else {
          console.log('Gesture not classified as tap or swipe (movement or duration thresholds)');
        }
        downDataRef.current.delete(event.pointerId);
      }
      logEventDetails(event);
    };
    const handlePointerMove = (event: PointerEvent) => {
      logEventDetails(event);
    };

    contentEl.addEventListener('pointerdown', handlePointerDown);
    contentEl.addEventListener('pointerup', handlePointerUp);
    contentEl.addEventListener('pointermove', handlePointerMove);

    // Also Ionic createGesture on scroll element
    contentEl.getScrollElement().then(scrollEl => {
      if (!scrollEl) return;
      const gesture = createGesture({
        el: scrollEl,
        gestureName: 'swipe-gesture',
        threshold: 0,
        onStart: detail => {
          swipeDataRef.current = {
            startX: detail.startX,
            startY: detail.startY,
            startTime: Date.now()
          };
        },
        onEnd: detail => {
          const { startX, startY, startTime } = swipeDataRef.current;
          const endX = detail.currentX;
          const endY = detail.currentY;
          const deltaX = endX - startX;
          const deltaY = endY - startY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const duration = Date.now() - startTime;
          const timestamp = Date.now();
          console.log(`Gesture end: distance=${distance.toFixed(2)}px, duration=${duration}ms`);
          if (distance < HOLD_THRESHOLD && duration < TAP_TIME_THRESHOLD) {
            // treat as tap
            const tapEvent = {
              pointerId: -1, // gesture API does not give pointerId; mark as -1 or omit
              x: endX,
              y: endY,
              duration,
              timestamp,
              source: 'gesture'
            };
            setTapEvents(prev => [...prev, tapEvent]);
            console.log('Tap event (gesture) recorded:', tapEvent);
          } else if (duration < SWIPE_TIME_THRESHOLD && distance > SWIPE_DISTANCE_THRESHOLD) {
            const direction = Math.abs(deltaX) > Math.abs(deltaY)
              ? (deltaX > 0 ? 'right' : 'left')
              : (deltaY > 0 ? 'down' : 'up');
            const swipeEvent = {
              pointerId: -1,
              startX,
              startY,
              endX,
              endY,
              deltaX,
              deltaY,
              distance,
              duration,
              direction,
              timestamp,
              source: 'gesture'
            };
            setSwipeEvents(prev => [...prev, swipeEvent]);
            console.log('Swipe event (gesture) recorded:', swipeEvent);
          } else {
            console.log('Gesture (Ionic) not classified');
          }
        }
      });
      gesture.enable(true);
      gestureRef.current = gesture;
    });

    return () => {
      contentEl.removeEventListener('pointerdown', handlePointerDown);
      contentEl.removeEventListener('pointerup', handlePointerUp);
      contentEl.removeEventListener('pointermove', handlePointerMove);
      if (gestureRef.current) {
        gestureRef.current.destroy();
        gestureRef.current = null;
      }
    };
  }, []);

  const labelStyle = { color: 'black' };
  const inputStyle = { color: 'black', '--placeholder-color': 'black' };

  // Handle input change: update formData and record typing timestamps
  const handleInputChange = (field: string, value: any) => {
    const now = Date.now();
    // Initialize or update typing data
    if (!typingDataRef.current[field]) {
      typingDataRef.current[field] = { start: now, last: now };
    } else {
      typingDataRef.current[field].last = now;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  // Handle blur: compute typing speed for field
  const handleInputBlur = (field: string) => {
    const data = typingDataRef.current[field];
    if (data) {
      const { start, last } = data;
      const duration = last - start; // ms
      const value = formData[field as keyof typeof formData] as string;
      const length = value ? value.length : 0;
      let wpm = 0;
      if (duration > 0) {
        // words approximated as length/5
        wpm = (length / 5) / (duration / 60000);
      }
      const event = {
        field,
        length,
        duration,
        wpm: Math.round(wpm),
        timestamp: Date.now()
      };
      setTypingEvents(prev => [...prev, event]);
      console.log('Typing event recorded:', event);
      delete typingDataRef.current[field];
    }
  };

  const handleSelectBlur = (field: string) => {
    // For select fields, we can record typingEvents similarly if desired.
    // Here we skip since selection isn't typing.
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
    if (!validateForm()) return;
    console.log('Form submitted:', formData);
    console.log('Swipe payload:', swipeEvents);
    console.log('Tap payload:', tapEvents);
    console.log('Typing payload:', typingEvents);

    // Send to backend
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          form: formData,
          gestures: {
            swipes: swipeEvents,
            taps: tapEvents
          },
          typing: typingEvents
        })
      });
      if (!response.ok) {
        console.error('Failed to send data to backend:', response.statusText);
      } else {
        console.log('Data sent successfully');
      }
    } catch (error) {
      console.error('Error sending data:', error);
    }

    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    console.log('Success: Account registration successful! You will receive a confirmation email shortly.');
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
                {/* Personal Information */}
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
                        onIonBlur={() => handleInputBlur('firstName')}
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
                        onIonBlur={() => handleInputBlur('lastName')}
                        placeholder="Enter your last name"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.lastName && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.lastName}</IonText>}
                  </IonCol>
                </IonRow>
                {/* Email & Phone */}
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={mailOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Email Address *</IonLabel>
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                        onIonBlur={() => handleInputBlur('email')}
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
                        onIonBlur={() => handleInputBlur('phone')}
                        placeholder="Enter your phone number"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.phone && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.phone}</IonText>}
                  </IonCol>
                </IonRow>
                {/* Aadhar & PAN */}
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonItem style={{ '--background': 'rgba(255,255,255,0.8)', '--border-radius': '12px', marginBottom: '12px' }}>
                      <IonIcon icon={cardOutline} slot="start" style={{ color: '#667eea' }} />
                      <IonLabel position="stacked" style={labelStyle}>Aadhar Number *</IonLabel>
                      <IonInput
                        value={formData.aadhar}
                        onIonInput={(e) => handleInputChange('aadhar', e.detail.value!)}
                        onIonBlur={() => handleInputBlur('aadhar')}
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
                        onIonBlur={() => handleInputBlur('pan')}
                        placeholder="Enter your PAN number"
                        style={inputStyle}
                      />
                    </IonItem>
                    {errors.pan && <IonText color="danger" style={{ fontSize: '12px', marginLeft: '12px' }}>{errors.pan}</IonText>}
                  </IonCol>
                </IonRow>
                {/* Address */}
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
                        onIonBlur={() => handleInputBlur('address')}
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
                        onIonBlur={() => handleInputBlur('city')}
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
                        // onIonBlur={() => handleSelectBlur('state')}
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
                        onIonBlur={() => handleInputBlur('pincode')}
                        placeholder="Enter your pincode"
                        style={inputStyle}
                      />
                    </IonItem>
                  </IonCol>
                </IonRow>
                {/* Account Info */}
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
                        onIonBlur={() => handleInputBlur('occupation')}
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
                        onIonBlur={() => handleInputBlur('income')}
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
                        // onIonBlur={() => handleSelectBlur('accountType')}
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
                        onIonBlur={() => handleInputBlur('password')}
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
                        onIonBlur={() => handleInputBlur('confirmPassword')}
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
