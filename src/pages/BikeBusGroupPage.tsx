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
  const { fetchedGroups } = UseBikeBusGroup();

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


  return (
    <IonPage>
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