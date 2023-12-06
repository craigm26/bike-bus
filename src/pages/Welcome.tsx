import React, { useEffect, useContext, useState } from 'react';
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
import { HeaderContext } from '../components/HeaderContext';
import GoogleLogo from '../assets/web_neutral_sq_SI.svg';
import { useHistory } from 'react-router-dom';
import { getRedirectResult, GoogleAuthProvider, signInWithCredential, signInWithRedirect, User } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';
import useAuth from '../useAuth';




const Welcome: React.FC = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInWithGoogleNative,
    signInAnonymously,
    checkAndUpdateAccountModes,
  } = useAuth();
  const history = useHistory();
  const headerContext = useContext(HeaderContext);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');


  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(false);
    }
  }, [headerContext]);

  const handleGoogleSubmit = async () => {
    try {

      const isMobile = navigator.userAgent.match(/iPhone|iPad|iPod|Android/i);
      if (isMobile) {
        await signInWithGoogleNative();
      } else {
        const userCredential = await signInWithGoogle();
        await processUser(userCredential?.user);
      }
    } catch (error) {

    } finally {

    }
  };

  const processUser = async (user: User | undefined) => {
    if (user) {
      await checkAndUpdateAccountModes(user.uid);
      const username = user.displayName;
      if (username) {
        history.push('/Map');
      } else {
        history.push('/SetUsername');
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (result) {
          await processUser(result.user);
        }
      } catch (error) {
        console.log(error);       }
    })();

    if (headerContext) {
      headerContext.setShowHeader(false);
    }
  }, [headerContext, checkAndUpdateAccountModes, history]);

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        <IonGrid className="welcome-grid">
          <IonRow className="welcome-to-bikebus">
            <IonCol size="12">
              <h1>BikeBus</h1>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12">
              <h4>BikeBus is an app to help BikeBus leaders and parents organize BikeBus rides</h4>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size="5">
              <IonButton expand="block" routerLink='/Signup'>Signup</IonButton>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size="5">
              <IonButton expand="block" routerLink='/Login'>Login</IonButton>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center">
            <IonCol size="5">
              <img src={GoogleLogo} alt="Sign in with Google" onClick={handleGoogleSubmit} className="google-sign-in" />
            </IonCol>
          </IonRow>
          <IonText className="use-anonymously">
            <IonButton onClick={async () => {
              try {
                await signInAnonymously();
                history.push('/Map');
              } catch (error) {
              }
            }}>
              Login Anonymously
            </IonButton>
          </IonText>
          <IonRow className="ion-justify-content-center">
            <IonCol size="5">
              <a href="/PrivacyPolicy" className="privacy-policy-link">Privacy Policy</a>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>

    </IonPage>
  );
};

export default Welcome;
