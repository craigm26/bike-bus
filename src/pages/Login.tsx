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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signInWithEmailAndPassword,
    signInWithGoogle,
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

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(email, password);
      const user = userCredential?.user;
      if (user && user.uid) {
        await checkAndUpdateAccountModes(user.uid);
      }
      setSuccessMessage('Successfully logged in!');
      setTimeout(() => {
        history.push('/Map');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage("Error logging in: " + error.message);
      } else {
        setErrorMessage("Error logging in.");
      }
    }
  };

  const handleGoogleSubmit = async () => {
    try {
      const userCredential = await signInWithGoogle();
      const user = userCredential?.user;
      if (user && user.uid) {
        await checkAndUpdateAccountModes(user.uid);
      }
      history.push('/Map');
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage("Error logging in with Google: " + error.message);
      } else {
        setErrorMessage("Error logging in with Google.");
      }
    }
  };






  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
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

