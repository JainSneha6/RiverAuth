import { IonContent, IonPage } from '@ionic/react';
import React, { ReactNode } from 'react';
import TopMenu from './TopMenu';

// Custom interface for IonContent DOM element
interface IonContentElement extends HTMLElement {
  getScrollElement(): Promise<HTMLElement>;
  scrollToBottom(duration?: number): Promise<void>;
}

// Define the props interface, including contentRef
type Props = {
  background?: string; // Optional background prop
  children: ReactNode;
  contentRef?: React.RefObject<IonContentElement | null>; // Allow null to match useGestureTracking
};

const Layout: React.FC<Props> = ({ background, children, contentRef }) => {
  return (
    <IonPage className="h-full">
      <IonContent
        fullscreen
        ref={contentRef as any} // Type assertion to bypass HTMLIonContentElement mismatch
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