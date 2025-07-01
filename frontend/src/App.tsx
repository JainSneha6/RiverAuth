import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Signup from './pages/Signup'; // make sure this path is correct

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
import Signup2 from './pages/LoginPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PayBillsPage from './pages/PayBillsPage';
import TransferFundsPage from './pages/TransferFundsPage';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>

        <Route exact path="/login">
          <LoginPage />
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

      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
