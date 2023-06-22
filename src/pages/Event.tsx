// src/pages/BikeBusMember.tsx
import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonAvatar,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonText,
  } from '@ionic/react';
  import { useEffect, useState } from 'react';
  import './About.css';
  import useAuth from '../useAuth'; // Import useAuth hook
  import { useAvatar } from '../components/useAvatar';
  import Avatar from '../components/Avatar';
  import { personCircleOutline } from 'ionicons/icons';
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  
  
  const Event: React.FC = () => {
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
          <IonHeader>
            <IonToolbar></IonToolbar>
          </IonHeader>
            <IonCardHeader>
              <IonCardTitle>Event</IonCardTitle>
            </IonCardHeader>
        </IonContent>
      </IonPage >
    );
  };
  
  export default Event;
  