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

const Profile: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
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
      <IonContent className="ion-content-profile" fullscreen>
        <div className="avatar-container-profile">
          <IonAvatar className='img-center-profile'>
            <Avatar uid={user?.uid} size="medium" />
          </IonAvatar>
          {user?.accountType === 'Anonymous' ? (
            <div></div>
          ) : (
            <><><IonButton className="ion-button-profile" fill="solid" routerLink="/account">
              Account
            </IonButton>
            <Logout />
            <IonButton className="ion-button-profile" fill="solid" routerLink="/Login"> 
                Login to Account
              </IonButton>
            </></>
            
          )}
          {user?.accountType === 'Anonymous' ? (
            <>
              <IonText className="ion-text-profile"></IonText>
              <IonButton className="ion-button-profile" fill="solid" routerLink="/SignUp">
                SignUp to Add Avatar
              </IonButton>
              <IonButton className="ion-button-profile" fill="solid" routerLink="/Login"> 
                Login to Account
              </IonButton>
              <Logout />

            </>
          ) : (
            <div>
              {!avatarUrl && (
                <>
                </>
              )}
              <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
