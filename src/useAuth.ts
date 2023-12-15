import { useEffect, useState } from 'react';
import { auth, db, auth as firebaseAuth } from './firebaseConfig';
import { Capacitor } from '@capacitor/core';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User,
  UserCredential,
  updateProfile,
  signInWithRedirect,
  signInWithCredential,
  signInWithPopup,
  ProviderId,
  signInWithCustomToken,
  UserInfo,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, setDoc, getDocFromServer } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { FirebaseAuthentication, SignInWithOAuthOptions, SignInResult, SignInOptions } from '@capacitor-firebase/authentication';
import { useHistory } from 'react-router-dom';
import { set } from 'date-fns';
import { get } from 'http';



interface UserData {
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
  const [error, setError] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const mapFirebaseUserToUserData = (async (firebaseUser: User): Promise<UserData> => {
    let enabledAccountModes: ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[] = [];
    let enabledOrgModes: ("OrganizationCreator" | "OrganizationMembers" | "OrganizationAdmins" | "OrganizationManagers" | "OrganizationEmployees" | "Organization")[] = [];

    // Fetch additional user data from the database or other sources
    const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userSnapshot.data();

    if (userData && userData.accountType) {
      enabledAccountModes = getEnabledAccountModes(userData.accountType);
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: firebaseUser.displayName || '',
      firstName: '',
      lastName: '',
      accountType: userData?.accountType || '',
      enabledAccountModes: enabledAccountModes as ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[],
      enabledOrgModes: enabledOrgModes as ("OrganizationCreator" | "OrganizationMembers" | "OrganizationAdmins" | "OrganizationManagers" | "OrganizationEmployees" | "Organization")[],
      // Add other properties specific to user data
    };
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fUser) => {
      if (fUser) {
        // User is signed in
        const idToken = await fUser.getIdToken(); // Get the ID token
        console.log("ID Token:", idToken);

        const userData = await mapFirebaseUserToUserData(fUser);
        setUser(userData);
        setFirebaseUser(fUser);
      } else {
        // User is signed out
        setUser(null);
        setFirebaseUser(null);
      }
    });

    return () => {
      unsubscribe(); // Clean up the subscription
    };
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
    console.log('userData:', userData);
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

  const signInWithGoogle = async (): Promise<UserCredential | null> => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('signInWithGoogle called');
      const result = await signInWithRedirect(firebaseAuth, provider);
      console.log('result on useAuth page', result);
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  };


  const signInWithGoogleNative = async (): Promise<UserCredential | null> => {
    try {
      console.log('signInWithGoogleNative called');
      const result = await FirebaseAuthentication.signInWithGoogle();

      console.log('result as string:', JSON.stringify(result));

      if (result.credential && result.credential.idToken && result.credential.accessToken) {
        const { idToken, accessToken } = result.credential;
        console.log('token:', accessToken);
        console.log('idToken:', idToken);

        try {
          // the provider is google
          const userCredential = await signInWithCredential(firebaseAuth, GoogleAuthProvider.credential(idToken, accessToken));
          return userCredential;
        } catch (signInError) {
          console.error('Error during signInWithCredential:', signInError);
          // Log additional error details if available
          if ((signInError as any).code) console.error('Error code:', (signInError as any).code);
          if ((signInError as any).message) console.error('Error message:', (signInError as any).message);
          if ((signInError as any).stack) console.error('Error stack:', (signInError as any).stack);
          return null;
        }

      } else {
        console.error('No credentials found in result.');
        return null;
      }
    } catch (error) {
      console.error('Error in signInWithGoogleNative:', error);
      return null;
    }
  };

  const signInWithGoogleOniOS = async () => {
    console.log('signInWithGoogleOniOS called');

    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      console.log('result:', result);

      if (!result.credential?.idToken) {
        throw new Error('No idToken found in the result.');
      }

      const credential = GoogleAuthProvider.credential(result.credential.idToken);
      console.log('credential:', credential);

      const auth = getAuth();
      console.log('auth:', auth);

      console.log('starting signInWithCredential');
      await signInWithCredential(auth, credential);
      console.log('signInWithCredential successful');

      const user = auth.currentUser;
      console.log('user:', user);

      if (user) {
        const mappedUser = await mapFirebaseUserToUserData(user);
        console.log('mappedUser:', mappedUser);
        setUser(mappedUser);
        console.log('user set in useAuth');
      } else {
        throw new Error('User is null after signInWithCredential');
      }
    } catch (error) {
      console.error('Error in signInWithGoogleOniOS:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    }
  };




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
      console.log('Checking and updating account modes for user:', uid);
      const userRef = doc(collection(db, 'users'), uid);
      console.log('userRef:', userRef);
      const isMobile = navigator.userAgent.match(/iPhone|iPad|iPod|Android/i);
      if (isMobile) {
        // somehow need to update userData from userRef. Not sure why getDoc is not working for mobile
        console.log('isMobile');
        //getDoc should be the users' uid from firebase - this is a string, whereas getDoc is expecting a DocumentReference. 
        // how do we get the DocumentReference from the users' uid?
        const userDocRef = doc(db, 'users', uid);
        console.log('userDocRef:', userDocRef);
        const userDoc = await getDocFromServer(userDocRef);
        console.log('userDoc:', userDoc);
        const userData = userDoc.data();
        console.log('userData:', userData);
      } else {
        const userDoc = await getDoc(userRef);

        console.log('userDoc:', userDoc);

        if (userDoc.exists()) {
          console.log('userDoc exists');
          const userData = userDoc.data();
          console.log('userData:', userData);
          if (userData && userData.accountType) {
            console.log('userData.accountType exists');
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
    signInWithGoogleNative,
    signInWithGoogleOniOS,
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    mapFirebaseUserToUserData,
    error,
    setError,
    isAnonymous,
  };
};

export default useAuth;