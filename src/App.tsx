import { useEffect, useState } from 'react';
import { Route, Redirect, useParams } from 'react-router-dom';
import { IonApp, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonPage, IonMenuToggle, IonLabel, IonRouterOutlet, setupIonicReact, IonButton, IonIcon, IonText, IonFabButton, IonFab, IonCard, IonButtons, IonChip, IonMenuButton, IonPopover, IonAvatar, IonModal } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import useAuth from './useAuth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { HeaderContext } from './components/HeaderContext';
import { MapProvider } from './components/Mapping/MapContext';


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
import ViewRoute from './pages/ViewRoute';
import SearchForRoute from './pages/SearchForRoute';
import SetUsername from './components/SetUsername';
import Notifications from './pages/Notifications';
import CreateOrganization from './pages/CreateOrganization';
import CreateBikeBusGroup from './pages/CreateBikeBusGroup';
import CreateBikeBusStops from './pages/CreateBikeBusStops';
import UpgradeAccountToPremium from './pages/UpgradeAccountToPremium';
import { RouteProvider } from './components/RouteContext';
import CreateRoute from './pages/createRoute';
import React from 'react';
import { helpCircleOutline, mapOutline, personCircleOutline } from 'ionicons/icons';
import Avatar from './components/Avatar';
import { useAvatar } from './components/useAvatar';
import ViewSchedule from './pages/ViewSchedule';
import AddSchedule from './pages/AddSchedule';
import UpdateRouteManually from './pages/UpdateRouteManually';
import SearchForBikeBus from './pages/SearchForBikeBus';
import Event from './pages/Event';
import DeleteBikeBusStops from './pages/DeleteBikeBusStops';
import ViewRouteList from './pages/ViewRouteList';
import EditRoute from './pages/EditRoute';
import ViewBikeBusList from './pages/ViewBikeBusList';
import EditBikeBus from './pages/EditBikeBus';
import EditSchedule from './pages/EditSchedule';
import Trip from './pages/Trip';
import EventSummary from './pages/EventSummary';
import { BikeBusGroupProvider, useBikeBusGroupContext } from "./components/BikeBusGroup/useBikeBusGroup";
import useEvent from "./components/BikeBusGroup/useEvent";


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


setupIonicReact();

type Group = {
  id: number;
  BikeBusName: string;
}



