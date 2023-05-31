import React, { useEffect, useState, useContext } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar } from '@ionic/react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import UseBikeBusGroup from '../components/useBikeBusGroup';
import { useAvatar } from '../components/useAvatar';
import BikeBusGroup from '../components/BikeBusGroup';
import { HeaderContext } from '../components/HeaderContext';
import InviteUser from '../components/BikeBusGroup/InviteUser';


const BikeBusGroupPage: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setAccountType] = useState<string>('');
  const { fetchedGroups } = UseBikeBusGroup();
  const headerContext = useContext(HeaderContext);

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
        {headerContext?.showHeader && (
          <IonHeader>
            <IonToolbar>
            </IonToolbar>
          </IonHeader>
        )}
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