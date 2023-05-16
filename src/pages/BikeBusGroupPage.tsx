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
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useParams } from 'react-router-dom';

const BikeBusGroupPage: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { groupId } = useParams<{ groupId: string }>();
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [BikeBusName, setBikeBusName] = useState<string>('');
  const [routes, setRoutes] = useState<string>('');
  const [BikeBusLeaders, setBikeBusLeaders] = useState<string>('');
  const [groupData, setGroupData] = useState<any>([]);

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
    if (user && groupId) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();

          // Get the BikeBusGroup document directly using its ID
          const groupRef = doc(db, 'bikebusgroups', groupId);
          getDoc(groupRef).then((groupDoc) => {
            if (groupDoc.exists()) {
              const groupData = groupDoc.data();
              console.log(groupData);
              setGroupData(groupData); // Store the data in your state
              setBikeBusName(groupData?.BikeBusName);
              setBikeBusLeaders(groupData?.BikeBusLeaders);
            }
          });

          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [groupId, user]);


  if (!groupId) {
    return <div>Loading...</div>;
  }

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
          <IonToolbar>
          </IonToolbar>
        </IonHeader>
        <div>
          {groupData && (
            <div>
              <h1>{groupData.BikeBusName}</h1>
              <p>Leaders: {groupData.BikeBusLeaders}</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BikeBusGroupPage;
