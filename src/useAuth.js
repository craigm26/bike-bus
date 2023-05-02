import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import firebase from './firebaseConfig';

const useAuth = () => {
  const { user, loadingAuthState } = useContext(AuthContext);

  const signUpWithEmailAndPassword = async (email, password) => {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
  };

  const signInWithEmailAndPassword = async (email, password) => {
    await firebase.auth().signInWithEmailAndPassword(email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  };

  const signInAnonymously = async () => {
    await firebase.auth().signInAnonymously();
  };

  const signOut = async () => {
    await firebase.auth().signOut();
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
