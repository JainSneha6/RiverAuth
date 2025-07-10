import { IonContent, IonInput, IonPage, IonSpinner, IonToast } from '@ionic/react';
import React, { useRef, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
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
import { useAuth } from '../contexts/AuthContext';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';
import { apiService } from '../services/api';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const Signup2: React.FC = () => {
  // Add loading state for better UX
  const [isPageLoading, setIsPageLoading] = useState(true);
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
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [initError, setInitError] = useState<string | null>(null);

  const history = useHistory();
  const { signupStep1, isLoading, error, clearError } = useAuth();
  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error: wsError } = useWebSocket('ws://localhost:8081');
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);
  const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking(send, isConnected);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
    console.log('Signup2 mounted - Auth state:', { isAuthenticated: !!signupStep1, error });
  }, [clearError]);

  // Show authentication errors
  useEffect(() => {
    if (error) {
      console.error('Signup2 Auth Error:', error);
      setToastMsg(error);
      setShowToast(true);
    }
  }, [error]);

  // Handle WebSocket connection issues gracefully
  useEffect(() => {
    if (wsError) {
      console.warn('WebSocket connection issue in Signup2:', wsError);
      // Don't show WebSocket errors to users as they're not critical for signup
    }
  }, [wsError]);

  // Handle initialization errors gracefully
  useEffect(() => {
    const timer = setTimeout(() => {
      // If there are connection issues after 5 seconds, don't block the user
      if (wsError && !isConnected) {
        console.warn('WebSocket connection failed, continuing without real-time features');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [wsError, isConnected]);

  // Handle page initialization
  useEffect(() => {
    const initPage = async () => {
      try {
        // Give time for context to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
        setIsPageLoading(false);
      } catch (error) {
        console.error('Page initialization error:', error);
        setInitError('Failed to initialize page');
        setIsPageLoading(false);
      }
    };

    initPage();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = (): string | null => {
    const { firstName, lastName, email, phone, aadhaar, pan, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !phone || !aadhaar || !pan || !password || !confirmPassword) {
      return 'Please fill in all fields';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    
    if (!/^\d{10}$/.test(phone)) {
      return 'Please enter a valid 10-digit phone number';
    }
    
    if (!/^\d{12}$/.test(aadhaar)) {
      return 'Please enter a valid 12-digit Aadhaar number';
    }
    
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return 'Please enter a valid PAN number (e.g., ABCDE1234F)';
    }
    
    return null;
  };

  const handleNext = async () => {
    const validationError = validateForm();
    if (validationError) {
      setToastMsg(validationError);
      setShowToast(true);
      return;
    }

    try {
      clearError();
      
      // Track form submission with behavioral data
      const submissionData = {
        type: 'signup_step1_submission',
        timestamp: Date.now(),
        email: formData.email,
        formCompleted: true,
        passwordLength: formData.password.length,
      };
      send(submissionData);
      
      await signupStep1(formData);
      
      setToastMsg('Step 1 completed! 🎉');
      setShowToast(true);
      
      // Navigate to step 2 after successful completion
      setTimeout(() => {
        history.push('/signup3');
      }, 1000);
      
    } catch (err) {
      console.error('Signup step 1 failed:', err);
      // Error will be shown via useEffect above
    }
  };

  // Simulate page loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500); // Simulate a 500ms loading time

    return () => clearTimeout(timer);
  }, []);

  if (isPageLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="flex items-center justify-center min-h-screen">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <Layout contentRef={contentRef} showTopMenu={false}>
      <div className="bg-white p-5 rounded-md shadow-md m-2 min-h-screen w-full flex flex-col">
        <div className="text-black text-3xl font-bold mb-4">Sign Up</div>
        {/* Progress Bar - Step 1 of 3 */}
        <div className="flex flex-row gap-2 mb-10 w-full">
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded bg-white border border-blue-600"></div>
          <div className="flex-1 h-2 rounded bg-white border border-blue-600"></div>
        </div>

        <div className=" flex flex-col gap-4 justify-center">
          {/* First Name */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <User className="h-4 w-4" /> First Name
              </label>
              <input
                value={formData.firstName}
                onChange={e => {
                  handleChange('firstName', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('firstName')(customEvent);
                }}
                placeholder="First Name"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
            {/* Last Name */}
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <User className="h-4 w-4" /> Last Name
              </label>
              <input
                value={formData.lastName}
                onChange={e => {
                  handleChange('lastName', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('lastName')(customEvent);
                }}
                placeholder="Last Name"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Mail className="h-4 w-4" /> Email Address
              </label>
              <input className='w-full'
                value={formData.email}
                onChange={e => {
                  handleChange('email', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('email')(customEvent);
                }}
                placeholder="Email Address"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Phone className="h-4 w-4" /> Phone Number
              </label>
              <input className='w-full'
                value={formData.phone}
                onChange={e => {
                  handleChange('phone', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('phone')(customEvent);
                }}
                placeholder="Phone Number"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Aadhaar */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Fingerprint className="h-4 w-4" /> Aadhaar Number
              </label>
              <input className='w-full'
                value={formData.aadhaar}
                onChange={e => {
                  handleChange('aadhaar', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('aadhaar')(customEvent);
                }}
                placeholder="Aadhaar Number"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* PAN */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <IdCard className="h-4 w-4" /> PAN Number
              </label>
              <input className='w-full'
                value={formData.pan}
                onChange={e => {
                  handleChange('pan', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('pan')(customEvent);
                }}
                placeholder="PAN Number"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Lock className="h-4 w-4" /> Password
              </label>
              <input className='w-full'
                type="password"
                value={formData.password}
                onChange={e => {
                  handleChange('password', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('password')(customEvent);
                }}
                placeholder="Password"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <KeyRound className="h-4 w-4" /> Confirm Password
              </label>
              <input className='w-full'
                type="password"
                value={formData.confirmPassword}
                onChange={e => {
                  handleChange('confirmPassword', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('confirmPassword')(customEvent);
                }}
                placeholder="Confirm Password"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex w-full justify-center gap-1 my-2">
            <button
              className="bg-blue-600 text-white font-bold py-4 w-full rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center"
              style={{ minHeight: '30px' }}
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Next'}
            </button>
          </div>
        </div>
        
        <IonToast
          isOpen={showToast}
          message={toastMsg}
          duration={2200}
          onDidDismiss={() => setShowToast(false)}
        />
      </div>
    </Layout>
  );
};

export default Signup2;