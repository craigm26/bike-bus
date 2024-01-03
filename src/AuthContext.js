import { createContext, useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoadingAuthState(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmailAndPassword = async (email, password) => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
        setUser(result.user);
      } else {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        setUser(userCredential.user);
      }
    } catch (error) {
      console.error('Error during email/password login:', error.message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      setUser(result.user);
    } catch (error) {
      console.error('Error during Google login:', error.message);
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithApple();
      setUser(result.user);
    } catch (error) {
      console.error('Error during Apple login:', error.message);
    }
  };

  const signInAnonymously = async () => {
    try {
      const result = await FirebaseAuthentication.signInAnonymously();
      setUser(result.user);
    } catch (error) {
      console.error('Error during anonymous login:', error.message);
    }
  };

  const logout = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      } else {
        await auth.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loadingAuthState, signInWithEmailAndPassword, signInWithGoogle, signInWithApple, signInAnonymously, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
