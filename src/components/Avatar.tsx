import { IonAvatar } from '@ionic/react';
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
        <div className="default-avatar"></div>
      )}
    </IonAvatar>
  );
};

export default Avatar;
