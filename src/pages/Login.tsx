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

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInAnonymously,
  } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(email, password);
      // Redirect to the main app or show a success message
      history.push('/BikeBusMember');
    } catch (error) {
      // Handle the error (e.g., display an error message)
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
        <form onSubmit={handleSubmit}>
          <IonItem>
            <IonLabel>Email</IonLabel>
            <IonInput
              type="email"
              placeholder="Email"
              value={email}
              onIonChange={(e) => setEmail(e.detail.value!)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>Password</IonLabel>
            <IonInput
              type="password"
              placeholder="Password"
              value={password}
              onIonChange={(e) => setPassword(e.detail.value!)}
            />
          </IonItem>
          <IonButton expand="block" type="submit">
            Login with Email
          </IonButton>
        </form>
        <IonButton
          expand="block"
          onClick={async () => {
            try {
              await signInWithGoogle();
              history.push('/BikeBusMember');
            } catch (error) {
              // Handle the error (e.g., display an error message)
            }
          }}
        >
          Login with Google
        </IonButton>
        <IonButton
          expand="block"
          onClick={async () => {
            try {
              await signInAnonymously();
              history.push('/BikeBusMember');
            } catch (error) {
              // Handle the error (e.g., display an error message)
            }
          }}
        >
          Login Anonymously
        </IonButton>
        <IonText>
          <p>
            Don't have an account?{' '}
            <IonButton
              fill="clear"
              color="primary"
              onClick={() => history.push('/register')}
            >
              Register
            </IonButton>
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default Login;
