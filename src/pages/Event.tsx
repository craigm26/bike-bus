/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
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
  IonGrid,
  IonRouterLink,
  IonDatetime,
  IonTextarea,
  IonText,
  IonCardSubtitle,
  IonIcon,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { doc, getDoc, setDoc, arrayUnion, onSnapshot, collection, where, getDocs, query, serverTimestamp, updateDoc, DocumentReference, Timestamp, GeoPoint, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useParams, useHistory } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api';
import QRCode from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
// import sidebarevent from '../components/Mapping/SidebarEvent';
import SidebarEvent from '../components/Mapping/SidebarEvent';
import { bicycle, pauseCircle, playCircle, stopCircle } from 'ionicons/icons';
import WeatherForecast from '../components/WeatherForecast';



const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];


interface BikeBusGroupData {
  name: string;
  description: string;
  BikeBusRoutes: { id: string }[];
}

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteLeg {
  startPoint: Coordinate | google.maps.LatLng;
  endPoint: Coordinate | google.maps.LatLng;
  distance?: string;
  duration?: string;
}


interface BikeBusStop {
  BikeBusGroup: DocumentReference;
  BikeBusRouteId: string;
  BikeBusStopName: string;
  id: string;
  location: GeoPoint;
  placeId: string;
  photos: string;
  formattedAddress: string;
  placeName: string;
  order: number;
}
interface Route {
  eventCheckInLeader: any;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number, lng: number };
  pathCoordinates: {
    latitude: any;
    longitude: any; lat: number; lng: number
  }[];
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  routeName: string;
  routeType: string;
  routeCreator: DocumentReference;
  routeLeader: DocumentReference;
  description: string;
  travelMode: string;
  isBikeBus: boolean;
  BikeBusName: string;
  BikeBusStops: BikeBusStop[];
  legs: RouteLeg[];
  BikeBusGroup: DocumentReference;
  id: string;
  accountType: string;
  bicylingSpeed: string;
  bicyclingSpeedSelector: string;
  routeId: string;
  name: string;
  distance: string;
  duration: string;
  arrivalTime: string;
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

interface Forecast {
  temperature: number;
  weather: string;
  time: Date;
}



