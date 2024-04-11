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
  IonText,
  IonIcon,
} from '@ionic/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import { useParams, useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, OverlayView } from '@react-google-maps/api';
import React from 'react';
import { AuthContext } from '../AuthContext';
import SidebarEditRoute from '../components/Mapping/SidebarEditRoute';
import { playCircle, bicycle, pauseCircle, handRightOutline } from 'ionicons/icons';


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

interface Coordinate {
  lat: number;
  lng: number;
}

// a BikeBusStop is an array of BikeBusStops that exist as a subcollection of the route
interface BikeBusStop {
  BikeBusGroup: DocumentReference;
  BikeBusRouteId: string;
  BikeBusStopName: string;
  id: string;
  location: Coordinate;
  placeId: string;
  photos: string;
  formattedAddress: string;
  placeName: string;
  order: number;
}
interface Route {
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number, lng: number };
  pathCoordinates: {
    lat: number;
    lng: number;
  }[];
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  routeName: string;
  routeType: string;
  routeCreator: DocumentReference;
  routeLeader: DocumentReference;
  description: string;
  travelMode: string;
  isBikeBus: boolean;
  BikeBusName: string;
  BikeBusStops: BikeBusStop[];
  legs: RouteLeg[];
  BikeBusGroup: DocumentReference;
  id: string;
  accountType: string;
  bicyclingSpeed: string;
  bicyclingSpeedSelector: string;
  routeId: string;
  name: string;
  distance: string;
  duration: string;
  arrivalTime: string;
}

