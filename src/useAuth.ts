import { useState, useEffect } from 'react';
import { db, auth as firebaseAuth } from './firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User,
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, setDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  accountType: "Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin";
  enabledAccountModes: Array<'Member' | 'Anonymous' | 'Leader' | 'Parent' | 'Kid' | 'Org Admin' | 'App Admin'>;
  // Add other properties specific to user data
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

const mapFirebaseUserToUserData = (async (firebaseUser: User): Promise<UserData> => {
  let enabledAccountModes: ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[] = [];

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
    // Add other properties specific to user data
  };
});

const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);


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
  

  const signUpWithEmailAndPassword = async (email: string, password: string, username: string, firstName: string, lastName:string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: username });

    const userData = await mapFirebaseUserToUserData(user);
    setUser(userData);

    return userCredential;
  };

  const signInWithEmailAndPassword = async (email: string, password: string) => {
    try {
      await firebaseSignInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
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
      const result = await signInWithPopup(firebaseAuth, provider);
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  };

  const signInAnonymously = async () => {
    try {
      await firebaseSignInAnonymously(firebaseAuth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
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

  const checkAndUpdateAccountModes = async (user: User) => {
    try {
      const userRef = doc(collection(db, 'users'), user.uid);
      const userDoc = await getDoc(userRef);
  
      if (userDoc.exists()) {
        // Update the document as needed
        await updateDoc(userRef, { /* your update data */ });
      } else {
        // Create the document with the necessary data
        await setDoc(userRef, { /* your initial data */ });
      }
    } catch (error) {
      console.error('Error checking and updating account modes:', error);
    }
  };
  
  

  return {
    user,
    firebaseUser,
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    error,
    setError,
    checkAndUpdateAccountModes,
  };
};

export default useAuth;
