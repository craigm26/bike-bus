import {
  IonContent,
  IonPage,
  IonLabel,
  IonButton,
  IonCol,
  IonGrid,
  IonRow,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, deleteDoc, doc, getDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams, useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import React from 'react';
import { AuthContext } from '../AuthContext';


const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];


interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusGroup {
  id: string;
  name: string;
  description: string;
  routeId: string;
}



interface BikeBusStops {
  id: string; // Document ID
  BikeBusStopName: string;
  formattedAddress: string;
  // `location` should be an object with `lat` and `lng` properties if it's stored as GeoPoint in Firestore
  location: Coordinate;
  photos: string; // Assuming it's a string URL or could be an array of string URLs if multiple
  placeId: string;
  placeName: string;
}
interface Route {
  newStop: Coordinate | null;
  BikeBusGroup: DocumentReference;
  BikeBusStops: DocumentReference[]; 
  id: string;
  endPointAddress: string;
  endPointName: string;
  startPointAddress: string;
  startPointName: string;
  BikeBusGroupId: string;
  BikeBusName: string;
  accountType: string;
  bicyclingSpeed: string;
  bicyclingSpeedSelector: string;
  description: string;
  distance: string;
  duration: string;
  endPoint: {
    lat: number;
    lng: number;
  };
  isBikeBus: boolean;
  pathCoordinates: Array<{
    lat: number;
    lng: number;
  }>;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: {
    lat: number;
    lng: number;
    startPointAddress: string;
    startPointName: string;
  };
  travelMode: string;
}

interface Coordinate {
  lat: number;
  lng: number;
}

