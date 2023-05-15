import { IonAvatar, IonIcon } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { useAvatar } from './useAvatar';

interface AvatarProps {
  uid?: string;
  size?: 'extrasmall' | 'small' | 'medium' |'large';
}

const Avatar: React.FC<AvatarProps> = ({ uid, size = 'small' }) => {
  const { avatarUrl } = useAvatar(uid) || {};

  return (
    <IonAvatar className={`avatar ${size}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="Avatar" />
      ) : (
        <IonIcon icon={personCircleOutline} />
      )}
    </IonAvatar>
  );
};

export default Avatar;
