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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
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
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonText slot="start" color="primary" class="BikeBusFont">
            <h1>BikeBus</h1>
          </IonText>
          <IonButton fill="clear" slot="end" onClick={togglePopover}>
            <IonChip>
              {avatarElement}
              <IonLabel>{label}</IonLabel>
              <IonText>({accountType})</IonText>
            </IonChip>
          </IonButton>
          <IonPopover
            isOpen={showPopover}
            event={popoverEvent}
            onDidDismiss={() => setShowPopover(false)}
            className="my-popover"
          >
            <Profile />
          </IonPopover>
        </IonToolbar>
      </IonHeader>
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
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Roles and Account Types</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h2>Anonymous</h2>
            <p>Users without an account can still access the same features as Member account types, allowing them to find and join routes without saving any personal information.</p>

            <h2>Member</h2>
            <p>Members can find and join routes, create bikebus groups, and communicate with other members.</p>

            <h2>Leader</h2>
            <p>Leaders have access to Member features and can also claim routes and publish schedules for bikebus groups they lead.</p>

            <h2>Parent</h2>
            <p>Parents have access to Member and Leader features, with the unique ability to add kids to their account, assign them to routes, and manage premium subscription for their family.</p>

            <h2>Kid</h2>
            <p>Kid accounts are created and managed by Parent accounts. They can participate in assigned routes by receiving an invite from the Parent and only gives a "Start/Stop" button</p>

            <h2>Org Admin</h2>
            <p>Org Admins manage routes based on the route destination or start of school type. They can create, edit, and delete routes as needed. There are school, school district and city types of orgs.</p>

            <h2>App Admin</h2>
            <p>App Admins have complete access to all app features, can manage all routes, and oversee user accounts and activities.</p>
          </IonCardContent>
          </IonCard>
          <IonCard>
          <IonCardHeader>
            <IonCardTitle>Map Modes</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h2>Bicycle</h2>
            <p>Displays bike lanes and paths, as well as bike-friendly roads.</p>

            <h2>Car</h2>
            <p>Displays roads and highways.</p>
          </IonCardContent>
          </IonCard>
          <IonCard>
          <IonCardHeader>
            <IonCardTitle>Map Layers</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <h2>Map</h2>
            <p>Displays the map.</p>

            <h2>Routes</h2>
            <p>Displays the routes.</p>

            <h2>Stops</h2>
            <p>Displays the stops.</p>

            <h2>Destinations</h2>
            <p>Displays the destination.</p>

          </IonCardContent>
        </IonCard>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Privacy</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Display the privacy policy.</p>
            <p>At this point, the plan is to anonymize data before any exports for potential use for city planning of bike routes</p>
            <p>We are also trying to limit the social interaction on the app so that only BikeBus participants in a specific route can chat with each other</p>
          </IonCardContent>
        </IonCard>
    </IonContent>
    </IonPage >
  );
};

export default About;
