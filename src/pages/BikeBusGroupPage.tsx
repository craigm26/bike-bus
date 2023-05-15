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
  console.log(groupId);  // Check the value of groupId
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [BikeBusName, setBikeBusName] = useState<string>('');
  const [BikeBusLeader, setBikeBusLeader] = useState<string>(''); // Adjust the type as per your data structure
  const [Route, setRoute] = useState<string>(''); // Adjust the type as per your data structure
  const [ScheduledFor, setScheduledFor] = useState<string>(''); // Adjust the type as per your data structure
  const [GroupMessages, setGroupMessages] = useState<string>(''); // Update the state variable name to GroupMessages
  const [BikeBusMembers, setBikeBusMembers] = useState<string[]>([]); // Update initial state to an empty array


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

          // Get the BikeBusGroups
          const q = query(collection(db, 'bikebusgroups'), where('BikeBusMembers', 'array-contains', `${user.uid}`));

          getDocs(q).then((querySnapshot) => {
            const groups = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              BikeBusName: doc.data().BikeBusName,
              BikeBusMembers: doc.data().BikeBusMembers,
              BikeBusLeader: doc.data().BikeBusLeader, // Assuming 'BikeBusLeader' exists in the document
              Route: doc.data().Route, // Assuming 'Route' exists in the document
              ScheduledFor: doc.data().ScheduledFor, // Assuming 'ScheduledFor' exists in the document
              GroupMessages: doc.data().GroupMessages, // Assuming 'GroupMessages' exists in the document
            }));
            setBikeBusName(groups[0].BikeBusName);
            setBikeBusMembers(groups[0].BikeBusMembers);
            setBikeBusLeader(groups[0].BikeBusLeader);
            setRoute(groups[0].Route);
            setScheduledFor(groups[0].ScheduledFor);
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

  const BikeBusLeaderElement = BikeBusLeader ? (
    <IonChip>
      <IonAvatar>
        <Avatar uid={BikeBusLeader} size="medium" />
      </IonAvatar>
    </IonChip>
  ) : (
    <IonChip>
      <IonAvatar>
        <Avatar uid={BikeBusLeader} size="medium" />
      </IonAvatar>
    </IonChip>
  );

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
        <IonTitle>{BikeBusName}</IonTitle>
        <div>
          <h2>BikeBus Members:</h2>
          <IonChip>
            <IonAvatar>
              <ul>
                {BikeBusMembers.map((member) => (
                  <li key={member}>
                    <IonLabel>{JSON.stringify(member)}</IonLabel>
                  </li>
                ))}
              </ul>
            </IonAvatar>
          </IonChip>
          <h2>BikeBus Leader:</h2>
          {BikeBusLeaderElement}
          <IonChip>
            <IonAvatar>
              <Avatar uid={BikeBusLeader} size="medium" />
            </IonAvatar>
          </IonChip>

          <h2>Route</h2>
          {Route}
          <h2>Scheduled For:</h2>
          {ScheduledFor}
          <h2>Group Messages</h2>
          {GroupMessages}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default BikeBusGroupPage;
