// src/pages/BikeBusMember.tsx
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
import { useEffect, useState } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc, setDoc, arrayUnion, onSnapshot, collection, where, getDocs, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useParams } from "react-router-dom";

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


const Event: React.FC = () => {
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

  useEffect(() => {
    const fetchEvent = async () => {
      console.log('fetchEvent called');
      console.log('id:', id);
      const docRef = doc(db, 'event', id);
      console.log('docRef:', docRef);
      const docSnapshot = await getDoc(docRef);
      console.log('docSnapshot:', docSnapshot);

      if (docSnapshot.exists()) {
        setEventData(docSnapshot.data());
        console.log('Document data:', docSnapshot.data());
        // fetch the BikeBusGroup data after the event data has been fetched
        const fetchBikeBusGroup = async () => {
          console.log('BikeBusGroup:', docSnapshot.data().BikeBusGroup);
          const groupDocSnapshot = await getDoc(docSnapshot.data().BikeBusGroup);

          if (groupDocSnapshot.exists()) {
            setBikeBusGroupData(groupDocSnapshot.data());
            console.log('Group data:', groupDocSnapshot.data());
          } else {
            console.log(`No document with ID: ${docSnapshot.data().BikeBusGroup}`);
          }
        };
        fetchBikeBusGroup();
      } else {
        console.log(`No document with ID: ${id}`);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    const fetchUsernames = async (role: string[], setRole: Function) => {
      if (role) {
        const promises = role.map(fetchUser);
        const users = await Promise.all(promises);
        setRole(users.map(user => user?.username));
      }
    };

    if (eventData) {
      fetchUsernames(eventData.members || [], setMembers);
      fetchUsernames(eventData.caboose || [], setCaboose);
      fetchUsernames(eventData.captains || [], setCaptains);
      fetchUsernames(eventData.kids || [], setKids);
      fetchUsernames(eventData.parents || [], setParents);
      fetchUsernames(eventData.sheepdogs || [], setSheepdogs);
      fetchUsernames(eventData.sprinters || [], setSprinters);
    }
  }, [eventData]);



  const togglePopover = (e: any) => {
    console.log('togglePopover called');
    console.log('event:', e);
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
    console.log('showPopover state:', showPopover);
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

  console.log('eventData:', eventData);


  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const startTime = eventData?.startTimestamp ? new Date(eventData?.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
  const endTime = eventData?.endTime ? new Date(eventData?.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';


  // Check to see if the user is the event leader
  const isEventLeader = user && eventData?.leader === username;
  console.log('isEventLeader:', isEventLeader);
  console.log('eventData?.leader:', eventData?.leader);
  console.log('user?.username:', user?.username);
  console.log('username:', username);

  // Check to see if the event is active
  const isEventActive = eventData?.status === 'active';

  // create a function to toggle the event status between active and inactive
  const toggleEventStatus = async (status: string) => {
    const eventRef = doc(db, 'event', id);
    await setDoc(eventRef, {
      status: status
    }, { merge: true });
  };

  const toggleStartEvent = () => {
    toggleEventStatus('active');
  };

  const toggleEndEvent = () => {
    toggleEventStatus('inactive');
  };

  const toggleJoinEvent = () => {
    const eventRef = doc(db, 'event', id);
    setDoc(eventRef, {
      JoinedMembers: arrayUnion(username)
    }, { merge: true });
  };


  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonList>
          <IonLabel>{eventData?.BikeBusName}</IonLabel>
          <IonItem>
            <IonLabel>{startTime} to {endTime}</IonLabel>
          </IonItem>
          <IonItem>
            {isEventLeader && (
              <IonButton onClick={toggleStartEvent}>Start BikeBus Event</IonButton>
            )}
            {isEventLeader && (
              <IonButton onClick={toggleEndEvent}>End BikeBus Event</IonButton>
            )}
            {!isEventLeader && isEventActive && (
              <IonButton onClick={toggleJoinEvent}>Join BikeBus Event!</IonButton>
            )}
          </IonItem>
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
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="caboose" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Caboose</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="captains" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Captains</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="parents" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Parents</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="kids" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Kids</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="leader" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Leader</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="members" disabled checked />
                  <IonLabel>Members</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="sheepdogs" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Sheepdogs</IonLabel>
                </IonItem>
                <IonItem>
                  <IonCheckbox slot="start" value="sprinters" onIonChange={e => handleRoleChange(e.detail.value)} />
                  <IonLabel>Sprinters</IonLabel>
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
            {members.map((username: string, index: number) => (
              <IonLabel key={index}>{username}</IonLabel>
            ))}
          </IonItem>
          <IonItem>
            <IonLabel>Caboose</IonLabel>
            {caboose.map((username: string, index: number) => (
              <IonLabel key={index}>{username}</IonLabel>
            ))}
          </IonItem>
          <IonItem>
            <IonLabel>Captains</IonLabel>
            {captains.map((username: string, index: number) => (
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
            <IonLabel>Parents</IonLabel>
            {parents.map((username: string, index: number) => (
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
        </IonList>
        <IonButton routerLink={`/bikebusgrouppage/${eventData?.BikeBusGroup.id}`}>Back to BikeBus</IonButton>
      </IonContent>
    </IonPage >
  );
};

export default Event;
