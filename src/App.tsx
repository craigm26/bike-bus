import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonPage, IonMenuToggle, IonLabel, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import useAuth from './useAuth';

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
import Settings from './pages/Settings';
import useBikeBusGroup from './components/useBikeBusGroup';
import UseRoutes from './components/useRoutes';
import ViewRoute from './pages/ViewRoute';
import SearchForRoute from './pages/SearchForRoute';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import React from 'react';

setupIonicReact();


const App: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const { fetchedGroups, loading: loadingGroups, error } = useBikeBusGroup();
  const routeId = "your-route-id"; // replace with the actual routeId
  const { fetchedRoutes } = UseRoutes({ routeId });

  console.log('loadingGroups:', loadingGroups);
  console.log('fetchGroups:', fetchedGroups);
  console.log('fetchedRoutes:', fetchedRoutes);

  useEffect(() => {
    if (user !== undefined && !loadingGroups) {
      setLoading(false);
    }
  }, [user, loadingGroups, error]);


  if (loading) {
    return <p>Loading...</p>; // Replace with a loading spinner if available
  }

  console.log('Loading fetchedGroups app.tsx', fetchedGroups);


  return (
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
                  {fetchedGroups ? fetchedGroups.map((group: any) => (
                    <IonItem key={group.id} button routerLink={`/bikebusgrouppage/${group.id}`} routerDirection="none">
                      <IonLabel>{group.BikeBusName}</IonLabel>
                    </IonItem>
                  )) : <p>Loading groups...</p>}
                  { fetchedRoutes ? fetchedRoutes.map((route: any) => (
                    <IonItem key={route.id} button routerLink={`/viewroute/${route.id}`} routerDirection="none">
                      <IonLabel>{route.name}</IonLabel>
                    </IonItem>
                  )) : <p>Loading routes...</p>}
                  <IonItem button routerLink="/Map" routerDirection="none">
                    <IonLabel>Map</IonLabel>
                  </IonItem>
                  <IonItem button routerLink='/SearchForRoute' routerDirection="none">
                    <IonLabel>Search for Route</IonLabel>
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
              <React.Fragment>
                <Route path="/bikebusgrouppage/:groupId" exact>
                  <BikeBusGroupPage />
                </Route>
                <Route path="/viewroute/:routeId" exact>
                  <ViewRoute />
                </Route>
                <Route exact path="/Profile">
                  <Profile />
                </Route>
                <Route exact path="/Account">
                  <Account />
                </Route>
                <Route exact path="/Map">
                  <Map />
                </Route>
                <Route exact path="/SearchForRoute">
                  <SearchForRoute />
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
              </React.Fragment>
            </IonRouterOutlet>
          </IonPage>
        </React.Fragment>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
