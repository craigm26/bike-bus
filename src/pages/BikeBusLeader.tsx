import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonLabel, IonText } from '@ionic/react';
import './BikeBusLeader.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { logInOutline } from 'ionicons/icons';
import Profile from '../components/Profile';

const BikeBusLeader: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object

  const renderUserInfo = () => {
    if (user) {
      return (
        <div>
          <p>Welcome, {user.displayName || user.email}</p>
          {user.isAnonymous && <p>(Anonymous user)!</p>}
        </div>
      );
    } else {
      return <p>Loading...</p>;
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
          <IonLabel slot="end">
          {renderUserInfo()} {/* Render user info */}
          </IonLabel>
          <IonButtons slot="end">
            {user ? (
              <Profile /> // Show the profile picture when the user is logged in
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
            <IonTitle size="large">BikeBus Leader</IonTitle>
          </IonToolbar>
        </IonHeader>
      </IonContent>
    </IonPage>
  );
};

export default BikeBusLeader;
