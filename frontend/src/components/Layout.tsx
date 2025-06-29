import { IonContent, IonPage } from '@ionic/react';
import React, { ReactNode } from 'react';
import TopMenu from './TopMenu';

type Props = {
  background?: string; // Optional if you want dynamic gradients later
  children: ReactNode;
};

const Layout: React.FC<Props> = ({ background, children }) => {
  return (
    <IonPage className="h-full">
      <IonContent
        fullscreen
        style={{ '--background': 'transparent' } as React.CSSProperties}
      >
        <div
          className={`min-h-full flex flex-col items-center
              ${background || 'bg-gradient-to-b from-white to-[#01A0E3]'}
              py-10 px-5`}
        >
          <TopMenu />
          {children}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Layout;
