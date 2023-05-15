import React, { useState } from 'react';
import { IonPage, IonInput, IonButton, IonLabel, IonItem } from '@ionic/react';
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
      history.push('/Map');
    }
  };

  return (
    <IonPage>
      <IonItem>
        <IonLabel position="stacked">Username</IonLabel>
        <IonInput
          value={username}
          placeholder="Enter Username"
          onIonChange={e => setUsername(e.detail.value!)}
        />
      </IonItem>
      <IonButton onClick={saveUsername}>Save Username</IonButton>
    </IonPage>
  );
};

export default SetUsername;
