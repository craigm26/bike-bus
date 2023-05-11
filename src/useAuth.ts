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
import { getDoc, doc } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  accountType: "Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "OrgAdmin" | "AppAdmin";
  enabledAccountModes: Array<'Member' | 'Anonymous' | 'Leader' | 'Parent' | 'Kid' | 'OrgAdmin' | 'AppAdmin'>;
  // Add other properties specific to user data
}

const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await mapFirebaseUserToUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const mapFirebaseUserToUserData = async (firebaseUser: User): Promise<UserData> => {
    let enabledAccountModes: ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "OrgAdmin" | "AppAdmin")[] = [];
  
    // Fetch additional user data from the database or other sources
    const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userSnapshot.data();
  
    if (userData && userData.accountType) {
      if (userData.accountType === 'Member') {
        enabledAccountModes = ['Member'];
      } else if (userData.accountType === 'Leader') {
        enabledAccountModes = ['Member', 'Leader'];
      } else if (userData.accountType === 'Parent') {
        enabledAccountModes = ['Member', 'Leader', 'Parent'];
      } else if (userData.accountType === 'Kid') {
        enabledAccountModes = ['Member', 'Kid'];
      } else if (userData.accountType === 'OrgAdmin') {
        enabledAccountModes = ['Member', 'OrgAdmin'];
      } else if (userData.accountType === 'AppAdmin') {
        enabledAccountModes = ['Member', 'Leader', 'Parent', 'Kid', 'OrgAdmin', 'AppAdmin'];
      }
    }
  
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: firebaseUser.displayName || '',
      firstName: '',
      lastName: '',
      accountType: userData?.accountType || '',
      enabledAccountModes: enabledAccountModes as ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "OrgAdmin" | "AppAdmin")[],
      // Add other properties specific to user data
    };
  };
  
  
  

  const signUpWithEmailAndPassword = async (email: string, password: string, username: string): Promise<UserCredential> => {
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

  return {
    user,
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    error,
    setError,
  };
};

export default useAuth;
