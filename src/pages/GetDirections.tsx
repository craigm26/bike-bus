import {
    IonContent,
    IonHeader,
    IonPage,
  } from '@ionic/react';
  import { useEffect, useState, useContext } from 'react';
  import './Help.css';
  import useAuth from '../useAuth'; // Import useAuth hook
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  import { HeaderContext } from '../components/HeaderContext';
  
  
  const GetDirections: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const [accountType, setaccountType] = useState<string>('');
    const headerContext = useContext(HeaderContext);
  
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
  
    return (
      <IonPage>
        <IonContent fullscreen>
        {headerContext?.showHeader && (
          <IonHeader>
          </IonHeader>
        )}
        </IonContent>
      </IonPage>
    );
  };
  
  export default GetDirections;
  