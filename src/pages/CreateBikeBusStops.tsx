import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonButton,
  IonTitle,
  IonCol,
  IonRow,
  IonGrid,
  IonText,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { setDoc, updateDoc, doc, getDoc, arrayUnion, addDoc, collection, DocumentReference } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import LocationInput from '../components/LocationInput';
import { get } from 'http';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


interface Coordinate {
  lat: number;
  lng: number;
}

interface Route {
  BikeBusStops: any;
  BikeBusGroupId: string;
  BikeBusRouteId: string;
  BikeBusStopIds: DocumentReference[];
  id: string;
  endPoint: Coordinate;
  endPointAddress: string;
  endPointName: string;
  startPoint: Coordinate;
  startPointAddress: string;
  startPointName: string;
  pathCoordinates: Coordinate[];
}

interface BikeBusStop {
  BikeBusGroupId: string;
  BikeBusRouteId: string;
  BikeBusStopName: string;
  id: string;
  location: string;
  placeId: string;
  photos: string;
  formattedAddress: string;
  placeName: string;
}

const CreateBikeBusStop: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const headerContext = useContext(HeaderContext);
  const [accountType, setaccountType] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });
  const [BikeBusStopName, setBikeBusStopName] = useState<string>('');
  const [BikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);
  const [PlaceLocation, setPlaceLocation] = useState<string>('');
  const [PlaceName, setPlaceName] = useState<BikeBusStop['placeName']>('');
  const [FormattedAddress, setFormattedAddress] = useState<BikeBusStop['formattedAddress']>('');
  const [Photos, setPhotos] = useState<BikeBusStop['photos']>('');
  const [PlaceId, setPlaceId] = useState<BikeBusStop['placeId']>('');
  const [rerender, setRerender] = useState(0);




  // load the route from the url param
  useEffect(() => {
    if (id) {
      const routeRef = doc(db, 'routes', id);
      getDoc(routeRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const routeData = docSnapshot.data();
          if (routeData) {
            const route: Route = {
              ...routeData,
              // add any missing properties with the correct types
              startPoint: routeData.startPoint as Coordinate,
              endPoint: routeData.endPoint as Coordinate,
              id: routeData.id ? routeData.name as string : '',
              BikeBusStops: routeData.BikeBusStops ? routeData.BikeBusStops as BikeBusStop[] : [],
              BikeBusGroupId: routeData.BikeBusGroupId ? routeData.BikeBusGroupId as string : '',
              BikeBusRouteId: routeData.BikeBusRouteId ? routeData.BikeBusRouteId as string : '',
              BikeBusStopIds: routeData.BikeBusStopIds ? routeData.BikeBusStopIds as DocumentReference[] : [],
              pathCoordinates: [],
              endPointAddress: routeData.endPointAddress ? routeData.endPointAddress as string : '',
              endPointName: routeData.endPointName ? routeData.endPointName as string : '',
              startPointAddress: routeData.startPointAddress ? routeData.startPointAddress as string : '',
              startPointName: routeData.startPointName ? routeData.startPointName as string : '',
            };
            setSelectedRoute(route);
          }
        }
      });

      // since we know the BikeBusStopIds are DocumentReferences, we can get the data from the bikebusstops collection
      // and add it to the routeData
      const bikeBusStopIds = selectedRoute?.BikeBusStopIds || [];
      // for each bikeBusStopId, get the data from the bikebusstops collection
      for (const bikeBusStopId of bikeBusStopIds) {
        getDoc(bikeBusStopId).then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const bikeBusStopData = docSnapshot.data();
            if (bikeBusStopData) {
              const bikeBusStop: BikeBusStop = {
                ...bikeBusStopData,
                // add any missing properties with the correct types
                BikeBusGroupId: bikeBusStopData.BikeBusGroupId ? bikeBusStopData.BikeBusGroupId as string : '',
                BikeBusRouteId: bikeBusStopData.BikeBusRouteId ? bikeBusStopData.BikeBusRouteId as string : '',
                BikeBusStopName: bikeBusStopData.BikeBusStopName ? bikeBusStopData.BikeBusStopName as string : '',
                id: bikeBusStopData.id ? bikeBusStopData.id as string : '',
                location: bikeBusStopData.location ? bikeBusStopData.location as string : '',
                placeId: bikeBusStopData.placeId ? bikeBusStopData.placeId as string : '',
                photos: bikeBusStopData.photos ? bikeBusStopData.photos as string : '',
                formattedAddress: bikeBusStopData.formattedAddress ? bikeBusStopData.formattedAddress as string : '',
                placeName: bikeBusStopData.placeName ? bikeBusStopData.placeName as string : '',
              };
              // add the bikeBusStop to the route
              setSelectedRoute(prevRoute => {
                if (prevRoute) {
                  return {
                    ...prevRoute,
                    BikeBusStopIds: prevRoute.BikeBusStopIds,
                    pathCoordinates: prevRoute.pathCoordinates,
                    BikeBusStops: [...prevRoute.BikeBusStops, bikeBusStop]
                  };
                }
                return prevRoute;
              });
            }
          }
        }
        );
      }

      if (selectedRoute) {
        setStartGeo(selectedRoute.startPoint);
        setEndGeo(selectedRoute.endPoint);
        setMapCenter(selectedRoute.startPoint);
      }

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


    }
  }
    , [id, selectedRoute, user]);

  const onMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      setBikeBusStops([]);
      const newStop: Coordinate = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };

      // pass the newStop to the LocationInput and get the PlaceName and PlaceLocation
      const BikeBusStopName = PlaceName;


      // add the new stop to the LocationInput as the variable PlaceLocation
      setPlaceLocation(newStop.lat + ',' + newStop.lng);

      // add the new stop to the LocationInput as the variable PlaceName
      setPlaceName(BikeBusStopName);

      // show the new stop on the map with a marker
      setBikeBusStops([newStop]);

      // update the map center to the new stop
      setMapCenter(newStop);

      // update the marker with a title of the stop place name
      setBikeBusStopName(PlaceName);
    }
  };

  const addNewStop = async (newStop: Coordinate): Promise<string | null> => {
    try {
      const docRef = await addDoc(collection(db, 'bikebusstops'), newStop);
      return docRef.id;
      // set docRef.id as the new stop's id
    } catch (e) {
      console.error("Error adding document: ", e);
    }
    return null;
  };

  const updateBikeBusStops = async (newStopId: string) => {
    const bikeBusStopRef = doc(db, 'bikebusstops', newStopId);

    // Get the bikebusgroup's id from the selected route
    const bikeBusGroupId = selectedRoute?.BikeBusGroupId || '';

    // Get the route id from the URL parameter and set it as a document reference to the routes document collection
    const routeId = doc(db, 'routes', id);

    await updateDoc(bikeBusStopRef, {
      BikeBusGroupId: bikeBusGroupId,
      BikeBusRouteId: routeId,
      BikeBusStopName: BikeBusStopName
    });
  };

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    console.log('place', place);

    if (!place.geometry || !place.geometry.location) {
      return;
    } else {
      const BikeBusStopName = place.name;
      const PlaceLocation = place.geometry.location.toString();
      setPlaceLocation(PlaceLocation);
      // check to see if BikeBusStopName is null or undefined
      if (BikeBusStopName) {
        setBikeBusStopName(BikeBusStopName);
      }
      // BikeBusStops should be a pair of lat lng coordinates
      const newStop: Coordinate = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setBikeBusStops(prevStops => [...prevStops, newStop]);

    }

    if (place.name) {
      setBikeBusStopName(place.name);
    }
  };

  const handlePhotos = (photos: string) => {
    // let's display the photos in a small ionic grid
    return (
      <IonGrid>
        <IonRow>
          <IonCol>
            <img src={photos} alt="school photo" />
          </IonCol>
        </IonRow>
      </IonGrid>
    );
  }

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  const onSaveStopButtonClick = async () => {

    console.log('BikeBusStopName', BikeBusStopName);
    console.log('PlaceLocation', PlaceLocation);
    console.log('selectedRoute', selectedRoute);
    console.log('BikeBusStops', BikeBusStops);
    if (selectedRoute && BikeBusStops.length > 0) {
      const newStop = BikeBusStops[BikeBusStops.length - 1];
      const newStopId = await addNewStop(newStop);

      if (newStopId) {
        // Create a DocumentReference for the newStopId
        const newStopDocRef = doc(db, "bikebusstops", newStopId);
        const routeDocRef = doc(db, "routes", id);
        await setDoc(routeDocRef, {
          BikeBusStopIds: arrayUnion(newStopDocRef)
        }, { merge: true });



        await updateBikeBusStops(newStopId);
        alert('BikeBusStop added successfully!');
        history.push(`/EditRoute/${id}`);
      }
    }
  };



  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonRow>
            <IonCol>
              <IonTitle>
                Create BikeStop
              </IonTitle>
            </IonCol>
          </IonRow>
          <IonText>Search for Name by searching for the location. If you like the name of the BikeBus Stop, then "save new bikebusstop"</IonText>
          <IonItem lines="full">
            <IonLabel>BikeBusStop Name: {BikeBusStopName}</IonLabel>
          </IonItem>
          <IonItem lines="full">
            <IonLabel>Search for a location:</IonLabel>
          </IonItem>
          <LocationInput onLocationChange={setPlaceLocation} defaultLocation={PlaceLocation} onPlaceSelected={handlePlaceSelected} onPhotos={handlePhotos} setFormattedAddress={setFormattedAddress} setPlaceName={setPlaceName} />
          <IonRow>
            <IonCol>
              <IonButton size='default' onClick={() => {
                setPlaceLocation('');
                setPlaceName('');
                setFormattedAddress('');
                setPhotos('');
                setPlaceId('');
                setRerender(prev => prev + 1); 
              }}>Clear Address</IonButton>
            </IonCol>
            <IonCol>
              <IonButton size='default' color="success" onClick={onSaveStopButtonClick}>Save New BikeBusStop</IonButton>
            </IonCol>
            <IonCol>
              <IonButton color="danger" size='default' routerLink={`/EditRoute/${id}`}>Cancel</IonButton>
            </IonCol>
          </IonRow>
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '100%',
            }}
            center={mapCenter}
            zoom={12}
            options={{
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
              disableDoubleClickZoom: true,
              disableDefaultUI: true,
              mapId: 'b75f9f8b8cf9c287',
            }}
            onClick={onMapClick}
          >
            <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" />
            <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" />
            {BikeBusStops && BikeBusStops.map((stop, index) => (
              <Marker
                key={index}
                position={{ lat: stop.lat, lng: stop.lng }}
                title={`Stop ${index + 1}, ${BikeBusStopName}`}
              />
            ))}
            <Polyline
              path={selectedRoute ? selectedRoute.pathCoordinates : []}
              options={{
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 2,
                geodesic: true,
                draggable: true,
                editable: false,
                visible: true,
              }}
            />
          </GoogleMap>
        </IonGrid>
      </IonContent >
    </IonPage >
  );
};

export default CreateBikeBusStop;
