import { IonIcon } from '@ionic/react'
import React from 'react'
import { menu, logOut } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import banner from '../../public/Banner-nobg.png'

const TopMenu = () => {
  const history = useHistory();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className='flex justify-between items-center border-black w-full text-black'>
      <div className='grid grid-cols-3 gap-2 items-center'>
        <IonIcon 
          icon={menu} 
          className="text-4xl text-black cursor-pointer" 
          onClick={() => (document.querySelector('ion-menu') as any)?.open()} 
        />
        <img src={banner} className=''/>
      </div>
    </div>
  )
}

export default TopMenu