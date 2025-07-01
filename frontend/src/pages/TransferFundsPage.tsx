import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';

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

  const contentRef = useRef<IonContentElement | null>(null);
    
  const [send, setSend] = useState<(payload: unknown) => void>(() => () => {});
  
    useEffect(() => {
        const ws = new WebSocket('ws://your-websocket-url'); // Replace with actual WebSocket URL
    
        ws.onopen = () => {
          console.log('WebSocket connected');
          setSend(() => (payload: unknown) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(payload));
            }
          });
        };
    
        ws.onmessage = (event) => {
          console.log('Received:', event.data);
        };
    
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
    
        ws.onclose = () => {
          console.log('WebSocket closed');
        };
    
        return () => {
          ws.close();
        };
      }, []); 
  
      const { taps } = useGestureTracking(contentRef, send);
      console.log(taps);

  return (
    <Layout background="bg-white" contentRef={contentRef}>
      {/* Title */}
      <h1 className="mt-5 w-full text-2xl font-bold text-black">Transfer Funds</h1>

      {/* Balance Card */}
      <div className="mt-5 w-full rounded-md border border-blue-500 bg-[#01A0E3] p-5 text-center text-white">
        <p>Your Balance</p>
        <p className="text-3xl font-bold">₹69,420.00</p>
      </div>

      {/* Toggle Tabs */}
      <div className="mt-6 w-full h-8 grid grid-cols-2 gap-0">
        {(['Transaction', 'Recipient'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`w-full rounded-md px-5 py-3 text-base font-medium text-center transition-colors
              ${
                selectedTab === tab
                  ? 'bg-[#01A0E3] text-white'
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mt-4 w-full">
        <input
          type="text"
          placeholder={`Search ${selectedTab.toLowerCase()}…`}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add Button */}
      <div className="mt-6 w-full">
        <button
          className="my-2 flex w-full items-center justify-center rounded-md border border-gray-400 bg-white px-4 py-3 text-sm text-gray-800"
        >
          + Add {selectedTab}
        </button>
      </div>

      {/* List Section */}
     {/* List Section */}
<div className="mt-4 w-full">
  {filteredData.length > 0 ? (
    filteredData.map(item => {
      if (selectedTab === 'Transaction') {
        const tx = item as (typeof transactions)[0];
        return (
          <div
            key={tx.id}
            className="my-2 w-full rounded-md border border-gray-400 bg-white px-4 py-3 text-sm text-gray-800"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold">{tx.name}</span>
              <span className="text-sm text-green-600 font-medium">{tx.amount}</span>
              <span className="text-sm text-gray-600">{tx.account}</span>
              <span className="text-xs text-gray-500">{tx.time}</span>
            </div>
          </div>
        );
      } else {
        const recipient = item as (typeof recipients)[0];
        return (
          <div
            key={recipient.id}
            className="my-2 w-full rounded-md border border-gray-400 bg-white px-4 py-3 text-sm text-gray-800"
          >
            {recipient.name}
          </div>
        );
      }
    })
  ) : (
    <p className="mt-4 text-sm text-gray-500">
      No {selectedTab.toLowerCase()}s found.
    </p>
  )}
</div>

    </Layout>
  );
};

export default TransferFundsPage;
