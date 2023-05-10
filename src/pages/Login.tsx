import React, { useState } from 'react';
import useAuth from '../useAuth';
import {
  IonPage,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonHeader,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './Login.css';
import PasswordReset from '../components/PasswordReset';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInAnonymously,
  } = useAuth();
  const history = useHistory();

  const [errorMessage, setErrorMessage] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(email, password);
      // Redirect to the main app or show a success message
      history.push('/Map');
    } catch (error) {
      // Handle the error (e.g., display an error message)
      if (error instanceof Error) {
        setErrorMessage("Error logging in: " + error.message);
      } else {
        setErrorMessage("Error logging in.");
      }
    }
  };
  

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent>
        <IonText color="primary" class="BikeBusFont">
          <h1>BikeBus</h1>
        </IonText>
        <IonTitle>Login</IonTitle>
        <IonText>
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
        <form onSubmit={handleSubmit}>
          <IonText color="danger">{errorMessage}</IonText>
          <IonItem>
            <IonLabel>Email</IonLabel>
            <IonInput aria-label = "email"
              type="email"
              placeholder="Email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Password</IonLabel>
            <IonInput aria-label= "password"
              type="password"
              placeholder="Password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />
          </IonItem>
          <IonButton type="submit">
            Login with Email
          </IonButton>
        </form>
        <PasswordReset email={email} />
        <IonText>
          <p>Or Use Google
          <IonButton
          onClick={async () => {
            try {
              await signInWithGoogle();
              history.push('/Map');
            } catch (error) {
              // Handle the error (e.g., display an error message)
            }
          }}
        >
          Login with Google
        </IonButton>
          </p>
        </IonText>
        <IonText>
          <p>Just Curious?
          <IonButton
          onClick={async () => {
            try {
              await signInAnonymously();
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
