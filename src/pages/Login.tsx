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
import GoogleLogo from '../assets/web_neutral_sq_SI.svg';
import PasswordReset from '../components/PasswordReset';
import { HeaderContext } from '../components/HeaderContext';
import { getRedirectResult, GoogleAuthProvider, signInWithCredential, signInWithRedirect } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';

const Login: React.FC = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <IonPage className="ion-flex-offset-app">
      <IonContent className='login-container'>
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
        <form className="email-input">
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
          <IonButton className="email-button" type="button" onClick={handleSubmit}>
            Login with Email
          </IonButton>
        </form>
        <PasswordReset email={email} />
        <IonText className="use-google">
          <p>
            <IonButton onClick={handleGoogleSubmit}>
              <img src={GoogleLogo} alt="Google logo" style={{ marginRight: '8px' }} />
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
      </IonContent>
    </IonPage>
  );
};

export default Login;

