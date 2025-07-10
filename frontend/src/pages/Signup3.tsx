import React, { useRef, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonSpinner, IonToast } from '@ionic/react';
import {
  MapPin,
  Building,
  Map,
  Hash,
  Briefcase,
  DollarSign,
  CreditCard,
  CheckSquare,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';
import { apiService } from '../services/api';

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry',
];

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const Signup3: React.FC = () => {
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    pincode: '',
    occupation: '',
    income: '',
    accountType: '',
    agreeTerms: false,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const history = useHistory();
  const { signupStep2, isLoading, error, clearError, user, isAuthenticated } = useAuth();
  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error: wsError } = useWebSocket('ws://localhost:8081');
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);
  const { typingEvents, onInputChange, recordTypingEvent } = useTypingSpeedTracking(send, isConnected);

  // Redirect if not authenticated or completed step 1
  useEffect(() => {
    console.log('Signup3 mounted - Auth state:', { isAuthenticated, user, signup_step: user?.signup_step });
    if (!isAuthenticated || !user || user.signup_step < 1) {
      console.log('Signup3 redirecting to signup2 - missing auth or incomplete step 1');
      history.push('/signup2');
    }
  }, [isAuthenticated, user, history]);

  // Clear auth errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Show authentication errors
  useEffect(() => {
    if (error) {
      setToastMsg(error);
      setShowToast(true);
    }
  }, [error]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const validateForm = (): string | null => {
    const { address, city, state, pincode, occupation, income, accountType, agreeTerms } = formData;
    
    if (!address || !city || !state || !pincode || !occupation || !income || !accountType) {
      return 'Please fill in all fields';
    }
    
    if (!agreeTerms) {
      return 'You must agree to the Terms & Conditions';
    }
    
    if (!/^\d{6}$/.test(pincode)) {
      return 'Please enter a valid 6-digit pincode';
    }
    
    if (isNaN(Number(income)) || Number(income) <= 0) {
      return 'Please enter a valid income amount';
    }
    
    return null;
  };

  const handleSignUp = async () => {
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
        type: 'signup_step2_submission',
        timestamp: Date.now(),
        accountType: formData.accountType,
        formCompleted: true,
        income: formData.income,
      };
      send(submissionData);
      
      await signupStep2(formData);
      
      setToastMsg('Step 2 completed! Please set up security questions.');
      setShowToast(true);
      
      // Navigate to security questions (Signup4) after successful completion
      setTimeout(() => {
        history.push('/signup4');
      }, 1500);
      
    } catch (err) {
      console.error('Signup step 2 failed:', err);
      // Error will be shown via useEffect above
    }
  };

  return (
    <Layout contentRef={contentRef} showTopMenu={false}>
      <div className="bg-white rounded-md shadow-md m-2 min-h-screen w-full p-5 flex flex-col">
        <div className="text-black text-3xl font-bold mb-4">Sign Up</div>
        {/* Progress Bar - Step 2 of 3 */}
        <div className="flex flex-row gap-2 mb-10 w-full">
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          <div className="flex-1 h-2 rounded bg-white border border-blue-600"></div>
        </div>

        <div className="bg-white flex flex-col gap-4 justify-center">
          {/* Address */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <MapPin className="h-4 w-4" /> Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => {
                  handleChange('address', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('address')(customEvent);
                }}
                placeholder="Address"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              />
            </div>
          </div>
          {/* City */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Building className="h-4 w-4" /> City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => {
                  handleChange('city', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('city')(customEvent);
                }}
                placeholder="City"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              />
            </div>
          </div>
          {/* State */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Map className="h-4 w-4" /> State
              </label>
              <select
                value={formData.state}
                onChange={e => handleChange('state', e.target.value)}
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Pincode */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Hash className="h-4 w-4" /> Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={e => {
                  handleChange('pincode', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('pincode')(customEvent);
                }}
                placeholder="Pincode"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              />
            </div>
          </div>
          {/* Occupation */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <Briefcase className="h-4 w-4" /> Occupation
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={e => {
                  handleChange('occupation', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('occupation')(customEvent);
                }}
                placeholder="Occupation"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              />
            </div>
          </div>
          {/* Income */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <DollarSign className="h-4 w-4" /> Income
              </label>
              <input
                type="number"
                value={formData.income}
                onChange={e => {
                  handleChange('income', e.target.value);
                  const customEvent = {
                    detail: { value: e.target.value },
                  } as CustomEvent<{ value: string }>;
                  onInputChange('income')(customEvent);
                }}
                placeholder="Income"
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              />
            </div>
          </div>
          {/* Account Type */}
          <div className="flex w-full justify-center gap-1 my-2">
            <div className="w-full">
              <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                <CreditCard className="h-4 w-4" /> Account Type
              </label>
              <select
                value={formData.accountType}
                onChange={e => handleChange('accountType', e.target.value)}
                style={{ color: 'black', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                className="w-full"
              >
                <option value="">Select Account Type</option>
                <option value="savings">Savings Account</option>
                <option value="current">Current Account</option>
                <option value="fixed">Fixed Deposit</option>
              </select>
            </div>
          </div>
          {/* Agree Terms */}
          <div className="flex w-full items-center gap-2 my-2">
            <input
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={e => handleChange('agreeTerms', e.target.checked)}
              style={{ width: '1.25rem', height: '1.25rem', accentColor: '#2563eb' }}
            />
            <label className="text-sm text-gray-700 flex items-center gap-1">
              <CheckSquare className="h-4 w-4" /> I agree to the Terms & Conditions
            </label>
          </div>
          {/* Submit Button */}
          <div className="flex w-full justify-center gap-1 my-2">
            <button
              className="bg-blue-600 text-white font-bold py-4 w-full rounded-lg hover:bg-blue-700 transition shadow-lg flex items-center justify-center"
              style={{ minHeight: '30px' }}
              onClick={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : 'Complete Registration'}
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

export default Signup3;