import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
  } from '@ionic/react';
  import { useEffect, useState } from 'react';
  import './Help.css';
  import useAuth from '../useAuth'; // Import useAuth hook
  import { doc, getDoc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
    
  
  const Template: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const [accountType, setaccountType] = useState<string>('');


    
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
          <IonHeader collapse="condense">
            <IonToolbar></IonToolbar>
          </IonHeader>
        </IonContent>
      </IonPage>
    );
  };
  
  export default Template;
  