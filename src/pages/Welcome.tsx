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
import { getRedirectResult, User } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';
import SearchBar from "../components/SearchBar";
import useAuth from '../useAuth';

const Welcome: React.FC = () => {
  const {
    signInWithGoogle,
    signInAnonymously,
    checkAndUpdateAccountModes,
  } = useAuth();
  const history = useHistory();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);



  const handleGoogleSubmit = async () => {
    try {
      console.log('starting signInWithGoogle');
      const userCredential = await signInWithGoogle();
      console.log('userCredential', userCredential);
      if (!userCredential) {
        throw new Error('userCredential is null, Failed to sign in with Google.');
        console.log('userCredential is null');
      }
      if (userCredential) {
        await processUser(userCredential.user);
      }
    } catch (error) {
      console.error('Error during Google sign in:', error);
    }
  };

  const processUser = async (user: User | null | undefined) => {
    if (user) {
      await checkAndUpdateAccountModes(user.uid);
      const username = user.displayName;
      if (username) {
        setIsLoggedIn(true);
        setUsername(username);
      } else {
        history.push('/SetUsername');
      }
    }
  };

  const handleLogout = async () => {
    await firebaseAuth.signOut();
    setIsLoggedIn(false);
    setUsername(null);
  };

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        await processUser(user);
      }
    });
    return unsubscribe;
  }, [checkAndUpdateAccountModes, history]);




  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        <IonGrid className="welcome-grid">
          <IonRow className="welcome-to-bikebus">
            <IonCol size="12">
              <h1>BikeBus</h1>
              <h3>BikeBus is an app to help BikeBus leaders and parents organize BikeBus rides and help kids ride to school safely.</h3>
            </IonCol>
          </IonRow>
          <IonRow className="ion-justify-content-center video-container">
            <IonCol size="12">
              <div className="responsive-iframe-container">
                <iframe
                  src="https://www.youtube.com/embed/rKBRXcU9MYk"
                  title="How to Start a BikeBus"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </IonCol>
          </IonRow>

          {isLoggedIn && username ? (
            <>
              <IonRow className="ion-justify-content-center">
                <IonCol size="10">
                  <IonButton expand="block" onClick={() => history.push('/Map')}>Continue as {username}</IonButton>
                </IonCol>
              </IonRow>
              <IonRow className="ion-justify-content-center">
                <IonCol size="5">
                  <IonButton expand="block" onClick={handleLogout}>Logout</IonButton>
                </IonCol>
              </IonRow>
            </>
          ) : (
            <>
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
            </>
          )}
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
