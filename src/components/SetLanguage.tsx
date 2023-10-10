import React, { useState, useEffect } from 'react';
import { IonPage, IonButton, IonLabel, IonItem, IonContent, IonHeader, IonTitle, IonGrid, IonRow, IonSelect, IonSelectOption } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import useAuth from '../useAuth';

const SetLanguage: React.FC = () => {
  const { user } = useAuth();
  const [preferredLanguage, setPreferredLanguage] = useState<string>('');
  const history = useHistory();

  useEffect(() => {
    const fetchPreferredLanguage = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.preferredLanguage) {
            setPreferredLanguage(userData.preferredLanguage);
          }
        }
      }
    };

    fetchPreferredLanguage();
  }, [user]);

  const saveLanguage = async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { preferredLanguage: preferredLanguage });
      history.push('/Account');
    }
  };

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        <IonLabel>Preferred Language</IonLabel>
        <IonItem>
          <IonSelect
            value={preferredLanguage}
            onIonChange={e => setPreferredLanguage(e.detail.value)}
          >
            <IonSelectOption value="en">English</IonSelectOption>
            <IonSelectOption value="de">Deutsch (German)</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonButton onClick={saveLanguage}>Set Language</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default SetLanguage;
