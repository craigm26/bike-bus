import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonMenuButton, IonButtons, IonButton, IonIcon, IonLabel, IonText } from '@ionic/react';
import './Logout.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { logInOutline } from 'ionicons/icons';
import Profile from './Profile';

const Logout: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object

  const renderUserInfo = () => {
    if (user) {
      return (
        <div>
          <p>Welcome, {user.displayName || user.email}!</p>
          {user.isAnonymous && <p>(Anonymous user)</p>}
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
          </IonText>          <IonLabel slot="end">
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
            <IonTitle size="large">Logout</IonTitle>
          </IonToolbar>
        </IonHeader>
        {renderUserInfo()} {/* Render user info */}
      </IonContent>
    </IonPage>
  );
};

export default Logout;
