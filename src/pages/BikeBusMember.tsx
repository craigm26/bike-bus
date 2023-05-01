import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './BikeBusMember.css';

const BikeBusMember: React.FC = () => {
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
        <ExploreContainer name="BikeBus Member page" />
      </IonContent>
    </IonPage>
  );
};

export default BikeBusMember;
