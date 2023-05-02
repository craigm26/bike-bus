import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { auth } from './firebaseConfig';

const useAuth = () => {
  const { user, loadingAuthState } = useContext(AuthContext);

  const signUpWithEmailAndPassword = async (email, password) => {
    await auth.createUserWithEmailAndPassword(email, password);
  };

  const signInWithEmailAndPassword = async (email, password) => {
    await auth.signInWithEmailAndPassword(email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  };

  const signInAnonymously = async () => {
    await auth.signInAnonymously();
  };

  const signOut = async () => {
    await auth.signOut();
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
