import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { IonApp, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonPage, IonMenuToggle, IonLabel, IonRouterOutlet, setupIonicReact, IonButton, IonIcon, IonText, IonFabButton, IonFab, IonCard, IonButtons, IonChip, IonMenuButton, IonPopover, IonAvatar, IonFooter } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import useAuth from './useAuth';
import { HeaderContext } from './components/HeaderContext';

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
import ViewRoute from './pages/ViewRoute';
import SearchForRoute from './pages/SearchForRoute';
import SetUsername from './components/set-username';
import Notifications from './pages/Notifications';
import CreateOrganization from './pages/CreateOrganization';
import CreateBikeBusGroup from './pages/CreateBikeBusGroup';
import CreateBikeBusStation from './pages/CreateBikeBusStations';
import CreateRoute from './pages/CreateRoute';
import UpgradeAccountToPremium from './pages/UpgradeAccountToPremium';

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
import { alertCircleOutline, cogOutline, compassOutline, helpCircleOutline, mapOutline, personCircleOutline } from 'ionicons/icons';
import Avatar from './components/Avatar';
import { useAvatar } from './components/useAvatar';


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
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const [showHeader, setShowHeader] = useState(true);




  console.log('loadingGroups:', loadingGroups);
  console.log('fetchGroups:', fetchedGroups);

  useEffect(() => {
    if (user !== undefined && !loadingGroups) {
      setLoading(false);
    }
  }, [user, loadingGroups, error]);

  const label = user?.username ? user.username : "anonymous";

  const avatarElement = user ? (
    avatarUrl ? (
      <IonAvatar>
        <Avatar uid={user.uid} size="extrasmall" />
      </IonAvatar>
    ) : (
      <IonIcon icon={personCircleOutline} />
    )
  ) : (
    <IonIcon icon={personCircleOutline} />
  );

  const togglePopover = (e: any) => {
    console.log('togglePopover called');
    console.log('event:', e);
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
    console.log('showPopover state:', showPopover);
  };


  if (loading) {
    return <p>Loading...</p>; // Replace with a loading spinner if available
  }

  console.log('Loading fetchedGroups app.tsx', fetchedGroups);


  return (
    <IonApp>
      <HeaderContext.Provider value={{ showHeader, setShowHeader }}>
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
                      <IonItem button routerLink='/ViewRoute' routerDirection="none">
                        <IonLabel>View Routes</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/ViewBikeBusGroup' routerDirection="none">
                        <IonLabel>View BikeBusGroups</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/ViewBikeBusStations' routerDirection="none">
                        <IonLabel>View BikeBusStations</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/Create Route' routerDirection="none">
                        <IonLabel>Create Route</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/CreateBikeBusStation' routerDirection="none">
                        <IonLabel>Create BikeBusStation</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/CreateBikeBusGroup' routerDirection="none">
                        <IonLabel>Create BikeBusGroup</IonLabel>
                      </IonItem>
                    </IonCard>
                    <IonCard>
                      <IonLabel>Premium User Functions</IonLabel>
                      <IonItem button routerLink='/UpgradeAccountToPremium' routerDirection="none">
                        <IonLabel>Convert to Parent Account Type - Sign up for Premium</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/AddAKid' routerDirection="none">
                        <IonLabel>Add a Kid -as a premium user and converts to parent account type</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/CheckInKid' routerDirection="none">
                        <IonLabel>Check In a Kid to a BikeBus</IonLabel>
                      </IonItem>
                    </IonCard>
                    <IonCard>
                      <IonLabel>BikeBus Leader Functions</IonLabel>
                      <IonItem button routerLink='/CheckInKidFromLeader' routerDirection="none">
                        <IonLabel>Check In a Kid to a BikeBus</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/EndBikeBusGroupRide' routerDirection="none">
                        <IonLabel>Finish a BikeBusGroup ride - end ride for all</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/StartBikeBusGroupRide' routerDirection="none">
                        <IonLabel>Start a BikeBusGroup ride at BikeBusStation 1</IonLabel>
                      </IonItem>
                    </IonCard>
                    <IonCard>
                      <IonLabel>Org Admin Functions</IonLabel>
                      <IonItem button routerLink='/UpdateOrganization' routerDirection="none">
                        <IonLabel>Update Organization</IonLabel>
                      </IonItem>
                      <IonItem button routerLink='/DataAnalytics' routerDirection="none">
                        <IonLabel>Data Analytics</IonLabel>
                      </IonItem>
                    </IonCard>
                    <IonCard>
                      <IonLabel>App Admin Functions</IonLabel>
                      <IonItem button routerLink="/CreateOrganization" routerDirection="none">
                        <IonLabel>Create Organization</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/UpdateUsers" routerDirection="none">
                        <IonLabel>Update Users' Data</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/UpdateOrganizationalData" routerDirection="none">
                        <IonLabel>Update Organizational Data</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/UpdateBikeBusGroupData" routerDirection="none">
                        <IonLabel>Update BikeBusGroup Data</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/UpdateRouteData" routerDirection="none">
                        <IonLabel>Update Route Data</IonLabel>
                      </IonItem>
                      <IonItem button routerLink="/UpdateBikeBusStationData" routerDirection="none">
                        <IonLabel>Update BikeBusStation Data</IonLabel>
                      </IonItem>
                      <IonLabel></IonLabel>
                    </IonCard>
                    <IonItem button routerLink="/about" routerDirection="none">
                      <IonLabel>About</IonLabel>
                    </IonItem>
                  </IonMenuToggle>
                </IonList>
              </IonContent>
            </IonMenu>
            <IonPage id="main-content" >
              <IonContent fullscreen>
                {showHeader && (
                  <IonHeader>
                    <IonToolbar color="primary" >
                      <IonButtons color="secondary" slot="start">
                        <IonMenuButton></IonMenuButton>
                      </IonButtons>
                      <IonText slot="start" color="secondary" class="BikeBusFont">
                        <h1>BikeBus</h1>
                      </IonText>

                      <IonPopover
                        isOpen={showPopover}
                        event={popoverEvent}
                        onDidDismiss={() => setShowPopover(false)}
                        className="my-popover"
                      >
                        <Profile />
                      </IonPopover>
                      <IonButton fill="clear" slot="end" onClick={togglePopover}>
                        <IonChip>
                          {avatarElement}
                          <IonLabel>{label}</IonLabel>
                        </IonChip>
                      </IonButton>
                      <IonPopover
                        isOpen={showPopover}
                        event={popoverEvent}
                        onDidDismiss={() => setShowPopover(false)}
                        className="my-popover"
                      >
                        <Profile />
                      </IonPopover>
                      <IonButtons slot="primary">
                        <IonButton routerLink='/help'>
                          <IonIcon slot="end" icon={helpCircleOutline}></IonIcon>
                        </IonButton>
                        <IonButton routerLink='/notifications'>
                          <IonIcon slot="end" icon={alertCircleOutline}></IonIcon>
                        </IonButton>
                      </IonButtons>
                    </IonToolbar>
                  </IonHeader>
                )}
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
                    <Route exact path="/ViewBikeBusGroup">
                      <BikeBusGroupPage />
                    </Route>
                    <Route exact path="/ViewRoute">
                      <ViewRoute />
                    </Route>
                    <Route exact path="/SearchForRoute">
                      <SearchForRoute />
                    </Route>
                    <Route exact path="/CreateOrganization">
                      <CreateOrganization />
                    </Route>
                    <Route exact path="/CreateRoute">
                      <CreateRoute routeId={''} />
                    </Route>
                    <Route exact path="/CreateBikeBusGroup">
                      <CreateBikeBusGroup />
                    </Route>
                    <Route exact path="/CreateBikeBusStation">
                      <CreateBikeBusStation />
                    </Route>
                    <Route exact path="/UpgradeAccountToPremium">
                      <UpgradeAccountToPremium />
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
              </IonContent>
            </IonPage>
            <IonFab vertical="bottom" horizontal="start" slot="fixed">
              <IonFabButton routerLink="/Map" routerDirection="none">
                <IonIcon icon={mapOutline} />
              </IonFabButton>
            </IonFab>
            <div className='bikebusname-button-container'>
              {fetchedGroups ? fetchedGroups.map((group: any) => (
                <IonButton shape="round" size="large" key={group.id} routerLink={`/bikebusgrouppage/${group.id}`} routerDirection="none">
                  <IonText class="BikeBusFont">{group.BikeBusName}</IonText>
                </IonButton>
              )) : <p>Loading groups...</p>}
            </div>
            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton routerLink="/GetDirections" routerDirection="none">
                <IonIcon icon={compassOutline} />
              </IonFabButton>
            </IonFab>
          </React.Fragment>
        </IonReactRouter>
      </HeaderContext.Provider>
    </IonApp >
  );
};

export default App;
