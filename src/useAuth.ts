import { useState, useEffect } from 'react';
import { db, auth as firebaseAuth } from './firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User,
  UserCredential,
  updateProfile,
  signInWithRedirect,
  signInWithCredential,
  signInWithPopup
} from 'firebase/auth';
import { getDoc, doc, updateDoc, collection, setDoc } from 'firebase/firestore';
import { FirebaseAuthentication, SignInWithOAuthOptions, SignInResult, SignInOptions } from '@capacitor-firebase/authentication';


interface UserData {
  uid: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  accountType: "Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin";
  enabledAccountModes: Array<'Member' | 'Anonymous' | 'Leader' | 'Parent' | 'Kid' | 'Org Admin' | 'App Admin'>;
  enabledOrgModes: Array<'OrganizationCreator' | 'OrganizationMembers' | 'OrganizationAdmins' | 'OrganizationManagers' | 'OrganizationEmployees' | 'Organization'>;
  // Add other properties specific to user data
}

const getEnabledAccountModes = (accountType: string): ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[] => {
  switch (accountType) {
    case 'Anonymous':
      return ['Member', 'Anonymous'];
    case 'Member':
      return ['Member'];
    case 'Leader':
      return ['Member', 'Leader'];
    case 'Parent':
      return ['Member', 'Leader', 'Parent'];
    case 'Kid':
      return ['Member', 'Kid'];
    case 'Org Admin':
      return ['Member', 'Org Admin'];
    case 'App Admin':
      return ['Member', 'Leader', 'Parent', 'Kid', 'Org Admin', 'App Admin'];
    default:
      return [];
  }
};



const useAuth = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const mapFirebaseUserToUserData = (async (firebaseUser: User): Promise<UserData> => {
    let enabledAccountModes: ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[] = [];
    let enabledOrgModes: ("OrganizationCreator" | "OrganizationMembers" | "OrganizationAdmins" | "OrganizationManagers" | "OrganizationEmployees" | "Organization")[] = [];

    // Fetch additional user data from the database or other sources
    const userSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userSnapshot.data();

    if (userData && userData.accountType) {
      enabledAccountModes = getEnabledAccountModes(userData.accountType);
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      username: firebaseUser.displayName || '',
      firstName: '',
      lastName: '',
      accountType: userData?.accountType || '',
      enabledAccountModes: enabledAccountModes as ("Member" | "Anonymous" | "Leader" | "Parent" | "Kid" | "Org Admin" | "App Admin")[],
      enabledOrgModes: enabledOrgModes as ("OrganizationCreator" | "OrganizationMembers" | "OrganizationAdmins" | "OrganizationManagers" | "OrganizationEmployees" | "Organization")[],
      // Add other properties specific to user data
    };
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fUser) => {
      if (fUser) {
        const userData = await mapFirebaseUserToUserData(fUser);
        setUser(userData);
        setFirebaseUser(fUser);
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isAnonymous = firebaseUser?.isAnonymous || false;


  const signUpWithEmailAndPassword = async (email: string, password: string, username: string, firstName: string, lastName: string): Promise<UserCredential> => {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    await updateProfile(user, { displayName: username });

    const userData = await mapFirebaseUserToUserData(user);
    setUser(userData);

    return userCredential;
  };

  const signInWithEmailAndPassword = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const userCredential = await firebaseSignInWithEmailAndPassword(firebaseAuth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
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
      const result = await signInWithRedirect(firebaseAuth, provider);
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return null;
    }
  };

  const getCurrentUser = async () => {
    const result = await FirebaseAuthentication.getCurrentUser();
    return result.user;
  };
  
  const getIdToken = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return;
    }
    const result = await FirebaseAuthentication.getIdToken();
    return result.token;
  };


  const getGoogleUser = async () => {
    try {
      console.log('Signing in with Google with capacitor-firebase-authentication...');
      const result = await FirebaseAuthentication.signInWithGoogle();
      console.log('Google SignIn Result:', result);
      // Use a type assertion if you are sure that idToken exists on the result object
      return { accessToken: (result as any).idToken };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };
  
  const signInWithGoogleMobile = async (): Promise<UserCredential> => {
      console.log('Signing in with Google...');
      const googleUser = await getGoogleUser(); // Implement this method to get the Google User
      const credential = GoogleAuthProvider.credential(googleUser.accessToken)
      const userCredential = await signInWithCredential(firebaseAuth, credential);
      return userCredential; // Make sure to return the userCredential
      // Handle errors
  };
  

  const signInAnonymously = async (): Promise<UserCredential> => {
    try {
      const userCredential = await firebaseSignInAnonymously(firebaseAuth);
      const user = userCredential.user;

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userData = {
          accountType: "Anonymous",
          enabledAccountModes: ["Anonymous"]
        };

        await setDoc(userRef, userData, { merge: true });

        const mappedUser = await mapFirebaseUserToUserData(user);
        setUser(mappedUser);
      }

      return userCredential;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const checkAndUpdateAccountModes = async (uid: string) => {
    try {
      const userRef = doc(collection(db, 'users'), uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData && userData.accountType) {
          // Only update if enabledAccountModes does not exist or is empty
          if (!userData.enabledAccountModes || userData.enabledAccountModes.length === 0) {
            const enabledAccountModes = getEnabledAccountModes(userData.accountType);
            await updateDoc(userRef, { enabledAccountModes });
          }
        }
      }
    } catch (error) {
      console.error('Error checking and updating account modes:', error);
    }
  };

  return {
    user,
    firebaseUser,
    checkAndUpdateAccountModes,
    signInWithGoogleMobile,
    signUpWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendResetEmail,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    error,
    setError,
    isAnonymous,
  };
};

export default useAuth;
