import { createContext, useState, useEffect, useMemo } from 'react';
import { auth } from './firebaseConfig';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createUserWithEmailAndPassword, indexedDBLocalPersistence, setPersistence } from 'firebase/auth';
import i18n from './i18n';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loadingAuthState, setLoadingAuthState] = useState(true);
  const [docSnapshot, setDocSnapshot] = useState(null);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const setAuthPersistence = async () => {
      if (!Capacitor.isNativePlatform()) {
        await setPersistence(auth, indexedDBLocalPersistence);
      }
    };

    setAuthPersistence().then(() => {
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
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    getDoc(userRef).then(async (snapshot) => {
      if (!snapshot.exists()) return;
      setDocSnapshot(snapshot);
      const userData = docSnapshot?.data();
      if (!userData) return;
      i18n.changeLanguage(userData?.preferredLanguage || 'en');
      if (userData.bikebusgroups) {
        const groupRefs = userData.bikebusgroups;
        const groups = await Promise.all(groupRefs.map((ref) => getDoc(ref)));
        const groupData = groups.map((group) => group?.data() || null);
        setGroups(groupData.filter((group) => group !== null));
      }
    });
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [groups]);

  const fetchGroups = async () => {
    for (const group of groups) {
      if (!group) continue;
      if (group?.BikeBusRoutes) {
        const routeSnapshot = await getDoc(group.BikeBusRoutes[0]);
        group.route = routeSnapshot.data();
      }

      if (group?.event && group?.event[0]) {
        const eventSnapshot = await getDoc(group.event[0]);
        group.event = eventSnapshot.data();
      }
    }
  };

  const processSignIn = async (userCredential) => {
    // Fetch additional user details from Firestore and set in context
    const userDocRef = doc(db, 'users', userCredential.user.uid);
    const userDocSnap = await getDoc(userDocRef);
    const data = userDocSnap.exists() ? userDocSnap.data() : {};
    setUser({
      ...userCredential.user,
      ...data
    });
  }

  const signInWithEmailAndPassword = async (email, password) => {
    try {
      const userCredential = Capacitor.isNativePlatform() ?
        await FirebaseAuthentication.signInWithEmailAndPassword({ email, password }) :
        await auth.signInWithEmailAndPassword(email, password);
      processSignIn(userCredential);
    } catch (error) {
      console.error('Error during email/password login:', error.message);
    }
  };

  const signUpWithEmailAndPassword = async (email, password) => {
    try {
      const nativePlatform = Capacitor.isNativePlatform();
      const result = nativePlatform ?
        await FirebaseAuthentication.signUpWithEmailAndPassword({ email, password }) :
        await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        enabledAccountModes: ['Member'],
      });
      setUser(user);
      return nativePlatform ? { user: result.user } : result;
    } catch (error) {
      console.error('Error during email/password sign up:', error.message);
      throw error; // Ensure errors are propagated for proper handling
    }
  };

  const signInWithGoogle = async () => {
    try {
      const userCredential = await FirebaseAuthentication.signInWithGoogle();
      processSignIn(userCredential);
    } catch (error) {
      console.error('Error during Google login:', error.message);
    }
  };

  const signInWithApple = async () => {
    try {
      const userCredential = await FirebaseAuthentication.signInWithApple();
      processSignIn(userCredential);
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
    <AuthContext.Provider value={{
      user,
      groups,
      loadingAuthState,
      signInWithEmailAndPassword,
      signInWithGoogle,
      signInWithApple,
      signInAnonymously,
      logout,
      signUpWithEmailAndPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
