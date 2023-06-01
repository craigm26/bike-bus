import React, { useEffect, useState, useContext, useCallback } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonList, IonItem, IonButton, IonLabel, IonText } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import { HeaderContext } from '../components/HeaderContext';
import { useParams, Link } from 'react-router-dom';

interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBus {
  BikeBusRoutes: string;
  id: string;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  BikeBusCreator: string;
  BikeBusLeader: string;
  BikeBusName: string;
  BikeBusType: string;
  startPoint: Coordinate;
  travelMode: string;
}

const BikeBusGroupPage: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setAccountType] = useState<string>('');
  const [groupData, setGroupData] = useState<any>(null);
  const { groupId } = useParams<{ groupId: string }>();
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);


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

    const groupRef = doc(db, 'bikebusgroups', groupId);
    getDoc(groupRef)
      .then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const groupData = docSnapshot.data();
          setGroupData(groupData);
        } else {
          console.log("No such document!");
        }
      })
      .catch((error) => {
        console.log("Error getting group document:", error);
      });
  }, [user, groupId]);

  const fetchBikeBus = useCallback(async () => {
    const uid = user?.uid;
    console.log('UID:', uid);

    if (!uid) {
      return;
    }

    const BikeBusCollection = collection(db, 'bikebusgroups');
    const q = query(BikeBusCollection, where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
    console.log('Query:', q);
    const querySnapshot = await getDocs(q);
    const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
      ...doc.data() as BikeBus,
      id: doc.id,
    }));
    console.log('BikeBusData:', BikeBusData);
    setBikeBus(BikeBusData);
  }, [user]);

  useEffect(() => {
    console.log(user);
    fetchBikeBus();
  }, [fetchBikeBus, user]);


  console.log(groupData);

  return (
    <IonPage>
      <IonContent fullscreen>
        {headerContext?.showHeader && (
          <IonHeader>
            <IonToolbar>
              <IonTitle>{groupData?.BikeBusName}</IonTitle>
            </IonToolbar>
          </IonHeader>
        )}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{groupData?.BikeBusName}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonLabel>BikeBus Leader</IonLabel>
                <IonText>{groupData?.BikeBusLeaders.map((leader: any) => leader.BikeBusLeaders)}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>BikeBus Description</IonLabel>
                <IonText>{groupData?.BikeBusDescription}</IonText>
              </IonItem>
              <IonItem>
                <IonLabel>BikeBus Routes</IonLabel>
                </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage >
  );
};


export default BikeBusGroupPage;
