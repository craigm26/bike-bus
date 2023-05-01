import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './BikeBusLeader.css';

const BikeBusLeader: React.FC = () => {
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
        <ExploreContainer name="BikeBus Leader page" />
      </IonContent>
    </IonPage>
  );
};

export default BikeBusLeader;
