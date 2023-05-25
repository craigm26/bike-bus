import React, { useEffect, useContext } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonHeader,
  IonRow,
  IonGrid,
  IonCol,
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
        <IonGrid>
          <IonRow className="welcome-to-bikebus">
            <IonText color="primary">
              <h1>BikeBus</h1>
            </IonText>
          </IonRow>
          <IonRow className="welcome-to-bikebus-about">
            <IonText className="ion-align-items-center">
              <h4>BikeBus is an app to help BikeBus leaders and parents organize BikeBus rides</h4>
              <h4>It is currently under development</h4>
              <h4>This is an Alpha Build</h4>
              <h4>We're testing while I'm trying to quickly build this app - drop a line on Twitter @BikeBusApp</h4>
            </IonText>
          </IonRow>
          <IonRow className="welcome-to-bikebus-buttons">
            <IonCol>
              <IonButton routerLink='/Signup'>Signup</IonButton>
            </IonCol>
            <IonCol>
              <IonButton routerLink='/Login'>Login</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
