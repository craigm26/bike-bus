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
import { getRedirectResult, GoogleAuthProvider, signInWithCredential, User, UserInfo } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';
import useAuth from '../useAuth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const Welcome: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithGoogleNative,
    signInAnonymously,
    checkAndUpdateAccountModes,
    mapFirebaseUserToUserData,
    authenticateWithFirebase,
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
        console.log('userCredential from welcome page', userCredential);
        // let's pass the userCredential to the authenticateWithFirebase function
        await authenticateWithFirebase(); // Remove the argument here
        // have we authenticated with Firebase?
        console.log('after authenticateWithFirebase');
        // let's test to see if we can get the user from Firebase
        if (userCredential?.user) {
          console.log('starting processUser');
          await processUser(userCredential?.user);
        }
      } else {
        const userCredential = await signInWithGoogle();
        await processUser(userCredential?.user);
      }
    } catch (error) {
      console.error('Error during Google sign in:', error);
    }
  };

  const getCurrentUser = async () => {
    const result = await FirebaseAuthentication.getCurrentUser();
    console.log('getCurrentUser', result);
    return result.user;
  };

  const getIdToken = async () => {
    const result = await FirebaseAuthentication.getIdToken();
    console.log('getIdToken', result);
    return result;
  };

  const processUser = async (user: User | null | undefined) => {
    if (user) {
      console.log('user during processUser', user);
      console.log('user.uid', user.uid);
      console.log('user.displayName', user.displayName);
      console.log('user.email', user.email);
      await checkAndUpdateAccountModes(user.uid);
      console.log('after checkAndUpdateAccountModes');
      const username = user.displayName;
      console.log('username', username);
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
