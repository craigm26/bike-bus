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
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, DocumentSnapshot, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams, useHistory, Link } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import React from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import AvatarMapMarker from "../components/AvatarMapMarker";
import { get } from 'http';


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

interface FetchedUserData {
  username: string;
  accountType?: string;
}

interface RouteData {
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number };
  pathCoordinates: { lat: number; lng: number }[];
  startPointName: string;
  endPointName: string;
  startPointAddress: string;
  endPointAddress: string;
  routeName: string;
  routeType: string;
  routeCreator: string;
  routeLeader: string;
  description: string;
  travelMode: string;
  isBikeBus: boolean;
  BikeBusName: string;
  BikeBusStopName: string[];
  BikeBusStop: Coordinate[];
  BikeBusStops: Coordinate[];
  BikeBusStationsIds: string[];
  BikeBusGroupId: DocumentReference;
  id: string;
  accountType: string;
  routeId: string;
  name: string;
}



interface RouteParams {
  eventDataId: string;
  tripDataId: string;
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
  const [eventData, setEventData] = useState<any>(null);
  const [bikeBusGroupData, setBikeBusGroupData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [caboose, setCaboose] = useState<string[]>([]);
  const [captains, setCaptains] = useState<string[]>([]);
  const [kids, setKids] = useState<string[]>([]);
  const [parents, setParents] = useState<string[]>([]);
  const [sheepdogs, setSheepdogs] = useState<string[]>([]);
  const [sprinters, setSprinters] = useState<string[]>([]);
  const [role, setRole] = useState<string[]>([]);
  const [leader, setLeader] = useState<string>('');
  const [showJoinBikeBus, setShowJoinBikeBus] = useState<boolean>(false);
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string>('');
  const [userLocation, setUserLocation] = useState<Coordinate>({ lat: 0, lng: 0 });

  let { tripDataId } = useParams<RouteParams>();

  const history = useHistory();


  const containerMapStyle = {
    width: '100%',
    height: '100%',
  };

  // get the route id by using the eventDataId
  const [routeid, setRouteId] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const fetchUser = async (username: string): Promise<FetchedUserData | undefined> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    let user: FetchedUserData | undefined;

    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      user = doc.data() as FetchedUserData;
    });

    return user;
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

  // use the default value of startGeo to set the initial map center location
  const [leaderLocation, setLeaderLocation] = useState<Coordinate>({ lat: startGeo.lat, lng: startGeo.lng });
  // the leaderUID is the user.uid of the leader which is stored in the selectedRoute.routeLeader
  const [leaderUID, setLeaderUID] = useState<string>('');


  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }

        const tripsRef = doc(db, 'trips', tripDataId);
        const tripSnapshot = await getDoc(tripsRef);

        if (tripSnapshot.exists()) {
          const tripData = tripSnapshot.data();
          const eventDataId = tripData?.eventId;

          if (eventDataId) {
            const eventDataRef = doc(db, 'event', eventDataId);
            const eventSnapshot = await getDoc(eventDataRef);

            if (eventSnapshot.exists()) {
              const eventData = eventSnapshot.data();
              const selectedRouteRef = eventData?.route;
              const routeSnapshot = await getDoc(selectedRouteRef);
              const routeData = routeSnapshot.data() as RouteData;

              if (routeData) {
                setSelectedRoute(routeData);
                setBikeBusGroupId(routeData.BikeBusGroupId.id);
                setPath(routeData.pathCoordinates);
                setBikeBusStops(routeData.BikeBusStops);
                setStartGeo(routeData.startPoint);
                setEndGeo(routeData.endPoint);
              }
            }
          }
        }

        // also get the avatar of the leader and use the avatar element to display it
        const leaderUser = await fetchUser(selectedRoute?.routeLeader || '');
        if (leaderUser) {
          const leaderAvatar = await fetchUser(leaderUser.username);
          if (leaderAvatar) {
            setLeaderAvatarUrl(leaderAvatar.username);
          }
        }



      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    if (selectedRoute) {
      // Extract only the UID from the path
      const extractedUID = selectedRoute.routeLeader.split('/').pop() || '';
      setLeaderUID(extractedUID);
    }

    // get the user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLocation);
        },
        (error) => {
          console.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }


    if (leaderUID) {
      const rtdb = getDatabase();
      const leaderLocationRef = ref(rtdb, 'userLocations/' + leaderUID);
      onValue(leaderLocationRef, (snapshot) => {
        const leaderLocationData = snapshot.val();
        if (leaderLocationData) {
          setLeaderLocation({ lat: leaderLocationData.lat, lng: leaderLocationData.lng });
        }
        if (leaderLocationData && selectedRoute) {
          setMapCenter({
            lat: leaderLocation.lat,
            lng: leaderLocation.lng,
          });
        }
      });
    }

    fetchData();
  }, [user, tripDataId, selectedRoute, leaderUID, leaderLocation.lat, leaderLocation.lng]);

  // Date and time formatting options

  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const startTime = eventData?.startTimestamp ? new Date(eventData?.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
  const endTime = eventData?.endTime ? new Date(eventData?.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';



  // Check to see if the event is active which means the event occurs within 15 minutes of the eventData?.startTimestamp
  const isEventOpenActive = eventData?.startTimestamp && eventData?.startTimestamp.toDate() < new Date(Date.now() + 15 * 60000);


  const label = user?.username ? user.username : "anonymous";

  // Check to see if the user is the setLeaderUID
  const isEventLeader = user?.uid === leaderUID;

  const checkIn = async () => {
    // check in the user by setting the user status to "checkedin" in the firestore database "event" collection

    // and then navigate back to the Trip page

  };

  const endTripAndCheckInAll = async () => {
    // end the trip by setting the trip status to "ended" in the firestore database "trips" collection
    // and then check in all the users in the trip by setting their status to "checkedin" in the firestore database "event" collection
    // and then navigate to the Trip Summary page

  };


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
              {isLoaded && selectedRoute && (
                <>
                  <GoogleMap
                    mapContainerStyle={containerMapStyle}
                    center={leaderLocation}
                    zoom={15}
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
                    <Marker
                      position={{ lat: startGeo.lat, lng: startGeo.lng }}
                      title="Start"
                      onClick={() => setSelectedMarker(selectedMarker)}
                    />
                    <Marker
                      position={{ lat: endGeo.lat, lng: endGeo.lng }}
                      title="End"
                    />
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
                    {user && <AvatarMapMarker uid={leaderUID} position={leaderLocation} />}
                    {user && <AvatarMapMarker uid={user.uid} position={userLocation} />}
                  </GoogleMap>
                  {isEventLeader && (
                    <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                      <IonButton onClick={endTripAndCheckInAll}>End Trip</IonButton>
                    </div>
                  )}
                  {!isEventLeader && (
                    <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                      <IonButton onClick={checkIn}>Check In</IonButton>
                    </div>
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
