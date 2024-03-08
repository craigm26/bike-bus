import React, { useEffect, useState } from 'react';
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
import GoogleLogo from '../assets/web_neutral_sq_SI.svg';
import { useHistory } from 'react-router-dom';
import { GoogleAuthProvider, User as FirebaseUser, signInWithCredential, signInWithPopup, UserCredential } from '@firebase/auth';
import { db, auth as firebaseAuth } from '../firebaseConfig';
import useAuth from '../useAuth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { doc, getDoc } from 'firebase/firestore';

export type UserData = {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  accountType: "Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin";
  enabledAccountModes: Array<'Member' | 'Anonymous' | 'Leader' | 'Parent' | 'Kid' | 'Org Admin' | 'App Admin'>;
  enabledOrgModes: Array<'OrganizationCreator' | 'OrganizationMembers' | 'OrganizationAdmins' | 'OrganizationManagers' | 'OrganizationEmployees' | 'Organization'>;
}


const getEnabledAccountModes = (accountType: string): ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[] => {
  switch (accountType) {
    case 'Anonymous':
      return ['Member', 'Anonymous'];
    case 'Member':
      return ['Member'];
    case 'Leader':
      return ['Member', 'Leader'];
    case 'Parent':
      return ['Member', 'Leader', 'Parent'];
    case 'Kid':
      return ['Member', 'Kid'];
    case 'Org Admin':
      return ['Member', 'Org Admin'];
    case 'App Admin':
      return ['Member', 'Leader', 'Parent', 'Kid', 'Org Admin', 'App Admin'];
    default:
      return [];
  }
};

const Welcome: React.FC = () => {
  const {
    signInAnonymously,
    checkAndUpdateAccountModes,
  } = useAuth();
  const history = useHistory();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState<any>(null);

  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const mapFirebaseUserToUserData = async (firebaseUser: FirebaseUser): Promise<UserData> => {
    // Define default values
    const defaultUserData: UserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: firebaseUser.displayName || '',
      firstName: '',
      lastName: '',
      accountType: 'Member',
      enabledAccountModes: [],
      enabledOrgModes: []
    };

    try {
      // Fetch additional user data from the database
      const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data() as UserData;

        return { ...defaultUserData, ...userData };
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
    return defaultUserData;
  }


  const signInWithGoogle = async (): Promise<UserData | null> => {
    console.log('signInWithGoogle called');
    try {
      let userCredential: UserCredential;
      console.log('Capacitor.isNativePlatform():', Capacitor.isNativePlatform());
      if (Capacitor.isNativePlatform()) {
        console.log('Capacitor.isNativePlatform() is true');
        const result = await FirebaseAuthentication.signInWithGoogle();
        console.log('result:', result);
        if (!result.credential?.idToken) {
          throw new Error("No ID token returned from Google sign-in.");
        }
        try {
          const googleCredential = GoogleAuthProvider.credential(result.credential.idToken);
          console.log('googleCredential:', googleCredential);
          // firebase has already been initialized in the app.tsx file or index.tsx file - we want to use the same instance of firebase
          // how do we get the instance of firebase that was initialized in the app.tsx file or index.tsx file?
          console.log('firebaseAuth:', firebaseAuth);
          if (!firebaseAuth) {
            // get the instance of firebase that was initialized in the app.tsx file or index.tsx file
            const firebase = (await import('firebase/app')).default;
            console.log('firebase:', firebase);
            const firebaseAuth = (await import('firebase/auth')).default;
            console.log('firebaseAuth:', firebaseAuth);

          }
          
          userCredential = await signInWithCredential(firebaseAuth, googleCredential);
          console.log('userCredential:', userCredential);
          // map firebase user to userData
          const userData = await mapFirebaseUserToUserData(userCredential.user);
          console.log('userData:', userData);
          setUser(userData);
          return userData;
        }
        catch (error) {
          console.error('Error signing in with Google:', error);
          setError(error instanceof Error ? error.message : "An error occurred during Google sign-in.");
          return null;
        }
      } else {
        const provider = new GoogleAuthProvider();
        userCredential = await signInWithPopup(firebaseAuth, provider);
      }


      console.log('userCredential.user: in useAuth', userCredential.user);
      const userData = await mapFirebaseUserToUserData(userCredential.user);
      console.log('userData: in useAuth', userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error instanceof Error ? error.message : "An error occurred during Google sign-in.");
      return null;
    }
  };



  const handleGoogleSubmit = async () => {
    try {
      console.log('starting signInWithGoogle');
      const userData = await signInWithGoogle();
      console.log('from Welcome.tsx userCredential', userData);
      if (userData) {
        setIsLoggedIn(true);
        setUsername(userData.username || 'Anonymous Username');
        await checkAndUpdateAccountModes(userData.uid);
        history.push('/Map');
      }
    } catch (error) {
      console.error('Error during Google sign in:', error);
    }
  };

  const getUserData = async (uid: string) => {
    console.log('Getting user data for uid:', uid);
    const user = await firebaseAuth.currentUser;
    if (user) {
      console.log('Getting user data for user:', user);
      const userData = await user.getIdTokenResult();
      console.log('Got user data:', userData);
      processUser(user);
      return userData.claims;
    }
    return null;
  }


  const processUser = async (user: FirebaseUser | null | undefined) => {
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
    console.log('Welcome.tsx useEffect');

    // Check if the user is already logged in, if not, try to log them in
    const user = firebaseAuth.currentUser;
    if (user) {
      processUser(user);
    } else {
      console.log('No user is logged in');
      // start google sign in
      handleGoogleSubmit();
    }

    /*const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      console.log('firebaseUser: in Welcome.tsx', firebaseUser);
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser.uid);
        console.log('userData: in Welcome.tsx', userData);
        if (userData) {
          setIsLoggedIn(true);
          setUsername(userData.username);
        }
      } else {
        setIsLoggedIn(false);
        setUsername(null);
      }
    });
    return () => unsubscribe();
    */
  }, [firebaseAuth]);




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