const ViewRoute: React.FC = () => {
  const { user, loadingAuthState } = useContext(AuthContext);
  const history = useHistory();
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const headerContext = useContext(HeaderContext);
  const [accountType, setaccountType] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const [selectedMarker, setSelectedMarker] = useState<Coordinate | null>(null);
  const [selectedBikeBusStop, setSelectedBikeBusStop] = useState<Coordinate | null>(null);
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
  const [BikeBusGroup, setBikeBusGroup] = useState<DocumentReference | null>(null);
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStops[] | null>(null);



  const containerMapStyle = {
    width: '100%',
    height: '100%',
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries: libraries,
  });




  const isBikeBus = selectedRoute?.isBikeBus ?? false;

  useEffect(() => {

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
            // get the start and end points of the route and set to state
            if (selectedRoute && selectedRoute.startPoint && selectedRoute.endPoint) {
              setMapCenter({
                lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
                lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
              });
            }
          }
        }
      }
      );
    }

    const fetchSingleRoute = async (id: string) => {
      const docRef = doc(db, 'routes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const routeData = {
          ...docSnap.data() as Route,
          id: docSnap.id,
          isBikeBus: docSnap.data().isBikeBus,
          startPoint: docSnap.data().startPoint,
          endPoint: docSnap.data().endPoint,
          duration: docSnap.data().duration,
          distance: docSnap.data().distance,
          bicyclingSpeed: docSnap.data().bicyclingSpeed,
          BikeBusGroup: docSnap.data().BikeBusGroup,
          // convert BikeBusGroupId (document reference in firebase) to a string
          pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
            lat: coord.lat,  // use 'lat' instead of 'latitude'
            lng: coord.lng,  // use 'lng' instead of 'longitude'
          })),
        };
        setSelectedRoute(routeData);

        if (Array.isArray(routeData.BikeBusStops)) {
          const bikeBusStopDataArray = [];
          for (const stopRef of routeData.BikeBusStops) {
            const stopDoc = await getDoc(stopRef);
            if (stopDoc.exists()) {
              const stopData = stopDoc.data() as BikeBusStops;
              stopData.id = stopDoc.id;
              bikeBusStopDataArray.push(stopData);
            }
          }
          setBikeBusStops(bikeBusStopDataArray);
          console.log(bikeBusStopDataArray);
        }

        setBikeBusGroup(routeData.BikeBusGroup);
        setPath(routeData.pathCoordinates);
        setStartGeo(routeData.startPoint);
        setEndGeo(routeData.endPoint);
        // test if the route is a bikebus
        if (routeData.isBikeBus) {
          console.log("This is a bike bus route");
          console.log(routeData.BikeBusGroup);
          // fetch the bikebus group data
          const docRef = doc(db, 'bikebusgroups', routeData?.BikeBusGroup?.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const bikeBusGroupData = {
              ...docSnap.data() as BikeBusGroup,
              id: docSnap.id,
            };
            console.log(bikeBusGroupData);
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        }


        if (selectedRoute && selectedRoute.startPoint && selectedRoute.endPoint) {
          setStartGeo(selectedRoute?.startPoint);
          setEndGeo(selectedRoute.endPoint);
        }

        const newCenter = {
          lat: (routeData.startPoint.lat + routeData.endPoint.lat) / 2,
          lng: (routeData.startPoint.lng + routeData.endPoint.lng) / 2,
        };
        setMapCenter(newCenter);
      
        
        setLoading(false);
      }
    };

    if (id) fetchSingleRoute(id);

  }, [id]);

  const deleteRoute = async () => {
    if (selectedRoute) {
      const routeRef = doc(db, 'routes', selectedRoute.id);
      await deleteDoc(routeRef);
      // send message to user that the route was deleted
      alert('Route Deleted');
      history.push('/viewroutelist/');
    }
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Viewing {selectedRoute?.routeName}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonRow>
            <IonCol>
              <IonLabel>Speed: {selectedRoute?.bicyclingSpeed}</IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              {selectedRoute?.travelMode && (
                <IonLabel>Travel Mode: {selectedRoute?.travelMode?.charAt(0).toUpperCase() + selectedRoute?.travelMode?.slice(1)}</IonLabel>
              )}
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonLabel>
                Starting Point: {selectedRoute?.startPointAddress}
              </IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonLabel>
                Ending Point: {selectedRoute?.endPointAddress}
              </IonLabel>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonLabel>
                Duration: {selectedRoute?.duration} Minutes
              </IonLabel>
            </IonCol>
          </IonRow>
          {isBikeBus && (
            <IonRow>
              <IonCol>
                <IonLabel>
                  BikeBus Stops:
                  {bikeBusStops?.map((stop, index) => (
                    <IonLabel key={index}>{stop.BikeBusStopName}</IonLabel>
                  ))}
                </IonLabel>
              </IonCol>
            </IonRow>
          )}
          <IonRow>
            <IonCol>
              <IonButton shape="round" size="small" routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
              <IonButton shape="round" color="danger"  size="small" onClick={deleteRoute}>Delete Route</IonButton>
              <IonButton shape="round"  size="small" routerLink={'/ViewRouteList/'}>Go to Route List</IonButton>
              {isBikeBus && (
                <IonButton shape="round"  size="small" routerLink={`/bikebusgrouppage/${selectedRoute?.BikeBusGroup?.id}`}>Go to BikeBus</IonButton>
              )}
            </IonCol>
          </IonRow>
          {!isBikeBus && (
            <IonRow>
              <IonCol>
                <IonButton shape="round"  size="small" routerLink={`/CreateBikeBusGroup/${id}`}>Create BikeBus Group</IonButton>
              </IonCol>
            </IonRow>
          )}
          <IonRow style={{ flex: '1' }}>
            <IonCol>
              {isLoaded && (
                <GoogleMap
                  onLoad={(map) => {
                    mapRef.current = map;
                    bicyclingLayerRef.current = new google.maps.BicyclingLayer();
                  }}
                  mapContainerStyle={containerMapStyle}
                  center={mapCenter}
                  zoom={13}
                  options={{
                    zoomControl: true,
                    zoomControlOptions: {
                      position: window.google.maps.ControlPosition.LEFT_CENTER
                    },
                    mapTypeControl: false,
                    mapTypeControlOptions: {
                      position: window.google.maps.ControlPosition.LEFT_CENTER, // Position of map type control
                      mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',],
                    },
                    streetViewControl: false,
                    fullscreenControl: true,
                    disableDoubleClickZoom: true,
                    disableDefaultUI: true,
                    mapId: 'b75f9f8b8cf9c287',
                  }}
                  onUnmount={() => {
                    mapRef.current = null;
                  }}
                >
                  <Polyline
                    path={selectedRoute?.pathCoordinates}
                    options={{
                      strokeColor: "#000000",
                      strokeOpacity: 1,
                      strokeWeight: 5,
                      geodesic: true,
                      draggable: false,
                      editable: false,
                      visible: true,
                    }}
                  />
                  <Polyline
                    path={selectedRoute?.pathCoordinates}
                    options={{
                      strokeColor: "#ffd800",
                      strokeOpacity: 1,
                      strokeWeight: 3,
                      geodesic: true,
                      draggable: false,
                      editable: false,
                      visible: true,
                    }}
                  />
                  {bikeBusStops?.map((stop, index) => (
                    <Marker
                      zIndex={10}
                      key={index}
                      position={{ lat: stop.location.lat, lng: stop.location.lng }}
                      title={stop.BikeBusStopName}
                      label={stop.BikeBusStopName}
                    />
                  ))}
                  <Marker
                    zIndex={1}
                    position={{ lat: startGeo.lat, lng: startGeo.lng }}
                    title="Start"
                    label={"Start"}
                    onClick={() => setSelectedMarker(startGeo)}
                  />
                  <Marker
                    zIndex={10}
                    position={{ lat: endGeo.lat, lng: endGeo.lng }}
                    title="End"
                    label={"End"}
                    onClick={() => setSelectedMarker(endGeo)}
                  />
                </GoogleMap>
              )}
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );

};

export default ViewRoute;
