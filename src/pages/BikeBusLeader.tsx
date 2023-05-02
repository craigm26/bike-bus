import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './BikeBusLeader.css';
import useAuth from '../useAuth'; // Import useAuth hook

const BikeBusLeader: React.FC = () => {
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
          <IonTitle>BikeBus Leader</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">BikeBus Leader</IonTitle>
          </IonToolbar>
        </IonHeader>
        {renderUserInfo()} {/* Render user info */}
        <ExploreContainer name="BikeBus Leader page" />
      </IonContent>
    </IonPage>
  );
};

export default BikeBusLeader;
