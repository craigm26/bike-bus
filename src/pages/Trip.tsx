import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import {
    IonContent,
    IonPage,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonCol,
    IonGrid,
    IonRow,
    IonRouterLink,
    IonAvatar,
    IonIcon,
  } from '@ionic/react';
  import { useContext, useEffect, useState } from 'react';
  import { useAvatar } from '../components/useAvatar';
  import { db } from '../firebaseConfig';
  import { HeaderContext } from "../components/HeaderContext";
  import { DocumentReference, deleteDoc, doc, getDoc } from 'firebase/firestore';
  import useAuth from "../useAuth";
  import { GeoPoint } from 'firebase/firestore';
  import { useParams, useHistory, Link } from 'react-router-dom';
  import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
  import React from 'react';
  
  
  const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];
  
  
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
  
  interface Station {
    id: string;
    location: GeoPoint;
  }
  
  interface Route {
    BikeBusName: string;
    BikeBusStopName: string[];
    BikeBusStop: Coordinate[];
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
  }
  
  interface Coordinate {
    lat: number;
    lng: number;
  }
  

interface RouteParams {
    eventDataId: string;
  }

const Trip: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const headerContext = useContext(HeaderContext);
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);

    const [bikeBusGroup, setBikeBusGroup] = useState<BikeBusGroup | null>(null);
    const [stations, setStations] = useState<Station[]>([]);
    const { isLoaded, loadError } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
      libraries,
    });
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<Coordinate[]>([]);
    const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [BikeBusStop, setBikeBusStop] = useState<Coordinate>({ lat: 0, lng: 0 });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
      lat: startGeo.lat,
      lng: startGeo.lng,
    });
    const [BikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<Coordinate | null>(null);
    const [selectedBikeBusStop, setSelectedBikeBusStop] = useState<Coordinate | null>(null);
    const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
    const [BikeBusGroupId, setBikeBusGroupId] = useState<string>('');

    let { eventDataId } = useParams<RouteParams>();
    console.log('eventDataId:', eventDataId);

    const history = useHistory();

    
  const containerMapStyle = {
    width: '100%',
    height: '100%',
  };

  // get the route id by using the eventDataId
    const [id, setId] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);


  useEffect(() => {
    if (id) fetchSingleRoute(id);
  }, [id]);

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
        BikeBusGroupId: docSnap.data().BikeBusGroupId,
        // convert BikeBusGroupId (document reference in firebase) to a string
        pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
          lat: coord.lat,  // use 'lat' instead of 'latitude'
          lng: coord.lng,  // use 'lng' instead of 'longitude'
        })),
        BikeBusStationsIds: (docSnap.data().BikeBusStationsIds || []).map((coord: any) => ({
          lat: coord.lat,  // use 'lat' instead of 'latitude'
          lng: coord.lng,  // use 'lng' instead of 'longitude'
        })),
        BikeBusStops: (docSnap.data().BikeBusStop || []).map((coord: any) => ({
          lat: coord.lat,  // use 'lat' instead of 'latitude'
          lng: coord.lng,  // use 'lng' instead of 'longitude'
        })),
      };
      setSelectedRoute(routeData);
      setBikeBusGroupId(routeData.BikeBusGroupId);
      console.log(routeData);
      console.log(routeData.BikeBusGroupId);
      // setBikeBusGroup(routeData.BikeBusGroupId); is a document reference. Convert it to a string
      setPath(routeData.pathCoordinates);
      setBikeBusStops(routeData.BikeBusStops);
      setStartGeo(routeData.startPoint);
      setEndGeo(routeData.endPoint);
      // test if the route is a bikebus
      if (routeData.isBikeBus) {
        console.log("This is a bike bus route");
        console.log(routeData.BikeBusGroupId);
        // fetch the bikebus group data
        const docRef = doc(db, 'bikeBusGroups', routeData.BikeBusGroupId);
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


    }
  };

    const togglePopover = (e: any) => {
        console.log('togglePopover called');
        console.log('event:', e);
        setPopoverEvent(e.nativeEvent);
        setShowPopover((prevState) => !prevState);
        console.log('showPopover state:', showPopover);
    };

    const avatarElement = user ? (
        avatarUrl ? (
            <IonAvatar>
                <Avatar uid={user.uid} size="extrasmall" />
            </IonAvatar>
        ) : (
            <IonIcon icon={personCircleOutline} />
        )
    ) : (
        <IonIcon icon={personCircleOutline} />
    );

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
    
        // get the data from the url params eventDataId
        const eventDataRef = doc(db, 'events', eventDataId);
        getDoc(eventDataRef).then((docSnapshot) => {
            if (docSnapshot.exists()) {
                const eventData = docSnapshot.data();
                if (eventData) {
                    console.log('eventData:', eventData);
                    const selectedRoute = eventData?.route;
                    console.log('selectedRoute:', selectedRoute);
                    if (selectedRoute) {
                        setMapCenter({
                            lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
                            lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
                        });
                        setStartGeo(selectedRoute.startPoint);
                        setEndGeo(selectedRoute.endPoint);
                        setSelectedRoute(selectedRoute);
                    }
                }
            }
        });
    }, [user, eventDataId]);
    

    const label = user?.username ? user.username : "anonymous";

    return (
        <IonPage style={{ height: '100%' }}>
        <IonHeader>
          <IonToolbar>
            {headerContext?.showHeader && <IonHeader></IonHeader>}
          </IonToolbar>
        </IonHeader>
        <IonContent style={{ height: '100%' }}>
          <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <IonRow style={{ flex: '1' }}>
              <IonCol>
                {isLoaded && selectedRoute ? (
                  <GoogleMap
                    mapContainerStyle={containerMapStyle}
                    center={mapCenter}
                    zoom={12}
                    options={{
                      mapTypeControl: false,
                      streetViewControl: false,
                      fullscreenControl: true,
                      disableDoubleClickZoom: true,
                      disableDefaultUI: true,
                      styles: [
                        {
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#f5f5f5"
                            }
                          ]
                        },
                        {
                          "elementType": "labels.icon",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#616161"
                            }
                          ]
                        },
                        {
                          "elementType": "labels.text.stroke",
                          "stylers": [
                            {
                              "color": "#f5f5f5"
                            }
                          ]
                        },
                        {
                          "featureType": "administrative",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "administrative.land_parcel",
                          "elementType": "labels",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "administrative.land_parcel",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#bdbdbd"
                            }
                          ]
                        },
                        {
                          "featureType": "administrative.neighborhood",
                          "elementType": "geometry.fill",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "administrative.neighborhood",
                          "elementType": "labels.text",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "poi",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "poi",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#eeeeee"
                            }
                          ]
                        },
                        {
                          "featureType": "poi",
                          "elementType": "labels.text",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "poi",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#757575"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.business",
                          "stylers": [
                            {
                              "visibility": "simplified"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.business",
                          "elementType": "labels.text",
                          "stylers": [
                            {
                              "saturation": -65
                            },
                            {
                              "lightness": 50
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#e5e5e5"
                            },
                            {
                              "visibility": "simplified"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "geometry.fill",
                          "stylers": [
                            {
                              "color": "#27d349"
                            },
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "labels",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "labels.text",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.park",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#9e9e9e"
                            },
                            {
                              "saturation": 45
                            },
                            {
                              "lightness": -20
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "elementType": "geometry.fill",
                          "stylers": [
                            {
                              "color": "#ffd800"
                            },
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "elementType": "geometry.stroke",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "elementType": "labels",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "elementType": "labels.text",
                          "stylers": [
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "visibility": "on"
                            },
                            {
                              "weight": 5
                            }
                          ]
                        },
                        {
                          "featureType": "poi.school",
                          "elementType": "labels.text.stroke",
                          "stylers": [
                            {
                              "visibility": "on"
                            },
                            {
                              "weight": 3.5
                            }
                          ]
                        },
                        {
                          "featureType": "road",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#ffffff"
                            },
                            {
                              "visibility": "simplified"
                            }
                          ]
                        },
                        {
                          "featureType": "road",
                          "elementType": "labels.icon",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "road.arterial",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#757575"
                            }
                          ]
                        },
                        {
                          "featureType": "road.highway",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#dadada"
                            }
                          ]
                        },
                        {
                          "featureType": "road.highway",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#616161"
                            }
                          ]
                        },
                        {
                          "featureType": "road.local",
                          "elementType": "labels",
                          "stylers": [
                            {
                              "visibility": "off"
                            }
                          ]
                        },
                        {
                          "featureType": "road.local",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#9e9e9e"
                            }
                          ]
                        },
                        {
                          "featureType": "transit",
                          "elementType": "geometry.fill",
                          "stylers": [
                            {
                              "color": "#7ea3ec"
                            },
                            {
                              "saturation": -50
                            },
                            {
                              "lightness": 50
                            },
                            {
                              "visibility": "on"
                            }
                          ]
                        },
                        {
                          "featureType": "water",
                          "elementType": "geometry",
                          "stylers": [
                            {
                              "color": "#c9c9c9"
                            }
                          ]
                        },
                        {
                          "featureType": "water",
                          "elementType": "labels.text.fill",
                          "stylers": [
                            {
                              "color": "#9e9e9e"
                            }
                          ]
                        }
                      ],
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
                    <Marker position={{ lat: startGeo.lat, lng: startGeo.lng }} title="Start" label="Start" onClick={() => setSelectedMarker(selectedMarker)} />
                    <Marker position={{ lat: endGeo.lat, lng: endGeo.lng }} title="End" label="End" onClick={() => setSelectedMarker(selectedMarker)} />
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
                    {BikeBusStops.map((stop, index) => (
                      <Marker
                        key={index}
                        position={stop}
                        title={`Stop ${index + 1}`}
                        label={`${index + 1}`}
                        onClick={() => setSelectedMarker(selectedMarker)}
                      />
                    ))}
                  </GoogleMap>
                ) : (
                  <>
                    {isLoaded && selectedRoute && (
                      <>
                        <GoogleMap
                          mapContainerStyle={containerMapStyle}
                          center={mapCenter}
                          zoom={12}
                          options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true,
                            disableDoubleClickZoom: true,
                            disableDefaultUI: true,
                          }}
                        >
                          <Marker
                            position={{ lat: startGeo.lat, lng: startGeo.lng }}
                            title="Start"
                            onClick={() => setSelectedMarker(selectedMarker)}
                          />
                          <Marker
                            position={{ lat: endGeo.lat, lng: endGeo.lng }}
                            title="End"
                          />
                        </GoogleMap>
                        <Polyline
                          path={selectedRoute.pathCoordinates}
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
                        {BikeBusStops?.map((stop, index) => (
                          <Marker
                            key={index}
                            position={stop}
                            title={`Stop ${index + 1}`}
                            label={`${index + 1}`}
                            onClick={() => {
                              setSelectedStopIndex(index);
                            }}
                          >
                            {selectedStopIndex === index && (
                              <InfoWindow onCloseClick={() => setSelectedStopIndex(null)}>
                                <div>
                                  <h3>{`Stop ${index + 1}`}</h3>
                                  <p>Some details about the location...</p>
                                </div>
                              </InfoWindow>
                            )}
                          </Marker>
                        ))}
                      </>
                    )}
                  </>
                )}
  
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
      </IonPage>
    );
};

export default Trip;
