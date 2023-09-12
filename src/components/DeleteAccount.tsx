import React, { useState } from 'react';
import { IonPage, IonButton, IonContent, IonHeader, IonTitle, IonGrid, IonRow } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { deleteDoc, doc } from 'firebase/firestore';
import useAuth from '../useAuth';

const DeleteAccount: React.FC = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const history = useHistory();

  const deleteAccount = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);  
      history.push('/');
    }
  };

  return (
    <IonPage style={{ height: '100%' }}>
      <IonHeader>
        <IonTitle>Delete Account</IonTitle>
      </IonHeader>
      <IonContent style={{ height: '100%' }}>
      <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IonRow style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <IonButton onClick={deleteAccount}>Delete Account</IonButton>
        </IonRow>
      </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default DeleteAccount;
