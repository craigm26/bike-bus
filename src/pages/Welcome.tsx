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
          console.log("userCredential: " + userCredential);
          console.log("Finished signInWithGoogleNative");
          const user = userCredential?.user;
          console.log("user: " + user);
          console.log("user.uid: " + user?.uid)
          if (user && user.uid) {
            console.log("Starting native checkAndUpdateAccountModes");
            await checkAndUpdateAccountModes(user.uid);
            console.log("Finished native checkAndUpdateAccountModes");
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


  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);
        if (result) {
          const user = result.user;
          if (user && user.uid) {
            console.log("Starting web checkAndUpdateAccountModes");
            await checkAndUpdateAccountModes(user.uid);
            console.log("Finished web checkAndUpdateAccountModes");

            // The same username check and redirect logic as in handleGoogleSubmit
            const username = user.displayName;
            if (username) {
              console.log("Pushing to /Map");
              history.push('/Map');
              console.log("Pushed to /Map");
            } else {
              console.log("Pushing to /SetUsername");
              history.push('/SetUsername');
              console.log("Pushed to /SetUsername");
            }
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

    handleRedirectResult();

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
          <p>
            <IonButton
              onClick={async () => {
                try {
                  const userCredential = await signInAnonymously();
                  const user = userCredential?.user;
                  if (user && user.uid) {
                    await checkAndUpdateAccountModes(user.uid);
                  }
                  history.push('/Map');
                } catch (error) {
                  // Handle the error (e.g., display an error message)
                }
              }}
            >
              Login Anonymously
            </IonButton>
          </p>
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