const Event: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);

  const [members, setMembers] = useState<string[]>([]);
  const [accountType, setaccountType] = useState<string>('');
  const { id } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [showRSVPListModal, setShowRSVPListModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
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
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [leadersId, setLeadersId] = useState<FetchedUserData[]>([]);
  const [membersId, setMembersId] = useState<FetchedUserData[]>([]);
  const [cabooseId, setCabooseId] = useState<FetchedUserData[]>([]);
  const [captainsId, setCaptainsId] = useState<FetchedUserData[]>([]);
  const [kidsId, setKidsId] = useState<FetchedUserData[]>([]);
  const [parentsId, setParentsId] = useState<FetchedUserData[]>([]);
  const [sheepdogsId, setSheepdogsId] = useState<FetchedUserData[]>([]);
  const [sprintersId, setSprintersId] = useState<FetchedUserData[]>([]);
  const [route, setroute] = useState<Route | null>(null);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [startAddress, setStartAddress] = useState<string>('');
  const [endAddress, setEndAddress] = useState<string>('');
  const [bikeBusGroupId, setBikeBusGroupId] = useState<string>('');
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [pathCoordinates, setPathCoordinates] = useState<LatLngCoordinate[]>([]);
  const [selectedEndLocation, setSelectedEndLocation] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [selectedStartLocation, setSelectedStartLocation] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const [mapLoaded, setMapLoaded] = useState(false);

  const [showStartDateTimeModal, setShowStartDateTimeModal] = useState(false);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [expectedDuration, setExpectedDuration] = useState<any>(0);
  const [eventEndTime, setEventEndTime] = useState<string>('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);
  const [routeLegsEnabled, setRouteLegsEnabled] = useState(false);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(13);
  const [timingSidebarEnabled, setTimingSidebarEnabled] = useState(true);
  const [weatherForecastEnabled, setWeatherForecastEnabled] = useState(true);
  const [weatherForecastType, setWeatherForecastType] = useState<string>('hourly');



  type SetRoleFunction = (role: string[]) => void;

  type SetRoleDataFunction = (role: FetchedUserData[]) => void;


  const fetchBikeBusStops = async () => {
    if (!RouteId) {
      console.error("RouteId is not set. Cannot fetch BikeBusStops.");
      return;
    }
    console.log(`Fetching BikeBusStops with RouteId: ${RouteId}`);
    const BikeBusStopsSnapshot = await getDocs(collection(db, `routes/${RouteId}/BikeBusStops`));
    const BikeBusStops: BikeBusStop[] = BikeBusStopsSnapshot.docs.map(doc => {
      const data = doc.data() as BikeBusStop;
      return {
        ...data,
        id: doc.id,
        location: data.location as GeoPoint,
      };
    });
    setBikeBusStops(BikeBusStops);

    // since we're setting BikeBusStops, let's also fetch the existing legs of the route
    const legsSnapshot = await getDocs(collection(db, `routes/${RouteId}/legs`));
    console.log('legsSnapshot', legsSnapshot);
    const legs = legsSnapshot.docs.map(doc => doc.data() as RouteLeg);
    console.log('legs', legs);
    setRouteLegs(legs);
    console.log('routeLegs', routeLegs);

  };




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
        const newEventData = { ...eventData };
        setEventData(newEventData);
        return eventData; // Return eventData for further use
      }
      return null;
    };
    const fetchRoute = async (routeId: string) => {
      const docRouteRef = doc(db, 'routes', routeId);
      setRouteId(routeId);
      const docRouteSnapshot = await getDoc(docRouteRef);
      if (docRouteSnapshot.exists()) {
        const route = docRouteSnapshot.data() as Route;
        setroute(route);
        setPath(route.pathCoordinates);
        setStartAddress(route.startPointAddress);
        setEndAddress(route.endPointAddress);
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
          fetchBikeBusStops();
          console.log('bikebussstops', bikeBusStops);
          console.log('routeLegs', routeLegs);
          if (eventData?.BikeBusGroup) {
            fetchBikeBusGroup(eventData.BikeBusGroup);
          }
        });
      }
    });

  }, [id]);


  useEffect(() => {
    if (route) {
      console.log('route', route);
      setPathCoordinates(route.pathCoordinates);

      fetchBikeBusStops();
      console.log('bikebussstops', bikeBusStops);
      console.log('routeLegs', routeLegs);

      setMapCenter({
        lat: (route.startPoint.lat + route.endPoint.lat) / 2,
        lng: (route.startPoint.lng + route.endPoint.lng) / 2,
      });
      setStartGeo(route.startPoint);
      setEndGeo(route.endPoint);
      setSelectedStartLocation(route.startPoint);
      setSelectedEndLocation(route.endPoint);

      // let's set the zoom level based on the distance between the start and end points
      const distance = Math.sqrt(Math.pow(route.startPoint.lat - route.endPoint.lat, 2) + Math.pow(route.startPoint.lng - route.endPoint.lng, 2));
      if (distance < 0.01) {
        setCurrentZoomLevel(16);
      }
      else if (distance < 0.02) {
        setCurrentZoomLevel(16);
      }
      else if (distance < 0.03) {
        setCurrentZoomLevel(15);
      }
      else if (distance < 0.04) {
        setCurrentZoomLevel(14);
      }
      else if (distance < 0.05) {
        setCurrentZoomLevel(13);
      }
      else if (distance < 0.06) {
        setCurrentZoomLevel(12);
      }
      else if (distance < 0.07) {
        setCurrentZoomLevel(11);
      }
      else if (distance > 0.07) {
        setCurrentZoomLevel(1);
      }
    }

  }
    , [route]);



  useEffect(() => {
    const docRef = doc(db, 'event', id);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      setEventData(doc.data());
    });

    return () => unsubscribe();  // Clean up listener on unmount
  }, [id]);

  function isroute(data: unknown): data is typeof route {
    return !!(data && typeof data === 'object' && 'BikeBusName' in data);
  }

  const updateEvent = useCallback(async () => {

    let route: Route | null = null;
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
          if (isroute(data)) {
            route = data as typeof route;
          }
        }

        if (route && groupData) {
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
            eventstartTimeStamp: eventData?.startTimeStamp || '',
            eventEndTimeStamp: eventData?.endTime || null,
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
            // for the eventCheckInstartTimeStamp, we're going to use the time when the leader clicked on the "Start event" button
            eventCheckInstartTimeStamp: serverTimestamp(),
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
  }, [id, eventData?.leader, eventData?.members, eventData?.caboose, eventData?.captains, eventData?.kids, eventData?.parents, eventData?.sheepdogs, eventData?.sprinters, eventData?.startTimeStamp, eventData?.endTime, eventData?.status, eventData?.BikeBusName, eventData?.route, eventData?.groupId, user?.uid, history]);


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

  const handleUnRSVP = async () => {
    if (!user || !username) {
      console.error("User not found. Cannot un-RSVP.");
      return;
    }

    const eventRef = doc(db, 'event', id);

    try {
      const docSnapshot = await getDoc(eventRef);
      if (docSnapshot.exists()) {
        const eventData = docSnapshot.data();
        // Define all possible roles within the event
        const roles = ['members', 'leaders', 'captains', 'sheepdogs', 'sprinters', 'parents', 'kids', 'caboose'];

        // Initialize an object to hold the updates
        let updates: { [key: string]: any } = {};

        // Check each role to see if the user is part of it and prepare update object
        roles.forEach(role => {
          if (eventData[role] && eventData[role].includes(username)) {
            updates[role] = arrayRemove(username); // Prepare to remove user from this role
          }
        });

        // Update the document with the prepared updates
        await updateDoc(eventRef, updates);
        console.log("User successfully removed from all roles and RSVP list.");
      } else {
        console.error("Event document does not exist.");
      }
    } catch (error) {
      console.error("Failed to un-RSVP user:", error);
    }
  };


  // Date and time formatting options

  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const timeOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }; // Time only

  function isTimestamp(timestamp: { toDate: any; }) {
    return timestamp && typeof timestamp.toDate === 'function';
  }

  const formatTimestamp = (timestamp: Timestamp) => {
    console.log('timestamp', timestamp);
    if (isTimestamp(timestamp)) {
      setStartDateTime(timestamp.toDate().toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    } else {
      console.error('Provided data is not a Timestamp:', timestamp);
      return ''; // or handle error appropriately
    }
  };





  const startTime = eventData?.start ? new Date(eventData?.start.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
  const endTime = eventData?.endTime instanceof Timestamp
    ? new Date(eventData?.endTime.toDate()).toLocaleTimeString(undefined, timeOptions)
    : new Date(eventData?.endTime).toLocaleTimeString(undefined, timeOptions); // Fallback to JavaScript Date

  // timezone in the format of the user's locale
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Check to see if the user is the event leader (a single string) in the eventData?.leader array
  const isEventLeader = username && eventData?.leader.includes(username);

  // Check to see if the event is active which means the event occurs within 15 minutes of the eventData?.startTimeStamp
  //const isEventOpenActive = eventData?.startTimeStamp && eventData?.startTimeStamp.toDate() < new Date(Date.now() + 15 * 60000);

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
    // update the event document field "startTimeStamp" with the current time
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

  const isBikeBus = route?.isBikeBus ?? false;

  // create a function that allows the leader to changet the date and time of the event
  const handleUpdateTimeEvent = async () => {
    // //eventEndTime is a string, not a timestamp. We need to convert it to a timestamp. 
    const eventEndTime = new Date(Date.parse(startDateTime) + expectedDuration * 60000);
    const startDateTimeTimestamp = new Date(Date.parse(startDateTime));
    const docRef = doc(db, 'event', id);
    await updateDoc(docRef, {
      startTimeStamp: startDateTimeTimestamp,
      start: startDateTimeTimestamp,
      startTime: startTime,
      endTime: eventEndTime,
      endTimestamp: eventEndTime
    });
    setShowStartDateTimeModal(false);
  };

  // create a function that allows the leader to changet the notes for the event
  const handleUpdateNotes = async () => {
    const docRef = doc(db, 'event', id);
    await updateDoc(docRef, {
      notes: notes
    });
    setShowNotesModal(false);
  };


  const printRef = useRef(null);

  const componentRef = useRef<HTMLDivElement>(null);

  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'BikeBus Flyer',
  });

  const triggerPrint = () => {
    setIsPrinting(true);

    // Force a redraw
    componentRef.current?.offsetHeight;

    setTimeout(() => {
      handlePrint();
      setIsPrinting(false);
    }, 500); // Increase the delay to 500ms
  };

  const hiddenStyle: React.CSSProperties = isPrinting ? {} : { visibility: 'hidden', height: 0, overflow: 'hidden' };

  function convertToGPX(pathCoordinates: any[]) {
    let gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
  <gpx version="1.1" creator="YourAppName" xmlns="http://www.topografix.com/GPX/1/1">
    <trk>
      <name>YourRouteName</name>
      <trkseg>\n`;

    pathCoordinates.forEach(coord => {
      gpxContent += `      <trkpt lat="${coord.lat}" lon="${coord.lng}"></trkpt>\n`;
    });

    gpxContent += `    </trkseg>
    </trk>
  </gpx>`;

    return gpxContent;
  }


  const handleExportGPX = () => {
    if (!pathCoordinates || pathCoordinates.length === 0) {
      alert("No route data available to export.");
      return;
    }

    const gpxContent = convertToGPX(pathCoordinates);
    const blob = new Blob([gpxContent], { type: "application/gpx+xml" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = "route.gpx"; // You can dynamically name the file here
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleBicyclingLayerToggle = (enabled: boolean | ((prevState: boolean) => boolean)) => {
    setBicyclingLayerEnabled(enabled);
    if (bicyclingLayerRef.current) {
      if (enabled && mapRef.current) {
        bicyclingLayerRef.current.setMap(mapRef.current);
      } else {
        bicyclingLayerRef.current.setMap(null);
      }
    }
  };


  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.setCenter(mapCenter);
    }
  }, [isLoaded, loadError]);





  const getNumber = (value: number | (() => number)): number => typeof value === 'function' ? value() : value;

  // Base offset at zoom level 13 (you can adjust this according to your preferences)
  const BASE_LAT_OFFSET = 0.0090; // 0.009
  const BASE_LNG_OFFSET = 0.0090;
  const BASE_ZOOM_LEVEL = 13;

  // Function to get current offset based on zoom level
  const getCurrentOffset = (zoomLevel: number) => {
    // The higher the zoom, the less the offset
    const zoomDifference = Math.pow(2, BASE_ZOOM_LEVEL - zoomLevel);
    return {
      latOffset: BASE_LAT_OFFSET * zoomDifference,
      lngOffset: BASE_LNG_OFFSET * zoomDifference,
    };
  };

  // Use the function to get the current offset

  useEffect(() => {
    if (mapRef.current && !bicyclingLayerRef.current) {
      bicyclingLayerRef.current = new google.maps.BicyclingLayer();
      // You may need to conditionally set the map here as well
      if (bicyclingLayerEnabled) {
        bicyclingLayerRef.current.setMap(mapRef.current);
      }
      const listener = mapRef.current.addListener('zoom_changed', () => {
        setCurrentZoomLevel(mapRef.current?.getZoom() ?? 13);
      });
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [mapRef.current, bicyclingLayerEnabled]);


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
              zoom={currentZoomLevel}
              options={{
                zoomControl: true,
                zoomControlOptions: {
                  position: window.google.maps.ControlPosition.LEFT_CENTER
                },
                streetViewControl: true,
                streetViewControlOptions: {
                  position: window.google.maps.ControlPosition.LEFT_CENTER
                },
                fullscreenControl: true,
                fullscreenControlOptions: {
                  position: window.google.maps.ControlPosition.LEFT_CENTER
                },
                disableDefaultUI: true,
                mapTypeControl: false,
                disableDoubleClickZoom: true,
                maxZoom: 18,
                mapId: 'b75f9f8b8cf9c287',
              }}
            >
              {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                <div>
                  <Polyline
                    path={pathCoordinates.map(coord => ({ lat: coord.lat, lng: coord.lng }))}
                    options={{
                      strokeColor: "#000000", // Black color for the outline
                      strokeOpacity: 1.0,
                      strokeWeight: 6,
                      geodesic: true,
                      editable: false,
                      draggable: false,
                      icons: [
                        {
                          icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            strokeColor: "#000000", // Main line color
                            strokeOpacity: 1,
                            strokeWeight: 6,
                            fillColor: "#000000",
                            fillOpacity: 1,
                            scale: 3,
                          },
                          offset: "100%",
                          repeat: "100px",
                        },
                      ]
                    }}
                  />
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
                </div>
              )}
              <div>
                <IonGrid>
                  <IonRow>
                    <IonCol>
                      {!isBikeBus && (
                        <IonButton size="small" routerLink="/map">Back to Map</IonButton>
                      )}
                      {!isEventEnded && (
                        <IonButton size="small" onClick={() => setShowRSVPModal(true)}>RSVP to be there!</IonButton>
                      )}
                      {!isEventEnded && (
                        <IonButton size="small" onClick={handleUnRSVP}>Un-RSVP</IonButton>
                      )}
                      <IonModal isOpen={showRSVPModal}>
                        <IonHeader>
                          <IonToolbar>
                            <IonCardSubtitle>Select a Role</IonCardSubtitle>
                            <IonText>To ensure that your RSVP saves, your Account must have a username filled in</IonText>
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
                          <IonButton size="small" onClick={() => setShowRSVPModal(false)}>Close</IonButton>
                          <IonButton size="small" onClick={handleRSVP}>RSVP with these Roles</IonButton>
                        </IonContent>
                      </IonModal>

                      {!isEventEnded && (
                        <IonButton size="small" onClick={() => setShowRSVPListModal(true)}>See who's RSVP'd</IonButton>
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
                                <IonButton size="small" onClick={() => setShowMembersModal(true)} fill="clear" style={{}}>
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
                                <IonButton size="small" expand="full" fill="clear" onClick={() => setShowMembersModal(false)}>Cancel</IonButton>
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
                          <IonButton size="small" onClick={() => setShowRSVPListModal(false)}>Close</IonButton>
                        </IonContent>
                      </IonModal>
                      {isEventEnded && (
                        <IonButton size="small" routerLink={`/EventSummary/${id}`}>Event Summary</IonButton>
                      )}
                      {isEventLeader && !isEventActive && !isEventEnded && (
                        <IonButton size="small" color={'success'} onClick={toggleStartEvent}>Start BikeBus Event</IonButton>
                      )}
                      {!isEventLeader && isEventActive && (
                        <IonButton size="small" onClick={toggleJoinEvent}>CheckIn to BikeBus Event!</IonButton>
                      )}
                      {isEventLeader && isEventActive && (
                        <IonButton size="small" routerLink={`/Map/${id}`}>Go to Event</IonButton>
                      )}
                      <IonButton size="small" onClick={handleExportGPX}>Export GPX</IonButton>
                      <IonButton size="small" onClick={triggerPrint}>Print Flyer</IonButton>
                      <div ref={printRef}>
                        <div ref={componentRef} className="print-hidden" style={hiddenStyle}>
                          <svg>
                          </svg>
                        </div>
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                  <Marker
                    position={selectedStartLocation}
                    icon={{
                      url: "/assets/markers/play-circle.svg",
                      scaledSize: new google.maps.Size(30, 30),
                      labelOrigin: new google.maps.Point(40, -15)
                    }}
                    label={{
                      text: route?.startPointName || 'Start',
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                      fontFamily: "Arial, sans-serif",
                      className: "custom-marker-label-event"
                    }}
                  />
                )}
                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && (
                  <Marker
                    position={selectedEndLocation}
                    icon={{
                      url: "/assets/markers/stop-circle.svg",
                      scaledSize: new google.maps.Size(30, 30),
                      labelOrigin: new google.maps.Point(40, -15)
                    }}
                    label={{
                      text: route?.endPointName || 'End',
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "bold",
                      fontFamily: "Arial, sans-serif",
                      className: "custom-marker-label-event"
                    }}
                  />
                )}

                {isLoaded && pathCoordinates && pathCoordinates.length > 0 && bikeBusStops && (
                  bikeBusStops.map((bikeBusStop, index) => {
                    const position = {
                      lat: bikeBusStop?.location?.latitude,
                      lng: bikeBusStop?.location?.longitude
                    };
                    if (!isNaN(position.lat) && !isNaN(position.lng)) {
                      return (
                        <Marker
                          key={index}
                          zIndex={10}
                          icon={{
                            url: "/assets/markers/pause-circle.svg",
                            scaledSize: new google.maps.Size(30, 30),
                            labelOrigin: new google.maps.Point(40, -15),
                          }}
                          label={{
                            text: bikeBusStop?.BikeBusStopName || 'BikeBus Stop',
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                            fontFamily: "Arial, sans-serif",
                            className: "custom-marker-label-event"
                          }}
                          position={position}
                          title={bikeBusStop?.BikeBusStopName}
                        />
                      );
                    } else {
                      console.error("Invalid position for Marker:", position);
                      return null;
                    }
                  })
                )}
                {routeLegsEnabled && routeLegs.map((leg, index) => {

                  const midLat = (getNumber(leg.startPoint.lat) + getNumber(leg.endPoint.lat)) / 2;
                  const midLng = (getNumber(leg.startPoint.lng) + getNumber(leg.endPoint.lng)) / 2;

                  // Use the function to get the current offset
                  const { latOffset, lngOffset } = getCurrentOffset(currentZoomLevel);

                  // Apply the dynamic offset to the midpoint
                  const offsetMidLat = midLat + latOffset;
                  const offsetMidLng = midLng + lngOffset;

                  return (
                    <React.Fragment key={index}>
                      <OverlayView
                        position={{ lat: offsetMidLat, lng: offsetMidLng }}
                        mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                      >
                        <div style={{
                          background: "white",
                          border: "1px solid #ccc",
                          padding: "4px 8px",
                          borderRadius: "3px",
                          whiteSpace: "nowrap",
                          display: "inline-block",
                          minWidth: "100px",
                          opacity: 0.8

                        }}>
                          <div style={{ textAlign: "center" }}>Leg {index + 1}</div>
                          <div>Distance: {leg.distance} miles</div>
                          <div>Duration: {leg.duration} minutes</div>
                        </div>
                      </OverlayView>

                    </React.Fragment>
                  )
                })}
                {timingSidebarEnabled && route && (
                  <div style={{
                    position: 'absolute',
                    right: '20px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'white',
                    padding: '10px',
                    zIndex: 100,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IonIcon icon={playCircle} style={{ marginRight: '5px' }} />
                      <IonLabel>{startDateTime}</IonLabel>
                    </div>
                    <div>
                      <IonText>
                        {route.startPointName}
                      </IonText>
                    </div>
                    {routeLegs.map((leg, index) => {
                      const isLastLeg = index === routeLegs.length - 1;
                      const stopsForThisLeg = bikeBusStops.sort((a, b) => a.order - b.order);

                      // Calculate expected time at each stop based on duration
                      let currentTime = new Date(eventData?.startTimeStamp.toDate());
                      let formattedStopTimeAMPM: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined; // Declare the variable using 'let'
                      for (let i = 0; i <= index; i++) {
                        const durationMinutes = Number(leg.duration) || 0;
                        currentTime = new Date(currentTime.getTime() + durationMinutes * 60000);
                        // format currentTime to be displayed in the sidebar as a simple hh:mm am/pm
                        formattedStopTimeAMPM = currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                      }
                      return (
                        <React.Fragment key={index}>
                          <div style={{ width: '2px', height: '20px', backgroundColor: '#ffd800', margin: '5px auto' }} />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IonIcon icon={bicycle} style={{ marginRight: '5px' }} />
                            <IonLabel>Leg {index + 1}: </IonLabel>
                          </div>
                          <div>
                            <IonText>{leg.duration} minutes</IonText>
                          </div>
                          {!isLastLeg && stopsForThisLeg.map((stop, stopIndex) => (
                            <React.Fragment key={stopIndex}>
                              <div style={{ width: '2px', height: '20px', backgroundColor: '#ffd800', margin: '5px auto' }} />
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IonIcon icon={pauseCircle} style={{ marginRight: '5px' }} />
                                <IonLabel>{formattedStopTimeAMPM}</IonLabel>
                              </div>
                              <div>
                                <IonLabel>{stop.BikeBusStopName}</IonLabel>
                              </div>
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      );
                    })
                    }
                    <div style={{ width: '2px', height: '20px', backgroundColor: '#ffd800', margin: '5px auto' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IonIcon icon={stopCircle} style={{ marginRight: '5px' }} />
                      <IonLabel>{endTime}</IonLabel>
                    </div>
                    <div>
                      <IonLabel>{route.endPointName}</IonLabel>
                    </div>
                  </div>
                )}
                {weatherForecastEnabled && route && (
                  <div style={{
                    position: 'absolute',
                    left: '50%',                       // Center the div on the x-axis
                    bottom: '5px',                    // Position the div 80px above the bottom
                    transform: 'translateX(-50%)',     // Shift the div back by half its width for centering
                    maxWidth: 'calc(100% - 20px)',     // Adjust the width to ensure it stays within the viewport
                    backgroundColor: 'clear',
                    padding: '5px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'row',              // Changed to row to lay out the cards horizontally
                    alignItems: 'center',
                    justifyContent: 'center',          // Center the items horizontally
                    overflowX: 'hidden',               // Hide horizontal scrollbar
                    overflowY: 'hidden',               // Hide vertical scrollbar
                  }}>
                    <WeatherForecast
                      startTimestamp={eventData.startTimeStamp}
                      lat={route.endPoint.lat}
                      lng={route.endPoint.lng}
                      weatherForecastType={weatherForecastType as 'hourly'}
                    />
                  </div>
                )}

              </div>
              <div>
              </div>
              <div>
                <IonGrid className="bikebus-event-name">
                  <IonRow>
                    <IonCol>
                      {isBikeBus ? (
                        <IonRouterLink routerLink={`/bikebusgrouppage/${eventData?.groupId.id}`}>
                          <IonLabel style={{ color: 'black' }}>{eventData?.BikeBusName}</IonLabel>
                        </IonRouterLink>
                      ) : (
                        <IonLabel>{eventData?.BikeBusName}</IonLabel>
                      )}
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                <IonGrid className="bikebus-event-route">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{route?.routeName}</IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                <IonGrid className="bikebus-event-time">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{startTime} to {endTime} {timeZone}
                      </IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              {isBikeBus && isEventLeader && (
                <div>
                  <IonGrid className="bikebus-event-updateStartTime">
                    <IonRow>
                      <IonCol>
                        <IonButton size="small" onClick={() => setShowStartDateTimeModal(true)}>Update Start Time</IonButton>
                        <IonModal isOpen={showStartDateTimeModal} onDidDismiss={() => setShowStartDateTimeModal(false)}>
                          <IonDatetime
                            presentation='date-time'
                            onIonChange={e => {
                              if (typeof e.detail.value === 'string') {
                                const startDateTime = new Date(e.detail.value);
                                setStartDateTime(startDateTime.toISOString());
                                setEventEndTime(startDateTime.toISOString());
                                // bring in the duration value from the route data so that we can use it to calculate the endTime for the function addDuration
                                const duration = route?.duration ?? 0;
                                setExpectedDuration(duration);

                                // Define addDuration here
                                const addDuration = (duration: number) => {
                                  const endTimeDate = new Date(startDateTime);
                                  duration = Math.ceil(duration);
                                  endTimeDate.setMinutes(endTimeDate.getMinutes() + duration);
                                  const endTime = endTimeDate.toString();
                                  setEventEndTime(endTime);
                                };

                                addDuration(Number(duration));
                              }
                            }}

                          ></IonDatetime>
                          <IonButton onClick={handleUpdateTimeEvent}>Update Event Start and End Time</IonButton>
                        </IonModal>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              )}
              <div>
                <IonGrid className="bikebus-event-notes">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{eventData?.notes}</IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              {isBikeBus && isEventLeader && (
                <div>
                  <IonGrid className="bikebus-event-updateNotes">
                    <IonRow>
                      <IonCol>
                        <IonButton size="small" onClick={() => setShowNotesModal(true)}>Update Notes</IonButton>
                        <IonModal isOpen={showNotesModal} onDidDismiss={() => setShowNotesModal(false)}>
                          <IonTextarea
                            value={notes}
                            onIonChange={(e) => setNotes(e.detail.value!)}
                          ></IonTextarea>
                          <IonButton onClick={handleUpdateNotes}>Update Notes</IonButton>
                        </IonModal>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              )}
              <div>
                <IonGrid className="bikebus-event-status">
                  <IonRow>
                    <IonCol>
                      <IonLabel>{eventData?.status}</IonLabel>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                <IonGrid className="bikebus-event-qrcode">
                  <IonRow>
                    <IonCol>
                      <QRCode size={50} value={window.location.href} />
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <SidebarEvent
                mapRef={mapRef}
                bicyclingLayerEnabled={bicyclingLayerEnabled}
                setBicyclingLayerEnabled={setBicyclingLayerEnabled}
                handleBicyclingLayerToggle={handleBicyclingLayerToggle}
                routeLegsEnabled={routeLegsEnabled}
                setRouteLegsEnabled={setRouteLegsEnabled}
                timingSidebarEnabled={timingSidebarEnabled}
                setTimingSidebarEnabled={setTimingSidebarEnabled}
                weatherForecastEnabled={weatherForecastEnabled}
                setWeatherForecastEnabled={setWeatherForecastEnabled}
              />
            </GoogleMap>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default Event;
