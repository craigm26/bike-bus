import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './CarDriver.css';

const CarDriver: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Car Driver</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Car Driver</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer name="Car Driver page" />
      </IonContent>
    </IonPage>
  );
};

export default CarDriver;
