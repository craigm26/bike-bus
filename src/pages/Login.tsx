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
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import GoogleLogo from '../assets/web_neutral_sq_SI.svg';
import AppleLogo from '../assets/Apple_logo_black.svg';
import PasswordReset from '../components/PasswordReset';
import { HeaderContext } from '../components/HeaderContext';
import { getRedirectResult, User } from '@firebase/auth';
import { auth as firebaseAuth } from '../firebaseConfig';
import { AuthContext } from '../AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmailAndPassword, signInWithGoogle, checkAndUpdateAccountModes, signInAnonymously } = useContext(AuthContext);

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
    try {
      const userCredential = await signInWithGoogle();
      if (userCredential?.user) {
        await processUser(userCredential.user);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage("Error logging in: " + error.message);
      } else {
        setErrorMessage("Error logging in.");
      }
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
        console.log(error);
      }
    })();

    if (headerContext) {
      headerContext.setShowHeader(false);
    }
  }, [headerContext, checkAndUpdateAccountModes, history]);


  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
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
          <IonButton shape="round" className="email-button" type="button" onClick={handleSubmit}>
            Login with Email
          </IonButton>
        </form>
        <PasswordReset email={email} />
        <IonText className="use-google">
          <p>
            <IonButton shape="round" color="clear" onClick={handleGoogleSubmit}>
              <img src={GoogleLogo} alt="Google logo" style={{ marginRight: '0px' }} />
            </IonButton>
          </p>
        </IonText>
        {/* Apple Sign In Button }
        <IonText className="use-apple">
          <p>
            <IonButton shape="round" color="clear" onClick={async () => {
              try {
                const userCredential = await signInWithApple();
                if (userCredential?.user) {
                  await processUser(userCredential.user);
                }
              } catch (error) {
                if (error instanceof Error) {
                  setErrorMessage("Error logging in with Apple: " + error.message);
                } else {
                  setErrorMessage("Error logging in with Apple.");
                }
              }
            }}>
              <img src={AppleLogo} alt="Apple logo" style={{ marginRight: '0px' }} />
            </IonButton>
          </p>
        </IonText>
        */}


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

