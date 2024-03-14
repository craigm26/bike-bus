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
  IonTitle,
  IonButton,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';


const About: React.FC = () => {
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
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>About BikeBus</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonCardContent>
          <IonText>BikeBus helps communities create, find and join BikeBus routes to commute to school together. Users can create and publish routes, organize groups, and participate in a safer, more enjoyable, and environmentally-friendly way to travel to school.</IonText>
          <IonText>This app is maintained by Craig Merry and supported by Contributers that help build the UI on GitHub.</IonText>
          <IonText>For more information, please visit our <a href="https://github.com/craigm26/bike-bus">GitHub Repository</a></IonText>
        </IonCardContent>
        <IonCardHeader>
          <IonCardTitle>Terms of Service</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText>Our app is provided as-is, with no warranty or guarantee. Please keep your eyes on the road and follow all traffic laws.
          </IonText>
        </IonCardContent>
        <IonCardHeader>
          <IonCardTitle>Privacy Policy</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonButton shape="round" href="/privacypolicy">Privacy Policy</IonButton>
        </IonCardContent>
        
      </IonContent>
    </IonPage >
  );
};

export default About;
