import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Redirect, useParams } from 'react-router-dom';
import { IonApp, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonPage, IonMenuToggle, IonLabel, IonRouterOutlet, setupIonicReact, IonButton, IonIcon, IonText, IonFabButton, IonFab, IonCard, IonButtons, IonChip, IonMenuButton, IonPopover, IonAvatar, IonModal, IonActionSheet } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import useAuth from './useAuth';
import { getDoc, doc, Timestamp, DocumentReference } from 'firebase/firestore';
import { db, rtdb } from './firebaseConfig';
import { HeaderContext } from './components/HeaderContext';
import { MapProvider } from './components/Mapping/MapContext';
import { DataSnapshot } from '@firebase/database';
import { ref, get } from "firebase/database";
import { Share } from '@capacitor/share';

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
import { arrowUp, helpCircleOutline, homeOutline, logoInstagram, logoTwitter, mailOutline, mapOutline, personCircleOutline, phonePortraitOutline, shareOutline, textOutline } from 'ionicons/icons';
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
import OrganizationProfile from './pages/OrganizationProfile';
import ViewOrganization from './pages/ViewOrganization';
import ViewOrganizationList from './pages/ViewOrganizationList';
import BulletinBoards from './pages/BulletinBoards';
import { useBikeBusGroupContext } from "./components/BikeBusGroup/useBikeBusGroup";
import { useOrganizationContext } from "./components/Organizations/useOrganization";
import useEvent from "./components/BikeBusGroup/useEvent";
import OrganizationMap from './pages/OrganizationMap';
import EditOrganization from './pages/EditOrganization';


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
import { type } from 'os';

setupIonicReact();

