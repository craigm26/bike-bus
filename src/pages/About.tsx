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
    <IonPage>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>About the App</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            Our app helps users find and join bikebus routes to commute to school together. Users can create and publish routes, organize groups, and participate in a safer, more enjoyable, and environmentally-friendly way to travel to school.
            <IonText>All built and ran by Craig Merry.</IonText>
          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>About the Developer</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>Hi, I'm Craig Merry</IonText>
            <Avatar uid="ScLzYFaBBlMbfZs0z5vq47C0eRY2" size="large" />
            <IonText>I'm a Microsoft SharePoint Developer and Administrator for a small Power Utility in the Sacramento Region. I am passionate about using technology to solve problems and make the world a better place. I am also passionate about biking, and excited to combine my passions to create a useful app for the community. E-mail me at craigm26@gmail.com for any feedback or questions!</IonText>
          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Privacy Policy</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
            </IonText>
          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Terms of Service</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>Our app is provided as-is, with no warranty or guarantee. Please keep your eyes on the road and follow all traffic laws.
            </IonText>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage >
  );
};

export default About;
