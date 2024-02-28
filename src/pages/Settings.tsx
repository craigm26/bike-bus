import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';


const Settings: React.FC = () => {
  const { user, loadingAuthState } = useContext(AuthContext);

  if (loadingAuthState) {
    // Show a loading spinner while auth state is loading
    return <IonSpinner />;
  }

  // get the user data from the AuthContext
  console.log('user:', user);


  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonButton routerLink='/Account'>Back to Account</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
