import { IonIcon } from '@ionic/react'
import React from 'react'
import { menu } from 'ionicons/icons';

const TopMenu = () => {
  return (
    <div className='flex justify-between border-black w-full text-black'>
      <IonIcon icon={menu} className="text-4xl text-black cursor-pointer" onClick={() => (document.querySelector('ion-menu') as any)?.open()} />
      <div className='h-12 w-12 bg-yellow-300 rounded-full'></div>
    </div>
  )
}

export default TopMenu