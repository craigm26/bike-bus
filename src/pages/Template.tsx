import {
  IonContent,
  IonPage,
} from '@ionic/react';
import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';


const Template: React.FC = () => {
  const { user } = useContext(AuthContext);



  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
      </IonContent>
    </IonPage>
  );
};

export default Template;
