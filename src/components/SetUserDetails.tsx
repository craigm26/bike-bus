import React, { useEffect, useState } from 'react';
import { IonPage, IonInput, IonButton, IonLabel, IonItem, IonContent, IonCard, IonCardContent, IonCardHeader } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import useAuth from '../useAuth';

const SetUserDetails: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const history = useHistory();

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUsername(userData.username || '');
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          // Set other fields as needed
        } else {
          console.log("No such document!");
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  const saveUserDetails = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: username,
        firstName: firstName,
        lastName: lastName,
        // Include other fields as needed
      });
      // Provide feedback and/or navigate
      history.push('/Account');
    }
  };

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonCard className="ion-justify-content-center">
          <IonCardHeader>Set User Details</IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonInput
                placeholder="First Name"
                value={firstName}
                onIonChange={(e) => setFirstName(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonInput
                placeholder="Last Name"
                value={lastName}
                onIonChange={(e) => setLastName(e.detail.value!)}
              />
            </IonItem>
            <IonItem>
              <IonInput
                placeholder="Username"
                value={username}
                onIonChange={(e) => setUsername(e.detail.value!)}
              />
            </IonItem>
            <IonButton onClick={saveUserDetails}>Save Details</IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default SetUserDetails;
