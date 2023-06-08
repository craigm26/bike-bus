// src/pages/BikeBusMember.tsx
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonMenuButton,
  IonButtons,
  IonButton,
  IonLabel,
  IonText,
  IonChip,
  IonAvatar,
  IonPopover,
  IonIcon,
  IonTitle,
  IonCardTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonItem,
  IonList,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { alertCircleOutline, cogOutline, helpCircleOutline, personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Help: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);


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

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Help</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>How do I create a BikeBus?</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>1. First, you should be signed up as a User</IonItem>
              <IonItem>2. Then you create a route</IonItem>
              <IonItem>3. Create a BikeBus by clicking on the "Create BikeBus" button on the route page</IonItem>
              <IonItem>4. Invite users to your BikeBus</IonItem>
              <IonItem>5. When your schedule indicates that you (as BikeBus Leader) should start the BikeBus, Start the BikeBus on the Map</IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Creating a Route</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>1. Go to the Map Page</IonItem>
              <IonItem>2. Search for a Starting Location</IonItem>
              <IonItem>3. Search for a Destination</IonItem>
              <IonItem>4. Click on the "Get Directions" button</IonItem>
              <IonItem>5. Click on the "Create Route" button</IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};

export default Help;
