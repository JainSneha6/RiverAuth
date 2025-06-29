import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonLabel,
  IonButton,
  IonToast,
  IonIcon,
  IonText,
} from '@ionic/react';
import { personAdd, lockClosed, mail } from 'ionicons/icons';
import { useState } from 'react';
import { menu } from 'ionicons/icons';
import TopMenu from '../components/TopMenu';
import Layout from '../components/Layout';


const DashboardPage: React.FC = () => {

return (
    <Layout>

                <div className='w-full text-left flex flex-col text-black mt-5'>
                    <div className='font-bold text-xl'>Welcome, Suraj!</div>
                    <div className='text-sm mt-5'>Your Balance</div>
                    <div className='text-6xl font-bold'>69,420.00</div>
                </div>

                <div className='mt-5'>
                    <div className='text-black'>Quick Actions</div>
                    <div className='mt-2 w-full grid grid-cols-3 grid-rows-2 gap-2'>
                        <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
                            <img src="/sheets of documents.png" alt="Transfer" className="h-24 w-24 mb-2" />
                            <span className="text-sm font-medium text-gray-800">Documents</span>
                        </button>

                        <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
                            <img src="/credit cards.png" alt="Transfer" className="h-24 w-auto mb-2" />
                            <span className="text-sm font-medium text-gray-800">Cards</span>
                        </button>

                        <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
                            <img src="/bills.png" alt="Transfer" className="h-24 w-24 mb-2" />
                            <span className="text-sm font-medium text-gray-800">Pay Bills</span>
                        </button>

                        <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
                            <img src="/contact.png" alt="Transfer" className="h-24 w-24 mb-2" />
                            <span className="text-sm font-medium text-gray-800">Contact Us</span>
                        </button>
                                                
                        <button className="bg-white h-36 w-36 rounded-md flex flex-col items-center justify-center shadow-md">
                            <img src="/security configuration.png" alt="Transfer" className="h-24 w-24 mb-2" />
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
)

};

export default DashboardPage;

