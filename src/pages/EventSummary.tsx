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




  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonList>
          <IonItem>
            <IonLabel>{startTime} to {endTime}</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage >
  );
};

export default EventSummary;
