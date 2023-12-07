import React, { useEffect, useContext, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonRow,
  IonGrid,
  IonCol,
} from '@ionic/react';
import './Welcome.css';
import { HeaderContext } from '../components/HeaderContext';
import GoogleLogo from '../assets/web_neutral_sq_SI.svg';
import { useHistory } from 'react-router-dom';
import { getRedirectResult, GoogleAuthProvider, signInWithCredential, User } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';
import useAuth from '../useAuth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const Welcome: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithGoogleNative,
    signInAnonymously,
    checkAndUpdateAccountModes,
  } = useAuth();
  const history = useHistory();
  const headerContext = useContext(HeaderContext);

  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(false);
    }
  }, [headerContext]);

  const handleGoogleSubmit = async () => {
    try {
      const isMobile = navigator.userAgent.match(/iPhone|iPad|iPod|Android/i);
      if (isMobile) {
        const userCredential = await signInWithGoogleNative();
        if (userCredential?.user) {
          const firebaseUser = await authenticateWithFirebase();
          await processUser(firebaseUser);
        }
      } else {
        const userCredential = await signInWithGoogle();
        await processUser(userCredential?.user);
      }
    } catch (error) {
      console.error('Error during Google sign in:', error);
    }
  };

  const authenticateWithFirebase = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('No current user found for Firebase authentication');
      return null;
    }

    const idTokenResult = await getIdToken();
    const idToken = idTokenResult?.token;

    if (idToken) {
      const credential = GoogleAuthProvider.credential(idToken);
      const firebaseUserCredential = await signInWithCredential(firebaseAuth, credential);
      return firebaseUserCredential.user;
    } else {
      console.error('ID Token not available for Firebase authentication');
      return null;
    }
  };

  const getCurrentUser = async () => {
    const result = await FirebaseAuthentication.getCurrentUser();
    return result.user;
  };

  const getIdToken = async () => {
    const result = await FirebaseAuthentication.getIdToken();
    return result;
  };

  const processUser = async (user: User | null | undefined) => {
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
        console.log(error);
      }
    })();
  }, [checkAndUpdateAccountModes, history]);




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
