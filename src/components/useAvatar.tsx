import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from '@firebase/storage';
import { storage } from '../firebaseConfig';

interface AvatarHookReturn {
  avatarUrl: string | null;
  refresh: () => void;
}

export const useAvatar = (uid?: string): AvatarHookReturn => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (uid) {
      const storageRef = ref(storage, `avatars/${uid}`);
      getDownloadURL(storageRef).then(setAvatarUrl).catch(console.error);
    }
  }, [uid]);

  const refresh = () => setAvatarUrl(null);

  return { avatarUrl, refresh };
};
