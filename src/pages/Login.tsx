import React, { useState, useEffect, useContext } from 'react';
import useAuth from '../useAuth';
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonHeader,
  IonRow,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';
import PasswordReset from '../components/PasswordReset';
import { HeaderContext } from '../components/HeaderContext';
import { getRedirectResult } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInWithGoogleMobile,
    signInAnonymously,
    checkAndUpdateAccountModes,
  } = useAuth();
  const history = useHistory();
  const headerContext = useContext(HeaderContext);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(email, password);
      const user = userCredential?.user;
      if (user && user.uid) {
        console.log("Starting checkAndUpdateAccountModes");
        await checkAndUpdateAccountModes(user.uid);
        console.log("Finished checkAndUpdateAccountModes");
      }
      setSuccessMessage('Successfully logged in!');
      console.log("Pushing to /Map");
      history.push('/Map');
      console.log("Pushed to /Map");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage("Error logging in: " + error.message);
      } else {
        setErrorMessage("Error logging in.");
      }
    }
  };

  const handleGoogleSubmit = async () => {
    console.log("handleGoogleSubmit");
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        // Mobile browsers do not support redirect sign-in
        // so we need to use popup sign-in instead
        console.log("Starting signInWithGoogle");
        const userCredential = await signInWithGoogleMobile();
        console.log("Finished signInWithGoogle");
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
            console.log("Starting checkAndUpdateAccountModes");
            await checkAndUpdateAccountModes(user.uid);
            console.log("Finished checkAndUpdateAccountModes");

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
    <IonPage>
      <IonContent className='login-container'>
        <IonRow className="welcome-to-bikebus" background-color="primary">
          <IonText color="secondary">
            <h1>BikeBus</h1>
          </IonText>
        </IonRow>
        <IonRow className="welcome-to-bikebus-about">
          <IonText className="ion-align-items-center">BikeBus is an app to help BikeBus Leaders organize BikeBus trips.</IonText>
        </IonRow>
        <IonText className="signup">
          <p>
            Don't have an account?{' '}
            <IonButton
              fill="solid"
              color="primary"
              onClick={() => history.push('/SignUp')}
            >
              Sign Up
            </IonButton>
          </p>
        </IonText>
        <form className="email-input" onSubmit={handleSubmit}>
          <IonText color="danger">{errorMessage}</IonText>
          <IonText color="success">{successMessage}</IonText>
          <IonItem>
            <IonLabel>Email</IonLabel>
            <IonInput aria-label="email"
              type="email"
              placeholder="Email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Password</IonLabel>
            <IonInput aria-label="password"
              type="password"
              placeholder="Password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />
          </IonItem>
          <IonButton className="email-button" type="submit">
            Login with Email
          </IonButton>
        </form>
        <PasswordReset email={email} />
        <IonText className="use-google">
          <p>
            <IonButton
              onClick={handleGoogleSubmit}
            >
              Login with Google
            </IonButton>

          </p>
        </IonText>
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
        <IonText>
          <p>Copyright 2023 for Craig Merry</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Login;

