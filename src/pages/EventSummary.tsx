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
import { useParams, useHistory } from 'react-router-dom';
import { create } from 'domain';
import { set } from 'date-fns';

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

interface FetchedUserData {
  username: string;
  accountType?: string;
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


const EventSummary: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const { id } = useParams<{ id: string }>();
  const [eventData, setEventData] = useState<any>(null);
  const [bikeBusGroupData, setBikeBusGroupData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [caboose, setCaboose] = useState<string[]>([]);
  const [captains, setCaptains] = useState<string[]>([]);
  const [kids, setKids] = useState<string[]>([]);
  const [parents, setParents] = useState<string[]>([]);
  const [sheepdogs, setSheepdogs] = useState<string[]>([]);
  const [sprinters, setSprinters] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [leader, setLeader] = useState<string>('');
  const [showJoinBikeBus, setShowJoinBikeBus] = useState<boolean>(false);
  const [routeId, setRouteId] = useState<string>('');
  const [groupId, setGroupId] = useState<string>('');
  const [routeData, setRouteData] = useState<any>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [eventDataForCreateTrip, setEventDataForCreateTrip] = useState<any>(null);
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
  }, [eventData]);


  const fetchUser = async (username: string): Promise<FetchedUserData | undefined> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    let user: FetchedUserData | undefined;

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      user = doc.data() as FetchedUserData;
    });

    return user;
  };

  const history = useHistory();



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
      const fetchEvent = async () => {
        const docRef = doc(db, 'event', id);
        const docSnapshot = await getDoc(docRef);

        if (docSnapshot.exists()) {
          const eventData = docSnapshot.data();
          setEventData(eventData);

          // fetch the BikeBusGroup data only if eventType is not 'openTrip'
          if (eventData.eventType !== 'openTrip') {
            const fetchBikeBusGroup = async () => {
              const groupDocSnapshot = await getDoc(eventData.BikeBusGroup);
              if (groupDocSnapshot.exists()) {
                setBikeBusGroupData(groupDocSnapshot.data());
              }
            };
            fetchBikeBusGroup();
          }
          // if eventType is 'openTrip', fetch the event document and set it to routeData
          if (eventData.eventType === 'openTrip') {
            setRouteData(eventData);
          }
        }
      };
      fetchEvent();
    }
  }, [id, user]);

  function isRouteData(data: unknown): data is RouteData {
    return !!(data && typeof data === 'object' && 'BikeBusName' in data);
  }


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

  console.log(eventData);
  console.log(mapCenter);


  useEffect(() => {
    if (routeData) {
      setMapCenter({
        lat: (routeData.startPoint.lat + routeData.endPoint.lat) / 2,
        lng: (routeData.startPoint.lng + routeData.endPoint.lng) / 2,
      });
      setStartGeo(routeData.startPoint);
      setEndGeo(routeData.endPoint);
    }
  }
    , [routeData]);


  function createStaticMapUrl(mapCenter: { lat: number; lng: number }, RouteId: RouteData | null, startGeo: Coordinate, endGeo: Coordinate, apiKey: string) {
    const routeData = RouteId;
    const center = `${mapCenter.lat},${mapCenter.lng}`;
    // make the size fill the screen and as a background image
    const size = `${window.innerWidth}x${window.innerHeight}`;
    const path = routeData?.pathCoordinates
      .map((coord: { lat: any; lng: any; }) => `${coord.lat},${coord.lng}`)
      .join('|');
    const markers = [
      `markers=color:red|label:A|${startGeo.lat},${startGeo.lng}`,
      `markers=color:red|label:B|${endGeo.lat},${endGeo.lng}`,
    ];
    // let's make some markers for the bikebusstops in the route
    const bikeBusStops = routeData?.BikeBusStop;
    if (bikeBusStops) {
      for (let i = 0; i < bikeBusStops.length; i++) {
        markers.push(`markers=color:blue|label:${i + 1}|${bikeBusStops[i].lat},${bikeBusStops[i].lng}`);
      }
    }
    const styles = "element:geometry%7Ccolor:0xf5f5f5&style=element:labels.icon%7Cvisibility:off&style=element:labels.text.fill%7Ccolor:0x616161&style=element:labels.text.stroke%7Ccolor:0xf5f5f5&style=feature:administrative%7Celement:geometry%7Cvisibility:off&style=feature:administrative.land_parcel%7Celement:labels%7Cvisibility:off&style=feature:administrative.land_parcel%7Celement:labels.text.fill%7Ccolor:0xbdbdbd&style=feature:administrative.neighborhood%7Celement:geometry.fill%7Cvisibility:off&style=feature:administrative.neighborhood%7Celement:labels.text%7Cvisibility:off&style=feature:poi%7Cvisibility:off&style=feature:poi%7Celement:geometry%7Ccolor:0xeeeeee&style=feature:poi%7Celement:labels.text%7Cvisibility:off&style=feature:poi%7Celement:labels.text.fill%7Ccolor:0x757575&style=feature:poi.park%7Cvisibility:on&style=feature:poi.park%7Celement:geometry%7Ccolor:0xe5e5e5&style=feature:poi.park%7Celement:geometry.fill%7Cvisibility:on&style=feature:poi.school%7Cvisibility:on&style=feature:poi.school%7Celement:geometry.fill%7Ccolor:0xffd800%7Cvisibility:on&style=feature:poi.school%7Celement:labels%7Cvisibility:on&style=feature:poi.school%7Celement:labels.text%7Cvisibility:on&style=feature:poi.school%7Celement:labels.text.fill%7Cvisibility:on%7Cweight:5&style=feature:poi.school%7Celement:labels.text.stroke%7Cvisibility:on%7Cweight:3.5&style=feature:road%7Celement:geometry%7Ccolor:0xffffff%7Cvisibility:simplified&style=feature:road%7Celement:labels.icon%7Cvisibility:off&style=feature:road.arterial%7Celement:labels.text.fill%7Ccolor:0x757575&style=feature:road.highway%7Celement:geometry%7Ccolor:0xdadada&style=feature:road.highway%7Celement:labels.text.fill%7Ccolor:0x616161&style=feature:road.local%7Celement:labels%7Cvisibility:off&style=feature:road.local%7Celement:labels.text.fill%7Ccolor:0x9e9e9e&style=feature:transit%7Celement:geometry.fill%7Csaturation:-50%7Clightness:50&style=feature:water%7Celement:geometry%7Ccolor:0xc9c9c9&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x9e9e9e";
    // create markers for bikebusstops along the route
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=12&size=${size}&path=color:0x00000000|weight:5|${path}&path=color:0xffd800|weight:3|${path}&${markers.join('&')}&${styles}&key=${apiKey}`;
    return url;
  }


  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        <IonHeader>
          <IonToolbar>{eventData?.eventName}</IonToolbar>
        </IonHeader>
        <IonList>
          <IonItem>
            <IonLabel>{startTime} to {endTime}</IonLabel>
          </IonItem>
          </IonList>
          <IonImg className="event-map" onClick={() => window.open(createStaticMapUrl(mapCenter, routeData, startGeo, endGeo, apiKey), '_blank')}
            src={createStaticMapUrl(mapCenter, routeData, startGeo, endGeo, apiKey)} />
      </IonContent>
    </IonPage >
  );
};

export default EventSummary;
