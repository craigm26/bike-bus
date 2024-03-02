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

interface BikeBusStop {
  BikeBusGroupId: string;
  BikeBusRouteId: string;
  BikeBusStopName: string;
  lat: number;
  lng: number;
  id: string;
  location: Coordinate;
  placeId: string;
  photos: string;
  formattedAddress: string;
  placeName: string;
}

interface Route {
  BikeBusName: string;
  BikeBusStopName: string[];
  BikeBusStopIds: DocumentReference[];
  id: string;
  BikeBusStationsIds: string[];
  BikeBusGroupId: DocumentReference;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: Coordinate;
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  travelMode: string;
  pathCoordinates: Coordinate[];
  isBikeBus: boolean;
  duration: string;
  distance: string;
  bicyclingSpeed: string;
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
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);
  const { avatarUrl } = useAvatar(user?.uid);
  const headerContext = useContext(HeaderContext);
  const [accountType, setaccountType] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const { id } = useParams<{ id: string }>();
  const [bikeBusGroup, setBikeBusGroup] = useState<BikeBusGroup | null>(null);
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
  const [BikeBusGroupId, setBikeBusGroupId] = useState<DocumentReference | null>(null);
  const [BikeBusStopIds, setBikeBusStopIds] = useState<DocumentReference[]>([]);
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[] | null>(null);



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
          BikeBusGroupId: docSnap.data().BikeBusGroupId,
          // convert BikeBusGroupId (document reference in firebase) to a string
          pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
            lat: coord.lat,  // use 'lat' instead of 'latitude'
            lng: coord.lng,  // use 'lng' instead of 'longitude'
          })),
        };
        setSelectedRoute(routeData);
        setBikeBusGroupId(routeData.BikeBusGroupId);
        setPath(routeData.pathCoordinates);
        setBikeBusStopIds(routeData.BikeBusStopIds);
        setStartGeo(routeData.startPoint);
        setEndGeo(routeData.endPoint);
        // test if the route is a bikebus
        if (routeData.isBikeBus) {
          console.log("This is a bike bus route");
          console.log(routeData.BikeBusGroupId);
          // fetch the bikebus group data
          const docRef = doc(db, 'bikebusgroups', routeData.BikeBusGroupId?.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const bikeBusGroupData = {
              ...docSnap.data() as BikeBusGroup,
              id: docSnap.id,
            };
            setBikeBusGroup(bikeBusGroupData);
            console.log(bikeBusGroupData);
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        }

  
        if (selectedRoute && selectedRoute.startPoint && selectedRoute.endPoint) {
          setStartGeo(selectedRoute?.startPoint);
          console.log(selectedRoute?.startPoint);
          setEndGeo(selectedRoute.endPoint);
          console.log(selectedRoute.endPoint);
        }

        const newCenter = {
          lat: (routeData.startPoint.lat + routeData.endPoint.lat) / 2,
          lng: (routeData.startPoint.lng + routeData.endPoint.lng) / 2,
        };
        setMapCenter(newCenter);
  
        if (selectedRoute && selectedRoute.BikeBusStopIds) {
          const bikeBusStopData = async () => {
            // fetch the bikebus stop data by looping through the bikebus stop ids array
            const bikeBusStopDataArray: BikeBusStop[] = [];
            for (const bikeBusStopId of selectedRoute.BikeBusStopIds) {
              const docRef = doc(db, 'bikebusstops', bikeBusStopId.id);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const bikeBusStopData = {
                  ...docSnap.data() as BikeBusStop,
                  id: docSnap.id,
                  location: {
                    lat: docSnap.data()?.lat,
                    lng: docSnap.data()?.lng,
                  },
                  // also get the formatted address and place name along with the BikeBusStopName field and values
                  formattedAddress: docSnap.data()?.formattedAddress,
                  placeName: docSnap.data()?.placeName,
                  BikeBusStopName: docSnap.data()?.BikeBusStopName,
                };
                bikeBusStopDataArray.push(bikeBusStopData);
                setBikeBusStops(bikeBusStopDataArray);
                console.log(bikeBusStopData);
                console.log(bikeBusStops);
                console.log(bikeBusStopDataArray);
              } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
              }
            }
            console.log(bikeBusStopDataArray);
            setBikeBusStops(bikeBusStopDataArray);
            console.log(bikeBusStopDataArray);
            console.log(bikeBusStops);
          };
  
          //call bikebus stop data
          bikeBusStopData();
        }
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
          <IonTitle>Viewing Route</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonRow>
            <IonCol>
              <IonLabel>Route Name: {selectedRoute?.routeName}</IonLabel>
            </IonCol>
          </IonRow>
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
                    <span key={index}>{stop.BikeBusStopName}, </span>
                  ))}
                </IonLabel>
              </IonCol>
            </IonRow>
          )}
          <IonRow>
            <IonCol>
              <IonButton routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
              <IonButton onClick={deleteRoute}>Delete Route</IonButton>
              <IonButton routerLink={'/ViewRouteList/'}>Go to Route List</IonButton>
              {isBikeBus && (
                <IonButton routerLink={`/bikebusgrouppage/${selectedRoute?.BikeBusGroupId?.id}`}>Go to BikeBus</IonButton>
              )}
            </IonCol>
          </IonRow>
          {!isBikeBus && (
            <IonRow>
              <IonCol>
                <IonButton routerLink={`/CreateBikeBusGroup/${id}`}>Create BikeBus Group</IonButton>
              </IonCol>
            </IonRow>
          )}
          <IonRow style={{ flex: '1' }}>
            <IonCol>
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
                <React.Fragment key={selectedRoute?.pathCoordinates?.toString()}>
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
                </React.Fragment>
                {bikeBusStops?.map((stop, index) => (
                  <Marker
                    key={index}
                    position={{ lat: stop.location.lat, lng: stop.location.lng }}
                    title={stop.BikeBusStopName}
                    label={stop.BikeBusStopName}
                    onClick={() => {
                      setSelectedBikeBusStop(stop.location);
                      setSelectedStopIndex(index);
                    }}
                  />
                ))}
                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <h4>Marker Data</h4>
                      <p>Latitude: {selectedMarker.lat}</p>
                      <p>Longitude: {selectedMarker.lng}</p>
                    </div>
                  </InfoWindow>
                )}
                <Marker
                  position={{ lat: startGeo.lat, lng: startGeo.lng }}
                  title="Start"
                  label={"Start"}
                  onClick={() => setSelectedMarker(startGeo)}
                />
                <Marker
                  position={{ lat: endGeo.lat, lng: endGeo.lng }}
                  title="End"
                  label={"End"}
                  onClick={() => setSelectedMarker(endGeo)}
                />
                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <h4>Marker Data</h4>
                      <p>Latitude: {selectedMarker.lat}</p>
                      <p>Longitude: {selectedMarker.lng}</p>
                    </div>
                  </InfoWindow>
                )}
                {bikeBusStops?.map((stop, index) => (
                  <Marker
                    key={index}
                    position={{ lat: stop.location.lat, lng: stop.location.lng }}
                    title={stop.BikeBusStopName}
                    label={stop.BikeBusStopName}
                    onClick={() => {
                      setSelectedBikeBusStop(stop.location);
                      setSelectedStopIndex(index);
                    }}
                  />
                ))}
              </GoogleMap>
              <Polyline
                path={selectedRoute?.pathCoordinates}
                options={{
                  strokeColor: "#ffd800",
                  strokeOpacity: 1.0,
                  strokeWeight: 2,
                  geodesic: true,
                  draggable: false,
                  editable: false,
                  visible: true,
                }}
              />
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );

};

export default ViewRoute;
