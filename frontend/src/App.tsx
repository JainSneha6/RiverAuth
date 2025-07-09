import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
  IonMenu,
  IonContent as IonMenuContent,
  IonList,
  IonItem,
  IonMenuToggle,
  IonIcon
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { menu, home, person, card, swapHorizontal } from 'ionicons/icons';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark mode (optional) */
// import '@ionic/react/css/palettes/dark.always.css';
// import '@ionic/react/css/palettes/dark.class.css';
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import Signup2 from './pages/Signup2';
import Signup3 from './pages/Signup3';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PayBillsPage from './pages/PayBillsPage';
import TransferFundsPage from './pages/TransferFundsPage';
import { WebSocketProvider } from './hooks/useWebSocketContext';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';

setupIonicReact();

const App: React.FC = () => (
  <WebSocketProvider url="ws://localhost:8081">
  <IonApp>
    {/* Side Drawer Menu */}
    <IonMenu side="start" menuId="main-menu" contentId="main-content" className="custom-menu">
      <IonMenuContent className="bg-white border-r border-gray-200">
        <div className="bg-white px-6 py-5 border-b border-gray-200">
          <div className="text-2xl font-bold text-blue-600 tracking-tight">RiverAuth</div>
        </div>
        <IonList >
          <IonMenuToggle autoHide={false}>
            <IonItem button routerLink="/dashboard" className='bg-white'>
              <IonIcon icon={home} slot="start" className="text-xl text-blue-600" />
              Dashboard
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle autoHide={false}>
            <IonItem button routerLink="/profile">
              <IonIcon icon={person} slot="start" className="text-xl text-blue-600" />
              Profile
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle autoHide={false}>
            <IonItem button routerLink="/pay-bills">
              <IonIcon icon={card} slot="start" className="text-xl text-blue-600" />
              Pay Bills
            </IonItem>
          </IonMenuToggle>
          <IonMenuToggle autoHide={false}>
            <IonItem button routerLink="/transfer-funds">
              <IonIcon icon={swapHorizontal} slot="start" className="text-xl text-blue-600" />
              Transfer Funds
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonMenuContent>
    </IonMenu>
    <IonReactRouter>
      <IonRouterOutlet>

        <Route exact path="/login">
          <LoginPage />
        </Route>

        <Route exact path="/signup2">
          <Signup2 />
        </Route>

        <Route exact path="/signup3">
          <Signup3 />
        </Route>

        <Route exact path="/profile">
          <ProfilePage />
        </Route>

        <Route exact path="/pay-bills">
          <PayBillsPage />
        </Route>

        <Route exact path="/dashboard">
          <DashboardPage />
        </Route>

        <Route exact path="/transfer-funds">
          <TransferFundsPage />
        </Route>

        <Route exact path="/">
          <Redirect to="/dashboard" />
        </Route>

        <Route exact path="/onboarding-questions">
          <OnboardingPage />
        </Route>

      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
  </WebSocketProvider>
);

export default App;
