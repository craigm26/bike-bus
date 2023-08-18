/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonAvatar,
  IonIcon,
  IonLabel,
  IonButton,
  IonList,
  IonItem,
  IonModal,
  IonTitle,
  IonCheckbox,
  IonChip,
  IonCol,
  IonRow,
  IonCard,
  IonCardContent,
  IonGrid,
  IonImg,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonToggle,
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import './About.css';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { bicycleOutline, busOutline, carOutline, locateOutline, personCircleOutline, walkOutline } from 'ionicons/icons';
import { doc, getDoc, setDoc, arrayUnion, onSnapshot, collection, where, getDocs, query, addDoc, serverTimestamp, updateDoc, DocumentReference } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useParams, useHistory } from "react-router-dom";
import { create } from 'domain';
import { set } from 'date-fns';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow, StandaloneSearchBox } from '@react-google-maps/api';
import React from 'react';


const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusGroupData {
  name: string;
  description: string;
  BikeBusRoutes: { id: string }[];
}

interface BikeBusGroup {
  name: string;
  description: string;
  BikeBusRoutes: { id: string }[];
}

interface event {
  title: string;
  route: string;
  time: string;
  leader: string;
  captains: string[];
  sheepdogs: string[];
  sprinters: string[];
  parents: string[];
  kids: string[];
  caboose: string[];
  members: string[];
  BikeBusGroup: string;
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface Route {
  BikeBusName: string;
  BikeBusStopName: string[];
  BikeBusStop: Coordinate[];
  id: string;
  BikeBusStationsIds: string[];
  BikeBusGroupId: DocumentReference;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: Coordinate;
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  travelMode: string;
  pathCoordinates: Coordinate[];
  isBikeBus: boolean;
}

interface FirestoreRef {
  path: string;
}

type LatLngCoordinate = {
  lat: number;
  lng: number;
};


interface FetchedUserData {
  username: string;
  accountType?: string;
  id: string;
  uid?: string;
}

interface Coordinate {
  lat: number;
  lng: number;
}
interface RouteData {
  BikeBusName: string;
  BikeBusStopName: string[];
  BikeBusStop: Coordinate[];
  id: string;
  BikeBusStationsIds: string[];
  BikeBusGroupId: DocumentReference;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: Coordinate;
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  travelMode: string;
  pathCoordinates: Coordinate[];
  isBikeBus: boolean;
}



const Event: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [bikeBusGroupData, setBikeBusGroupData] = useState<any>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showRSVPListModal, setShowRSVPListModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [caboose, setCaboose] = useState<string[]>([]);
  const [captains, setCaptains] = useState<string[]>([]);
  const [kids, setKids] = useState<string[]>([]);
  const [parents, setParents] = useState<string[]>([]);
  const [sheepdogs, setSheepdogs] = useState<string[]>([]);
  const [sprinters, setSprinters] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [leader, setLeader] = useState<string[]>([]);
  const [showJoinBikeBus, setShowJoinBikeBus] = useState<boolean>(false);
  const [RouteId, setRouteId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const [eventDataForupdateEvent, setEventDataForupdateEvent] = useState<any>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [leadersId, setLeadersId] = useState<FetchedUserData[]>([]);
  const [membersId, setMembersId] = useState<FetchedUserData[]>([]);
  const [cabooseId, setCabooseId] = useState<FetchedUserData[]>([]);
  const [captainsId, setCaptainsId] = useState<FetchedUserData[]>([]);
  const [kidsId, setKidsId] = useState<FetchedUserData[]>([]);
  const [parentsId, setParentsId] = useState<FetchedUserData[]>([]);
  const [sheepdogsId, setSheepdogsId] = useState<FetchedUserData[]>([]);
  const [sprintersId, setSprintersId] = useState<FetchedUserData[]>([]);
  const [eventRefid, seteventRefid] = useState<string>('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeData, setRouteData] = useState<Route | null>(null);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [bikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);
  const [startAddress, setStartAddress] = useState<string>('');
  const [endAddress, setEndAddress] = useState<string>('');
  const [bikeBusGroupId, setBikeBusGroupId] = useState<string>('');
  const [bikeBusGroupName, setBikeBusGroupName] = useState<string>('');
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });
  const [bikeBusGroup, setBikeBusGroup] = useState<BikeBusGroup | null>(null);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [pathCoordinates, setPathCoordinates] = useState<LatLngCoordinate[]>([]);
  const [startPointAdress, setStartPointAdress] = useState<string>('');
  const [selectedEndLocation, setSelectedEndLocation] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [selectedStartLocation, setSelectedStartLocation] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [selectedEndLocationAddress, setSelectedEndLocationAddress] = useState<string>('');
  const [selectedStartLocationAddress, setSelectedStartLocationAddress] = useState<string>('');
  const [endPointAdress, setEndPointAdress] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "";
  const [RouteDocId, setRouteDocId] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);

  type SetRoleFunction = (role: string[]) => void;

  type SetRoleDataFunction = (role: FetchedUserData[]) => void;




  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData) {
            setUsername(userData.username);
            if (userData.accountType) {
              setaccountType(userData.accountType);
            }
          }
        }
      });
    }

    const fetchUser = async (username: string): Promise<FetchedUserData | undefined> => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      let user: FetchedUserData | undefined;

      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        // make the id property the same as the in-page uid property

        user = { id: doc.id, uid: doc.data().uid, ...doc.data() } as FetchedUserData; // Include the document's ID and uid
        // make the uid property the same as the user id property:
        user.uid = user.id;

      });

      return user;
    };

    const fetchUsernames = async (role: string[], setRole: SetRoleFunction) => {
      if (role) {
        const promises = role.map(fetchUser);
        const users = await Promise.all(promises);
        const usernames = users.filter(user => user !== undefined).map(user => user?.username !== undefined ? user.username : '');
        setRole(usernames);
      }
    };

    if (eventData) {
      fetchUsernames([eventData.leader], setLeader);
      fetchUsernames(eventData.members, setMembers);
      fetchUsernames(eventData.caboose || [], setCaboose);
      fetchUsernames(eventData.captains || [], setCaptains);
      fetchUsernames(eventData.kids || [], setKids);
      fetchUsernames(eventData.parents || [], setParents);
      fetchUsernames(eventData.sheepdogs || [], setSheepdogs);
      fetchUsernames(eventData.sprinters || [], setSprinters);
    }

    const fetchUserids = async (role: string[], setRole: SetRoleDataFunction) => {
      if (role) {
        const promises = role.map(fetchUser);
        const users = (await Promise.all(promises)).filter(user => user !== undefined);
        setRole(users as FetchedUserData[]);
      }
    };

    if (eventData) {
      fetchUserids([eventData.leader], setLeadersId);
      fetchUserids(eventData.members, setMembersId);
      fetchUserids(eventData.caboose || '', setCabooseId);
      fetchUserids(eventData.captains || '', setCaptainsId);
      fetchUserids(eventData.kids || '', setKidsId);
      fetchUserids(eventData.parents || '', setParentsId);
      fetchUserids(eventData.sheepdogs || '', setSheepdogsId);
      fetchUserids(eventData.sprinters || '', setSprintersId);
    }
  }, [eventData, id, user]);

  const history = useHistory();

  useEffect(() => {
    const fetchEventData = async () => {
      const docRef = doc(db, 'event', id);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        const eventData = docSnapshot.data();
        setEventData(eventData);
        return eventData; // Return eventData for further use
      }
      return null;
    };
    const fetchRoute = async (routeId: string) => {
      const docRouteRef = doc(db, 'routes', routeId);
      const docRouteSnapshot = await getDoc(docRouteRef);
      if (docRouteSnapshot.exists()) {
        const routeData = docRouteSnapshot.data() as Route;
        setRouteData(routeData);
        setPath(routeData.pathCoordinates);
        setBikeBusStops(routeData.BikeBusStop);
        setStartAddress(routeData.startPointAddress);
        setEndAddress(routeData.endPointAddress);
      }
    };
    const fetchBikeBusGroup = async (bikeBusGroupRef: DocumentReference) => {
      const groupDocSnapshot = await getDoc(bikeBusGroupRef);
      if (groupDocSnapshot.exists()) {
        const bikeBusGroupData = groupDocSnapshot.data() as BikeBusGroupData;
        if (bikeBusGroupData) {
          const groupId = groupDocSnapshot.id;
          setBikeBusGroupId(groupId);
        }
      }
    };
    fetchEventData().then(eventData => {
      if (eventData?.route?.id) {
        fetchRoute(eventData.route.id).then(() => {
          if (eventData?.BikeBusGroup) {
            fetchBikeBusGroup(eventData.BikeBusGroup);
          }
        });
      }
    });
  }, [id]);


  useEffect(() => {
    if (routeData) {
      console.log('routeData', routeData)
      setBikeBusStops(routeData.BikeBusStop);
      setPathCoordinates(routeData.pathCoordinates);

      setMapCenter({
        lat: (routeData.startPoint.lat + routeData.endPoint.lat) / 2,
        lng: (routeData.startPoint.lng + routeData.endPoint.lng) / 2,
      });
      setStartGeo(routeData.startPoint);
      setEndGeo(routeData.endPoint);
      setSelectedStartLocation(routeData.startPoint);
      setSelectedEndLocation(routeData.endPoint);

      // let's set the zoom level based on the distance between the start and end points
      const distance = Math.sqrt(Math.pow(routeData.startPoint.lat - routeData.endPoint.lat, 2) + Math.pow(routeData.startPoint.lng - routeData.endPoint.lng, 2));
      if (distance < 0.01) {
        setMapZoom(18);
      }
      else if (distance < 0.02) {
        setMapZoom(18);
      }
      else if (distance < 0.03) {
        setMapZoom(17);
      }
      else if (distance < 0.04) {
        setMapZoom(16);
      }
      else if (distance < 0.05) {
        setMapZoom(15);
      }
      else if (distance < 0.06) {
        setMapZoom(14);
      }
      else if (distance < 0.07) {
        setMapZoom(13);
      }
      else if (distance > 0.07) {
        setMapZoom(13);
      }
    }

  }
    , [routeData]);



  useEffect(() => {
    const docRef = doc(db, 'event', id);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      setEventData(doc.data());
    });

    return () => unsubscribe();  // Clean up listener on unmount
  }, [id]);

  function isRouteData(data: unknown): data is RouteData {
    return !!(data && typeof data === 'object' && 'BikeBusName' in data);
  }

  const updateEvent = useCallback(async () => {

    let routeData: RouteData | undefined;
    let groupData;

    const docRefEvent = doc(db, 'event', id);
    const docEventsnapshot = await getDoc(docRefEvent);

    if (docEventsnapshot.exists()) {
      const eventDataForupdateEvent = docEventsnapshot.data();
      if (eventDataForupdateEvent) {
        const groupRef = eventDataForupdateEvent?.BikeBusGroup;
        const docSnapshotgroup = await getDoc(groupRef);

        if (docSnapshotgroup.exists()) {
          groupData = docSnapshotgroup.data();
        }


        const routeRef = eventDataForupdateEvent?.route;
        const docSnapshotroute = await getDoc(routeRef);


        if (docSnapshotroute.exists()) {
          const data = docSnapshotroute.data();
          if (isRouteData(data)) {
            routeData = data as RouteData;
          }
        }

        if (routeData && groupData) {
          const updateData = {
            groupSize: '',
            eventLeader: eventData?.leader || [],
            eventMembers: eventData?.members || [],
            eventCaboose: eventData?.caboose || [],
            eventCaptains: eventData?.captains || [],
            eventKids: eventData?.kids || [],
            eventParents: eventData?.parents || [],
            eventSheepdogs: eventData?.sheepdogs || [],
            eventSprinters: eventData?.sprinters || [],
            eventStartTimestamp: eventData?.startTimestamp || '',
            eventEndTimestamp: eventData?.endTime || null,
            eventStatus: eventData?.status || 'active',
            eventBikeBusName: eventData?.BikeBusName || '',
            eventRoute: eventData?.route || '',
            eventGroupId: eventData?.groupId || '',
            eventGroupSize: '',
            eventCheckInLeader: user?.uid,
            eventcheckInLeaderTimeStamp: serverTimestamp(),
            eventCheckInMembers: '',
            eventCheckInMembersTimeStamp: '',
            eventCheckInCaboose: '',
            eventCheckInCabooseTimeStamp: '',
            eventCheckInCaptains: '',
            eventCheckInCaptainsTimeStamp: '',
            eventCheckInKids: '',
            eventCheckInKidsTimeStamp: '',
            eventCheckInParents: '',
            eventCheckInParentsTimeStamp: '',
            eventCheckInSheepdogs: '',
            eventCheckInSheepdogsTimeStamp: '',
            eventCheckInSprinters: '',
            eventCheckInSprintersTimeStamp: '',
            // for the eventCheckInStartTimestamp, we're going to use the time when the leader clicked on the "Start event" button
            eventCheckInStartTimestamp: serverTimestamp(),
            // for the eventCheckInEndTimestamp, we're going to use the time when the leader clicked on the "End event" button
            eventCheckInEndTimestamp: '',
            eventCheckInStatus: '',
            eventCheckInBikeBusName: eventData?.BikeBusName || '',
            eventCheckInRoute: eventData?.route || '',
            eventCheckInGroupId: eventData?.groupId || '',
            eventCheckInGroupSize: '',
            eventEndeventLeader: '',
            eventEndeventLeaderTimeStamp: '',
            eventEndeventMembers: '',
            eventEndeventMembersTimeStamp: '',
            eventEndeventCaboose: '',
            eventEndeventCabooseTimeStamp: '',
            eventEndeventCaptains: '',
            eventEndeventCaptainsTimeStamp: '',
            eventEndeventKids: '',
            eventEndeventKidsTimeStamp: '',
            eventEndeventParents: '',
            eventEndeventParentsTimeStamp: '',
            eventEndeventSheepdogs: '',
            eventEndeventSheepdogsTimeStamp: '',
            eventEndeventSprinters: '',
            eventEndeventSprintersTimeStamp: '',
            eventEndeventEndTimestamp: '',
            eventEndeventStatus: '',
            eventEndeventBikeBusName: '',
            eventEndeventRoute: '',
            eventEndeventGroupId: '',
            eventEndeventGroupSize: '',
          };

          await updateDoc(docRefEvent, updateData);


          // redirect to the event page with the event id being the "eventId" parameter
          history.push(`/Map/${docEventsnapshot.id}`);
        }
      } else {
        // doc.data() will be undefined in this case
      }
    }
  }, [id, eventData?.leader, eventData?.members, eventData?.caboose, eventData?.captains, eventData?.kids, eventData?.parents, eventData?.sheepdogs, eventData?.sprinters, eventData?.startTimestamp, eventData?.endTime, eventData?.status, eventData?.BikeBusName, eventData?.route, eventData?.groupId, user?.uid, history]);



  const togglePopover = (e: any) => {
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
  };

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

  const label = user?.username ? user.username : "anonymous";

  const handleRoleChange = (value: string) => {
    if (role.includes(value)) {
      setRole(prevRole => prevRole.filter(r => r !== value));
    } else {
      setRole(prevRole => [...prevRole, value]);
    }
  };

  const handleRSVP = async () => {
    if (!user || !username) {
      return;
    }

    if (!role || role.length === 0) {
      // set the role to members if no role is selected
      setRole(['members']);
      return;
    }

    const eventRef = doc(db, 'event', id);

    // Iterate through roles and add the user to each of them
    for (const r of role) {
      await setDoc(eventRef, {
        [r]: arrayUnion(username)
      }, { merge: true });
    }

    // check to see if the user is already in the role array as a members, if not, add them to the end of the members array
    if (!role.includes('members')) {
      if (!eventData.members.includes(username)) {
        await setDoc(eventRef, {
          members: arrayUnion(username)
        }, { merge: true });
      }
    }

    // if the role "choice" is only set to members, then add the user to the members array if they aren't already in it. It's a valid response.
    if (role.length === 1 && role.includes('members')) {
      if (!eventData.members.includes(username)) {
        await setDoc(eventRef, {
          members: arrayUnion(username)
        }, { merge: true });
      }
    }

    // Clear the role selection and hide the modal
    setRole([]);
    setShowRSVPModal(false);
  };

  // Date and time formatting options

  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const startTime = eventData?.startTimestamp ? new Date(eventData?.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
  const endTime = eventData?.endTime ? new Date(eventData?.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';

  // Check to see if the user is the event leader (a single string) in the eventData?.leader array
  const isEventLeader = username && eventData?.leader.includes(username);

  // Check to see if the event is active which means the event occurs within 15 minutes of the eventData?.startTimestamp
  //const isEventOpenActive = eventData?.startTimestamp && eventData?.startTimestamp.toDate() < new Date(Date.now() + 15 * 60000);

  // Check to see if the event field of the eventData document is set to 'active'
  const isEventActive = eventData?.status === 'active';

  const isEventEnded = eventData?.status === 'ended';

  const setShowStartBikeBus = (value: boolean) => {
    setShowJoinBikeBus(value);
  };

  const toggleEventStatus = useCallback(async (status: string) => {
    const docRef = doc(db, 'event', id);
    await setDoc(docRef, {
      status: status
    }, { merge: true });
    // check to see if the event already has the status of active, if not, set the status to active and trigger the updateEvent function
    if (status === '' || status === 'inactive') {
      setEventData((prevEventData: any) => ({ ...prevEventData, status: '' }));
      setShowStartBikeBus(true);
      setShowJoinBikeBus(false);
    } else
      if (status === 'active') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setEventData((prevEventData: any) => ({ ...prevEventData, status: 'active' }));
        updateEvent();
        setShowJoinBikeBus(true);
        setShowStartBikeBus(false);
      }
  }, [id, updateEvent]);

  const toggleStartEvent = useCallback(() => (
    toggleEventStatus('active'),
    // update the event document field "leader" with the user.uid value
    setEventData((prevEventData: any) => ({ ...prevEventData, leader: user?.uid })),
    // update the event document field "startTimestamp" with the current time
    console.log('toggleStartEvent is active!')
  ), [toggleEventStatus]);


  const toggleJoinEvent = () => {
    const eventRef = doc(db, 'event', eventData?.id);
    setDoc(eventRef, {
      JoinedMembers: arrayUnion(username)
    }, { merge: true });
    // find any other of user's ids in the event add them to the appropriate role arrays
    // if the user is a parent in the eventData field parents, add them to the parents array
    if (Array.isArray(eventData?.parents) && eventData?.parents.includes(username)) {
      setDoc(eventRef, {
        eventCheckInParents: arrayUnion(username),
        eventCheckInParentsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the kids array
    if (Array.isArray(eventData?.kids) && eventData?.kids.includes(username)) {
      setDoc(eventRef, {
        eventCheckInKids: arrayUnion(username),
        eventCheckInKidsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the captains array
    if (Array.isArray(eventData?.captains) && eventData?.captains.includes(username)) {
      setDoc(eventRef, {
        eventCheckInCaptains: arrayUnion(username),
        eventCheckInCaptainsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the sheepdogs array
    if (Array.isArray(eventData?.sheepdogs) && eventData?.sheepdogs.includes(username)) {
      setDoc(eventRef, {
        eventCheckInSheepdogs: arrayUnion(username),
        eventCheckInSheepdogsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the sprinters array
    if (Array.isArray(eventData?.sprinters) && eventData?.sprinters.includes(username)) {
      setDoc(eventRef, {
        eventCheckInSprinters: arrayUnion(username),
        eventCheckInSprintersTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the caboose array
    if (Array.isArray(eventData?.caboose) && eventData?.caboose.includes(username)) {
      setDoc(eventRef, {
        eventCheckInCaboose: arrayUnion(username),
        eventCheckInCabooseTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the members array
    if (Array.isArray(eventData?.members) && eventData?.members.includes(username)) {
      setDoc(eventRef, {
        eventCheckInMembers: arrayUnion(username),
        eventCheckInMembersTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the leader array
    if (eventData?.leader.includes(username)) {
      setDoc(eventRef, {
        eventCheckInLeader: arrayUnion(username),
        eventCheckInLeaderTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // re-direct users to the event page
    history.push(`/map/${eventData?.id}`);
  };

  const isBikeBus = routeData?.isBikeBus ?? false;

  useEffect(() => {
    console.log("Google Maps script loaded: ", isLoaded);
    console.log("Google Maps load error: ", loadError);
  }, [isLoaded, loadError]);

  if (loadError) {
    return <div>Error loading Google Maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading Google Maps...</div>;
  }


  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        <IonGrid className="ion-no-padding">
          <IonRow className="map-base" id="map-container">
            <GoogleMap
              onLoad={(map) => {
                mapRef.current = map;
                setMapLoaded(true);
              }}
              mapContainerStyle={{
                width: "100%",
                height: "100%",
              }}
              center={mapCenter}
              zoom={mapZoom}
              options={{
                disableDefaultUI: true,
                zoomControl: false,
                mapTypeControl: false,
                disableDoubleClickZoom: true,
                maxZoom: 18,
                styles: [
                  {
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#f5f5f5"
                      }
                    ]
                  },
                  {
                    "elementType": "labels.icon",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#616161"
                      }
                    ]
                  },
                  {
                    "elementType": "labels.text.stroke",
                    "stylers": [
                      {
                        "color": "#f5f5f5"
                      }
                    ]
                  },
                  {
                    "featureType": "administrative",
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "administrative.land_parcel",
                    "elementType": "labels",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "administrative.land_parcel",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#bdbdbd"
                      }
                    ]
                  },
                  {
                    "featureType": "administrative.neighborhood",
                    "elementType": "geometry.fill",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "administrative.neighborhood",
                    "elementType": "labels.text",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "poi",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "poi",
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#eeeeee"
                      }
                    ]
                  },
                  {
                    "featureType": "poi",
                    "elementType": "labels.text",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "poi",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#757575"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.park",
                    "stylers": [
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.park",
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#e5e5e5"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.park",
                    "elementType": "geometry.fill",
                    "stylers": [
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "stylers": [
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "elementType": "geometry.fill",
                    "stylers": [
                      {
                        "color": "#ffd800"
                      },
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "elementType": "geometry.stroke",
                    "stylers": [
                      {
                        "color": "#ffd800"
                      },
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "elementType": "labels",
                    "stylers": [
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "elementType": "labels.text",
                    "stylers": [
                      {
                        "visibility": "on"
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "visibility": "on"
                      },
                      {
                        "weight": 5
                      }
                    ]
                  },
                  {
                    "featureType": "poi.school",
                    "elementType": "labels.text.stroke",
                    "stylers": [
                      {
                        "visibility": "on"
                      },
                      {
                        "weight": 3.5
                      }
                    ]
                  },
                  {
                    "featureType": "road",
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#ffffff"
                      },
                      {
                        "visibility": "simplified"
                      }
                    ]
                  },
                  {
                    "featureType": "road",
                    "elementType": "labels.icon",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "road.arterial",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#757575"
                      }
                    ]
                  },
                  {
                    "featureType": "road.highway",
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#dadada"
                      }
                    ]
                  },
                  {
                    "featureType": "road.highway",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#616161"
                      }
                    ]
                  },
                  {
                    "featureType": "road.local",
                    "elementType": "labels",
                    "stylers": [
                      {
                        "visibility": "off"
                      }
                    ]
                  },
                  {
                    "featureType": "road.local",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#9e9e9e"
                      }
                    ]
                  },
                  {
                    "featureType": "transit",
                    "elementType": "geometry.fill",
                    "stylers": [
                      {
                        "saturation": -50
                      },
                      {
                        "lightness": 50
                      }
                    ]
                  },
                  {
                    "featureType": "water",
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#c9c9c9"
                      }
                    ]
                  },
                  {
                    "featureType": "water",
                    "elementType": "labels.text.fill",
                    "stylers": [
                      {
                        "color": "#9e9e9e"
                      }
                    ]
                  }
                ],
              }}
            >
              {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                <div>
                  <Polyline
                    path={pathCoordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }))}
                    options={{
                      strokeColor: "#FFD800",
                      strokeOpacity: 1.0,
                      strokeWeight: 2,
                      geodesic: true,
                      editable: false,
                      draggable: false,
                      icons: [
                        {
                          icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            strokeColor: "#ffd800", // Main line color
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            fillColor: "#ffd800",
                            fillOpacity: 1,
                            scale: 3,
                          },
                          offset: "100%",
                          repeat: "100px",
                        },
                      ],
                    }}
                  />
                  {bikeBusStops && bikeBusStops.length > 0 && bikeBusStops.map((stop, index) => (
                    <Marker
                      key={index}
                      position={{ lat: stop.lat, lng: stop.lng }}
                      icon={{
                        url: '/assets/markers/stop-outline.svg',
                        scaledSize: new google.maps.Size(30, 30),
                      }}
                    />
                  ))}
                </div>
              )}
              <div>
                <IonGrid>
                  <IonRow>
                    <IonCol>
                      {isBikeBus && (
                        <IonButton routerLink={`/bikebusgrouppage/${eventData?.groupId.id}`}>Back to BikeBus</IonButton>
                      )}
                      {!isBikeBus && (
                        <IonButton routerLink="/map">Back to Map</IonButton>
                      )}
                      {!isEventEnded && (
                      <IonButton onClick={() => setShowRSVPModal(true)}>RSVP to be there!</IonButton>
                      )}
                      <IonModal isOpen={showRSVPModal}>
                        <IonHeader>
                          <IonToolbar>
                            <IonTitle>Select a Role</IonTitle>
                          </IonToolbar>
                        </IonHeader>
                        <IonContent>
                          <IonList>
                            <IonItem>
                              <IonCheckbox slot="start" value="leader" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Leader: Schedules the BikeBus, makes adjustments to the route and starts the BikeBus in the app. </IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="members" disabled checked />
                              <IonLabel>Members: Everyone is considered a member of the BikeBus Event when they make an RSVP to an Event.</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="captains" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Captains: Front of the BikeBus and keeping track of time.</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="sheepdogs" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Sheepdogs: Ride alongside the BikeBus, keeping the group together.</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="sprinters" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Sprinters: Ride back and forth to help block intersections when encountered. When the BikeBus has cleared the intersection, head to the front.</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="parents" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Parents: Parents can help their Kid RSVP for an event or help other kids enjoy the BikeBus.</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="kids" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Kids: Be safe and have fun!</IonLabel>
                            </IonItem>
                            <IonItem>
                              <IonCheckbox slot="start" value="caboose" onIonChange={e => handleRoleChange(e.detail.value)} />
                              <IonLabel>Caboose: Keep to the back to handle any stragglers</IonLabel>
                            </IonItem>
                          </IonList>
                          <IonButton onClick={() => setShowRSVPModal(false)}>Close</IonButton>
                          <IonButton onClick={handleRSVP}>RSVP with these Roles</IonButton>
                        </IonContent>
                      </IonModal>
                      
                      {!isEventEnded && (
                      <IonButton onClick={() => setShowRSVPListModal(true)}>See who's RSVP'd</IonButton>
                      )}
                      <IonModal isOpen={showRSVPListModal}>
                        <IonHeader>
                          <IonToolbar>
                            <IonTitle>RSVP List</IonTitle>
                          </IonToolbar>
                        </IonHeader>
                        <IonContent>
                          <IonList>
                            <IonItem>
                              <IonLabel>Leader</IonLabel>
                              {eventData?.leader}
                            </IonItem>
                            <IonItem>
                              <IonLabel>Members</IonLabel>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <IonButton onClick={() => setShowMembersModal(true)} fill="clear" style={{}}>
                                  {membersId.slice(0, 5).map((member, index) => (
                                    <IonChip key={index}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <Avatar uid={member?.uid} size="extrasmall" />
                                      </div>
                                    </IonChip>
                                  ))}
                                  {membersId.length > 5 && (
                                    <IonChip>
                                      <IonLabel>{membersId.length}</IonLabel>
                                    </IonChip>
                                  )}
                                </IonButton>
                              </div>
                            </IonItem>
                            <IonModal isOpen={showMembersModal}>
                              <IonHeader>
                                <IonToolbar>
                                  <IonTitle>Members</IonTitle>
                                </IonToolbar>
                              </IonHeader>
                              <IonContent>
                                <IonList>
                                  {membersId.map((member, index) => (
                                    <IonItem key={index}>
                                      <Avatar uid={member?.uid} />
                                      <IonLabel>{username}</IonLabel>
                                    </IonItem>
                                  ))}
                                </IonList>
                                <IonButton expand="full" fill="clear" onClick={() => setShowMembersModal(false)}>Cancel</IonButton>
                              </IonContent>
                            </IonModal>
                            <IonItem>
                              <IonLabel>Captains</IonLabel>
                              {captains.map((username: string, index: number) => (
                                <IonLabel key={index}>{username}</IonLabel>
                              ))}
                            </IonItem>
                            <IonItem>
                              <IonLabel>Sheepdogs</IonLabel>
                              {sheepdogs.map((username: string, index: number) => (
                                <IonLabel key={index}>{username}</IonLabel>
                              ))}
                            </IonItem>
                            <IonItem>
                              <IonLabel>Sprinters</IonLabel>
                              {sprinters.map((username: string, index: number) => (
                                <IonLabel key={index}>{username}</IonLabel>
                              ))}
                            </IonItem>
                            <IonItem>
                              <IonLabel>Parents</IonLabel>
                              {parents.map((username: string, index: number) => (
                                <IonLabel key={index}>{username}</IonLabel>
                              ))}
                            </IonItem>
                            <IonItem>
                              <IonLabel>Kids</IonLabel>
                              {kids.map((username: string, index: number) => (
                                <IonLabel key={index}>{username}</IonLabel>
                              ))}
                            </IonItem>
                            <IonItem>
                              <IonLabel>Caboose</IonLabel>
                              {caboose.map((username: string, index: number) => (
                                <IonLabel key={index}>{username}</IonLabel>
                              ))}
                            </IonItem>
                          </IonList>
                          <IonButton onClick={() => setShowRSVPListModal(false)}>Close</IonButton>
                        </IonContent>
                      </IonModal>
                      {isEventEnded && (
                        <IonButton routerLink="/eventsummary/:id">Event Summary</IonButton>
                      )}
                      {isEventLeader && !isEventActive && !isEventEnded && (
                        <IonButton color={'success'} onClick={toggleStartEvent}>Start BikeBus Event</IonButton>
                      )}
                      {!isEventLeader && isEventActive && (
                        <IonButton onClick={toggleJoinEvent}>CheckIn to BikeBus Event!</IonButton>
                      )}
                      {isEventLeader && isEventActive && (
                        <IonButton routerLink={`/Map/${id}`}>Go to Event</IonButton>
                      )}
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                  <Marker
                    position={selectedStartLocation}
                    icon={{
                      url: "/assets/markers/MarkerA.svg",
                      scaledSize: new google.maps.Size(20, 20),
                    }}
                  />
                )}
                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                  <Marker position={selectedEndLocation}
                    icon={{
                      url: "/assets/markers/MarkerB.svg",
                      scaledSize: new google.maps.Size(20, 20),
                    }}
                  />
                )}
              </div>
              <div>
              </div>
              <div>
                <IonGrid className="bikebus-event-name">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{eventData?.BikeBusName}</IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                <IonGrid className="bikebus-event-route">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{routeData?.routeName}</IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                <IonGrid className="bikebus-event-time">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{startTime} to
                      </IonLabel>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>
                      <IonLabel>{endTime}
                      </IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
            </GoogleMap>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default Event;