const App: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const [showHeader, setShowHeader] = useState(true);
  const [accountType, setAccountType] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const [isUserLeader, setIsUserLeader] = useState<boolean>(false);
  const [isUserMember, setIsUserMember] = useState<boolean>(false);
  const { fetchedGroups } = useBikeBusGroupContext();
  const [showModal, setShowModal] = useState(false);
  const [eventStatuses, setEventStatuses] = useState<Record<string, string>>({});
  const { fetchedEvents } = useEvent();


  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  const label = user?.username ? user.username : "anonymous";

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setAccountType(userData.accountType);
          }
        }
      });
    }

  }, [user, accountType]);

  // useEffect to fetch the event document from Firestore
  useEffect(() => {
    if (fetchedGroups && fetchedGroups.length > 0) {
      const fetchEventStatuses = async () => {
        const newEventStatuses: Record<string, string> = {}; // Explicitly set type to Record<string, string>
  
        for (const group of fetchedGroups) {
          if (group.event && group.event.length > 0) {
            for (const eventRef of group.event) {
              const eventDocSnap = await eventRef.get();
  
              if (eventDocSnap.exists()) {
                newEventStatuses[eventDocSnap.id] = eventDocSnap.data().status;
              } else {
                console.log("No such document!");
              }
            }
          }
        }
  
        setEventStatuses(newEventStatuses);
      };
  
      fetchEventStatuses();
    }
  }, [fetchedGroups]);


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

  return (
    <IonApp>
      <HeaderContext.Provider value={{ showHeader, setShowHeader }}>
        <IonReactRouter>
          <RouteProvider>
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
                        <IonItem button routerLink='/ViewRouteList' routerDirection="none">
                          <IonLabel>View Routes</IonLabel>
                        </IonItem>
                        <IonItem button routerLink='/ViewBikeBusList' routerDirection="none">
                          <IonLabel>View BikeBusses</IonLabel>
                        </IonItem>
                        <IonItem button routerLink='/SearchForBikeBus' routerDirection="none">
                          <IonLabel>Search for BikeBus</IonLabel>
                        </IonItem>
                      </IonCard>
                      {accountType === 'App Admin' &&
                        <IonCard>
                          <IonLabel>Premium User Functions</IonLabel>
                          <IonItem button routerLink='/CheckInAsMember' routerDirection="none">
                            <IonLabel>Check In to a active BikeBusGroup Ride</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/AddAKid' routerDirection="none">
                            <IonLabel>Add a Kid -Converts to Parent Account</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/CheckInKid' routerDirection="none">
                            <IonLabel>Check In a Kid to a BikeBusGroupRide</IonLabel>
                          </IonItem>
                        </IonCard>}
                      {accountType === 'App Admin' &&
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
                          <IonItem button routerLink='/CreateBikeBusStops' routerDirection="none">
                            <IonLabel>Create BikeBusStops</IonLabel>
                          </IonItem>
                        </IonCard>}
                      {accountType === 'App Admin' &&
                        <IonCard>
                          <IonLabel>Org Admin Functions</IonLabel>
                          <IonItem button routerLink='/UpdateBikeBusGroups' routerDirection="none">
                            <IonLabel>Update BikeBusGroups</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/UpdateBikeBusStations' routerDirection="none">
                            <IonLabel>Update BikeBusStations</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/UpdateRoutes' routerDirection="none">
                            <IonLabel>Update Associated Routes</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/UpdateOrganization' routerDirection="none">
                            <IonLabel>Update Organization</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/DataAnalytics' routerDirection="none">
                            <IonLabel>Data Analytics</IonLabel>
                          </IonItem>
                        </IonCard>}
                      {accountType === 'App Admin' &&
                        <IonCard>
                          <IonLabel>App Admin Functions</IonLabel>
                          <IonItem button routerLink='/ViewBikeBusStations' routerDirection="none">
                            <IonLabel>TODO: View BikeBusStations</IonLabel>
                          </IonItem>
                          <IonItem button routerLink='/UpgradeAccountToPremium' routerDirection="none">
                            <IonLabel>TODO: Upgrade Account to Premium</IonLabel>
                          </IonItem>
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
                        </IonCard>}
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
                        </IonButtons>
                      </IonToolbar>
                    </IonHeader>
                  )}
                  <IonRouterOutlet>
                    <React.Fragment>
                      <Route path="/bikebusgrouppage/:groupId">
                        <BikeBusGroupPage />
                      </Route>
                      <Route path="/SearchForBikeBus">
                        <SearchForBikeBus />
                      </Route>
                      <Route path="/viewroute/:id" exact>
                        <ViewRoute />
                      </Route>
                      <Route path="/editroute/:id" exact>
                        <EditRoute />
                      </Route>
                      <Route path="/updateroutemanually/:id" exact>
                        <UpdateRouteManually />
                      </Route>
                      <Route exact path="/viewroutelist">
                        <ViewRouteList />
                      </Route>
                      <Route exact path="/viewschedule/:id">
                        <ViewSchedule />
                      </Route>
                      <Route exact path="/addschedule/:id">
                        <AddSchedule />
                      </Route>
                      <Route exact path="/editschedule/:id">
                        <EditSchedule />
                      </Route>
                      <Route exact path="/viewbikebuslist">
                        <ViewBikeBusList />
                      </Route>
                      <Route path="/editbikebus/:id" exact>
                        <EditBikeBus />
                      </Route>
                      <Route path="/event/:id">
                        <Event />
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
                        <MapProvider
                        >
                          <Map />
                        </MapProvider>
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
                        <CreateRoute />
                      </Route>
                      <Route path="/CreateBikeBusGroup/:RouteID" component={CreateBikeBusGroup} />
                      <Route path="/CreateBikeBusStops/:id">
                        <CreateBikeBusStops />
                      </Route>
                      <Route path="/DeleteBikeBusStops/:id">
                        <DeleteBikeBusStops />
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
                      <Route exact path="/trips/:tripDataId">
                        <Trip />
                      </Route>
                      <Route exact path="/eventsummary/:id">
                        <EventSummary />
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
                        <Redirect to="/Login" />
                      </Route>
                    </React.Fragment>
                  </IonRouterOutlet>
                </IonContent>
              </IonPage>
              {user && (
                <div className='bikebus-footer'>
                  <div className='map-button-container footer-content'>
                    <IonFab vertical="bottom" horizontal="start" slot="fixed">
                      <IonFabButton routerLink="/Map" routerDirection="none">
                        <IonIcon icon={mapOutline} />
                      </IonFabButton>
                    </IonFab>
                  </div>
                  <div className="bikebusname-button-container">
                    {fetchedGroups ? (
                      fetchedGroups.map((group: any) => (
                        group.event && group.event.length > 0 && eventStatuses[group.event[0].id] === "active" ? (
                          <IonButton
                            shape="round"
                            size="large"
                            key={group.id}
                            routerLink={`/eventpage/${group.id}`} // replace with the correct routerLink for the event page
                            routerDirection="none"
                          >
                            <IonText className="BikeBusFont">Event Page</IonText>
                          </IonButton>
                        ) : (
                          <IonButton
                            shape="round"
                            size="large"
                            key={group.id}
                            routerLink={`/bikebusgrouppage/${group.id}`}
                            routerDirection="none"
                          >
                            <IonText className="BikeBusFont">{group.BikeBusName}</IonText>
                          </IonButton>
                        )
                      ))
                    ) : (
                      <p>Loading groups...</p>
                    )}
                    {fetchedGroups && fetchedGroups.length > 1 && (
                    <IonButton onClick={() => setShowModal(true)}>More Groups</IonButton>
                  )}
                  <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                    <IonList>
                      {fetchedGroups.map((group: any) => (
                        <IonItem key={group.id} routerLink={`/bikebusgrouppage/${group.id}`} routerDirection="none">
                          <IonLabel>{group.BikeBusName}</IonLabel>
                        </IonItem>
                      ))}
                    </IonList>
                    <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
                  </IonModal>
                </div>
                </div>
              )}
          </React.Fragment>

        </RouteProvider>

      </IonReactRouter>
    </HeaderContext.Provider>
    </IonApp >
  );
};

export default App;
