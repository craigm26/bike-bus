import { useState, useEffect } from 'react';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from '@firebase/storage';

const useAvatar = (userId: string | null) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const storageRef = ref(storage, `avatars/${userId}`);

      getDownloadURL(storageRef)
        .then((url) => {
          setAvatarUrl(url);
        })
        .catch((error) => {
          console.error('Error fetching avatar:', error);
        });
    }
  }, [userId]);

  return avatarUrl;
};

export default useAvatar;