interface RouteLeg {
  startPoint: Coordinate | google.maps.LatLng;
  endPoint: Coordinate | google.maps.LatLng;
  distance?: string;
  duration?: string;
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
  const [BikeBusGroup, setBikeBusGroup] = useState<DocumentReference | null>(null);
  const [isUserLeader, setIsUserLeader] = useState(false);
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);
  const [routeLegsEnabled, setRouteLegsEnabled] = useState(true);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(13);
  const [timingSidebarEnabled, setTimingSidebarEnabled] = useState(true);




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
        setBikeBusGroup(routeData.BikeBusGroup);
        setIsUserLeader(routeData?.routeLeader === user?.uid);
        setPath(routeData.pathCoordinates);
        setStartGeo(routeData.startPoint);
        setEndGeo(routeData.endPoint);
        setStartGeo(routeData?.startPoint);
        setEndGeo(routeData.endPoint);
        setMapCenter({
          lat: (routeData.startPoint.lat + routeData.endPoint.lat) / 2,
          lng: (routeData.startPoint.lng + routeData.endPoint.lng) / 2,
        });
        // test if the route is a bikebus
        if (routeData.isBikeBus) {
          // fetch the bikebus group data
          const docRef = doc(db, 'bikebusgroups', routeData?.BikeBusGroup?.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const bikeBusGroupData = {
              ...docSnap.data() as BikeBusGroup,
              id: docSnap.id,
            };
          } else {
            // doc.data() will be undefined in this case
            console.log("No such document!");
          }
        }

        const fetchBikeBusStops = async () => {
          // first let's get the bikebusstop documents from the selectedRoute.BikeBusStops
          const BikeBusStopsSnapshot = await getDocs(collection(db, 'routes', id, 'BikeBusStops'));
          // now we want to map through the BikeBusStopsSnapshot and return the data and then set to state
          const BikeBusStops = BikeBusStopsSnapshot.docs.map((doc) => {
            const data = doc.data() as any; // use 'any' temporarily to bypass type checking
            // Assume 'location' is a GeoPoint, extract 'latitude' and 'longitude'
            const location = data.location; // This should be a Firestore GeoPoint
            return {
              ...data,
              location: {
                lat: location.latitude,
                lng: location.longitude,
              },
            };
          });

          setBikeBusStops(BikeBusStops);
        }


        fetchBikeBusStops();

        // since we're setting BikeBusStops, let's also fetch the existing legs of the route
        const legsRef = collection(db, 'routes', id, 'legs');
        const legsSnapshot = await getDocs(legsRef);
        const legs = legsSnapshot.docs.map(doc => doc.data() as RouteLeg);
        setRouteLegs(legs);

      }

    }
    if (id) fetchSingleRoute(id);
  }
    , [user, id]);

  const deleteRoute = async () => {
    if (selectedRoute) {
      const routeRef = doc(db, 'routes', selectedRoute.id);
      await deleteDoc(routeRef);
      // send message to user that the route was deleted
      alert('Route Deleted');
      history.push('/viewroutelist/');
    } else {
      alert('No route to delete');
    }
  };

  const handleBicyclingLayerToggle = (enabled: boolean) => {
    if (bicyclingLayerRef.current && mapRef.current) {
      if (enabled) {
        bicyclingLayerRef.current.setMap(mapRef.current); // Show the layer
      } else {
        bicyclingLayerRef.current.setMap(null); // Hide the layer
      }
    }
  };

  const getNumber = (value: number | (() => number)): number => typeof value === 'function' ? value() : value;

  // Base offset at zoom level 13 (you can adjust this according to your preferences)
  const BASE_LAT_OFFSET = 0.0090;
  const BASE_LNG_OFFSET = 0.0090;
  const BASE_ZOOM_LEVEL = 13;

  // Function to get current offset based on zoom level
  const getCurrentOffset = (zoomLevel: number) => {
    // The higher the zoom, the less the offset
    const zoomDifference = Math.pow(2, BASE_ZOOM_LEVEL - zoomLevel);
    return {
      latOffset: BASE_LAT_OFFSET * zoomDifference,
      lngOffset: BASE_LNG_OFFSET * zoomDifference,
    };
  };

  // Use the function to get the current offset

  useEffect(() => {
    if (mapRef.current) {
      const listener = mapRef.current.addListener('zoom_changed', () => {
        // Update current zoom level state with the new zoom level
        setCurrentZoomLevel(mapRef.current?.getZoom() ?? 13);
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [mapRef.current]);



  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonText>Viewing {selectedRoute?.routeName}</IonText>
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
          <IonRow>
            <IonCol>
              {isUserLeader && (
                <IonButton shape="round" size="small" routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
              )}
              {isUserLeader && (
                <IonButton shape="round" color="danger" size="small" onClick={deleteRoute}>Delete Route</IonButton>
              )}
              <IonButton shape="round" size="small" routerLink={'/ViewRouteList/'}>Go to Route List</IonButton>
              {isBikeBus && (
                <IonButton shape="round" size="small" routerLink={`/bikebusgrouppage/${selectedRoute?.BikeBusGroup?.id}`}>Go to BikeBus</IonButton>
              )}
            </IonCol>
          </IonRow>
          {!isBikeBus && (
            <IonRow>
              <IonCol>
                <IonButton shape="round" size="small" routerLink={`/CreateBikeBusGroup/${id}`}>Create BikeBus Group</IonButton>
              </IonCol>
            </IonRow>
          )}
          <IonRow style={{ flex: '1' }}>
            <IonCol>
              {selectedRoute && isLoaded && (
                <GoogleMap
                  onLoad={(map) => {
                    mapRef.current = map;
                    bicyclingLayerRef.current = new google.maps.BicyclingLayer();
                  }}
                  mapContainerStyle={containerMapStyle}
                  center={mapCenter}
                  zoom={currentZoomLevel}
                  options={{
                    zoomControl: true,
                    zoomControlOptions: {
                      position: window.google.maps.ControlPosition.LEFT_CENTER
                    },
                    streetViewControl: true,
                    streetViewControlOptions: {
                      position: window.google.maps.ControlPosition.LEFT_CENTER
                    },
                    fullscreenControl: true,
                    fullscreenControlOptions: {
                      position: window.google.maps.ControlPosition.LEFT_CENTER
                    },
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
                  {bikeBusStops.map((BikeBusStop, index) => (
                    <Marker
                      key={index}
                      label={BikeBusStop.BikeBusStopName || 'BikeBus Stop'}
                      position={BikeBusStop.location}
                      title={BikeBusStop.BikeBusStopName}
                    />
                  ))}
                  {routeLegsEnabled && routeLegs.map((leg, index) => {

                    const midLat = (getNumber(leg.startPoint.lat) + getNumber(leg.endPoint.lat)) / 2;
                    const midLng = (getNumber(leg.startPoint.lng) + getNumber(leg.endPoint.lng)) / 2;

                    // Use the function to get the current offset
                    const { latOffset, lngOffset } = getCurrentOffset(currentZoomLevel);

                    // Apply the dynamic offset to the midpoint
                    const offsetMidLat = midLat + latOffset;
                    const offsetMidLng = midLng + lngOffset;

                    return (
                      <React.Fragment key={index}>
                        <OverlayView
                          position={{ lat: offsetMidLat, lng: offsetMidLng }}
                          mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                          <div style={{
                            background: "white",
                            border: "1px solid #ccc",
                            padding: "4px 8px", // Adjust padding as necessary
                            borderRadius: "3px",
                            whiteSpace: "nowrap", // Keep text on a single line
                            display: "inline-block", // Adjust width based on content
                            minWidth: "100px", // Set a minimum width if necessary
                            opacity: 0.8

                          }}>
                            <div style={{ textAlign: "center" }}>Leg {index + 1}</div>
                            <div>Distance: {leg.distance} miles</div>
                            <div>Duration: {leg.duration} minutes</div>
                          </div>
                        </OverlayView>

                      </React.Fragment>
                    )
                  })}
                  {timingSidebarEnabled && selectedRoute && (
                      <div style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'white',
                        padding: '10px',
                        zIndex: 100,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IonIcon icon={playCircle} style={{ marginRight: '5px' }} />
                          <IonLabel>{selectedRoute.startPointName}</IonLabel>
                        </div>
                        {routeLegs.map((leg, index) => {
                          const isLastLeg = index === routeLegs.length - 1;
                          const stopsForThisLeg = bikeBusStops
                            .sort((a, b) => a.order - b.order);

                          return (
                            <React.Fragment key={index}>
                              <div style={{
                                width: '2px',
                                height: '20px',
                                backgroundColor: '#ffd800',
                                margin: '10px auto',
                              }} />
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IonIcon icon={bicycle} style={{ marginRight: '5px' }} />
                                <IonLabel>Leg {index + 1}: {leg.duration} minutes</IonLabel>
                              </div>
                              {!isLastLeg && stopsForThisLeg.map((stop, stopIndex) => (
                                <React.Fragment key={stopIndex}>
                                  <div style={{
                                    width: '2px',
                                    height: '20px',
                                    backgroundColor: '#ffd800',
                                    margin: '10px auto',
                                  }} />
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IonIcon icon={pauseCircle} style={{ marginRight: '5px' }} />
                                    <IonLabel>{stop.BikeBusStopName}</IonLabel>
                                  </div>
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          );
                        })}
                        <div style={{
                          width: '2px',
                          height: '20px',
                          backgroundColor: '#ffd800',
                          margin: '10px auto',
                        }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <IonIcon icon={handRightOutline} style={{ marginRight: '5px' }} />
                          <IonLabel>{selectedRoute.endPointName}</IonLabel>
                        </div>
                      </div>
                    )}
                  <Marker
                    zIndex={1}
                    position={{ lat: selectedRoute.startPoint.lat, lng: selectedRoute.startPoint.lng }}
                    title="Start"
                    label={"Start"}
                  />
                  <Marker
                    zIndex={10}
                    position={{ lat: selectedRoute.endPoint.lat, lng: selectedRoute.endPoint.lng }}
                    title="End"
                    label={"End"}
                  />
                  <SidebarEditRoute
                    mapRef={mapRef}
                    bicyclingLayerEnabled={bicyclingLayerEnabled}
                    setBicyclingLayerEnabled={setBicyclingLayerEnabled}
                    handleBicyclingLayerToggle={handleBicyclingLayerToggle}
                    routeLegsEnabled={routeLegsEnabled}
                    setRouteLegsEnabled={setRouteLegsEnabled}
                    timingSidebarEnabled={timingSidebarEnabled}
                    setTimingSidebarEnabled={setTimingSidebarEnabled}
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
