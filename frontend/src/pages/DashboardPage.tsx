import React, { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';
import { useTypingSpeedTracking } from '../hooks/useTypingSpeedTracking';
import {
  IoDocumentTextOutline,
  IoCardOutline,
  IoCashOutline,
  IoSwapHorizontalOutline,
} from 'react-icons/io5';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const QuickActionButton: React.FC<{
  name: string;
  Icon: React.ElementType;
  onClick: () => void;
}> = ({ name, Icon, onClick }) => (
  <div className="bg-white h-36 w-full rounded-md flex flex-col items-center justify-center shadow-md">
    <button onClick={onClick} className="flex flex-col items-center justify-center">
      <Icon className="text-4xl text-blue-600 mb-2" />
      <span className="text-sm font-medium text-gray-800">{name}</span>
    </button>
  </div>
);

const DashboardPage: React.FC = () => {
  const contentRef = useRef<IonContentElement>(null);
  const history = useHistory();
  const { send, isConnected } = useWebSocket('ws://localhost:8081');
  useGestureTracking(contentRef, send);
  const [a, setA] = useState('');
  useDeviceTracking(send, isConnected);
  useGeolocationTracking(send, isConnected);
  const { onInputChange } = useTypingSpeedTracking(send, isConnected);

  // Safely handle localStorage user data
  const userString = localStorage.getItem('user');
  const userId = userString ? JSON.parse(userString).id : null;

  const handleButtonClick = (buttonName: string) => {
    const buttonData = {
      type: 'button_click',
      timestamp: Date.now(),
      button: buttonName,
      page: 'DashboardPage',
      userAgent: navigator.userAgent,
    };
    send(buttonData);
    console.log(`Button clicked: ${buttonName}`, buttonData);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setA(value);
    onInputChange('search')({ detail: { value } } as any);
  };

  const quickActions = [
    {
      name: 'Documents',
      Icon: IoDocumentTextOutline,
      onClick: () => handleButtonClick('Documents'),
    },
    {
      name: 'Cards',
      Icon: IoCardOutline,
      onClick: () => handleButtonClick('Cards'),
    },
    {
      name: 'Pay Bills',
      Icon: IoCashOutline,
      onClick: () => {
        handleButtonClick('Pay Bills');
        history.push('/pay-bills');
      },
    },
    {
      name: 'Transfer Funds',
      Icon: IoSwapHorizontalOutline,
      onClick: () => {
        handleButtonClick('Transfer Funds');
        history.push('/transfer-funds');
      },
    },
  ];

  const recentActions = [
    {
      type: 'transaction',
      title: 'Money Sent',
      subtitle: 'To: Paytm Wallet',
      amount: '-₹1,200.00',
      date: '2024-06-10',
      icon: '/paytm.webp',
      color: 'text-red-600',
    },
    {
      type: 'transaction',
      title: 'Money Received',
      subtitle: 'From: Amazon Pay',
      amount: '+₹2,500.00',
      date: '2024-06-09',
      icon: '/amazon_pay.png',
      color: 'text-green-600',
    },
    {
      type: 'update',
      title: 'Profile Updated',
      subtitle: 'Address changed',
      status: 'Success',
      date: '2024-06-08',
      icon: '/contact.png',
      color: 'text-blue-600',
    },
    {
      type: 'transaction',
      title: 'Bill Paid',
      subtitle: 'Electricity Bill',
      amount: '-₹3,000.00',
      date: '2024-06-07',
      icon: '/bills.png',
      color: 'text-red-600',
    },
    {
      type: 'update',
      title: 'Card Activated',
      subtitle: 'HDFC Credit Card',
      status: 'Activated',
      date: '2024-06-06',
      icon: '/hdfc.png',
      color: 'text-green-600',
    },
  ];

  return (
    <Layout contentRef={contentRef}>
      <div className="w-full text-left flex flex-col text-black mt-5">
        <div className="font-bold text-xl">Welcome, Suraj!</div>
        <div className="text-sm mt-5">Your Balance</div>
        <div className="text-6xl font-bold">69,420.00</div>
      </div>

      <div className="mt-5 w-full">
        <input
          placeholder="Search...."
          value={a}
          onChange={handleSearchInput}
          className="w-full bg-white rounded-md shadow-md p-2"
          style={{ color: 'black' }}
        />
      </div>

      {/* Security Testing Section */}
      <div className="mt-5 w-full bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="text-black font-semibold mb-3">🛡️ Security Monitoring Demo</div>
        <div className="text-sm text-gray-600 mb-4">
          Simulate different risk scenarios to test the behavioral monitoring system:
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button
            className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600"
            onClick={() => {
              // Simulate medium risk by sending fake WebSocket message
              send({
                type: 'test_alert',
                user_id: userId,
                behavioral_alert: {
                  type: 'behavioral_alert',
                  score: 0.65,
                  model: 'typing',
                  severity: 'medium',
                  message: 'Simulated medium risk - unusual typing pattern detected',
                  timestamp: Date.now()
                }
              });
            }}
          >
            🟡 Test Medium Risk (Security Questions)
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
            onClick={() => {
              // Simulate high risk by sending fake WebSocket message
              send({
                type: 'test_alert',
                user_id: userId,
                behavioral_alert: {
                  type: 'behavioral_alert',
                  score: 0.95,
                  model: 'tap',
                  severity: 'high',
                  message: 'Simulated high risk - suspicious tap behavior detected',
                  timestamp: Date.now()
                }
              });
            }}
          >
            🔴 Test High Risk (Force Logout)
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded text-sm hover:bg-green-600"
            onClick={() => {
              send({
                type: 'test_alert',
                user_id: userId,
                behavioral_alert: {
                  type: 'behavioral_alert',
                  score: 0.25,
                  model: 'swipe',
                  severity: 'low',
                  message: 'Normal behavior - no action needed',
                  timestamp: Date.now()
                }
              });
            }}
          >
            🟢 Test Low Risk (No Action)
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-3">
          Note: These are simulated alerts for demonstration purposes only.
        </div>
      </div>

      <div className="mt-5 w-full">
        <div className="text-black">Quick Actions</div>
        <div className="mt-2 w-full grid grid-cols-2 grid-rows-2 gap-4 rounded-md">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              name={action.name}
              Icon={action.Icon}
              onClick={action.onClick}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 w-full">
        <div className="text-black w-full font-semibold text-lg mb-2">Recent Actions</div>
        <div className="flex flex-col gap-3">
          {recentActions.map((action, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow flex items-center gap-4 p-4 hover:shadow-lg transition cursor-pointer border border-gray-100"
              onClick={() => handleButtonClick(action.title)}
            >
              <img src={action.icon} alt="icon" className="h-12 w-12 rounded-md object-contain bg-gray-50" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-black truncate">{action.title}</div>
                  {action.amount && (
                    <div className={`font-bold text-lg ml-2 ${action.color}`}>{action.amount}</div>
                  )}
                  {action.status && (
                    <div className={`font-semibold ml-2 px-2 py-1 rounded ${action.color} bg-blue-50 text-xs`}>
                      {action.status}
                    </div>
                  )}
                </div>
                <div className="text-gray-500 text-sm truncate">{action.subtitle}</div>
                <div className="text-gray-400 text-xs mt-1">{action.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
