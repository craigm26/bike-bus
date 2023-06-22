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
  IonPopover,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTitle,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc, setDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useParams } from "react-router-dom";

interface event {
  title: string;
  route: string;
  time: string;
  leader: string;

  members: string[];
  BikeBusGroup: string;
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
  const [role, setRole] = useState('');
  const [username, setUsername] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<string[]>([]);



  const fetchUser = async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    return userSnapshot.data();
  };


  const fetchUsernames = async () => {
    const promises = eventData.members.map(fetchUser);
    const users = await Promise.all(promises);
    setUsernames(users.map(user => user.username));
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
          const docRef = doc(db, 'BikeBusGroups', docSnapshot.data().BikeBusGroup);
          const groupDocSnapshot = await getDoc(docRef);

          if (groupDocSnapshot.exists()) {
            setBikeBusGroupData(groupDocSnapshot.data());
            console.log('Group data:', groupDocSnapshot.data());
          } else {
            console.log(`No document with ID: ${docSnapshot.data().BikeBusGroup}`);
          }
        };
        fetchUsernames();
        fetchBikeBusGroup();
      } else {
        console.log(`No document with ID: ${id}`);
      }
    };

    fetchEvent();
  }, [id, setBikeBusGroupData, setEventData, setUsernames]);


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
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);

  const label = user?.username ? user.username : "anonymous";

  const handleRSVP = async () => {
    if (!user || !username) {
      console.log("No user is logged in or username is not loaded yet!");
      return;
    }

    if (!role) {
      console.log("No role is selected!");
      return;
    }

    const eventRef = doc(db, 'event', id);

    await setDoc(eventRef, {
      [role]: arrayUnion(username)
    }, { merge: true });

    // Clear the role selection and hide the modal
    setRole('');
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
  const startTime = new Date(eventData?.startTime).toLocaleString(undefined, dateOptions);
  const endTime = new Date(eventData?.endTime).toLocaleString(undefined, dateOptions);


  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonList>
          <IonLabel>{eventData?.title}</IonLabel>
          <IonItem>
            <IonButton routerLink={`/bikebusgrouppage/${eventData?.BikeBusGroup.id}`}>Back to BikeBusGroup</IonButton>
          </IonItem>
          <IonItem>
            <IonLabel>{startTime} to {endTime}</IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>Roles in the BikeBus</IonLabel>
          </IonItem>
          <IonModal isOpen={showModal}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Select a Role</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonItem>
                <IonLabel>Role</IonLabel>
                <IonSelect value={role} placeholder="Select One" onIonChange={e => setRole(e.detail.value)}>
                  <IonSelectOption value="caboose">Caboose</IonSelectOption>
                  <IonSelectOption value="captains">Captains</IonSelectOption>
                  <IonSelectOption value="parents">Parents</IonSelectOption>
                  <IonSelectOption value="kids">Kids</IonSelectOption>
                  <IonSelectOption value="leader">Leader</IonSelectOption>
                  <IonSelectOption value="members">Members</IonSelectOption>
                  <IonSelectOption value="sheepdogs">Sheepdogs</IonSelectOption>
                  <IonSelectOption value="sprinters">Sprinters</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
              <IonButton onClick={handleRSVP}>RSVP with this Role</IonButton>
            </IonContent>
          </IonModal>

          <IonButton onClick={() => setShowModal(true)}>RSVP to be there!</IonButton>

          <IonItem>
            <IonLabel>Leader</IonLabel>
            {eventData?.leader}
          </IonItem>
          <IonItem>
            <IonLabel>Members</IonLabel>
            {usernames.map((username: string) => (
              <IonLabel>{username}</IonLabel>
            ))}
          </IonItem>
          <IonItem>
            <IonLabel>Parents</IonLabel>
            {usernames.map((username: string) => (
              <IonLabel>{username}</IonLabel>
            ))}
          </IonItem>

          <IonItem>
          </IonItem>
          <IonItem>
          </IonItem>
          <IonItem>
            <IonLabel>Route:</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonPage >
  );
};

export default Event;
