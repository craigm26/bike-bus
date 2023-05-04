import { useState, useEffect, useCallback } from 'react';
import { storage } from '../firebaseConfig';
import { ref, getDownloadURL } from '@firebase/storage';
import { AvatarHookReturn } from '../types';

const useAvatar = (userId: string | undefined): AvatarHookReturn => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const fetchAvatarUrl = useCallback(async () => {
    if (userId) {
      try {
        const storageRef = ref(storage, `avatars/${userId}`);
        const url = await getDownloadURL(storageRef);
        setAvatarUrl(url);
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchAvatarUrl();
  }, [fetchAvatarUrl, userId]);

  const refresh = () => {
    fetchAvatarUrl();
  };

  return [avatarUrl, refresh];
};

export default useAvatar;
