import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import app from './firebaseConfig';
import { getAuth } from 'firebase/auth';

const useAuth = () => {
  const { user, loadingAuthState } = useContext(AuthContext);
  const auth = getAuth(app);

  const signUpWithEmailAndPassword = async (email , password) => {
    await auth.createUserWithEmailAndPassword(email, password);
  };

  const signInWithEmailAndPassword = async (email , password) => {
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
