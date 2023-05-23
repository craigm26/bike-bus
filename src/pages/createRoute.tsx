import { useState, useContext, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonCard, IonInput, IonButton, IonText, IonGrid, IonRow, IonCol, IonTitle, IonItem, IonSelect, IonSelectOption } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { HeaderContext } from '../components/HeaderContext';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const CreateRoute: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [routeName, setRouteName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [routeType, setRouteType] = useState<string>('');
  const [accountType, setAccountType] = useState<string>('');
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [travelMode, setTravelMode] = useState('');
  const headerContext = useContext(HeaderContext);

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

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const handlePlaceChangedStart = (place: google.maps.places.PlaceResult) => {
    setStartPoint(place.formatted_address || '');
  };

  const handlePlaceChangedEnd = (place: google.maps.places.PlaceResult) => {
    setEndPoint(place.formatted_address || '');
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'routes'), {
        routeName,
        description,
        startPoint,
        endPoint,
        routeType,
        accountType,
        travelMode,
        routeCreator: user?.uid,
        routeLeader: user?.uid,
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
                  <IonSelect value={travelMode} placeholder="Select Travel Mode" onIonChange={e => setTravelMode(e.detail.value)} >
                    <IonSelectOption value="BICYCLING">Bicycling</IonSelectOption>
                    <IonSelectOption value="TRANSIT">Transit</IonSelectOption>
                    <IonSelectOption value="DRIVING">Driving</IonSelectOption>
                    <IonSelectOption value="WALKING">Walking</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonText>Route Type</IonText>
                <IonItem>
                  <IonSelect value={routeType} placeholder="Select Route Type" onIonChange={e => setRouteType(e.detail.value)}>
                    <IonSelectOption value="school">School</IonSelectOption>
                    <IonSelectOption value="work">Work</IonSelectOption>
                    <IonSelectOption value="club">Club</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonText>Start Location</IonText>
                <Autocomplete onLoad={autocomplete => (autocomplete && setStartPoint(autocomplete.getPlace()?.formatted_address || ''))} onPlaceChanged={() => handlePlaceChangedStart}>
                  <IonInput value={startPoint} placeholder="Enter start location" />
                </Autocomplete>
                <IonText>End Location</IonText>
                <Autocomplete onLoad={autocomplete => (autocomplete && setEndPoint(autocomplete.getPlace()?.formatted_address || ''))} onPlaceChanged={() => handlePlaceChangedEnd}>
                  <IonInput value={endPoint} placeholder="Enter end location" />
                </Autocomplete>
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
