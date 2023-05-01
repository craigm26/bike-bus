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
  IonMenuToggle,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { ellipse, square, triangle } from 'ionicons/icons';
import BikeBusMember from './pages/BikeBusMember';
import BikeBusLeader from './pages/BikeBusLeader';
import CarDriver from './pages/CarDriver';

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
                <IonItem button routerLink="/your-page-1" routerDirection="none">
                  <IonLabel>Your Page 1</IonLabel>
                </IonItem>
                <IonItem button routerLink="/your-page-2" routerDirection="none">
                  <IonLabel>Your Page 2</IonLabel>
                </IonItem>
              </IonMenuToggle>
            </IonList>
          </IonContent>
        </IonMenu>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/BikeBusMember">
              <BikeBusMember />
            </Route>
            <Route exact path="/BikeBusLeader">
              <BikeBusLeader />
            </Route>
            <Route path="/CarDriver">
              <CarDriver />
            </Route>
            <Route exact path="/">
              <Redirect to="/BikeBusMember" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="bikebusmember" href="/bikebusmember">
              <IonIcon aria-hidden="true" icon={triangle} />
              <IonLabel>BikeBus Member</IonLabel>
            </IonTabButton>
            <IonTabButton tab="bikebusleader" href="/bikebusleader">
              <IonIcon aria-hidden="true" icon={ellipse} />
              <IonLabel>BikeBus Leader</IonLabel>
            </IonTabButton>
            <IonTabButton tab="cardriver" href="/cardriver">
              <IonIcon aria-hidden="true" icon={square} />
              <IonLabel>Car Driver</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </React.Fragment>
    </IonReactRouter>
  </IonApp >
);

export default App;
