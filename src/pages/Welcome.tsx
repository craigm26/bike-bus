import React from 'react';
import useAuth from '../useAuth';
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonHeader,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const {
    signInAnonymously,
  } = useAuth();
  const history = useHistory();


  

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
        <IonButton>
            <IonButton routerLink='/Signup'>Signup</IonButton>
        </IonButton>
        <IonButton>
            <IonButton routerLink='/Login'>Login</IonButton>
        </IonButton>
        <IonButton
          onClick={async () => {
            try {
              await signInAnonymously();
              history.push('/Map');
            } catch (error) {
              // Handle the error (e.g., display an error message)
            }
          }}
        >
          Login Anonymously
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Login;
