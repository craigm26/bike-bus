import { createContext, useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';



export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        // User is signed in, fetch additional details from Firestore
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          // Merge auth user object with Firestore document data
          const fullUserDetails = {
            ...authUser, // contains UID, email, etc.
            ...userDocSnap.data() // contains accountType, and other custom fields
          };
          setUser(fullUserDetails);
        } else {
          console.log("No such document!");
          setUser(authUser); // Fallback to just auth user details
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoadingAuthState(false);
    });

    return () => unsubscribe();
  }, []);


  const signInWithEmailAndPassword = async (email, password) => {
    try {
      let userCredential;
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithEmailAndPassword({ email, password });
        userCredential = result;
      } else {
        userCredential = await auth.signInWithEmailAndPassword(email, password);
      }
      // Fetch additional user details from Firestore and set in context
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser({
          ...userCredential.user,
          ...userDocSnap.data()
        });
      } else {
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
    let userCredential;
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      userCredential = result;
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser({
          ...userCredential.user,
          ...userDocSnap.data() 
        });
      } else {
        setUser(userCredential.user);
      }
    } catch (error) {
      console.error('Error during Google login:', error.message);
    }
  };

  const signInWithApple = async () => {
    let userCredential;
    try {
      const result = await FirebaseAuthentication.signInWithApple();
      userCredential = result;
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setUser({
          ...userCredential.user,
          ...userDocSnap.data() 
        });
      } else {
        setUser(userCredential.user);
      }
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
