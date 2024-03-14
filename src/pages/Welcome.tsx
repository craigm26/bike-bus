import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonText,
  IonRow,
  IonGrid,
  IonCol,
  IonIcon,
} from '@ionic/react';
import GoogleLogo from '../assets/web_neutral_sq_SI.svg';
import { useHistory } from 'react-router-dom';
import { User } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';
import useAuth from '../useAuth';
import { logoGithub } from 'ionicons/icons';

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
        setIsLoggedIn(true);
        setUsername('Anonymous Username');
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
              <h3>The BikeBus app helps leaders create and organize group bicycling rides</h3>
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
          <IonRow className="ion-justify-content-center">
            <IonCol size="10">
              <a href="https://github.com/craigm26/bike-bus/discussions/new?category=q-a" target="_blank" rel="noopener noreferrer">
                <IonButton shape="round" expand="block">
                  <IonIcon icon={logoGithub} />
                  FeedBack
                </IonButton>
              </a>
            </IonCol>

          </IonRow>

          {isLoggedIn && username ? (
            <>
              <IonRow className="ion-justify-content-center">
                <IonCol size="10">
                  <IonButton shape="round" expand="block" onClick={() => history.push('/Map')}>Continue as {username}</IonButton>
                </IonCol>
              </IonRow>
              <IonRow className="ion-justify-content-center">
                <IonCol size="5">
                  <IonButton shape="round" expand="block" onClick={handleLogout}>Logout</IonButton>
                </IonCol>
              </IonRow>
            </>
          ) : (
            <>
              <IonRow className="ion-justify-content-center">
                <IonCol size="5">
                  <IonButton shape="round" expand="block" routerLink='/Signup'>Signup</IonButton>
                </IonCol>
              </IonRow>
              <IonRow className="ion-justify-content-center">
                <IonCol size="5">
                  <IonButton shape="round" expand="block" routerLink='/Login'>Login</IonButton>
                </IonCol>
              </IonRow>
              <IonRow className="ion-justify-content-center">
                <IonCol size="5">
                  <img src={GoogleLogo} alt="Sign in with Google" onClick={handleGoogleSubmit} className="google-sign-in" />
                </IonCol>
              </IonRow>
              <IonText className="use-anonymously">
                <IonButton shape="round" onClick={async () => {
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
