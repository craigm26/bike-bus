import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from '@firebase/storage';
import { storage } from '../firebaseConfig';
import { personCircleOutline } from 'ionicons/icons';

interface AvatarHookReturn {
  avatarUrl: string | null;
  refresh: () => void;
}

export const useAvatar = (uid?: string | null): AvatarHookReturn => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState(false); // new state variable

  useEffect(() => {
    if (uid) {
      const storageRef = ref(storage, `avatars/${uid}`);
      // if the uid is not null and the user is anonymous, set the avatarUrl to the ionicon person circle outline icon.
      if (uid === 'anonymous') {
        setAvatarUrl(personCircleOutline);
      } else {
        getDownloadURL(storageRef)
          .then(setAvatarUrl)
          .catch((error) => {
            if (error.code === "storage/object-not-found") {
              // If the object is not found, just set the avatarUrl to null.
              setAvatarUrl(null);
            } else {
              // If there's any other error, log it to the console.
              console.error(error);
            }
          });
      }
    } else {
      setAvatarUrl(null);
    }
  }, [uid, triggerRefresh]); // Added triggerRefresh as a dependency

  const refresh = () => setTriggerRefresh(!triggerRefresh); // Toggle triggerRefresh

  return { avatarUrl, refresh };
};
