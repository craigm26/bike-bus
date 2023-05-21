import React, { useEffect, useContext } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonHeader,
} from '@ionic/react';
import './Welcome.css';
import { HeaderContext } from '../components/HeaderContext'; // make sure to use the correct relative path

const Welcome: React.FC = () => {
  const headerContext = useContext(HeaderContext);

  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(false);
    }
  }, [headerContext]);

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent>
        <IonText color="primary" class="BikeBusFont">
          <h1>BikeBus</h1>
        </IonText>
        <IonText>
          <p>BikeBus is an app to help BikeBus leaders and parents organize BikeBus rides</p>
          <p>It is currently under development</p>
          <p>We're testing while I'm trying to quickly build this app - drop a line on Twitter @BikeBusApp</p>
        </IonText>
        <IonButton routerLink='/Signup'>Signup</IonButton>
        <IonButton routerLink='/Login'>Login</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
