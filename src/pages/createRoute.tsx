import { useState, useContext, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonCard, IonInput, IonButton, IonText, IonGrid, IonRow, IonCol, IonTitle, IonItem, IonLabel, IonSegment, IonSegmentButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { HeaderContext } from '../components/HeaderContext';
import { useJsApiLoader } from '@react-google-maps/api';
import { RouteContext } from '../components/RouteContext';
import { CurrentLocationContext } from '../components/CurrentLocationContext';
import React from 'react';

type Point = {
  lat: number;
  lng: number;
};

type LocationContextProps = {
  lat: number;
  lng: number;
};

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const CreateRoute: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [routeName, setRouteName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [accountType, setAccountType] = useState<string>('');
  const [travelMode, setTravelMode] = useState<string>('');
  const [routeType, setRouteType] = useState<string>('');
  const headerContext = useContext(HeaderContext);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [startPointAdress, setStartPointAdress] = useState<string>('');
  const [endPointAdress, setEndPointAdress] = useState<string>('');
  const CurrentLocationContext = React.createContext<LocationContextProps | undefined>(undefined);
  const currentLocation = useContext(CurrentLocationContext);

  

  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(true);
    }
  }, [headerContext]);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setAccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);

  console.log(endPoint);
  console.log(currentLocation);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const getStartPointAdress = async () => {
    if (startPoint) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${startPoint.lat},${startPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      setStartPointAdress(data.results[0].formatted_address);
    }
  };
  
  const getEndPointAdress = async () => {
    if (endPoint) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${endPoint.lat},${endPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      setEndPointAdress(data.results[0].formatted_address);
    }
  };
  

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'routes'), {
        routeName,
        description,
        startPoint,
        endPoint,
        startPointAdress: getStartPointAdress(),
        endPointAdress: getEndPointAdress(),
        routeType,
        accountType,
        travelMode,
        routeCreator: "/users/" + user?.uid,
        routeLeader: "/users/" + user?.uid,
      });

      if (window.confirm('Would you like to set a schedule for the bikebus so that it can become a bikebus group?')) {
        history.push('/createabikebusgroup');
      } else {
        history.push('/Viewroute');
      }
    } catch (error) {
      console.log("Error: ", error);
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Create a Route</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonCard>
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonText>Route Name</IonText>
                <IonInput value={routeName} onIonChange={e => setRouteName(e.detail.value!)} />
                <IonText>Description</IonText>
                <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} />
                <IonText>Travel Mode</IonText>
                <IonItem>
                  <IonSegment value={travelMode} onIonChange={(e: CustomEvent) => setTravelMode(e.detail.value as string)}>
                    <IonSegmentButton value="BICYCLING">
                      <IonLabel>Bicycling</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="DRIVING">
                      <IonLabel>Driving</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="WALKING">
                      <IonLabel>Walking</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>
                </IonItem>
                <IonText>Route Type</IonText>
                <IonItem>
                  <IonSegment value={routeType} onIonChange={(e: CustomEvent) => setRouteType(e.detail.value as string)}>
                    <IonSegmentButton value="school">
                      <IonLabel>School</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="work">
                      <IonLabel>Work</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="club">
                      <IonLabel>Club</IonLabel>
                    </IonSegmentButton>
                  </IonSegment>
                </IonItem>
                <IonButton shape="round" onClick={handleSubmit}>Create New Route</IonButton>
                <IonButton shape="round" onClick={() => history.push('/Map')}>Cancel</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default CreateRoute;
