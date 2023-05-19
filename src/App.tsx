import { useEffect, useState } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonPage, IonMenuToggle, IonLabel, IonRouterOutlet, setupIonicReact, IonButton, IonIcon, IonTabBar, IonTabButton, IonText, IonFooter, IonFabButton, IonFab, IonChip, IonPopover, IonCard } from '@ionic/react';
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
import SetUsername from './components/set-username';
import Notifications from './pages/Notifications';
import CreateOrganization from './pages/CreateOrganization';
import CreateBikeBusGroup from './pages/CreateBikeBusGroup';

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
import { mapOutline, bicycleOutline } from 'ionicons/icons';

setupIonicReact();

type Group = {
  id: number;
  BikeBusName: string;
}

const App: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const { fetchedGroups, loading: loadingGroups, error } = useBikeBusGroup();
  const [showPopover, setShowPopover] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  console.log('loadingGroups:', loadingGroups);
  console.log('fetchGroups:', fetchedGroups);

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
                <IonTitle class="BikeBusFont">Menu</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonList>
                <IonMenuToggle auto-hide="false">
                  <IonCard>
                    <IonLabel>Bike Bus You Belong To</IonLabel>
                    {fetchedGroups ? fetchedGroups.map((group: any) => (
                      <IonItem key={group.id} button routerLink={`/bikebusgrouppage/${group.id}`} routerDirection="none">
                        <IonLabel class="BikeBusFont">{group.BikeBusName}</IonLabel>
                      </IonItem>
                    )) : <p>Loading groups...</p>}
                  </IonCard>
                  <IonCard>
                    <IonLabel>Basic User Functions</IonLabel>
                    <IonItem button routerLink='/SearchForRoute' routerDirection="none">
                      <IonLabel>Search for Route by geolocation</IonLabel>
                    </IonItem>
                    <IonText>Search for a route by name</IonText>
                    <IonText>Start a Ride</IonText>
                    <IonText>Get Directions</IonText>
                    <IonText>View Route</IonText>
                    <IonText>View BikeBusGroup</IonText>
                    <IonText>View BikeBusStation</IonText>
                    <IonText>Create Route</IonText>
                    <IonText>Create BikeBusGroup</IonText>
                  </IonCard>
                  <IonCard>
                    <IonLabel>Premium User Functions</IonLabel>
                    <IonText>Add a Kid -as a premium user and converts to parent account type</IonText>
                    <IonText>Check In a Kid to a BikeBus</IonText>
                  </IonCard>
                  <IonCard>
                    <IonLabel>BikeBus Leader Functions</IonLabel>
                    <IonText>Check In a Kid to a BikeBus</IonText>
                    <IonText>Finish a BikeBusGroup ride - end ride for all</IonText>
                  </IonCard>
                  <IonCard>
                    <IonLabel>Org Admin Functions</IonLabel>
                  </IonCard>
                  <IonCard>
                    <IonLabel>App Admin Functions</IonLabel>
                    <IonItem button routerLink="/CreateOrganization" routerDirection="none">
                      <IonLabel>Create Organization</IonLabel>
                    </IonItem>
                    <IonText>Update Users' Data</IonText>
                    <IonText>Update Organizational Data</IonText>
                    <IonText>Update BikeBusGroup Data</IonText>
                    <IonText>Update Route Data</IonText>
                    <IonText>Update BikeBusStation Data</IonText>
                    <IonText></IonText>
                  </IonCard>
                  <IonItem button routerLink="/about" routerDirection="none">
                    <IonLabel>About</IonLabel>
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
                <Route exact path="/SetUsername">
                  <SetUsername />
                </Route>
                <Route exact path="/Map">
                  <Map />
                </Route>
                <Route exact path="/SearchForRoute">
                  <SearchForRoute />
                </Route>
                <Route exact path="/CreateOrganization">
                  <CreateOrganization />
                </Route>
                <Route exact path="/CreateBikeBusGroup">
                  <CreateBikeBusGroup />
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
                <Route exact path="/notifications">
                  <Notifications />
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
          <IonFab vertical="bottom" horizontal="start" slot="fixed">
            <IonFabButton routerLink="/Map" routerDirection="none">
              <IonIcon icon={mapOutline} />
            </IonFabButton>
          </IonFab>
          <div className='bikebusname-button-container'>
            {fetchedGroups ? fetchedGroups.map((group: any) => (
              <IonButton shape="round" key={group.id} routerLink={`/bikebusgrouppage/${group.id}`} routerDirection="none">
                <IonText class="BikeBusFont">{group.BikeBusName}</IonText>
              </IonButton>
            )) : <p>Loading groups...</p>}
          </div>

        </React.Fragment>
      </IonReactRouter>
    </IonApp >
  );
};

export default App;
