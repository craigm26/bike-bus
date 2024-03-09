import { useContext, useEffect, useRef, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonAvatar,
  IonButton,
  IonText,
  IonItem,
  IonItemDivider,
} from '@ionic/react';
import './Profile.css';
import { AuthContext } from '../AuthContext';
import { useAvatar } from './useAvatar';
import { ref, uploadBytesResumable } from '@firebase/storage';
import { db, storage } from '../firebaseConfig';
import Avatar from './Avatar';
import Logout from './Logout';
import AccountModeSelector from '../components/AccountModeSelector';
import { doc, getDoc } from 'firebase/firestore';

const Profile: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, logout } = useContext(AuthContext);
  const { avatarUrl, refresh } = useAvatar(user?.uid) || {};
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountType, setAccountType] = useState<string>('');

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setAccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);


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
            setAccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);

  const onAccountModeChange = (mode: string[]) => {
    setAccountMode(mode);
  };

  const renderButtonsBasedOnUserState = () => {
    if (!user) {
      // User not logged in
      return (
        <>
          <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Login" onClick={onClose}>
            Login
          </IonButton>
          <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/SignUp" onClick={onClose}>
            Sign Up
          </IonButton>
        </>
      );
    } else if (accountType === 'Anonymous') {
      // User logged in but is anonymous
      return (
        <>
          <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/SignUp" onClick={onClose}>
            Sign Up to Add Avatar
          </IonButton>
          <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/Login" onClick={onClose}>
            Login to Account
          </IonButton>
          <Logout />
        </>
      );
    } else {
      // User logged in and not anonymous
      return (
        <>
          <IonButton shape="round" className="ion-button-profile" fill="solid" routerLink="/account" onClick={onClose}>
            Account
          </IonButton>
          <Logout />
          {avatarUrl && (
            <IonButton shape="round" className="ion-button-profile" fill="solid" onClick={() => fileInputRef.current?.click()}>
              Change Avatar
            </IonButton>
          )}
          {!avatarUrl && (
            <IonButton shape="round" className="ion-button-profile" fill="solid" onClick={() => fileInputRef.current?.click()}>
              Upload Avatar
            </IonButton>
          )}
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} onClick={onClose} />
        </>
      );
    }
  };

  return (
    <IonPage>
      <IonHeader></IonHeader>
      <IonContent className="ion-content-profile" fullscreen>
        <div className="avatar-container-profile">
          <IonAvatar className="img-center-profile">
            <Avatar uid={user?.uid} size="medium" />
          </IonAvatar>
          {renderButtonsBasedOnUserState()}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