type Group = {
  id: number;
  BikeBusRoutes: any[];
  BikeBusName: string;
  event: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type Coordinate = {
  lat: number;
  lng: number;
};

type GRoute = {
  startPoint: Coordinate;
  endPoint: Coordinate;
  [key: string]: any;
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
  const [relevantEvents, setRelevantEvents] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [upcomingEvent, setUpcomingEvent] = useState<Group['event'] | null>(null);
  const [upcomingGroup, setUpcomingGroup] = useState<Group | null>(null);



  function formatDate(timestamp: Timestamp) {
    const dateObject = timestamp.toDate(); // Converts Firestore timestamp to JavaScript Date
    return dateObject.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  }

  const label = user?.username ? user.username : "anonymous";

  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
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

  }, [user]);


  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const userRef = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(userRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.bikebusgroups) {
            const groupRefs = userData.bikebusgroups; // getting the group document references
            const groupSnapshots = await Promise.all(groupRefs.map((ref: DocumentReference<unknown>) => getDoc(ref))); // Fetch all group documents in parallel

            const groups = groupSnapshots.map(snapshot => snapshot.data());

            // Fetch routes and events for each group
            for (const group of groups) {
              if (group && group.BikeBusRoutes) {
                const routeRef = group.BikeBusRoutes[0];
                const routeSnapshot = await getDoc(routeRef);

                group.route = routeSnapshot.data();
              }

              if (group && group.event) {
                const eventRef = group.event[0];
                const eventSnapshot = await getDoc(eventRef);

                group.event = eventSnapshot.data();
              }
            }

            // Now groups contains all the data we need
            setGroupData(groups);
          }
        }
      };

      fetchData();
    }
  }, [user]);


  const getUserLocation = useCallback(async () => {
    if (!user) return null;
    const userLocationRef = ref(rtdb, `userLocations/${user.uid}`);
    const snapshot = await get(userLocationRef);
    return snapshot.val();
  }
    , [user]);

  const getUserGroups = useCallback(async () => {
    if (!user) return [];
    const userRef = doc(db, 'users', user.uid);
    const docSnapshot = await getDoc(userRef);
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      if (userData && userData.bikebusgroups) {
        const groupRefs = userData.bikebusgroups; // getting the group document references
        const groups = [];
        for (let i = 0; i < groupRefs.length; i++) {
          const groupSnapshot = await getDoc(groupRefs[i]);
          if (groupSnapshot.exists()) {
            groups.push(groupSnapshot.data());
          }
        }
        return groups; // return fetched group data
      }
    }
    return [];
  }
    , [user]);

  const getRoute = useCallback(async () => {
    if (!user) return null;
    const userRef = doc(db, 'users', user.uid);
    const docSnapshot = await getDoc(userRef);
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      if (userData && userData.bikebusgroups) {
        const groupRefs = userData.bikebusgroups; // getting the group document references
        const groupSnapshots = await Promise.all(groupRefs.map((ref: DocumentReference<unknown>) => getDoc(ref))); // Fetch all group documents in parallel
        for (const groupSnapshot of groupSnapshots) {
          if (groupSnapshot.exists()) {
            const groupData = groupSnapshot.data() as Group;  // Add type assertion here
            if (groupData && groupData.BikeBusRoutes) {
              const routeRef = groupData.BikeBusRoutes[0];
              const routeSnapshot = await getDoc(routeRef);
              if (routeSnapshot.exists()) {
                return routeSnapshot.data() as GRoute;
              }
            }
          }
        }
      }
    }
    return null;
  }, [user]);


  // Function to check if an event is within the required distance and if the event belongs to a group the user is part of
  const isEventRelevant = useCallback(async (event: any) => {
    return new Promise(async (resolve, reject) => {
      const userLocation = await getUserLocation(); // Get the user's location
      const userGroups = await getUserGroups(); // Get the groups the user is part of
      const groupRoute = await getRoute() as GRoute | null;
      // event.location doesn't exist, so we can't calculate distance. We need to get the route associated with the event and calculate distance from the user's location to the route

      // Helper function to calculate the distance between two lat/long points
      function getDistanceFromLatLonInMiles(lat1: any, lon1: any, lat2: any, lon2: any) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);
        var dLon = deg2rad(lon2 - lon1);
        var a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2)
          ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d * 0.621371; // Convert to miles
      }

      function deg2rad(deg: any) {
        return deg * (Math.PI / 180)
      }


      if (userLocation && event && groupRoute?.startPoint && groupRoute.endPoint) {
        const eventDistance = getDistanceFromLatLonInMiles(userLocation.lat, userLocation.lng, groupRoute.startPoint.lat, groupRoute.startPoint.lng);


        if (eventDistance <= 30) {
          resolve(true);
        }
        // if eventDistance is greater than 5, show the next event in my bikebusgroup
        else {
          const group = fetchedGroups.find((group: any) => group.event && group.event.length > 0 && group.event[0].id === event.id);

          if (group) {
            const groupEvents = group.event;
            const groupEventIndex = groupEvents.findIndex((groupEvent: any) => groupEvent.id === event.id);

            if (groupEventIndex !== -1 && groupEventIndex < groupEvents.length - 1) {
              const nextEvent = groupEvents[groupEventIndex + 1];
              if (nextEvent && nextEvent.location) {
                const nextEventDistance = getDistanceFromLatLonInMiles(userLocation.lat, userLocation.lng, nextEvent.location.lat, nextEvent.location.lng);
                if (nextEventDistance <= 10) {
                  resolve(true);
                }
              }
            }
          }
        }
      }

      for (const group of userGroups as Group[]) {
        if (group.event.id === event.id) {
          resolve(true);
        }
      }




      const isRelevant = event.location ? getDistanceFromLatLonInMiles(userLocation.lat, userLocation.lng, event.location.lat, event.location.lng) <= 10 : false;

      resolve(isRelevant);
    });
  }, [fetchedGroups, getRoute, getUserGroups, getUserLocation]);


  useEffect(() => {
    if (fetchedEvents && fetchedEvents.length > 0) {
      Promise.all(fetchedEvents.map(isEventRelevant)) // Map each event to a promise that resolves to a boolean
        .then(relevanceArray => {
          const relevantEvents = fetchedEvents.filter((_, index) => relevanceArray[index]); // Filter events based on the relevance array
          setRelevantEvents(relevantEvents);
        });
    }
  }, [fetchedEvents, isEventRelevant]);

  useEffect(() => {
    if (!fetchedGroups || fetchedGroups.length === 0) return;

    // Fetch all event documents from their references in parallel
    const eventFetchPromises = fetchedGroups.flatMap((group) =>
      group.event.map((eventRef: DocumentReference<unknown>) => getDoc(eventRef))
    );

    Promise.all(eventFetchPromises).then((eventSnapshots) => {
      // Extract event data from snapshots
      const allEvents = eventSnapshots.map((eventSnapshot, index) => ({
        ...eventSnapshot.data(),
        id: eventSnapshot.id,
        groupId: fetchedGroups[Math.floor(index / fetchedGroups[0].event.length)].id,
      }));
      console.log(allEvents);

      // Filter out events in the past
      const futureEvents = allEvents.filter(
        (event) => new Date(event.startTimestamp.seconds * 1000).getTime() > Date.now()
      );
      // Sort all the future events by startTimestamp in ascending order
      const sortedEvents = [...futureEvents].sort(
        (a, b) =>
          new Date(a.startTimestamp.seconds * 1000).getTime() - new Date(b.startTimestamp.seconds * 1000).getTime()
      );

      // Now, the first event in sortedEvents is the upcoming event
      const upcomingEvent = sortedEvents[0];

      // Find the group that the upcoming event belongs to
      const upcomingGroup = upcomingEvent
        ? fetchedGroups.find((group) => group.id === upcomingEvent.groupId)
        : null;

      setUpcomingEvent(upcomingEvent);
      setUpcomingGroup(upcomingGroup);
    });
  }, [fetchedGroups]);



  const avatarElement = useMemo(() => {
    return user ? (
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
  }, [user, avatarUrl]);


  const togglePopover = (e: any) => {
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
  };


  if (loading) {
    return <p>Loading...</p>;
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
                        <IonItem button routerLink="/BulletinBoards" routerDirection="none">
                          <IonLabel>Bulletin Boards</IonLabel>
                        </IonItem>
                        <IonItem button routerLink='/ViewRouteList' routerDirection="none">
                          <IonLabel>View Routes</IonLabel>
                        </IonItem>
                        <IonItem button routerLink='/ViewBikeBusList' routerDirection="none">
                          <IonLabel>View BikeBusses</IonLabel>
                        </IonItem>
                        <IonItem button routerLink='/ViewOrganizationList' routerDirection="none">
                          <IonLabel>View Organizations</IonLabel>
                        </IonItem>
                        <IonItem button routerLink="/CreateOrganization" routerDirection="none">
                          <IonLabel>Create Organization</IonLabel>
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
                          <IonActionSheet
                            isOpen={showActionSheet}
                            onDidDismiss={() => setShowActionSheet(false)}
                            buttons={[
                              {
                                text: 'Share via Text Message',
                                icon: phonePortraitOutline,
                                handler: () => {
                                  Share.share({
                                    title: 'Check out my BikeBus link!',
                                    text: 'I found this link on the BikeBus app',
                                    url: window.location.href,
                                  });
                                }
                              },
                              {
                                text: 'Share on Twitter',
                                icon: logoTwitter,
                                handler: () => {
                                  Share.share({
                                    title: 'Check out my BikeBus link!',
                                    text: 'I found this link on the BikeBus app',
                                    url: window.location.href,
                                  });
                                }
                              },
                              {
                                text: 'Share on Instagram',
                                icon: logoInstagram,
                                handler: () => {
                                  Share.share({
                                    title: 'Check out my BikeBus link!',
                                    text: 'I found this link on the BikeBus app',
                                    url: window.location.href,
                                  });
                                }
                              },
                              {
                                text: 'Share via Email',
                                icon: mailOutline,
                                handler: () => {
                                  Share.share({
                                    title: 'Check out my BikeBus link!',
                                    text: 'I found this link on the BikeBus app',
                                    url: window.location.href,
                                  });
                                }
                              },
                              {
                                text: 'Cancel',
                                role: 'cancel',
                                handler: () => {
                                  console.log('Cancel clicked');
                                }
                              },
                            ]}
                          />
                          <IonButton onClick={() => setShowActionSheet(true)}>
                            <IonIcon slot="end" icon={shareOutline}></IonIcon>
                          </IonButton>
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
                      <Route path="/BulletinBoards">
                        <BulletinBoards />
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
                      <Route path="/editorganization/:id" exact>
                        <EditOrganization />
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
                      <Route exact path="/OrganizationProfile/:id">
                        <OrganizationProfile />
                      </Route>
                      <Route exact path="/ViewOrganization/:id">
                        <ViewOrganization />
                      </Route>
                      <Route exact path="/OrganizationMap/:id">
                        <OrganizationMap />
                      </Route>
                      <Route exact path="/ViewOrganizationList">
                        <ViewOrganizationList />
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
                        <Redirect to="/Map" />
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
                        <IonIcon icon={homeOutline} />
                      </IonFabButton>
                    </IonFab>
                  </div>
                  <div className="bikebusname-button-container">
                    {upcomingGroup ? (
                      <div className="button-group">
                        <IonButton
                          className="group-button"
                          shape="round"
                          size="large"
                          key={upcomingGroup.id}
                          routerLink={upcomingEvent ? `/Event/${upcomingEvent.id}` : `/bikebusgrouppage/${upcomingGroup.id}`}
                          routerDirection="none"
                        >
                          <IonLabel className="BikeBusFont" text-wrap>
                            {upcomingGroup.BikeBusName}
                            {upcomingEvent && (
                              <IonText className="EventTimeFont">
                                {formatDate(upcomingEvent.startTimestamp)}
                              </IonText>
                            )}
                          </IonLabel>
                        </IonButton>
                      </div>
                    ) : (
                      <p>Loading BikeBus Event...</p>
                    )}
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
