import React, { useRef } from 'react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';

const mockUser = {
  name: 'John Doe',
  joinDate: '2017-04-15',
  accounts: [
    {
      accountNumber: '1234567890',
      type: 'Savings',
      balance: 25400.75,
      currency: 'INR',
    },
    {
      accountNumber: '9876543210',
      type: 'Current',
      balance: 120000.00,
      currency: 'INR',
    },
    {
      accountNumber: '1122334455',
      type: 'Fixed Deposit',
      balance: 500000.00,
      currency: 'INR',
    },
  ],
};

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

function getYearsAsCustomer(joinDate: string) {
  const join = new Date(joinDate);
  const now = new Date();
  let years = now.getFullYear() - join.getFullYear();
  if (
    now.getMonth() < join.getMonth() ||
    (now.getMonth() === join.getMonth() && now.getDate() < join.getDate())
  ) {
    years--;
  }
  return years;
}

const ProfilePage: React.FC = () => {
  const years = getYearsAsCustomer(mockUser.joinDate);
  const contentRef = useRef<IonContentElement>(null);
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081'); 
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);

  return (
    <Layout contentRef={contentRef}>
      <div className="w-full max-w-xl mx-auto flex flex-col gap-8 mt-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-20 w-20 bg-yellow-300 rounded-full flex items-center justify-center text-3xl font-bold">
            {mockUser.name[0]}
          </div>
          <div className="text-2xl font-bold text-black">{mockUser.name}</div>
          <div className="text-gray-600 text-sm">Customer for <span className="font-semibold text-blue-600">{years} years</span></div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <div className="text-xl font-bold text-blue-700 mb-2">Bank Accounts</div>
          {mockUser.accounts.map((acc, idx) => (
            <div key={acc.accountNumber} className="border border-blue-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-blue-50">
              <div>
                <div className="text-sm text-gray-500">Account Number</div>
                <div className="font-mono text-lg text-black">{acc.accountNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-semibold text-black">{acc.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Balance</div>
                <div className="font-bold text-green-700 text-lg">{acc.currency} {acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 