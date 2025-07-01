import { useState, useRef, useEffect } from 'react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking'; // Adjust path as needed

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

const DashboardPage: React.FC = () => {
  const contentRef = useRef<IonContentElement>(null);

  const [send, setSend] = useState<(payload: unknown) => void>(() => () => {});

  useEffect(() => {
    const ws = new WebSocket('ws://your-websocket-url'); 

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
  console.log(taps)

  return (
    <Layout contentRef={contentRef}>
      <div className="w-full text-left flex flex-col text-black mt-5">
        <div className="font-bold text-xl">Welcome, Suraj!</div>
        <div className="text-sm mt-5">Your Balance</div>
        <div className="text-6xl font-bold">69,420.00</div>
      </div>

      <div className="mt-5">
        <div className="text-black">Quick Actions</div>
        <div className="mt-2 w-full grid grid-cols-3 grid-rows-2 gap-2">
          <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
            <img src="/sheets of documents.png" alt="Documents" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Documents</span>
          </button>
          <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
            <img src="/credit cards.png" alt="Cards" className="h-24 w-auto mb-2" />
            <span className="text-sm font-medium text-gray-800">Cards</span>
          </button>
          <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
            <img src="/bills.png" alt="Pay Bills" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Pay Bills</span>
          </button>
          <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
            <img src="/contact.png" alt="Contact" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Contact Us</span>
          </button>
          <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
            <img src="/security configuration.png" alt="Security" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Security Questions</span>
          </button>
          <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
            <img src="/money and phone.png" alt="Transfer" className="h-24 w-24 mb-2" />
            <span className="text-sm font-medium text-gray-800">Transfer Funds</span>
          </button>
        </div>
      </div>

      <div className='mt-5 w-full'>
        <div className='text-black w-full'>Recent Actions</div>
            <button className='bg-white h-12 w-full my-2 rounded-md'>ssd</button>
            <button className='bg-white h-12 w-full my-2 rounded-md'>ssd</button>
            <button className='bg-white h-12 w-full my-2 rounded-md'>ssd</button>
            <button className='bg-white h-12 w-full my-2 rounded-md'>ssd</button>
      </div>
    </Layout>
  );
};

export default DashboardPage;