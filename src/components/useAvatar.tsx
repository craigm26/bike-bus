import { useState, useEffect, useContext } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import { personCircleOutline } from 'ionicons/icons';
import { FirestoreError, doc, getDoc } from 'firebase/firestore';
import { IonSpinner } from '@ionic/react';
import { AuthContext } from '../AuthContext';
import { get } from 'http';

interface AvatarHookReturn {
  avatarUrl: string | null;
  refresh: () => void;
}

export const useAvatar = (uid?: string | null): AvatarHookReturn => {
  const { user, loadingAuthState } = useContext(AuthContext);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState(false); // new state variable



  useEffect(() => {


    // get the user document from firestore
    const getUserDoc = async (uid: string) => {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log('No such document!');
        return null;
      }
    };

    if (uid) {
      getUserDoc(uid); // Ensure uid is not undefined before calling getUserDoc
      // test to see if accountType is being returned
      const storageRef = ref(storage, `avatars/${uid}`);
      // if the uid is not null and the user is anonymous, set the avatarUrl to the ionicon person circle outline icon.
      if (user?.accountType === 'Anonymous') {
        setAvatarUrl(personCircleOutline);
      } else {
        getDownloadURL(storageRef)
          .then((url) => setAvatarUrl(url))
          .catch((error) => handleStorageError(error));
      }
    } else {
      setAvatarUrl(null);
    }
  }, [uid, triggerRefresh]); // Added triggerRefresh as a dependency

  const handleStorageError = (error: FirestoreError) => {
    if ('storage/object-not-found') {
      // If the object is not found, just set the avatarUrl to null.
      setAvatarUrl(null);
    } else {
      // If there's any other error, log it to the console.
      console.error('Error retrieving avatar download URL:', error);
    }
  };

  const refresh = () => setTriggerRefresh((prevValue) => !prevValue); // Toggle triggerRefresh

  return { avatarUrl, refresh };
};
