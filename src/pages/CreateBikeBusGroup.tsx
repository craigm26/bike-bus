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
  IonItem,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { helpCircleOutline, cogOutline, alertCircleOutline } from 'ionicons/icons';
import GroupCalendar from '../components/BikeBusGroup/BikeBusCalendar';
import InviteUser from '../components/BikeBusGroup/InviteUser';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import RecurrenceSelect from '../components/BikeBusGroup/RecurrenceSelect';


const CreateBikeBusGroup: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const { RouteID } = useParams<{ RouteID: string }>();
  console.log("RouteID: ", RouteID);




  // fetch route data from the previous step of "CreateBikeBusGroup" button with the id from the URL and user data from firestore
  const history = useHistory();



  const fetchRoute = async () => {
    const routeRef = doc(db, 'routes', RouteID);
    const routeSnapshot = await getDoc(routeRef);
    if (routeSnapshot.exists()) {
      const routeData = routeSnapshot.data();
      if (routeData) {
        setRoute(routeData);
      }
    }
  };


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

  // add a button to save information from the calendar and invite user to the group


  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      fetchRoute();
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user, RouteID]);

  const label = user?.username ? user.username : "anonymous";

  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });

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
          <IonPopover
            isOpen={showPopover}
            event={popoverEvent}
            onDidDismiss={() => setShowPopover(false)}
            className="my-popover"
          >
            <Profile />
          </IonPopover>
          <IonButton fill="clear" slot="end" onClick={togglePopover}>
            <IonChip>
              {avatarElement}
              <IonLabel>{label}</IonLabel>
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
          <IonButtons slot="primary">
            <IonButton routerLink='/help'>
              <IonIcon slot="end" icon={helpCircleOutline}></IonIcon>
            </IonButton>
            <IonButton routerLink='/settings'>
              <IonIcon slot="end" icon={cogOutline}></IonIcon>
            </IonButton>
            <IonButton routerLink='/notifications'>
              <IonIcon slot="end" icon={alertCircleOutline}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonItem>
          <IonLabel>BikeBus Name</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Description</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Schedule</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>BIkeBus Route</IonLabel>
          <IonLabel>{route?.routeName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Starting Point</IonLabel>
          <IonLabel>{route?.startPointName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Ending Point</IonLabel>
          <IonLabel>{route?.endPointName}</IonLabel>
        </IonItem>
        <GroupCalendar />
        <RecurrenceSelect selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
        <IonItem>
          <IonButton>Save</IonButton>
        </IonItem>
      </IonContent>
    </IonPage>
  );
};

export default CreateBikeBusGroup;
