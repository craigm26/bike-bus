import React, { useState } from 'react';
import { IonPage, IonInput, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonGrid, IonRow } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import useAuth from '../useAuth';

const SetUsername: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const history = useHistory();

  const saveUsername = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { username: username });
      history.push('/Account');
    }
  };

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonTitle>Set Username</IonTitle>
      </IonHeader>
      <IonContent style={{ height: '100%' }}>
      <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IonRow style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <IonItem>
          <IonLabel>@Username</IonLabel>
          <IonInput
            type="text"
            value={username}
            onIonChange={async (event) => {
              setUsername(event.detail.value!)
            }}
          />
        </IonItem>
      <IonButton onClick={saveUsername}>Save Username</IonButton>
        </IonRow>
      </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default SetUsername;
