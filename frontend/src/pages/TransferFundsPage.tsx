import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';

type Props = {};

// Dummy data
const transactions = [
  {
    id: 1,
    name: 'Anita',
    amount: '₹2,000',
    account: 'XXXX 1234',
    time: 'Today, 10:30 AM',
  },
  {
    id: 2,
    name: 'Vikas',
    amount: '₹1,000',
    account: 'XXXX 5678',
    time: 'Yesterday, 4:15 PM',
  },
  {
    id: 3,
    name: 'Ravi',
    amount: '₹500',
    account: 'XXXX 9012',
    time: 'Mon, 8:00 AM',
  },
];

const recipients = [
  { id: 1, name: 'Anita' },
  { id: 2, name: 'Vikas' },
  { id: 3, name: 'Ravi' },
  { id: 4, name: 'Priya' },
];

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const TransferFundsPage: React.FC<Props> = () => {
  const [selectedTab, setSelectedTab] = useState<'Transaction' | 'Recipient'>('Transaction');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData =
    selectedTab === 'Transaction'
      ? transactions.filter(t =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.account.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : recipients.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const contentRef = useRef<IonContentElement>(null);
    const { send, isConnected, error } = useWebSocket('ws://localhost:8081'); 
    const { taps } = useGestureTracking(contentRef, send);
    const { deviceInfo } = useDeviceTracking(send, isConnected);
    const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);

  return (
    <Layout contentRef={contentRef}>
      {/* Title */}
      <div className="w-full text-2xl font-bold text-black mb-2 mt-5">Transfer Funds</div>

      {/* Balance Card */}
      <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-5 flex flex-col items-center mb-6 shadow-sm">
        <div className="text-gray-700 text-base">Your Balance</div>
        <div className="text-4xl font-bold text-blue-700 mt-1">₹69,420.00</div>
      </div>

      {/* Toggle Tabs */}
      <div className="w-full flex mb-4 gap-2">
        {(['Transaction', 'Recipient'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`flex-1 py-4 rounded-l-md first:rounded-l-md last:rounded-r-md text-base font-semibold transition-colors
              ${
                selectedTab === tab
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            style={{ minHeight: '48px' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="w-full mb-4">
        <input
          type="text"
          placeholder={`Search ${selectedTab.toLowerCase()}…`}
          className="w-full rounded-md border border-gray-700 px-4 py-2 text-sm focus:ring-2 focus:ring-gray-800"
          value={searchTerm}
          style={{ color:'black' }}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add Button */}
      <div className="w-full mb-4">
        <button
          className="w-full flex items-center justify-center rounded-md bg-blue-600 text-white font-semibold py-4 text-base shadow hover:bg-blue-700 transition"
          style={{ minHeight: '56px' }}
        >
          + Add {selectedTab}
        </button>
      </div>

      {/* List Section */}
      <div className="w-full flex flex-col gap-3">
        {filteredData.length > 0 ? (
          filteredData.map(item => {
            if (selectedTab === 'Transaction') {
              const tx = item as (typeof transactions)[0];
              return (
                <div
                  key={tx.id}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-xl">
                    {tx.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-black truncate">{tx.name}</div>
                      <div className="font-bold text-green-600 text-lg ml-2">{tx.amount}</div>
                    </div>
                    <div className="text-gray-500 text-sm">{tx.account}</div>
                    <div className="text-gray-400 text-xs mt-1">{tx.time}</div>
                  </div>
                </div>
              );
            } else {
              const recipient = item as (typeof recipients)[0];
              return (
                <div
                  key={recipient.id}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 flex items-center gap-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 font-bold text-xl">
                    {recipient.name[0]}
                  </div>
                  <div className="font-semibold text-black">{recipient.name}</div>
                </div>
              );
            }
          })
        ) : (
          <p className="mt-4 text-sm text-gray-500 text-center">
            No {selectedTab.toLowerCase()}s found.
          </p>
        )}
      </div>
    </Layout>
  );
};

export default TransferFundsPage;
