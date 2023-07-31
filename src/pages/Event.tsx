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
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import './About.css';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc, setDoc, arrayUnion, onSnapshot, collection, where, getDocs, query, addDoc, serverTimestamp, updateDoc, DocumentReference } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useParams } from "react-router-dom";
import { useHistory } from 'react-router-dom';
import { create } from 'domain';
import { set } from 'date-fns';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import React from 'react';


const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusGroup {
  id: string;
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
  const [members, setMembers] = useState<string[]>([]);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [bikeBusGroupData, setBikeBusGroupData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<string[]>([]);

  const [caboose, setCaboose] = useState<string[]>([]);
  const [captains, setCaptains] = useState<string[]>([]);
  const [kids, setKids] = useState<string[]>([]);
  const [parents, setParents] = useState<string[]>([]);
  const [sheepdogs, setSheepdogs] = useState<string[]>([]);
  const [sprinters, setSprinters] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [leader, setLeader] = useState<string>('');
  const [showJoinBikeBus, setShowJoinBikeBus] = useState<boolean>(false);
  const [RouteId, setRouteId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [routeData, setRouteData] = useState<any>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [eventDataForCreateTrip, setEventDataForCreateTrip] = useState<any>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [leadersId, setLeadersId] = useState<FetchedUserData[]>([]);
  const [membersId, setMembersId] = useState<FetchedUserData[]>([]);
  const [cabooseId, setCabooseId] = useState<FetchedUserData[]>([]);
  const [captainsId, setCaptainsId] = useState<FetchedUserData[]>([]);
  const [kidsId, setKidsId] = useState<FetchedUserData[]>([]);
  const [parentsId, setParentsId] = useState<FetchedUserData[]>([]);
  const [sheepdogsId, setSheepdogsId] = useState<FetchedUserData[]>([]);
  const [sprintersId, setSprintersId] = useState<FetchedUserData[]>([]);
  const [tripRefid, setTripRefid] = useState<string>('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "";

  useEffect(() => {
    const fetchUsernames = async (role: string[], setRole: Function) => {
      if (role) {
        const promises = role.map(fetchUser);
        const users = await Promise.all(promises);
        setRole(users.map(user => user?.username));
      }
    };


    if (eventData) {
      fetchUsernames(eventData.leader || '', setLeader);
      fetchUsernames(eventData.members || [], setMembers);
      fetchUsernames(eventData.caboose || [], setCaboose);
      fetchUsernames(eventData.captains || [], setCaptains);
      fetchUsernames(eventData.kids || [], setKids);
      fetchUsernames(eventData.parents || [], setParents);
      fetchUsernames(eventData.sheepdogs || [], setSheepdogs);
      fetchUsernames(eventData.sprinters || [], setSprinters);
    }

    const fetchUserids = async (role: string[], setRole: Function) => {
      if (role) {
        const promises = role.map(fetchUser);
        const users = await Promise.all(promises);
        setRole(users);
      }
    }

    if (eventData) {
      fetchUserids(eventData.leader || '', setLeadersId);
      fetchUserids(eventData.members || '', setMembersId);
      fetchUserids(eventData.caboose || '', setCabooseId);
      fetchUserids(eventData.captains || '', setCaptainsId);
      fetchUserids(eventData.kids || '', setKidsId);
      fetchUserids(eventData.parents || '', setParentsId);
      fetchUserids(eventData.sheepdogs || '', setSheepdogsId);
      fetchUserids(eventData.sprinters || '', setSprintersId);
    }
  }, [eventData]);


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

  const history = useHistory();

  useEffect(() => {
    const fetchEvent = async () => {
      const docRef = doc(db, 'event', id);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        setEventData(docSnapshot.data());
        // fetch the BikeBusGroup data after the event data has been fetched
        const fetchBikeBusGroup = async () => {
          const groupDocSnapshot = await getDoc(docSnapshot.data().BikeBusGroup);
          if (groupDocSnapshot.exists()) {
            const bikeBusGroupData = groupDocSnapshot.data() as BikeBusGroup;
            setBikeBusGroupData(bikeBusGroupData);
            const RouteId = bikeBusGroupData.BikeBusRoutes[0].id;
            console.log('RouteId is ', RouteId);
            setRouteId(RouteId);
            // also set the RouteId to be the selectedRoute
            const selectedRoute = routes.find((route) => route.id === RouteId);
            // get the document from the routes collection that matches the RouteId, then set the selectedRoute to that document
            setSelectedRoute(selectedRoute || null);
            console.log('selectedRoute is ', selectedRoute);
            // get the route data from the selectedRoute
            const routeData = selectedRoute;
            console.log('routeData is ', routeData);
            // set the routeData to the routeData
            setRouteData(routeData);
            // get the group id from the bikeBusGroupData
            const groupId = bikeBusGroupData.id;
            console.log('groupId is ', groupId);
            // set the groupId to the groupId
            setGroupId(groupId);
          }
           else {
          }
        };
        fetchBikeBusGroup();
      }
    };
    fetchEvent();
  }, [id]);

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
  }, [user]);

  function isRouteData(data: unknown): data is RouteData {
    return !!(data && typeof data === 'object' && 'BikeBusName' in data);
  }


  const createTrip = useCallback(async () => {

    console.log('createTrip is running!');
    let routeData: RouteData | undefined;
    let groupData;

    const docRefEvent = doc(db, 'event', id);
    const docEventsnapshot = await getDoc(docRefEvent);
    console.log('docEventsnapshot is ', docEventsnapshot);

    if (docEventsnapshot.exists()) {
      const eventDataForCreateTrip = docEventsnapshot.data();
      if (eventDataForCreateTrip) {
        const groupRef = eventDataForCreateTrip?.BikeBusGroup;
        const docSnapshotgroup = await getDoc(groupRef);

        if (docSnapshotgroup.exists()) {
          groupData = docSnapshotgroup.data();
        }
        console.log('groupData is ', groupData);

        const routeRef = eventDataForCreateTrip?.route;
        const docSnapshotroute = await getDoc(routeRef);
        console.log('docSnapshotroute is ', docSnapshotroute);
        console.log('routeRef is ', routeRef);

        if (docSnapshotroute.exists()) {
          const data = docSnapshotroute.data();
          console.log('route data before type check:', data);
          if (isRouteData(data)) {
            routeData = data as RouteData;
          }
          console.log('routeData is ', routeData);
        }

        if (routeData && groupData) {
          console.log('routeData is ', routeData);
          console.log('groupData is ', groupData);
          const tripsRef = collection(db, 'trips');
          const docRef = await addDoc(tripsRef, {
            // wait until all of the values are set in the trip document before continuing
            // check to see if the trip document has been created and the values for event have been saved
            eventId: id,
            BikeBusStops: routeData?.BikeBusStop || [],
            leader: user?.uid || '',
            members: eventData?.members || [],
            caboose: eventData?.caboose || [],
            captains: eventData?.captains || [],
            kids: eventData?.kids || [],
            parents: eventData?.parents || [],
            sheepdogs: eventData?.sheepdogs || [],
            sprinters: eventData?.sprinters || [],
            startTimestamp: eventData?.startTimestamp || '',
            endTimestamp: eventData?.endTime || null,
            status: eventData?.status || 'active',
            BikeBusName: eventData?.BikeBusName || '',
            route: eventData?.route || '',
            groupId: eventData?.groupId || '',
            groupSize: '',
            tripLeader: eventData?.leader || [],
            tripMembers: eventData?.members || [],
            tripCaboose: eventData?.caboose || [],
            tripCaptains: eventData?.captains || [],
            tripKids: eventData?.kids || [],
            tripParents: eventData?.parents || [],
            tripSheepdogs: eventData?.sheepdogs || [],
            tripSprinters: eventData?.sprinters || [],
            tripStartTimestamp: eventData?.startTimestamp || '',
            tripEndTimestamp: eventData?.endTime || null,
            tripStatus: eventData?.status || 'active',
            tripBikeBusName: eventData?.BikeBusName || '',
            tripRoute: eventData?.route || '',
            tripGroupId: eventData?.groupId || '',
            tripGroupSize: '',
            tripCheckInLeader: eventData?.leader || '',
            tripcheckInLeaderTimeStamp: serverTimestamp(),
            tripCheckInMembers: '',
            tripCheckInMembersTimeStamp: '',
            tripCheckInCaboose: '',
            tripCheckInCabooseTimeStamp: '',
            tripCheckInCaptains: '',
            tripCheckInCaptainsTimeStamp: '',
            tripCheckInKids: '',
            tripCheckInKidsTimeStamp: '',
            tripCheckInParents: '',
            tripCheckInParentsTimeStamp: '',
            tripCheckInSheepdogs: '',
            tripCheckInSheepdogsTimeStamp: '',
            tripCheckInSprinters: '',
            tripCheckInSprintersTimeStamp: '',
            // for the tripCheckInStartTimestamp, we're going to use the time when the leader clicked on the "Start Trip" button
            tripCheckInStartTimestamp: serverTimestamp(),
            // for the tripCheckInEndTimestamp, we're going to use the time when the leader clicked on the "End Trip" button
            tripCheckInEndTimestamp: '',
            tripCheckInStatus: '',
            tripCheckInBikeBusName: eventData?.BikeBusName || '',
            tripCheckInRoute: eventData?.route || '',
            tripCheckInGroupId: eventData?.groupId || '',
            tripCheckInGroupSize: '',
            tripEndTripLeader: '',
            tripEndTripLeaderTimeStamp: '',
            tripEndTripMembers: '',
            tripEndTripMembersTimeStamp: '',
            tripEndTripCaboose: '',
            tripEndTripCabooseTimeStamp: '',
            tripEndTripCaptains: '',
            tripEndTripCaptainsTimeStamp: '',
            tripEndTripKids: '',
            tripEndTripKidsTimeStamp: '',
            tripEndTripParents: '',
            tripEndTripParentsTimeStamp: '',
            tripEndTripSheepdogs: '',
            tripEndTripSheepdogsTimeStamp: '',
            tripEndTripSprinters: '',
            tripEndTripSprintersTimeStamp: '',
            tripEndTripEndTimestamp: '',
            tripEndTripStatus: '',
            tripEndTripBikeBusName: '',
            tripEndTripRoute: '',
            tripEndTripGroupId: '',
            tripEndTripGroupSize: '',
          });
          console.log('Document written with ID: ', docRef.id);

          const tripRefid = docRef.id;
          setTripRefid(tripRefid);
          // save that trip id to the event document as tripId
          const eventRef = doc(db, 'event', id);
          await updateDoc(eventRef, {
            tripId: tripRefid
          });
          // redirect to the trip page with the trip id being the "tripId" parameter
          history.push(`/trips/${tripRefid}`);
        }
      } else {
        // doc.data() will be undefined in this case
        console.log('No such document!');
      }
    }
  }, [id, user?.uid, eventData?.members, eventData?.caboose, eventData?.captains, eventData?.kids, eventData?.parents, eventData?.sheepdogs, eventData?.sprinters, eventData?.startTimestamp, eventData?.endTime, eventData?.status, eventData?.BikeBusName, eventData?.route, eventData?.groupId, eventData?.leader, history]);



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
      console.log("No user is logged in or username is not loaded yet!");
      return;
    }

    if (!role || role.length === 0) {
      // set the role to members if no role is selected
      setRole(['members']);
      console.log("No role is selected!");
      return;
    }

    const eventRef = doc(db, 'event', id);

    // Iterate through roles and add the user to each of them
    for (let r of role) {
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
        console.log('members is ', eventData.members);
      }
    }

    // Clear the role selection and hide the modal
    setRole([]);
    setShowModal(false);
  };

  useEffect(() => {
    const docRef = doc(db, 'event', id);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      setEventData(doc.data());
    });

    return () => unsubscribe();  // Clean up listener on unmount
  }, [id]);

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

  const setShowStartBikeBus = (value: boolean) => {
    setShowJoinBikeBus(value);
    console.log('setShowJoinBikeBus is ', value);
  };

  const toggleEventStatus = useCallback(async (status: string) => {
    const docRef = doc(db, 'event', id);
    await setDoc(docRef, {
      status: status
    }, { merge: true });
    // check to see if the event already has the status of active, if not, set the status to active and trigger the createTrip function
    if (status === '' || status === 'inactive') {
      setEventData((prevEventData: any) => ({ ...prevEventData, status: '' }));
      setShowStartBikeBus(true);
      console.log('setShowStartBikeBus is true!');
      setShowJoinBikeBus(false);
      console.log('setShowJoinBikeBus is false!');
    } else
      if (status === 'active') {
        setEventData((prevEventData: any) => ({ ...prevEventData, status: 'active' }));
        createTrip();
        //setShowJoinBikeBus(true);
        //console.log('setShowJoinBikeBus is true!');
        //setShowStartBikeBus(false);
        //console.log('setShowStartBikeBus is false!');
      }
  }, [createTrip, id]);

  // if toggleEventStatus is equal to active, then set the is eventActive to true

  const toggleStartEvent = useCallback(() => (
    toggleEventStatus('active'),
    console.log('toggleStartEvent is active!')
  ), [toggleEventStatus]);

  // in case the leader forgets to manually start the BikeBus, 
  // create a async function to get the users' current time and date and measure that against the event start time and date
  const checkEventTime = useCallback(() => {
    // get the current time and date
    const now = new Date();
    // get the event start time and date
    const eventStart = eventData?.startTimestamp?.toDate();
    // check to see if the event start time and date is before the current time and date and within 30 minutes of the current time and date
    if (eventStart && eventStart < now && eventStart > new Date(now.getTime() - 15 * 60000)) {
      // show the join bikebus button
      console.log('The event is active!');
      setShowJoinBikeBus(true);
      console.log('setShowJoinBikeBus is true!');
      // if the event start time and date is before the current time and date and within 30 minutes of the current time and date, toggle the event status to active when it's the eventData?.startTimestamp
      if (eventData?.startTimestamp) {
        toggleStartEvent();
      }
      // and trigger the createTrip function
      // build a function to create a new trip document in the trips collection
    }
  }, [eventData?.startTimestamp, toggleStartEvent]);

  // when page loads, do the checkEventTime function
  useEffect(() => {
    fetchSingleRoute(eventData?.route);
    checkEventTime();
    // check the event time every 30 seconds
    const interval = setInterval(() => {
      checkEventTime();
    }
      , 30000);

    // when the page unloads, clear the interval
    return () => clearInterval(interval);

  }, [checkEventTime, eventData?.route]);

  const toggleJoinEvent = () => {
    console.log('toggleJoinEvent is running!');
    console.log('eventData is ', eventData);
    console.log('eventData?.tripId is ', eventData?.tripId);
    const tripsRef = doc(db, 'trips', eventData?.tripId);
    console.log('tripsRef is ', tripsRef);
    setDoc(tripsRef, {
      JoinedMembers: arrayUnion(username)
    }, { merge: true });
    // find any other of user's ids in the event add them to the appropriate role arrays
    // if the user is a parent in the eventData field parents, add them to the parents array
    if (Array.isArray(eventData?.parents) && eventData?.parents.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInParents: arrayUnion(username),
        tripCheckInParentsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the kids array
    if (Array.isArray(eventData?.kids) && eventData?.kids.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInKids: arrayUnion(username),
        tripCheckInKidsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the captains array
    if (Array.isArray(eventData?.captains) && eventData?.captains.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInCaptains: arrayUnion(username),
        tripCheckInCaptainsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the sheepdogs array
    if (Array.isArray(eventData?.sheepdogs) && eventData?.sheepdogs.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInSheepdogs: arrayUnion(username),
        tripCheckInSheepdogsTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the sprinters array
    if (Array.isArray(eventData?.sprinters) && eventData?.sprinters.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInSprinters: arrayUnion(username),
        tripCheckInSprintersTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the caboose array
    if (Array.isArray(eventData?.caboose) && eventData?.caboose.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInCaboose: arrayUnion(username),
        tripCheckInCabooseTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // do the same as parents to the members array
    if (Array.isArray(eventData?.members) && eventData?.members.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInMembers: arrayUnion(username),
        tripCheckInMembersTimeStamp: serverTimestamp()
      }, { merge: true });
      console.log('members is ', eventData.members);
      console.log('tripCheckInMembers is ', eventData.tripCheckInMembers);
      console.log('tripCheckInMembersTimeStamp is ', eventData.tripCheckInMembersTimeStamp);
    }
    // do the same as parents to the leader array
    if (eventData?.leader.includes(username)) {
      setDoc(tripsRef, {
        tripCheckInLeader: arrayUnion(username),
        tripCheckInLeaderTimeStamp: serverTimestamp()
      }, { merge: true });
    }
    // re-direct users to the trip page
    history.push(`/trips/${eventData?.tripId}`);
  };

  // we need to get the routeId from the bikeBusGroupData

  const fetchSingleRoute = async (RouteId: any) => {
    console.log('fetchSingleRoute is running!')
    console.log('RouteId is ', RouteId)
    const docRef = doc(db, 'routes', RouteId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const routeData = {
        ...docSnap.data() as Route,
        id: docSnap.id,
        isBikeBus: docSnap.data().isBikeBus,
        startPoint: docSnap.data().startPoint,
        endPoint: docSnap.data().endPoint,
        BikeBusGroupId: docSnap.data().BikeBusGroupId,
        // convert BikeBusGroupId (document reference in firebase) to a string
        pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
          lat: coord.lat,  // use 'lat' instead of 'latitude'
          lng: coord.lng,  // use 'lng' instead of 'longitude'
        })),
        BikeBusStationsIds: (docSnap.data().BikeBusStationsIds || []).map((coord: any) => ({
          lat: coord.lat,  // use 'lat' instead of 'latitude'
          lng: coord.lng,  // use 'lng' instead of 'longitude'
        })),
        BikeBusStops: (docSnap.data().BikeBusStop || []).map((coord: any) => ({
          lat: coord.lat,  // use 'lat' instead of 'latitude'
          lng: coord.lng,  // use 'lng' instead of 'longitude'
        })),
      };
      setSelectedRoute(routeData);
      setBikeBusGroupId(routeData.BikeBusGroupId);
      console.log(routeData);
      console.log(routeData.BikeBusGroupId);
      // setBikeBusGroup(routeData.BikeBusGroupId); is a document reference. Convert it to a string
      setPath(routeData.pathCoordinates);
      setBikeBusStops(routeData.BikeBusStops);
      setStartGeo(routeData.startPoint);
      setEndGeo(routeData.endPoint);
      // test if the route is a bikebus
      if (routeData.isBikeBus) {
        console.log("This is a bike bus route");
        console.log(routeData.BikeBusGroupId);
        // fetch the bikebus group data
        const docRef = doc(db, 'bikeBusGroups', routeData.BikeBusGroupId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const bikeBusGroupData = {
            ...docSnap.data() as BikeBusGroup,
            id: docSnap.id,
          };
          setBikeBusGroup(bikeBusGroupData);
          console.log(bikeBusGroupData);
        } else {
          // doc.data() will be undefined in this case
          console.log("No such document!");
        }
      }


    }
  };

  const isBikeBus = selectedRoute?.isBikeBus ?? false;

  useEffect(() => {
    if (selectedRoute) {
      setMapCenter({
        lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
        lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
      });
      setStartGeo(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
    }
  }
    , [selectedRoute]);

  console.log('selectedRoute is ', selectedRoute);
  console.log('RouteId is ', RouteId);

  function createStaticMapUrl(mapCenter: { lat: number; lng: number } , selectedRoute: RouteData | null, startGeo: Coordinate, endGeo: Coordinate, apiKey: string) {
    const center = `${mapCenter.lat},${mapCenter.lng}`;
    const size = '1000x60';
    const path = routeData?.pathCoordinates
      .map((coord: { lat: any; lng: any; }) => `${coord.lat},${coord.lng}`)
      .join('|');
    const markers = [
      `markers=color:red|label:S|${startGeo.lat},${startGeo.lng}`,
      `markers=color:green|label:E|${endGeo.lat},${endGeo.lng}`,
    ];
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=12&size=${size}&path=color:0x00000000|weight:5|${path}&path=color:0xFFFF00FF|weight:3|${path}&${markers.join('&')}&key=${apiKey}`;
    return url;
  }
  

  return (
    <IonPage className="ion-flex-offset-app">
    <IonContent fullscreen>
          <IonLabel>{eventData?.BikeBusName}</IonLabel>
          <IonItem>
            <IonLabel>{startTime} to {endTime}</IonLabel>
          </IonItem>
          <IonRow>
                <IonCard >
                  <IonCardContent>
                      <IonRow className="static-map-event">
                        <IonCol>
                          <IonImg onClick={() => window.open(createStaticMapUrl(mapCenter, selectedRoute, startGeo, endGeo, apiKey), '_blank')}
                           src={createStaticMapUrl(mapCenter, selectedRoute, startGeo, endGeo, apiKey)} />
                        </IonCol>
                      </IonRow>
                  </IonCardContent>
                </IonCard>
          </IonRow>
            {isEventLeader && (
              <IonButton onClick={toggleStartEvent}>Start BikeBus Event</IonButton>
            )}
            {!isEventLeader && isEventActive && (
              <IonButton onClick={toggleJoinEvent}>CheckIn to BikeBus Event!</IonButton>
            )}
            {isEventLeader && isEventActive && (
              <IonButton routerLink={`/trips/${eventData?.tripId}`}>Go to Trip</IonButton>
            )}
          <IonButton onClick={() => setShowModal(true)}>RSVP to be there!</IonButton>
          <IonModal isOpen={showModal}>
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
              <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              <IonButton onClick={handleRSVP}>RSVP with these Roles</IonButton>
            </IonContent>

          </IonModal>
          <IonItem>
            <IonLabel>Roles in the BikeBus</IonLabel>
          </IonItem>
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
        <IonButton routerLink={`/bikebusgrouppage/${eventData?.BikeBusGroup.id}`}>Back to BikeBus</IonButton>
      </IonContent>
    </IonPage >
  );
};

export default Event;
