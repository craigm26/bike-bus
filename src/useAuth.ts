import { useEffect, useState } from 'react';
import { auth, db, auth as firebaseAuth } from './firebaseConfig';
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
} from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, setDoc, getDocFromServer } from 'firebase/firestore';
import { FirebaseAuthentication, SignInWithOAuthOptions, SignInResult, SignInOptions } from '@capacitor-firebase/authentication';
import { useHistory } from 'react-router-dom';
import { set } from 'date-fns';



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
        const userData = await mapFirebaseUserToUserData(fUser);
        setUser(userData);
        setFirebaseUser(fUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isAnonymous = firebaseUser?.isAnonymous || false;


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
      const result = await FirebaseAuthentication.signInWithGoogle();
      console.log('result on useAuth page', result);
      // let's example the result and see if it can match the required userCredential type
      const userCredential = result as unknown as UserCredential;
      console.log('userCredential on useAuth page', userCredential);
      console.log('userCredential.user on useAuth page', userCredential.user);
      // kick off the authentication process with Firebase
      const user = userCredential.user;

      const accessToken = result?.credential?.accessToken || '';
      console.log('accessToken on useAuth page', accessToken);
      const idToken = result?.credential?.idToken || '';
      console.log('idToken on useAuth page', idToken);
      // map the user to the userData object
      return userCredential;

    } catch (error) {
      console.error('Error in signInWithGoogleNative:', error);
      return null;
    }

  };

  const getCurrentUser = async () => {
    const result = await FirebaseAuthentication.getCurrentUser();
    console.log('getCurrentUser', result);
    return result.user;
  };

  const getIdToken = async () => {
    const result = await FirebaseAuthentication.getIdToken();
    console.log('getIdToken', result);
    return result;
  };

  const authenticateWithFirebase = async (providerId: typeof ProviderId, accessToken: string, idToken: string): Promise<UserData | null> => {
    console.log('authenticateWithFirebase called');
    console.log('providerId:', providerId);
    console.log('accessToken:', accessToken);
    console.log('idToken:', idToken);
    let userCredential: UserCredential | null = null;
    userCredential = await signInWithCredential(firebaseAuth, GoogleAuthProvider.credential(idToken, accessToken));


    console.log('userCredential:', userCredential);


    const user = userCredential.user;
    console.log('user:', user);
    const userData = await mapFirebaseUserToUserData(user);
    console.log('userData:', userData);
    setUser(userData);
    console.log('user set in useAuth');
    return userData;
  }



  const signInAnonymously = async (): Promise<UserCredential> => {
    try {
      const userCredential = await firebaseSignInAnonymously(firebaseAuth);
      const user = userCredential.user;

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userData = {
          accountType: "Anonymous",
          enabledAccountModes: ["Anonymous"]
        };

        await setDoc(userRef, userData, { merge: true });

        const mappedUser = await mapFirebaseUserToUserData(user);
        setUser(mappedUser);
      }

      return userCredential;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
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
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    mapFirebaseUserToUserData,
    authenticateWithFirebase,
    error,
    setError,
    isAnonymous,
  };
};

export default useAuth;
