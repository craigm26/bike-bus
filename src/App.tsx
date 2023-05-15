import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonPage,
  IonMenuToggle,
  IonLabel,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Map from './pages/Map';
import Login from './pages/Login';
import Profile from './components/Profile';
import Logout from './components/Logout';
import SignUp from './pages/SignUp';
import Help from './pages/Help';
import About from './pages/About';
import Account from './pages/Account';
import Welcome from './pages/Welcome';
import BikeBusGroupPage from './pages/BikeBusGroupPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import React from 'react';
import Settings from './pages/Settings';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <React.Fragment>
        <IonMenu side="start" content-id="main-content">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Menu</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              <IonMenuToggle auto-hide="false">
                <IonItem button routerLink="/Map" routerDirection="none">
                  <IonLabel>Map</IonLabel>
                </IonItem>
                <IonItem button routerLink="/help" routerDirection="none">
                  <IonLabel>Help</IonLabel>
                </IonItem>
                <IonItem button routerLink="/about" routerDirection="none">
                  <IonLabel>About</IonLabel>
                </IonItem>
                <IonItem button routerLink="/settings" routerDirection="none">
                  <IonLabel>Settings</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </IonList>
          </IonContent>
        </IonMenu>
        <IonPage id="main-content">
          <IonRouterOutlet>
            <Route path="/bikebusgrouppage/:groupId" component={BikeBusGroupPage} />
            <BikeBusGroupPage />
            <Route exact path="/Profile">
              <Profile />
            </Route>
            <Route exact path="/Account">
              <Account />
            </Route>
            <Route exact path="/Map">
              <Map />
            </Route>
            <Route exact path="/Login">
              <Login />
            </Route>
            <Route exact path="/SignUp">
              <SignUp />
            </Route>
            <Route exact path="/Logout">
              <Logout />
            </Route>
            <Route exact path="/help">
              <Help />
            </Route>
            <Route exact path="/about">
              <About />
            </Route>
            <Route exact path="/settings">
              <Settings />
            </Route>
            <Route exact path="/Welcome">
              <Welcome />
            </Route>
            <Route exact path="/">
              <Redirect to="/Welcome" />
            </Route>
          </IonRouterOutlet>
        </IonPage>
      </React.Fragment>
    </IonReactRouter>
  </IonApp >
);

export default App;
