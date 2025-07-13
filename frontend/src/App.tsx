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
import Signup4 from './pages/Signup4';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PayBillsPage from './pages/PayBillsPage';
import TransferFundsPage from './pages/TransferFundsPage';
import { WebSocketProvider } from './hooks/useWebSocketContext';
import { AuthProvider } from './contexts/AuthContext';
import ProfilePage from './pages/ProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import DrawerMenu from './components/DrawerMenu';
import ErrorBoundary from './components/ErrorBoundary';
import ScratchToRevealNumber from './pages/Captcha';

setupIonicReact();

const App: React.FC = () => (
  <ErrorBoundary>
    <AuthProvider>
      <WebSocketProvider url="ws://localhost:8081">
        <IonApp>
          {/* Side Drawer Menu */}
          <DrawerMenu />
          <IonReactRouter>
            <IonRouterOutlet>

            <Route exact path="/login">
              <LoginPage />
            </Route>

            <Route exact path="/captcha">
              <ScratchToRevealNumber/>
            </Route>

            <Route exact path="/signup2">
              <Signup2 />
            </Route>

            <Route exact path="/signup3">
              <Signup3 />
            </Route>

            <Route exact path="/signup4">
              <Signup4 />
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

            <Route exact path="/onboarding-questions">
              <OnboardingPage />
            </Route>

            <Route exact path="/">
              <Redirect to="/login" />
            </Route>

          </IonRouterOutlet>
        </IonReactRouter>
      </IonApp>
    </WebSocketProvider>
  </AuthProvider>
  </ErrorBoundary>
);

export default App;
