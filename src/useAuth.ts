import { useState, useEffect } from 'react';
import { auth as firebaseAuth, db, auth } from './firebaseConfig';
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
import { doc, setDoc } from 'firebase/firestore';

const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signUpWithEmailAndPassword = async (email: string, password: string, username: string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: username });

    // Save user data to Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      username,
      accountType: 'Member',
      enabledAccountModes: ['Member'],
    });

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
      const result = await signInWithPopup(auth, provider);
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
