import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonMenuButton, IonButtons, IonButton, IonIcon, IonLabel, IonText, IonChip, IonAvatar, IonImg } from '@ionic/react';
import './BikeBusMember.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { logInOutline } from 'ionicons/icons';
import useAvatar from '../components/useAvatar'; // Import useAvatar hook

const BikeBusMember: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const avatarUrl = useAvatar(user?.uid); // Use the useAvatar hook 

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
          <IonButtons slot="end">
            {user ? (
              <></> // Remove Profile component from here
            ) : (
              <IonButton routerLink="/login">
                <IonIcon icon={logInOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">BikeBus Member</IonTitle>
          </IonToolbar>
        </IonHeader>
      </IonContent>
    </IonPage>
  );
};

export default BikeBusMember;
