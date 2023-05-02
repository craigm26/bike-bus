import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './BikeBusMember.css';
import useAuth from '../useAuth'; // Import useAuth hook

const BikeBusMember: React.FC = () => {
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
          <IonTitle>BikeBus Member</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">BikeBus Member</IonTitle>
          </IonToolbar>
        </IonHeader>
        {renderUserInfo()} {/* Render user info */}
        <ExploreContainer name="BikeBus Member page" />
      </IonContent>
    </IonPage>
  );
};

export default BikeBusMember;
