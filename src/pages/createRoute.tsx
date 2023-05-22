import { useState, useEffect, useContext } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { IonPage, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonRadio } from '@ionic/react';
import { HeaderContext } from '../components/HeaderContext';

interface UseRoutesProps {
  routeId: string;
}

const CreateRoute = ({ routeId }: UseRoutesProps) => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const [accountType, setaccountType] = useState<string>('');
  const headerContext = useContext(HeaderContext);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchedRoutes, setFetchedRoutes] = useState<any[]>([]);

  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(true); // Hide the header for false, Show the header for true (default)
    }
  }, [headerContext]);



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
    const fetchData = async () => {
      try {
        if (user && user.uid && user.accountType !== 'Anonymous') {
          // fix the query so that the id is dynamic and accepts group.id from app.tsx or from useBikeBusGroups.tsx
          const q = query(collection(db, 'routes'), where('bikebusgroup', '==', doc(db, 'bikebusgroups', '')));
          const querySnapshot = await getDocs(q);
          const newRoutes = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setFetchedRoutes(newRoutes);
        } else {
          setFetchedRoutes([]);
        }
      } catch (error) {
        console.error("Error fetching data: ", error as Error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, routeId]);

  return (
    <IonPage>
      <IonContent fullscreen>
      {headerContext?.showHeader && (
        <IonHeader>
          <IonToolbar>
            </IonToolbar>
        </IonHeader>
      )}
        <IonToolbar>
          <IonTitle>Create a Route</IonTitle>
        </IonToolbar>
        <IonCard>
          <IonTitle>Route Name</IonTitle>
          <IonTitle>Description</IonTitle>
          <IonTitle>Start</IonTitle>
          <IonTitle>End</IonTitle>
          <IonTitle>Distance</IonTitle>
          <IonTitle>Duration</IonTitle>
          <IonTitle>Difficulty</IonTitle>
          <IonTitle>Type</IonTitle>
            <IonRadio slot="end" value="School" />
            <IonRadio slot="end" value="Work" />
            <IonRadio slot="end" value="Other" />
          <IonTitle>Route Tags</IonTitle>
          <IonTitle>Route Image</IonTitle>
          <IonTitle>Route Map</IonTitle>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default CreateRoute;


