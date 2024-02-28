import {
  IonContent,
  IonPage,
  IonSpinner,
} from '@ionic/react';
import { useState, useContext } from 'react';
import { AuthContext } from '../AuthContext';


const Template: React.FC = () => {
  const { user, loadingAuthState } = useContext(AuthContext);
  
  if (loadingAuthState) {
    // Show a loading spinner while auth state is loading
    return <IonSpinner />;
  }

  // get the user data from the AuthContext
  console.log('user:', user);
  

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
      </IonContent>
    </IonPage>
  );
};

export default Template;
