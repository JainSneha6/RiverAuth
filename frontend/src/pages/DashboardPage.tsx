import { useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking'; 
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useWebSocket } from '../hooks/useWebSocket';

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const DashboardPage: React.FC = () => {
  const contentRef = useRef<IonContentElement>(null);
  const history = useHistory();

  // Use the global WebSocket hook
  const { send, isConnected, error } = useWebSocket('ws://localhost:8081'); 

  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send);
  console.log(deviceInfo);

  // Function to handle button clicks and send data to WebSocket
  const handleButtonClick = (buttonName: string) => {
    const buttonData = {
      type: 'button_click',
      timestamp: Date.now(),
      button: buttonName,
      page: 'DashboardPage',
      userAgent: navigator.userAgent
    };
    send(buttonData);
    console.log(`Button clicked: ${buttonName}`, buttonData);
  };

  // Dummy recent actions data
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
      {/* Connection Status */}
      <div className={`mb-4 p-2 rounded text-center text-sm ${
        isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        WebSocket: {isConnected ? '✅ Connected' : '❌ Disconnected'}
        {error && <div className="text-red-600">Error: {error}</div>}
      </div>

      <div className="w-full text-left flex flex-col text-black mt-5">
        <div className="font-bold text-xl">Welcome, Suraj!</div>
        <div className="text-sm mt-5">Your Balance</div>
        <div className="text-6xl font-bold">69,420.00</div>
      </div>

      <div className="mt-5">
        <div className="text-black">Quick Actions</div>
        <div className="mt-2 w-full grid grid-cols-3 grid-rows-2 gap-2">
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => handleButtonClick('Documents')}
          >
            <img src="/sheets of documents.png" alt="Documents" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Documents</span>
          </button>
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => handleButtonClick('Cards')}
          >
            <img src="/credit cards.png" alt="Cards" className="h-24 w-auto mb-2" />
            <span className="text-sm font-medium text-gray-800">Cards</span>
          </button>
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => { handleButtonClick('Pay Bills'); history.push('/pay-bills'); }}
          >
            <img src="/bills.png" alt="Pay Bills" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Pay Bills</span>
          </button>
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => { handleButtonClick('Contact Us'); history.push('/profile'); }}
          >
            <img src="/contact.png" alt="Contact" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Contact Us</span>
          </button>
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => handleButtonClick('Security Questions')}
          >
            <img src="/security configuration.png" alt="Security" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Security Questions</span>
          </button>
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => { handleButtonClick('Transfer Funds'); history.push('/transfer-funds'); }}
          >
            <img src="/money and phone.png" alt="Transfer" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Transfer Funds</span>
          </button>
        </div>
      </div>

      <div className='mt-5 w-full'>
        <div className='text-black w-full font-semibold text-lg mb-2'>Recent Actions</div>
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
                    <div className={`font-semibold ml-2 px-2 py-1 rounded ${action.color} bg-blue-50 text-xs`}>{action.status}</div>
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