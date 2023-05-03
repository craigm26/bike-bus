import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { auth } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword, signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, signInAnonymously as firebaseSignInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';

const useAuth = () => {
  const { user, loadingAuthState } = useContext(AuthContext);

  const signUpWithEmailAndPassword = async (email, password) => {
    await firebaseCreateUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithEmailAndPassword = async (email, password) => {
    await firebaseSignInWithEmailAndPassword(auth, email, password);
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
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithGoogle,
    signInAnonymously,
    signOut,
  };
};

export default useAuth;
