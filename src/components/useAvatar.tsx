import { useState, useEffect, useContext } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { AuthContext } from '../AuthContext';
// use the personOutline icon from Ionicons
import { personOutline } from 'ionicons/icons';

const DEFAULT_AVATAR = personOutline;

interface AvatarHookReturn {
  avatarUrl: string;
  refresh: () => void;
}

export const useAvatar = (uid?: string | null): AvatarHookReturn => {
  const { user } = useContext(AuthContext);
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR);
  const [triggerRefresh, setTriggerRefresh] = useState(false);

  useEffect(() => {
    async function fetchAvatar() {
      if (!uid || user?.isAnonymous) {
        setAvatarUrl(DEFAULT_AVATAR);
        return;
      }

      const storageRef = ref(storage, `avatars/${uid}`);
      getDownloadURL(storageRef)
        .then(url => {
          setAvatarUrl(url);
        })
        .catch((error) => {
          if (error.code === 'storage/object-not-found') {
            // If the specific avatar is not found, use the default avatar.
            setAvatarUrl(DEFAULT_AVATAR);
          } else {
            // For all other errors, log them for debugging purposes.
            console.error("Error fetching avatar:", error);
            // Optionally set to default avatar or handle differently
          }
        });
    }

    fetchAvatar();
  }, [uid, triggerRefresh, user?.isAnonymous]);

  const refresh = () => setTriggerRefresh(!triggerRefresh);

  return { avatarUrl, refresh };
};
