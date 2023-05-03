import { useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonText,
  IonLabel,
  IonChip,
  IonAvatar,
  IonImg,
  IonButton,
} from '@ionic/react';
import './Profile.css';
import useAuth from '../useAuth';
import 'firebase/compat/storage';
import { storage } from '../firebaseConfig';
import { ref, uploadBytesResumable } from '@firebase/storage';
import useAvatar from './useAvatar';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const avatarUrl = useAvatar(user?.uid);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (user && user.uid && event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const storageRef = ref(storage, `avatars/${user.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          console.log('Upload progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          console.error('Error uploading avatar:', error);
        },
        () => {
          // No need to call setAvatarUrl, as useAvatar handles updating the avatar URL
        },
      );
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonText color="primary" class="BikeBusFont">
            <h1>BikeBus</h1>
          </IonText>
          <IonChip slot="end">
            {avatarUrl && (
              <IonAvatar>
                <IonImg src={avatarUrl} alt="User avatar" />
              </IonAvatar>
            )}
            <IonLabel>{user?.displayName || user?.email}</IonLabel>
          </IonChip>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonTitle size="large">Profile</IonTitle>
        <div className="avatar-container">
          {avatarUrl ? (
            <IonAvatar>
              <IonImg src={avatarUrl} alt="User avatar" />
            </IonAvatar>
          ) : (
            <IonAvatar>
              <IonImg src="/assets/icon/empty-avatar.svg" alt="Empty avatar" />
            </IonAvatar>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <IonButton fill='clear' onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? 'Change' : 'Add Avatar'}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
