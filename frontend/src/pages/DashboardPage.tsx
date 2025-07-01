import { useRef } from 'react';
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
            onClick={() => handleButtonClick('Pay Bills')}
          >
            <img src="/bills.png" alt="Pay Bills" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Pay Bills</span>
          </button>
          <button 
            className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md"
            onClick={() => handleButtonClick('Contact Us')}
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
            onClick={() => handleButtonClick('Transfer Funds')}
          >
            <img src="/money and phone.png" alt="Transfer" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Transfer Funds</span>
          </button>
        </div>
      </div>

      <div className='mt-5 w-full'>
        <div className='text-black w-full'>Recent Actions</div>
        <button 
          className='bg-white h-12 w-full my-2 rounded-md'
          onClick={() => handleButtonClick('Recent Action 1')}
        >
          Recent Transaction #1
        </button>
        <button 
          className='bg-white h-12 w-full my-2 rounded-md'
          onClick={() => handleButtonClick('Recent Action 2')}
        >
          Recent Transaction #2
        </button>
        <button 
          className='bg-white h-12 w-full my-2 rounded-md'
          onClick={() => handleButtonClick('Recent Action 3')}
        >
          Recent Transaction #3
        </button>
        <button 
          className='bg-white h-12 w-full my-2 rounded-md'
          onClick={() => handleButtonClick('Recent Action 4')}
        >
          Recent Transaction #4
        </button>
      </div>
    </Layout>
  );
};

export default DashboardPage;