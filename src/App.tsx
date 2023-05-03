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
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabButton,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { bicycleOutline, megaphoneOutline, peopleOutline } from 'ionicons/icons';
import BikeBusMember from './pages/BikeBusMember';
import BikeBusLeader from './pages/BikeBusLeader';
import BikeBusParent from './pages/BikeBusParent';
import Login from './pages/Login';
import Profile from './components/Profile';
import Logout from './components/Logout';
import Register from './pages/Register';


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
                <IonItem button routerLink="/profile" routerDirection="none">
                  <IonLabel>Profile</IonLabel>
                </IonItem>
                <IonItem button routerLink="/Login" routerDirection="none">
                  <IonLabel>Login</IonLabel>
                </IonItem>
                <IonItem button routerLink="/register" routerDirection="none">
                  <IonLabel>Register</IonLabel>
                </IonItem>
                <IonItem button routerLink="/logout" routerDirection="none">
                  <IonLabel>Logout</IonLabel>
                </IonItem>
                <IonLabel>Map Mode</IonLabel>
                    <IonItem button routerLink="/BikeBusMember" routerDirection="none">
                      <IonTabButton tab="bikebusmember" href="/bikebusmember">
                        <IonIcon aria-hidden="true" icon={bicycleOutline} />
                        <IonLabel>Member</IonLabel>
                      </IonTabButton>
                    </IonItem>
                    <IonItem button routerLink="/BikeBusLeader" routerDirection="none">
                      <IonTabButton tab="bikebusleader" href="/bikebusleader">
                        <IonIcon aria-hidden="true" icon={megaphoneOutline} />
                        <IonLabel>Leader</IonLabel>
                      </IonTabButton>
                    </IonItem>
                    <IonItem button routerLink="/BikeBusParent" routerDirection="none">
                      <IonTabButton tab="bikebusparent" href="/bikebusparent">
                        <IonIcon aria-hidden="true" icon={peopleOutline} />
                        <IonLabel>Parent</IonLabel>
                      </IonTabButton>
                    </IonItem>
                <IonItem button routerLink="/help" routerDirection="none">
                  <IonLabel>Help</IonLabel>
                </IonItem>
                <IonItem button routerLink="/about" routerDirection="none">
                  <IonLabel>About</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </IonList>
          </IonContent>
        </IonMenu>
        <IonPage id="main-content">
          <IonRouterOutlet>
            <Route exact path="/Profile">
              <Profile />
            </Route>
            <Route exact path="/Login">
              <Login />
            </Route>
            <Route exact path="/Register">
              <Register />
            </Route>
            <Route exact path="/Logout">
              <Logout />
            </Route>
            <Route exact path="/BikeBusMember">
              <BikeBusMember />
            </Route>
            <Route exact path="/BikeBusLeader">
              <BikeBusLeader />
            </Route>
            <Route path="/BikeBusParent">
              <BikeBusParent />
            </Route>
            <Route exact path="/">
              <Redirect to="/Login" />
            </Route>
          </IonRouterOutlet>
        </IonPage>
      </React.Fragment>
    </IonReactRouter>
  </IonApp >
);

export default App;
