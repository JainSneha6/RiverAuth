import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { useGestureTracking } from '../hooks/useGestureTracking';
import {
  CreditCard,
  Zap,
  Tv,
  Wifi,
  Smartphone,
  ShieldCheck,
  Flame,
  Droplet,
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useDeviceTracking } from '../hooks/useDeviceTracking';
import { useGeolocationTracking } from '../hooks/useGeolocationTracking';

type QuickActionItem = {
  label: string;
  amount: string;
  detailLabel: string;
  detailValue: string;
  icon?: string;
};

const quickActions: QuickActionItem[] = [
  {
    label: 'Tata Sky',
    amount: '₹350',
    detailLabel: 'Subscriber ID:',
    detailValue: '1023456789',
    icon: '/icons/tata-sky.png',
  },
  {
    label: 'Airtel Mobile',
    amount: '₹199',
    detailLabel: 'Phone No:',
    detailValue: '9876543210',
    icon: '/icons/airtel.png',
  },
  {
    label: 'BSNL Landline',
    amount: '₹450',
    detailLabel: 'Phone No:',
    detailValue: '044-23456789',
    icon: '/icons/bsnl.png',
  },
  {
    label: 'BESCOM Electricity',
    amount: '₹1200',
    detailLabel: 'Account No:',
    detailValue: '450002312',
    icon: '/icons/electricity.png',
  },
  {
    label: 'ACT Fibernet',
    amount: '₹999',
    detailLabel: 'Customer ID:',
    detailValue: 'ACT123456',
    icon: '/icons/act.png',
  },
  {
    label: 'DTH Videocon',
    amount: '₹300',
    detailLabel: 'Subscriber ID:',
    detailValue: 'VID987654',
    icon: '/icons/videocon.png',
  },
];


const savedPayees = [
  { label: 'Reliance Jio', icon: '/Jiopng.png' },
  { label: 'Tata Power', icon: '/tata.png' },
  { label: 'HDFC Bank', icon: '/hdfc.png' },
  { label: 'Amazon Pay', icon: '/amazon_pay.png' },
  { label: 'Paytm Insurance', icon: '/paytm.webp' },
];

const addPayeeOptions = [
  { label: 'Cards', icon: CreditCard },
  { label: 'Electricity', icon: Zap },
  { label: 'TV/DTH', icon: Tv },
  { label: 'WiFi', icon: Wifi },
  { label: 'Mobile Recharge', icon: Smartphone },
  { label: 'Insurance', icon: ShieldCheck },
  { label: 'Gas', icon: Flame },
  { label: 'Water', icon: Droplet },
];

interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

type Props = {
  recipient: string,
  amount: string,
  detail: string
}

function QuickPayCard({ recipient, amount, detail }: Props) {
  return (
    <div

      className="flex-shrink-0 bg-white h-48 w-48 rounded-lg border border-gray-300
                flex flex-col  justify-between text-left p-4 shadow-md"
    >
      <span className="text-sm font-semibold text-gray-800">{recipient}</span>
      <span className="text-4xl font-bold text-green-600">{amount}</span>
      <span className="text-xs text-gray-600">{detail}</span>
    </div>
  )
}

const PayBillsPage: React.FC = () => {

  const contentRef = useRef<IonContentElement>(null);

  const { send, isConnected, error } = useWebSocket('ws://localhost:8081'); 
  const { taps } = useGestureTracking(contentRef, send);
  const { deviceInfo } = useDeviceTracking(send, isConnected);
  const { pendingGeoData, pendingIpData } = useGeolocationTracking(send, isConnected);

  return (
    <Layout contentRef={contentRef}>
      <div className="mt-5 w-full text-2xl font-bold text-black">Pay Bills</div>

      <div className="mt-5 w-full">
        <div className="text-black text-lg font-medium mb-2">Quick Pay</div>
        <div className="w-full overflow-x-auto">
          <div className="flex space-x-4 w-max">
            {quickActions.map((item, idx) => (
              <QuickPayCard
                key={idx}
                recipient={item.label}
                amount={item.amount}
                detail={`${item.detailLabel} ${item.detailValue}`}
              />
            ))}
          </div>

        </div>
      </div>

      <div className="mt-8 w-full">
        <div className="text-black text-lg font-medium mb-2">Saved</div>
        <div className="w-full overflow-x-auto">
          <div className="flex space-x-6 w-max">
            {savedPayees.map(({ label, icon }, idx) => (
              <div key={idx} className="flex-shrink-0 flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-white border border-gray-300
                                flex items-center justify-center shadow-sm overflow-hidden">
                  {icon ? (
                    <img src={icon} alt={label} className="h-10 w-10 object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm">{label.charAt(0)}</span>
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-800 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 w-full">
        <div className="text-black text-lg font-medium mb-2">Add Payee</div>
        <div className="grid grid-cols-4 gap-4">
          {addPayeeOptions.map(({ label, icon: Icon }, idx) => (
            <div
              key={idx}
              className=" bg-white w-full h-24 rounded-lg border border-gray-300
               flex flex-col items-center justify-center p-2 shadow-md text-center"
            >
              <Icon className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-xs font-medium text-gray-700">{label}</span>
            </div>
          ))}

        </div>
      </div>
    </Layout>
  );
};

export default PayBillsPage;
