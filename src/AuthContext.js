import { createContext, useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';



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

  const signUpWithEmailAndPassword = async (email, password) => {
    try {
      let userCredential;
      if (Capacitor.isNativePlatform()) {
        // Assuming FirebaseAuthentication plugin handles user creation
        const result = await FirebaseAuthentication.signUpWithEmailAndPassword({ email, password });
        userCredential = { user: result.user };
        // set additional details in Firestore
        const user = result.user;
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          enabledAccountModes: ['Member'],
        });
        setUser(user);
        return userCredential;
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          enabledAccountModes: ['Member'],
        });
        // ensure that the user.uid is the same as the document id
        setUser(user);
        return userCredential;
      }
    } catch (error) {
      console.error('Error during email/password sign up:', error.message);
      throw error; // Ensure errors are propagated for proper handling
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
    <AuthContext.Provider value={{ user, loadingAuthState, signInWithEmailAndPassword, signInWithGoogle, signInWithApple, signInAnonymously, logout, signUpWithEmailAndPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
