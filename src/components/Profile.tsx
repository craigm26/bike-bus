import { useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonAvatar,
  IonButton,
  IonText,
  IonLabel,
} from '@ionic/react';
import './Profile.css';
import useAuth from '../useAuth';
import { useAvatar } from './useAvatar';
import { ref, uploadBytesResumable } from '@firebase/storage';
import { db, storage } from '../firebaseConfig';
import Avatar from './Avatar';
import Logout from './Logout';
import AccountModeSelector from '../components/AccountModeSelector';
import { doc, getDoc } from 'firebase/firestore';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl, refresh } = useAvatar(user?.uid) || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountType, setaccountType] = useState<string>('');

  const enabledAccountModes = [
    'Member',
    'Anonymous',
    'Leader',
    'Parent',
    'Kid',
    'Org Admin',
    'App Admin',
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (user && user.uid && event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const storageRef = ref(storage, `avatars/${user.uid}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot: any) => {
          console.log('Upload progress:', (snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error: any) => {
          console.error('Error uploading avatar:', error);
        },
        () => {
          // Notify useAvatar to update the avatar URL
          refresh();
        },
      );
    }
  };

  const [accountMode, setAccountMode] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);

  const onAccountModeChange = (mode: string[]) => {
    setAccountMode(mode);
  };

  return (
    <IonPage>
      <IonHeader>
      </IonHeader>
      <IonContent fullscreen>
        <div className="avatar-container">
          <IonTitle>Profile</IonTitle>
          <IonAvatar>
            <Avatar uid={user?.uid} size="medium" />
          </IonAvatar>
          {user?.accountType === 'Anonymous' ? (
            <div></div>
          ) : (
            <><><IonButton fill="clear" routerLink="/account">
                Account
              </IonButton><IonLabel>
                  <h2>UserName: {user?.username}</h2>
                </IonLabel></><IonText>Account Type: {accountType}</IonText></>

          )}
          {user?.accountType === 'Anonymous' ? (
            <>
              <IonText></IonText>
              <IonButton fill="clear" routerLink="/SignUp">
                SignUp to Add Avatar
              </IonButton>     
              <IonText>Account Type: {accountType}</IonText>
            </>
          ) : (
            <div>
              {!avatarUrl && (
                <>
                  <AccountModeSelector
                    enabledModes={enabledAccountModes}
                    value={accountMode}
                    onAccountModeChange={onAccountModeChange}
                  />
                  <IonButton fill="clear" onClick={() => fileInputRef.current?.click()}>
                    Add Avatar
                  </IonButton>
                </>
              )}
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
            </div>
          )}
        </div>
        <Logout />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
