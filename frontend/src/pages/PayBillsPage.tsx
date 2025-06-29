// src/pages/PayBillsPage.tsx
import React from 'react';
import Layout from '../components/Layout';

interface ActionItem {
  label: string;
  icon?: string; // path under /public/icons/
}

/* ── Data ──────────────────────────────────────────────────────────────────────── */
const quickActions: ActionItem[] = [
  { label: 'Pay A', icon: '/icons/icon-a.png' },
  { label: 'Pay B', icon: '/icons/icon-b.png' },
  { label: 'Pay C', icon: '/icons/icon-c.png' },
  { label: 'Pay D', icon: '/icons/icon-d.png' },
  { label: 'Pay E', icon: '/icons/icon-e.png' },
  { label: 'Pay F', icon: '/icons/icon-f.png' },
];

const savedPayees: ActionItem[] = [
  { label: 'Suraj', icon: '/icons/profile-a.png' },
  { label: 'Anita', icon: '/icons/profile-b.png' },
  { label: 'Ravi',  icon: '/icons/profile-c.png' },
  { label: 'Priya', icon: '/icons/profile-d.png' },
  { label: 'Vikas', icon: '/icons/profile-e.png' },
];

const addPayeeOptions: ActionItem[] = [
  { label: 'Cards',            icon: '/icons/cards.png' },
  { label: 'Electricity',      icon: '/icons/electricity.png' },
  { label: 'TV/DTH',           icon: '/icons/tv.png' },
  { label: 'WiFi',             icon: '/icons/wifi.png' },
  { label: 'Mobile Recharge',  icon: '/icons/mobile.png' },
  { label: 'Insurance',        icon: '/icons/insurance.png' },
  { label: 'Gas',              icon: '/icons/gas.png' },
  { label: 'Water',            icon: '/icons/water.png' },
];

/* ── Page ──────────────────────────────────────────────────────────────────────── */
const PayBillsPage: React.FC = () => {
  return (
    <Layout background="bg-white">
      {/* Title */}
      <div className="mt-5 w-full text-2xl font-bold text-black">Pay Bills</div>

      {/* ── Quick Pay ─────────────────────────────────────────────────────────── */}
      <div className="mt-5 w-full">
        <div className="text-black text-lg font-medium mb-2">Quick Pay</div>
        <div className="w-full overflow-x-auto">
          <div className="flex space-x-4 w-max">
            {quickActions.map(({ label, icon }, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 bg-white h-48 w-48 rounded-lg border border-gray-300
                           flex flex-col items-center justify-center text-center shadow-md"
              >
                {icon && (
                  <img src={icon} alt={label} className="h-10 w-10 mb-2" />
                )}
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Saved Payees ──────────────────────────────────────────────────────── */}
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

      {/* ── Add Payee ─────────────────────────────────────────────────────────── */}
      <div className="mt-8 w-full">
        <div className="text-black text-lg font-medium mb-2">Add Payee</div>
        <div className="grid grid-cols-4 gap-4">
          {addPayeeOptions.map(({ label, icon }, idx) => (
            <div
              key={idx}
              className="aspect-square rounded-lg bg-white border border-gray-300
                         flex flex-col items-center justify-center text-center shadow-sm"
            >
              {icon && (
                <img src={icon} alt={label} className="h-6 w-6 mb-2" />
              )}
              <span className="text-xs font-medium text-gray-700 px-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PayBillsPage;
