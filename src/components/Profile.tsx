import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonText, IonLabel } from '@ionic/react';
import './Profile.css';
import useAuth from '../useAuth'; // Import useAuth hook

const Profile: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object

  const renderUserInfo = () => {
    if (user) {
      return (
        <div>
          <p>{user.displayName || user.email}</p>
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
          </IonText>
          <IonLabel slot="end">
            {renderUserInfo()} {/* Render user info */}
          </IonLabel>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonTitle size="large">Profile</IonTitle>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
