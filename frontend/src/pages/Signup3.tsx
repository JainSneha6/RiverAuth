import React, { useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';

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

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081'); 
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);

  return (
    <Layout background='bg-white' contentRef={contentRef}>
        <div className="min-h-screen w-full bg-white p-5 flex flex-col">
          <div className="text-black text-3xl font-bold mb-4">Sign Up</div>
          {/* Progress Bar */}
          <div className="flex flex-row gap-2 mb-10 w-full">
            <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
            <div className="flex-1 h-2 rounded bg-blue-600 border border-blue-600"></div>
          </div>

          <div className="flex flex-col gap-4 justify-center">
            {/* Address */}
            <div className="flex w-full justify-center gap-1 my-2">
              <div className="w-full">
                <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Address"
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                  className="w-full"
                />
              </div>
            </div>
            {/* City */}
            <div className="flex w-full justify-center gap-1 my-2">
              <div className="w-full">
                <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="City"
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                  className="w-full"
                />
              </div>
            </div>
            {/* State */}
            <div className="flex w-full justify-center gap-1 my-2">
              <div className="w-full">
                <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                  State
                </label>
                <select
                  value={formData.state}
                  onChange={e => handleChange('state', e.target.value)}
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
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
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={e => handleChange('pincode', e.target.value)}
                  placeholder="Pincode"
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                  className="w-full"
                />
              </div>
            </div>
            {/* Occupation */}
            <div className="flex w-full justify-center gap-1 my-2">
              <div className="w-full">
                <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={e => handleChange('occupation', e.target.value)}
                  placeholder="Occupation"
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                  className="w-full"
                />
              </div>
            </div>
            {/* Income */}
            <div className="flex w-full justify-center gap-1 my-2">
              <div className="w-full">
                <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                  Income
                </label>
                <input
                  type="number"
                  value={formData.income}
                  onChange={e => handleChange('income', e.target.value)}
                  placeholder="Income"
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
                  className="w-full"
                />
              </div>
            </div>
            {/* Account Type */}
            <div className="flex w-full justify-center gap-1 my-2">
              <div className="w-full">
                <label className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.accountType}
                  onChange={e => handleChange('accountType', e.target.value)}
                  style={{ color: 'black', border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem' }}
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
              <label className="text-sm text-gray-700">I agree to the Terms & Conditions</label>
            </div>
            {/* Submit Button */}
            <div className="flex w-full justify-center gap-1 my-2">
              <button
                className="bg-blue-600 text-white font-bold  py-4 w-full rounded-lg hover:bg-blue-700 transition shadow-lg"
                style={{ minHeight: '30px' }}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </Layout>
  );
};

export default Signup3; 