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
import { getRedirectResult, GoogleAuthProvider, signInWithCredential, signInWithRedirect } from '@firebase/auth';
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
    console.log("handleGoogleSubmit");
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Mobile browsers do not support redirect sign-in
        // so we need to use the capacitor plugin instead
        console.log("Starting signInWithGoogleNative");
        try {
          const userCredential = await signInWithGoogleNative();

          // switch for signInWithGoogleNative
          // const userCredential = await signInWithGoogleNative();
          console.log("Finished signInWithGoogleNative");
          const user = userCredential?.user;
          if (user && user.uid) {
            console.log("Starting checkAndUpdateAccountModes");
            await checkAndUpdateAccountModes(user.uid);
            console.log("Finished checkAndUpdateAccountModes");
          }
          const username = user?.displayName;
          if (username) {
            // user has a username, so redirect to the map page
            console.log("Pushing to /Map");
            history.push('/Map');
            console.log("Pushed to /Map");
          } else {
            // user does not have a username, so redirect to the set username page
            console.log("Pushing to /SetUsername");
            history.push('/SetUsername');
            console.log("Pushed to /SetUsername");
          }
        } catch (error) {
          console.log("signInWithGoogleNative error: " + error);
        }
      } else {
        // Desktop browsers support redirect sign-in
        console.log("Starting signInWithGoogle");

        const userCredential = await signInWithGoogle();
        const user = userCredential?.user;
        if (user && user.uid) {
          await checkAndUpdateAccountModes(user.uid);
        }
        const username = user?.displayName;
        if (username) {
          // user has a username, so redirect to the map page
          console.log("Pushing to /Map");
          history.push('/Map');
          console.log("Pushed to /Map");
        } else {
          // user does not have a username, so redirect to the set username page
          console.log("Pushing to /SetUsername");
          history.push('/SetUsername');
          console.log("Pushed to /SetUsername");
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Failed to execute 'postMessage' on 'Window'")) {
          setErrorMessage("Error logging in with Google. Please try again or use another sign-in method.");
        } else {
          setErrorMessage("Error logging in with Google: " + error.message);
        }
      } else {
        setErrorMessage("Error logging in with Google.");
      }
    }
  };

  return (
    <IonPage className="ion-flex-offset-app">
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
              <h4>Drop a line on Twitter @BikeBusApp</h4>
            </IonText>
          </IonRow>
          <IonRow className="welcome-to-bikebus-buttons">
            <IonCol>
              <IonButton routerLink='/Signup'>Signup</IonButton>
            </IonCol>
            <IonCol>
              <IonButton routerLink='/Login'>Login</IonButton>
            </IonCol>
            <IonCol>
            <IonButton onClick={handleGoogleSubmit}>
              <img src={GoogleLogo} alt="Google logo" style={{ marginRight: '8px' }} />
              Login with Google
            </IonButton>
            </IonCol>
            <IonCol>
              <IonButton routerLink='/PrivacyPolicy'>Privacy Policy</IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Welcome;
