import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { auth, db } from './firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

const useAuth = () => {
  const { user, loadingAuthState, setUser } = useContext(AuthContext);

  const signUpWithEmailAndPassword = async (email, password, username, accountType) => {
    try {
      const { user: authUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Save user data to Firestore
      await db.collection('users').doc(authUser.uid).set({
        username,
        accountType,
      });

      setUser(authUser);
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  const signInWithEmailAndPassword = async (email, password) => {
    await firebaseSignInWithEmailAndPassword(auth, email, password);
  };

  const sendResetEmail = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInAnonymously = async () => {
    await firebaseSignInAnonymously(auth);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return {
    user,
    loadingAuthState,
    setUser,
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
  };
};

export default useAuth;
