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
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import useBikeBusGroup from '../components/useBikeBusGroup';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const Help: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const { fetchedGroups, loading, error } = useBikeBusGroup();
  const [groups, setGroups] = useState<any[]>([]);

  async function getUserData(userRef: any) {
    const docSnap = await getDoc(userRef);
    return docSnap.data();
  }


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

  useEffect(() => {
    if (fetchedGroups.length > 0) {
      fetchedGroups.forEach(async (group: any) => {
        const membersPromises = group.BikeBusMembers.map((memberRef: any) => getUserData(memberRef));
        const leadersPromises = group.BikeBusLeaders.map((leaderRef: any) => getUserData(leaderRef));

        const membersData = await Promise.all(membersPromises);
        const leadersData = await Promise.all(leadersPromises);

        group.BikeBusMembers = membersData;
        group.BikeBusLeaders = leadersData;

        setGroups([...fetchedGroups]); // This will trigger a re-render
      });
    }
  }, [fetchedGroups]);


  let groupsElement;
  if (loading) {
    groupsElement = <p>Loading groups...</p>;
  } else if (error) {
    groupsElement = <p>Error loading groups: {error.message}</p>;
  } else {
    groupsElement = fetchedGroups.map((group) => (
      <div key={group.id}>
        <h2>{group.BikeBusName}</h2>
        <p>Members: {group.BikeBusMembers.length}</p>
        <p>Leaders: {group.BikeBusLeaders.length}</p>
      </div>
    ));
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
          <IonToolbar></IonToolbar>
        </IonHeader>
        {fetchedGroups.map((group) => (
          <div key={group.id}>
            <h2>{group.BikeBusName}</h2>
            <h3>Members</h3>
            <IonChip>
              {avatarElement}
              {group.BikeBusMembers.map((member: any) => (
                <p key={member.uid}>{member.username}</p>
              ))}
            </IonChip>
            <h3>Leaders</h3>
            <IonChip>
              {avatarElement}
              {group.BikeBusLeaders.map((leader: any) => (
                <p key={leader.uid}>{leader.username}</p>
              ))}
            </IonChip>
          </div>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default Help;
