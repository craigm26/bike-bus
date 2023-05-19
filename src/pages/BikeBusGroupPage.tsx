import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonMenuButton, IonButtons, IonButton, IonLabel, IonText, IonChip, IonAvatar, IonPopover, IonIcon } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import UseBikeBusGroup from '../components/useBikeBusGroup';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile';
import BikeBusGroup from '../components/BikeBusGroup';
import { helpCircleOutline, cogOutline, alertCircleOutline } from 'ionicons/icons';

const BikeBusGroupPage: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setAccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const { fetchedGroups } = UseBikeBusGroup();

  const avatarElement = avatarUrl ? (
    <Avatar uid={user?.uid} size="extrasmall" />
  ) : (
    <IonIcon icon={personCircleOutline} />
  );

  const togglePopover = (e: any) => {
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
  };

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setAccountType(userData.accountType);
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
          <IonToolbar />
        </IonHeader>
        {fetchedGroups.map((group, index) => (
          <BikeBusGroup
            key={index}
            BikeBusLeaders={group.BikeBusLeaders}
            BikeBusMembers={group.BikeBusMembers}
            BikeBusName={group.BikeBusName}
            GroupMessages={group.GroupMessages}
            bikebusstations={group.bikebusstations}
            routeId={group.routeId}
            schedule={group.schedule}
          />
        ))}
      </IonContent>
    </IonPage>
  );
};

export default BikeBusGroupPage;