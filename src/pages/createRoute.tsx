import { useState, useEffect, useContext } from 'react';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { IonPage, IonContent, IonHeader, IonText, IonToolbar, IonCard, IonInput, IonButton, IonItem, IonList, IonSelect, IonSelectOption, IonCol, IonGrid, IonRow, IonTitle } from '@ionic/react';
import { HeaderContext } from '../components/HeaderContext';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Autocomplete } from '@react-google-maps/api';
import { RouteContext } from '../components/RouteContext';
import { useHistory } from 'react-router-dom';
import { set } from 'firebase/database';




const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface LoadMapProps {
  mapCenter: { lat: number; lng: number };
  isAnonymous: boolean;
  user: { uid: string } | null;
  navigate: (path: string) => void;
  routeId: string;
}

interface AutocompleteInputProps {
  value: string;
  setValue: (value: string) => void;
  setAutocompleteObject: (value: google.maps.places.Autocomplete | null) => void;
}


const CreateRoute = ({ routeId, mapCenter }: LoadMapProps) => {
  const { user } = useAuth();
  const history = useHistory();
  const [routeName, setRouteName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [routeType, setRouteType] = useState<string>('');
  const [accountType, setaccountType] = useState<string>('');
  const headerContext = useContext(HeaderContext);
  const [startPoint, setStartPoint] = useState<string>('');
  const [travelMode, setTravelMode] = useState('');
  const [directionResponse, setDirectionResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [generateMap, setGenerateMap] = useState<boolean>(false);
  const { autoCompleteValue, setAutoCompleteValue } = useContext(RouteContext);
  const [endPoint, setEndPoint] = useState<string>(autoCompleteValue);
  const [path, setPath] = useState<google.maps.LatLngLiteral[] | null>(null);
  const [BikeBusStations, setBikeBusStations] = useState<google.maps.DirectionsWaypoint[] | undefined>(undefined);
  const [startPointAutoComplete, setStartPointAutoComplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [endPointAutoComplete, setEndPointAutoComplete] = useState<google.maps.places.Autocomplete | null>(null);



  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  useEffect(() => {
    if (startPoint !== '' && endPoint !== '') {
      setGenerateMap(true);
    }
  }, [startPoint, endPoint]);


  useEffect(() => {
    if (isLoaded) {
      setTravelMode('BICYCLING');
      setRouteType('school');
      setGenerateMap(false);  // Reset here
    }
  }, [isLoaded]);

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
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user]);


  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  const AutocompleteInput = ({ value, setValue, setAutocompleteObject }: AutocompleteInputProps) => {
    const [localAutocomplete, setLocalAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
    useEffect(() => {
      setAutocompleteObject(localAutocomplete);
    }, [localAutocomplete, setAutocompleteObject]);
  
    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
      setLocalAutocomplete(autocomplete);
  
      const listener = autocomplete.addListener('place_changed', () => {
        const newValue = autocomplete.getPlace()?.formatted_address || '';
        if(newValue !== value) {
          setValue(newValue);
        }
      });
  
      return () => { google.maps.event.removeListener(listener); };
    };
  
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    };
  
    return (
      <Autocomplete onLoad={onLoad}>
        <input 
          className="ion-input" 
          type="text" 
          value={value} 
          onChange={handleChange} 
          placeholder="Enter location" 
        />
      </Autocomplete>
    );
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
        routecreator: user?.uid,
        routeleader: user?.uid,
      });

      setGenerateMap(false);  // Reset after creating route

      // Ask the user if they want to create a schedule
      const shouldCreateSchedule = window.confirm('Would you like to set a schedule for the bikebus so that it can become a bikebus group?');

      if (shouldCreateSchedule) {
        // Navigate to the Create a BikeBus Group page
        history.push('/createabikebusgroup');
      }
      else {
        // Navigate to the viewroute page - can add waypoints aka bikebusstations to route
        history.push('/Viewroute');
      }

    } catch (error) {
      console.log("Error: ", error);
    }
  };




  return (
    <IonPage>
      <IonContent fullscreen>
        {headerContext?.showHeader && (
          <IonHeader>
            <IonToolbar></IonToolbar>
          </IonHeader>
        )}
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
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonText>Description</IonText>
                  <IonInput value={description} onIonChange={e => setDescription(e.detail.value!)} />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonText>Travel Mode</IonText>
                  <IonItem>
                    <IonSelect value={travelMode} placeholder="Select Travel Mode" onIonChange={e => setTravelMode(e.detail.value)} >
                      <IonSelectOption value="BICYCLING">Bicycling</IonSelectOption>
                      <IonSelectOption value="TRANSIT">Transit</IonSelectOption>
                      <IonSelectOption value="DRIVING">Driving</IonSelectOption>
                      <IonSelectOption value="WALKING">Walking</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonText>Route Type</IonText>
                  <IonItem>
                    <IonSelect value={routeType} placeholder="Select Route Type" onIonChange={e => setRouteType(e.detail.value)}>
                      <IonSelectOption value="school">School</IonSelectOption>
                      <IonSelectOption value="work">Work</IonSelectOption>
                      <IonSelectOption value="club">Club</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonText>Start Location</IonText>
                  <AutocompleteInput value={startPoint} setValue={setStartPoint} setAutocompleteObject={setStartPointAutoComplete} />
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonText>End Location</IonText>
                  <AutocompleteInput value={endPoint} setValue={setEndPoint} setAutocompleteObject={setEndPointAutoComplete} />
                </IonCol>
              </IonRow>
              {generateMap && (
                <IonRow>
                  <IonCol>
                    <IonText>Route Preview</IonText>
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "400px" }}
                      center={mapCenter}
                      zoom={15}
                    >
                      <DirectionsService
                        options={{
                          destination: endPoint,
                          origin: startPoint,
                          travelMode: travelMode as google.maps.TravelMode,
                        }}
                        callback={(res) => {
                          if (res !== null) {
                            setDirectionResponse(res);
                          }
                        }}
                      />
                      {directionResponse !== null && (
                        <DirectionsRenderer

                          options={{
                            directions: directionResponse,
                            suppressMarkers: true,
                          }}
                        />
                      )}
                    </GoogleMap>
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </IonCard>
          <IonButton shape="round" onClick={handleSubmit}>Create New Route</IonButton>
        </IonContent>

      </IonContent>
    </IonPage>
  );
};

export default CreateRoute;
