import { useEffect, useState } from 'react';
import { db, auth as firebaseAuth } from './firebaseConfig';
import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  OAuthProvider,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  UserCredential,
  updateProfile,
  signInWithCredential,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  signInWithPopup,
  signInWithRedirect,
  IdTokenResult,
} from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, setDoc, getDocFromServer } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { FirebaseAuthentication, User } from '@capacitor-firebase/authentication';




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



const useAuth = () => {
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



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        const userData = await mapFirebaseUserToUserData(user);
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return unsubscribe;
  }, []);


  const isAnonymous = firebaseUser?.isAnonymous || false;

  const getFirebaseAuth = async () => {
    if (Capacitor.isNativePlatform()) {
      return initializeAuth(getApp(), {
        persistence: indexedDBLocalPersistence,
      });
    } else {
      return getAuth();
    }
  };

  const signUpWithEmailAndPassword = async (email: string, password: string, username: string, firstName: string, lastName: string): Promise<UserCredential> => {
    console.log('signUpWithEmailAndPassword in useAuth called');
    console.log('email:', email);
    console.log('password:', password);
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    console.log('userCredential:', userCredential);
    const user = userCredential.user;
    console.log('user:', user);
    await updateProfile(user, { displayName: username });
    console.log('user updated with username:', user);

    const userData = await mapFirebaseUserToUserData(user);
    setUser(userData);
    console.log('user set in useAuth');

    return userCredential;
  };

  const signInWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await firebaseSignInWithEmailAndPassword(firebaseAuth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const sendResetEmail = async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error) {
      console.error('Error sending password reset email:', error);
    }
  };

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

          userCredential = await signInWithCredential(firebaseAuth, googleCredential);
          //userCredential = await signInWithCredential(firebaseAuth, googleCredential);
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


  /*
  const signInWithApple = async (): Promise<UserCredential | null> => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native sign-in with Apple using Capacitor plugin
        const result = await FirebaseAuthentication.signInWithApple();
        if (!result.identityToken) {
          throw new Error("No identity token received from Apple sign-in.");
        }
        const credential = OAuthProvider.credential({
          idToken: result.identityToken,
          rawNonce: result.nonce, // Ensure you're handling nonces correctly for security
        });
        return await signInWithCredential(firebaseAuth, credential);
      } else {
        // Web sign-in with Apple
        const provider = new OAuthProvider('apple.com');
        return await signInWithRedirect(firebaseAuth, provider);
      }
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred. Please try again later.');
      return null;
    }
  };
  */




  const signInAnonymously = async (): Promise<UserCredential> => {
    const isIOS = navigator.userAgent.match(/iPhone|iPad|iPod/i);

    if (isIOS) {
      console.log('isIOS');
      try {
        console.log('signInAnonymously on iOS called');
        const authInstance = firebaseAuth;
        console.log('authInstance:', authInstance);
        const userCredential = await firebaseSignInAnonymously(authInstance);

        console.log('userCredential:', userCredential);
        const user = userCredential.user;

        if (user) {
          console.log('user exists');
          console.log('user.uid:', user.uid);
          const userRef = doc(db, 'users', user.uid);
          console.log('userRef:', userRef);
          const userData = {
            accountType: "Anonymous",
            enabledAccountModes: ["Anonymous"]
          };
          console.log('userData:', userData);

          await setDoc(userRef, userData, { merge: true });
          console.log('userRef set with userData');

          const mappedUser = await mapFirebaseUserToUserData(user);
          console.log('mappedUser:', mappedUser);
          setUser(mappedUser);
        }

        return userCredential;
      } catch (error) {
        console.error('Error signing in anonymously:', error);
        throw error;
      }
    } else {


      try {
        console.log('signInAnonymously called');
        const userCredential = await firebaseSignInAnonymously(firebaseAuth);
        console.log('userCredential:', userCredential);
        const user = userCredential.user;

        if (user) {
          console.log('user exists');
          console.log('user.uid:', user.uid);
          const userRef = doc(db, 'users', user.uid);
          console.log('userRef:', userRef);
          const userData = {
            accountType: "Anonymous",
            enabledAccountModes: ["Anonymous"]
          };
          console.log('userData:', userData);

          await setDoc(userRef, userData, { merge: true });
          console.log('userRef set with userData');

          const mappedUser = await mapFirebaseUserToUserData(user);
          console.log('mappedUser:', mappedUser);
          setUser(mappedUser);
        }

        return userCredential;
      } catch (error) {
        console.error('Error signing in anonymously:', error);
        throw error;
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkAndUpdateAccountModes = async (uid: string) => {
    try {
      const userRef = doc(collection(db, 'users'), uid);
      const isMobile = navigator.userAgent.match(/iPhone|iPad|iPod|Android/i);
      if (isMobile) {
        // somehow need to update userData from userRef. Not sure why getDoc is not working for mobile
        console.log('isMobile');
        //getDoc should be the users' uid from firebase - this is a string, whereas getDoc is expecting a DocumentReference. 
        // how do we get the DocumentReference from the users' uid?
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDocFromServer(userDocRef);
      } else {
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData && userData.accountType) {
            // Only update if enabledAccountModes does not exist or is empty
            if (!userData.enabledAccountModes || userData.enabledAccountModes.length === 0) {
              const enabledAccountModes = getEnabledAccountModes(userData.accountType);
              await updateDoc(userRef, { enabledAccountModes });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking and updating account modes:', error);
    }
  };

  return {
    user,
    firebaseUser,
    checkAndUpdateAccountModes,
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    //signInWithApple,
    signInAnonymously,
    signOut,
    mapFirebaseUserToUserData,
    error,
    setError,
    isAnonymous,
  };
};

export default useAuth;