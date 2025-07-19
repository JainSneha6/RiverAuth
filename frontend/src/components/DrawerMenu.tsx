import {
  IonMenu,
  IonIcon,
} from '@ionic/react';
import { home, person, card, swapHorizontal, logOut } from 'ionicons/icons';
import React from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Props = {}

const DrawerMenu = (props: Props) => {
  const history = useHistory();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigateTo = (path: string) => {
    history.push(path);
    // Close the menu
    (document.querySelector('ion-menu') as any)?.close();
  };

  return (
    <IonMenu side="start" menuId="main-menu" contentId="main-content">
      <div className='bg-white h-screen flex flex-col justify-between p-5'>

        {/* Top Profile Section */}
        <div>
          <div className='flex flex-col justify-start items-center gap-2'>
            <div className='w-12 h-12 bg-yellow-300 rounded-full'></div>
            <div className='text-black font-bold text-xl'>{user?.first_name} {user?.last_name}</div>
          </div>

          {/* Menu Items */}
          <div className='w-full flex flex-col mt-5'>

            <div className='text-black text-sm text-left border border-gray-200 rounded-md shadow-md p-3 my-1 flex items-center gap-3'>
              <IonIcon icon={person} className="text-blue-600 text-xl" />
              <button onClick={() => navigateTo('/profile')}>Profile</button>
            </div>

            <div className='text-black text-sm text-left border border-gray-200 rounded-md shadow-md p-3 my-1 flex items-center gap-3'>
              <IonIcon icon={home} className="text-blue-600 text-xl" />
              <button onClick={() => navigateTo('/dashboard')}>Dashboard</button>
            </div>

            <div className='text-black text-sm text-left border border-gray-200 rounded-md shadow-md p-3 my-1 flex items-center gap-3'>
              <IonIcon icon={card} className="text-blue-600 text-xl" />
              <button onClick={() => navigateTo('/pay-bills')}>Pay Bills</button>
            </div>

            <div className='text-black text-sm text-left border border-gray-200 rounded-md shadow-md p-3 my-1 flex items-center gap-3'>
              <IonIcon icon={swapHorizontal} className="text-blue-600 text-xl" />
              <button onClick={() => navigateTo('/transfer-funds')}>Transfer Funds</button>
            </div>

          </div>
        </div>

        {/* Logout Section */}
        <div>
          <div className='bg-red-400 p-2 rounded-md flex items-center gap-3 cursor-pointer hover:bg-red-500 transition-colors'>
            <IonIcon icon={logOut} className="text-white text-xl" />
            <button 
              onClick={handleLogout}
              className='w-full text-white font-bold text-sm text-left'
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </IonMenu>
  );
}

export default DrawerMenu;
