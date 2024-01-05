import {
  IonContent,
  IonPage,
} from '@ionic/react';
import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';


const Settings: React.FC = () => {
  const { user } = useContext(AuthContext);



  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <h1>Settings</h1>
        <p>Logged in as {user?.email}</p>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
