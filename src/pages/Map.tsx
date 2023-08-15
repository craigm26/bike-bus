import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonLabel,
  IonRow,
  IonGrid,
  IonCol,
  IonAvatar,
  IonSegment,
  IonSegmentButton,
  IonItem,
  IonList,
  IonText,
  IonCardTitle,
  IonToggle,
} from "@ionic/react";
import { useEffect, useCallback, useState, useRef, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { get, getDatabase, onValue, ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { arrayUnion, getDoc, query, doc, getDocs, updateDoc, where, setDoc, DocumentReference } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import { bicycleOutline, busOutline, businessOutline, carOutline, clipboardOutline, locateOutline, mapOutline, peopleOutline, personCircleOutline, walkOutline } from "ionicons/icons";
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader, StandaloneSearchBox } from "@react-google-maps/api";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";
import { HeaderContext } from "../components/HeaderContext";
import React from "react";
import Avatar from "../components/Avatar";
import { useAvatar } from "../components/useAvatar";
import { addDoc, collection } from 'firebase/firestore';
import {
  DocumentData,
  doc as firestoreDoc,
} from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

interface RouteData {
  eventCheckInLeader: any;
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

interface FetchedUserData {
  username: string;
  enabledAccountModes: string[];
  uid: string;
  accountType?: string;
}


interface BikeBusEvent {
  status: string;
  id: string;
  startTime: {
    seconds: number;
    nanoseconds: number;
  };
  startTimestamp: {
    seconds: number;
    nanoseconds: number;
  };
}

interface Coordinate {
  lat: number;
  lng: number;
}

const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isActiveEvent, setIsActiveEvent] = useState(false);
  const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const headerContext = useContext(HeaderContext);
  const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
  const [showGetDirectionsButton, setShowGetDirectionsButton] = useState(false);
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const [mapZoom, setMapZoom] = useState(15);
  const storage = getStorage();
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const { avatarUrl } = useAvatar(user?.uid);
  const [travelMode, setTravelMode] = useState<string>('');
  const [travelModeSelector, setTravelModeSelector] = useState<string>('BICYCLING');
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [routeDescription, setRouteDescription] = useState<string>('');
  const [routeStartLocation, setRouteStartLocation] = useState<string>('');
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeStartStreetName, setRouteStartStreetName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeEndStreetName, setRouteEndStreetName] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
  const [routeType, setRouteType] = useState("SCHOOL");
  const [pathCoordinates, setPathCoordinates] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [startPointAdress, setStartPointAdress] = useState<string>('');
  const [selectedEndLocationAddress, setSelectedEndLocationAddress] = useState<string>('');
  const [selectedStartLocationAddress, setSelectedStartLocationAddress] = useState<string>('');
  const [endPointAdress, setEndPointAdress] = useState<string>('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userLocationAddress, setUserLocationAddress] = useState("Loading...");
  const [route, setRoute] = useState<DocumentData | null>(null);

  type Point = {
    lat: number;
    lng: number;
  };
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [currentLocation, setCurrentLocation] = useState({ lat: null, lng: null });
  const [currentLocationRow, setCurrentLocationRow] = useState(true);
  const [destinationRow, setDestinationRow] = useState(false);
  const [directionsRow, setDirectionsRow] = useState(false);
  const [detailedDirectionsRow, setDetailedDirectionsRow] = useState(false);
  const [travelModeRow, setTravelModeRow] = useState(false);
  const [createRouteRow, setCreateRouteRow] = useState(false);
  const [directionsFetched, setDirectionsFetched] = useState(false);
  const [showCreateRouteModal, setCreateRouteShowModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [isBikeBus, setIsBikeBus] = useState(false);
  const polylinesRef = useRef([]); const [bikeBusEnabled, setBikeBusEnabled] = useState(true);
  const [routesEnabled, setRoutesEnabled] = useState(false);
  const [organizationsEnabled, setOrganizationsEnabled] = useState(false);
  const [openTripsEnabled, setOpenTripsEnabled] = useState(true);
  const [eventsEnabled, setEventsEnabled] = useState(false);
  const [bikeBusRoutes, setBikeBusRoutes] = useState<any[]>([]);
  const [openTrips, setOpenTrips] = useState<any[]>([]);
  const [openTripMarkers, setOpenTripMarkers] = useState<any[]>([]);
  const [openTripLeaderLocationMarker, setOpenTripLeaderLocationMarker] = useState<any[]>([]);
  const [endOpenTripButton, setEndOpenTripButton] = useState(false);
  const [showEndOpenTripButton, setShowEndOpenTripButton] = useState(false);
  const [openTripId, setOpenTripId] = useState('');
  const [openTripEventId, setOpenTripEventId] = useState('');
  const [tripActive, setTripActive] = useState(false);
  const [openTripRouteId, setOpenTripRouteId] = useState('');
  const [openTripLeaderLocation, setOpenTripLeaderLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [openTripLeaderAvatarUrl, setOpenTripLeaderAvatarUrl] = useState('');
  const [pathCoordinatesTrip, setPathCoordinatesTrip] = useState<{ latitude: number; longitude: number; }[]>([]);
  const [isStartLocationSelected, setIsStartLocationSelected] = useState(false);
  const [isEndLocationSelected, setIsEndLocationSelected] = useState(false);
  const [openTripLeaderUsername, setOpenTripLeaderUsername] = useState('');
  const [joinTripId, setJoinTripId] = useState('');
  const [focusTripId, setFocusTripId] = useState('');
  const [map, setMap] = useState(null);
  // use the default value of startGeo to set the initial map center location
  const [leaderLocation, setLeaderLocation] = useState<Coordinate>({ lat: startGeo.lat, lng: startGeo.lng });
  // the leaderUID is the user.uid of the leader which is stored in the selectedRoute.routeLeader
  const [leaderUID, setLeaderUID] = useState<string>('');
  const [bikeBusEvents, setBikeBusEvents] = useState<BikeBusEvent[]>([]);
  const isEventLeader = user?.uid === leaderUID;
  const [isBikeBusEventLeader, setIsBikeBusEventLeader] = useState(false);
  const [isEventLeaderActive, setIsEventLeaderActive] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [bikeBusGroupId, setBikeBusGroupId] = useState<string>('');
  const [bikeBusStops, setBikeBusStops] = useState<Coordinate[]>([]);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string>('');
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
  const transitLayerRef = useRef(null);
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);




  interface Trip {
    id: string;
    routeName?: string;
    tripLeader?: string;
  }

  interface InfoWindowOpenTrip {
    isOpen: boolean;
    content: string;
    position: { lat: number; lng: number; } | null;
    trip: Trip | null;
  }

  // if (!id) {

  // uploadString is the string that will be uploaded to the database

  const [infoWindowOpenTrip, setInfoWindowOpenTrip] = useState<InfoWindowOpenTrip>({
    isOpen: false,
    content: '',
    position: null,
    trip: null,
  });

  const [infoWindow, setInfoWindow] = useState<{ isOpen: boolean, content: string, position: { lat: number, lng: number } | null }>
    ({ isOpen: false, content: '', position: null });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const userLocationDefault = {
    lat: 41.8781,
    lng: -87.6298, // Coordinates for Chicago
  };

  const renderMap = (location: React.SetStateAction<{ lat: number; lng: number; }>) => {
    setGetLocationClicked(true);
    setShowMap(true);
    setMapCenter(location);
    watchLocation();
    onPlaceChangedStart();
    setCurrentLocationRow(false);
    setDestinationRow(true);
    setDirectionsRow(false);
    setCreateRouteRow(false);
    setDetailedDirectionsRow(false);
    setTravelModeRow(false);
    getBikeBusEvents();
  };


  const requestLocationPermission = () => {
    const permission = window.confirm("We need your location to provide directions, routes, Open Trips and BikeBus locations. Allow?");
    if (permission) {
      getLocation();
    } else {
      console.log("User denied location permission.");
      setUserLocation(userLocationDefault);
      renderMap(userLocationDefault);
    }
  };


  const getLocation = () => {

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLocation);
          renderMap(userLocation);
        },
        (error) => {
          alert("An error occurred while fetching your location. Please enable location services in your browser settings.");
          console.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      // return the user to the home page "/"
      history.push("/");
    }
  }

  // You can call this function when the "start map" button is clicked
  const handleStartMap = () => {
    requestLocationPermission();
    // Other logic
  };


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

  useEffect(() => {

    const fetchData = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData) {
            // get the uid of the user
            const uid = user.uid;
          }
        }

        if (id) {

          const tripsRef = doc(db, 'event', id);
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
                if (selectedRouteRef) {
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
                } else {
                  console.error('selectedRouteRef is undefined');
                }
              }
            }
            // also get the avatar of the leader and use the avatar element to display it
            const leaderUser = await fetchUser(selectedRoute?.eventCheckInLeader || '');
            if (leaderUser) {
              const leaderAvatar = await fetchUser(leaderUser.username);
              if (leaderAvatar) {
                setLeaderAvatarUrl(leaderAvatar.username);
              }
            }
          }


          if (selectedRoute) {
            // Extract only the UID from the path
            const extractedUID = selectedRoute.eventCheckInLeader ? selectedRoute.eventCheckInLeader.id : '';
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
                // update the event document with the leader location
              }

              if (leaderLocationData && selectedRoute) {
                setMapCenter({
                  lat: leaderLocation.lat,
                  lng: leaderLocation.lng,
                });
              }
            });
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }
    , [user, id, selectedRoute, leaderUID, leaderLocation.lat, leaderLocation.lng]);

  const endTripAndCheckOutAll = async () => {
    const tripDataIdDoc = doc(db, 'event', id);
    console.log('tripDataIdDoc', tripDataIdDoc)
    // get the serverTimeStamp() and set it as TripEndTimeStamp
    const serverTimestamp = () => {
      return new Date();
    };
    await setDoc(tripDataIdDoc, { status: 'ended', tripStatus: 'ended', tripEndTripEndTimeStamp: serverTimestamp() }, { merge: true });
    const tripSnapshot = await getDoc(tripDataIdDoc);
    console.log('tripSnapshot', tripSnapshot)
    const tripData = tripSnapshot.data();
    console.log('tripData', tripData)
    const eventDataId = tripData?.eventId;
    console.log('eventDataId', eventDataId)

    const eventDataIdDoc = doc(db, 'event', eventDataId);
    console.log('eventDataIdDoc', eventDataIdDoc)
    await setDoc(eventDataIdDoc, { status: 'ended' }, { merge: true });
    const eventSnapshot = await getDoc(eventDataIdDoc);
    console.log('eventSnapshot', eventSnapshot)
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    console.log('tripDataIdDoc', tripDataIdDoc)

    // and then check out all the users (by role) in the trip by setting their timestamp to serverTimestamp
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    console.log('tripDataIdDoc', tripDataIdDoc)
    // find any other of user's ids in the event add them to the appropriate role arrays
    // if the user is a parent in the eventData field parents, add them to the parents array
    if (tripData?.parents) {
      await setDoc(tripDataIdDoc, {
        tripEndTripParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids) {
      await setDoc(tripDataIdDoc, {
        tripEndTripKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members) {
      await setDoc(tripDataIdDoc, {
        tripEndTripMembers: arrayUnion(username),
      }, { merge: true });
    }
    console.log('tripDataIdDoc', tripDataIdDoc)
    console.log('tripData?.tripEndTripMembers', tripData?.tripEndTripMembers)
    console.log('tripData?.members', tripData?.members)
    console.log('username', username)
    console.log('tripEndTripEndTimeStamp', tripData?.tripEndTripEndTimeStamp)
    const eventSummaryUrl = `/eventsummary/${eventDataId}`;
    history.push(eventSummaryUrl);

  };

  const endTripAndCheckOut = async () => {
    const tripDataIdDoc = doc(db, 'event', id);

    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();
    const eventDataId = tripData?.eventId;


    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });

    if (tripData?.tripCheckInParents.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripMembers: arrayUnion(username),
      }, { merge: true });
      console.log('members', tripData?.members)
      console.log('username', username)
      console.log('tripEndTripMembers', tripData?.tripEndTripMembers)
    }

    const eventSummaryUrl = `/eventsummary/${eventDataId}`;
    history.push(eventSummaryUrl);

  };

  const endBikeBusAndCheckOutAll = async () => {
    const tripDataIdDoc = doc(db, 'event', id);
    console.log('tripDataIdDoc', tripDataIdDoc)
    // get the serverTimeStamp() and set it as TripEndTimeStamp
    const serverTimestamp = () => {
      return new Date();
    };
    await setDoc(tripDataIdDoc, { status: 'ended', tripStatus: 'ended', tripEndTripEndTimeStamp: serverTimestamp() }, { merge: true });
    const tripSnapshot = await getDoc(tripDataIdDoc);
    console.log('tripSnapshot', tripSnapshot)
    const tripData = tripSnapshot.data();
    console.log('tripData', tripData)
    const eventDataId = tripData?.eventId;
    console.log('eventDataId', eventDataId)

    const eventDataIdDoc = doc(db, 'event', eventDataId);
    console.log('eventDataIdDoc', eventDataIdDoc)
    await setDoc(eventDataIdDoc, { status: 'ended' }, { merge: true });
    const eventSnapshot = await getDoc(eventDataIdDoc);
    console.log('eventSnapshot', eventSnapshot)
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    console.log('tripDataIdDoc', tripDataIdDoc)

    // and then check out all the users (by role) in the trip by setting their timestamp to serverTimestamp
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    console.log('tripDataIdDoc', tripDataIdDoc)
    // find any other of user's ids in the event add them to the appropriate role arrays
    // if the user is a parent in the eventData field parents, add them to the parents array
    if (tripData?.parents) {
      await setDoc(tripDataIdDoc, {
        tripEndTripParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids) {
      await setDoc(tripDataIdDoc, {
        tripEndTripKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members) {
      await setDoc(tripDataIdDoc, {
        tripEndTripMembers: arrayUnion(username),
      }, { merge: true });
    }
    console.log('tripDataIdDoc', tripDataIdDoc)
    console.log('tripData?.tripEndTripMembers', tripData?.tripEndTripMembers)
    console.log('tripData?.members', tripData?.members)
    console.log('username', username)
    console.log('tripEndTripEndTimeStamp', tripData?.tripEndTripEndTimeStamp)
    const eventSummaryUrl = `/eventsummary/${eventDataId}`;
    history.push(eventSummaryUrl);

  };

  const endBikeBusAndCheckOut = async () => {
    const tripDataIdDoc = doc(db, 'event', id);

    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();
    const eventDataId = tripData?.eventId;


    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });

    if (tripData?.tripCheckInParents.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members.includes(username)) {
      await setDoc(tripDataIdDoc, {
        tripEndTripMembers: arrayUnion(username),
      }, { merge: true });
      console.log('members', tripData?.members)
      console.log('username', username)
      console.log('tripEndTripMembers', tripData?.tripEndTripMembers)
    }

    const eventSummaryUrl = `/eventsummary/${eventDataId}`;
    history.push(eventSummaryUrl);

  };



  // need to build a boolean to help us determine if the bikebusgroup event is active or not

  const [isActiveBikeBusEvent, setIsActiveBikeBusEvent] = useState(false);

  // make the const a conditional render based on the isActiveBikeBusEvent boolean
  const getBikeBusEvents = async () => {
    const eventsRef = collection(db, "event");
    const q = query(eventsRef, where("eventType", "==", "BikeBus"), where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    const events: BikeBusEvent[] = [];
    const currentTime = new Date().getTime(); // Get the current time in milliseconds
    querySnapshot.forEach((doc) => {
      const eventData = { id: doc.id, ...doc.data() } as BikeBusEvent; // cast the object as BikeBusEvent
      const eventStartTime = eventData.startTimestamp.seconds * 1000;
      if (eventStartTime > currentTime) {
        events.push(eventData);
      }
    });
    // check each event to see if it is active or not
    const activeEvents = events.filter((event) => event.status === "active");
    console.log("activeEvents: ", activeEvents);
    // if there are active events, then set the isActiveBikeBusEvent to true for that particular BikeBusGroup
    if (activeEvents.length > 0) {
      setIsActiveBikeBusEvent(true);
    }
    // if there are no active events, then set the isActiveBikeBusEvent to false for that particular BikeBusGroup
    if (activeEvents.length === 0) {
      setIsActiveBikeBusEvent(false);
    }
  };


  const watchLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLocation);
          setMapCenter(userLocation);
          // Get user location address
          const geocoder = new google.maps.Geocoder();
          const latlng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK") {
              if (results && results[0]) {
                const userLocationAddress = `${results[0].formatted_address}`;
                setUserLocationAddress(userLocationAddress);
                const selectedStartLocation = { lat: userLocation.lat, lng: userLocation.lng };
                setSelectedStartLocation(selectedStartLocation);
                setRouteStartFormattedAddress(`${results[0].formatted_address}` ?? '');
              } else {
                window.alert("No results found");
              }
            } else {
              window.alert("Geocoder failed due to: " + status);
            }
          });
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );

      navigator.geolocation.watchPosition(
        (position) => {
          const newMapCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newMapCenter);
          if (user) {
            const positionRef = ref(rtdb, `userLocations/${user.uid}`);
            set(positionRef, newMapCenter);
          }
        },
        (error) => console.log(error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
  }, [user]);

  useEffect(() => {
    if (user && getLocationClicked) {
      watchLocation();
    }
  }, [user, getLocationClicked, watchLocation]);

  useEffect(() => {
    if (user) {
      const userRef = firestoreDoc(db, "users", user.uid);
      const routesRef = collection(db, "routes");
      const queryObj = query(
        routesRef,
        where("isBikeBus", "==", true),

      );
      getDocs(queryObj)
        .then((querySnapshot) => {
          const routes: any[] = [];
          querySnapshot.forEach((doc) => {
            const routeData = doc.data();
            routes.push(routeData);
          });
          setBikeBusRoutes(routes);
        })
        .catch((error) => {
          console.log("Error fetching bike/bus routes:", error);
        });

      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData) {
            if (userData.enabledAccountModes) {
              setEnabledAccountModes(userData.enabledAccountModes);
            } else {
              setEnabledAccountModes(DEFAULT_ACCOUNT_MODES);
              updateDoc(userRef, { enabledAccountModes: DEFAULT_ACCOUNT_MODES });
            }
            if (userData.username) {
              setUsername(userData.username);
            }
            if (userData.accountType) {
              setAccountType(userData.accountType);
            }
          }
        }
      });
      const queryObj2 = query(collection(db, 'event'), where('eventType', '==', 'openTrip'), where('status', '==', 'active'));
      getDocs(queryObj2)
        .then((querySnapshot) => {
          const event: any[] = [];
          querySnapshot.forEach((doc) => {
            const eventData = { id: doc.id, ...doc.data() };  // include the document ID
            event.push(eventData);
          });
          setOpenTrips(event);
          // set the isActiveEvent to true if the user is the leader of an open trip and the status is active
          const openTripLeaderCheck = event.find((trip) => trip.tripLeader === user.uid);
          if (openTripLeaderCheck && openTripLeaderCheck.tripLeader === user.uid) {
            // set the value of the openTripId to the id of the open trip
            setOpenTripId(openTripLeaderCheck.id);
            console.log("openTripId: ", openTripLeaderCheck.id);
            setShowEndOpenTripButton(true);
            setIsActiveEvent(true);
            setTripActive(true);
            setOpenTripEventId(openTripLeaderCheck.eventId);
          }
        })
        .catch((error) => {
          console.log("Error fetching open trips:", error);
        }
        )
        .catch((error) => {
          console.log("Error fetching open trips:", error);
        }
        );

    }
  }, [user]);


  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (tripActive && user && openTripId && openTripEventId) {  // Check openTripId and openTripEventId are not undefined
      const uid = user.uid;
      const userLocationRef = ref(rtdb, `userLocations/${uid}`);

      console.log(`openTripId: ${openTripId}, openTripEventId: ${openTripEventId}`);  // Log the IDs

      timer = setInterval(() => {
        get(userLocationRef).then((snapshot) => {
          const userLocation = snapshot.val();

          if (userLocation) {  // Check userLocation is not undefined
            const tripRef = doc(db, "trips", openTripId);
            updateDoc(tripRef, {
              userLocation: userLocation,
            });
            // what we want to do is to add the lat lng values of the userLocation to the pathCoordinates array to create a path that shows the user's location over time
            const pathCoordinatesRef = doc(db, "trips", openTripId);
            updateDoc(pathCoordinatesRef, {
              pathCoordinatesTrip: arrayUnion(userLocation),
            });


            const eventDocRef = doc(db, "event", openTripEventId);
            updateDoc(eventDocRef, {
              userLocation: userLocation,
            });
            // do the same pathCoordinates update for the event
            const eventPathCoordinatesRef = doc(db, "event", openTripEventId);
            updateDoc(eventPathCoordinatesRef, {
              pathCoordinatesTrip: arrayUnion(userLocation),
            });
          }
        });
      }, 5000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [tripActive, user, openTripId, openTripEventId]);


  useEffect(() => {
    if (user) {
      const uid = user.uid;
      const openTripLeaderLocationRef = ref(rtdb, `userLocations/${uid}`);

      // Set up a real-time subscription
      const unsubscribe = onValue(openTripLeaderLocationRef, (snapshot) => {
        const newLocation = snapshot.val();
        if (newLocation) {
          setOpenTripLeaderLocation(newLocation);
        }
      });

      // Clean up the subscription when the component unmounts
      return () => {
        unsubscribe();
      };
    }
  }, [user]);


  //update map center when user location changes or selected location changes. When both have changed, set map center to show both locations on the map. Also set the zoom to fit both markers.
  useEffect(() => {
    if (selectedStartLocation && selectedEndLocation) {
      setMapCenter({
        lat: (selectedEndLocation.lat),
        lng: (selectedEndLocation.lng),
      });
      setMapZoom(10);
    } else if (selectedStartLocation) {
      setMapCenter(selectedStartLocation);
    } else if (selectedEndLocation) {
      setMapCenter(selectedEndLocation);
    }
  }, [selectedStartLocation, selectedEndLocation]);

  useEffect(() => {
    if (openTripsEnabled) {
      const getOpenTrips = async () => {
        const tripsRef = query(
          collection(db, "event"),
          where('eventType', '==', 'openTrip'),
          where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(tripsRef);

        const trips: any[] = [];
        querySnapshot.forEach((doc) => {
          const tripData = { id: doc.id, ...doc.data() };  // include the document ID
          trips.push(tripData);
        });

        setOpenTrips(trips);

        if (user) {
          const uid = user.uid;
          const openTripLeaderLocationRef = ref(rtdb, `userLocations/${uid}`);
          const snapshot = await get(openTripLeaderLocationRef);
          const openTripLeaderLocation = snapshot.exists() ? snapshot.val() : null;

          const openTripMarkers = openTrips.map((trip) => {
            const startIcon = {
              url: "/assets/markers/MarkerS.svg",
              scaledSize: new google.maps.Size(26, 26),
            };

            const endIcon = {
              url: "/assets/markers/MarkerE.svg",
              scaledSize: new google.maps.Size(26, 26),
            };

            const userIcon = {
              url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><circle cx='256' cy='256' r='200' fill='%230000ff' /><path d='M388 288a76 76 0 1076 76 76.24 76.24 0 00-76-76zM124 288a76 76 0 1076 76 76.24 76.24 0 00-76-76z' fill='none' stroke='%23ffffff' stroke-miterlimit='10' stroke-width='32'/><path fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='32' d='M256 360v-86l-64-42 80-88 40 72h56'/><path d='M320 136a31.89 31.89 0 0032-32.1A31.55 31.55 0 00320.2 72a32 32 0 10-.2 64z' fill='%23ffffff'/></svg>",
              scaledSize: new google.maps.Size(26, 26),
            };


            // this should be the avatarElement of the trip leader
            const userIconLeader = {
              url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' class='ionicon' viewBox='0 0 512 512'><circle cx='256' cy='256' r='200' fill='%2380ff00' /><path d='M388 288a76 76 0 1076 76 76.24 76.24 0 00-76-76zM124 288a76 76 0 1076 76 76.24 76.24 0 00-76-76z' fill='none' stroke='%23ffffff' stroke-miterlimit='10' stroke-width='32'/><path fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='32' d='M256 360v-86l-64-42 80-88 40 72h56'/><path d='M320 136a31.89 31.89 0 0032-32.1A31.55 31.55 0 00320.2 72a32 32 0 10-.2 64z' fill='%23ffffff'/></svg>",
              scaledSize: new google.maps.Size(26, 26),
            };


            const openTripMarker = new google.maps.Marker({
              position: trip.startLocation,
              map: mapRef.current,
              title: "Start Location",
              // use a Ionic Icon for the start icon
              icon: startIcon,
            });

            const openTripMarker2 = new google.maps.Marker({
              position: trip.endLocation,
              map: mapRef.current,
              title: "End Location",
              icon: endIcon,
            });

            const openTripMarker3 = new google.maps.Marker({
              position: trip.userLocation,
              map: mapRef.current,
              title: "Your Location",
              // use the default userLocation icon for the user icon
              icon: userIcon,
            });

            const openTripMarker4 = new google.maps.Marker({
              position: openTripLeaderLocation,
              map: mapRef.current,
              title: "Open Trip Leader Location",
              icon: userIconLeader,
            });

            return [openTripMarker, openTripMarker2, openTripMarker3, openTripMarker4];
          });

          openTripMarkers.forEach((openTripMarker) => {
            openTripMarker.forEach((marker: { setMap: (arg0: google.maps.Map | null) => void; }) => {
              marker.setMap(mapRef.current);
            });
          });
        }
      };

      getOpenTrips();
    }
  }, [openTripsEnabled, user]);


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
      const uid = user.uid;
      const openTripLeaderLocationRef = ref(rtdb, `userLocations/${uid}`);

      // Set up a real-time subscription
      const unsubscribe = onValue(openTripLeaderLocationRef, (snapshot) => {
        const newLocation = snapshot.val();
        if (newLocation) {
          setOpenTripLeaderLocation(newLocation);
        }
      });

      // Clean up the subscription when the component unmounts
      return () => {
        unsubscribe();
      };
    }
  }, [isLoaded, loadError]);



  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);

    const map = mapRef.current;
    if (map) {
      map.addListener("bounds_changed", () => {
        const bounds = map.getBounds();
        if (bounds) {
          console.log("Map bounds:", bounds.toJSON());
          ref.setBounds(bounds);

          const searchBoxBounds = ref.getBounds();
          if (searchBoxBounds) {
            console.log("Search box bounds set to:", searchBoxBounds.toJSON());
          }
        }
      });
    }




  };

  const onPlaceChangedStart = () => {
    console.log("onPlaceChangedStart called");

    if (autocompleteStart !== null) {
      const places = autocompleteStart.getPlaces();
      if (places && places.length > 0) {
        console.log("Places: ", places);
        const place = places[0];
        console.log("Place: ", place);
        if (place.geometry && place.geometry.location) {
          setSelectedStartLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });

          // After setting the new location, update the map bounds
          const map = mapRef.current;
          if (map) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng()));
            map.fitBounds(bounds);

            // Now, set the search box bounds to the map bounds
            const searchBoxBounds = map.getBounds();
            if (searchBoxBounds) {
              autocompleteStart.setBounds(searchBoxBounds);  // Adjusted this line
            }
          }

          // define place.address_components
          const addressComponents = place.address_components;
          // extract street name
          const streetName = addressComponents?.find(component =>
            component.types.includes('route')
          )?.long_name;

          setRouteStartStreetName(streetName ?? '');
          setRouteStartName(`${place.name}` ?? '');
          setRouteStartFormattedAddress(`${place.formatted_address}` ?? '');
        }
      }
    }
  };



  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {
    setAutocompleteStart(ref);

    const map = mapRef.current;
    if (map) {
      map.addListener("bounds_changed", () => {
        const bounds = map.getBounds();
        if (bounds) {
          console.log("Map bounds:", bounds.toJSON());
          ref.setBounds(bounds);

          const searchBoxBounds = ref.getBounds();
          if (searchBoxBounds) {
            console.log("Search box bounds set to:", searchBoxBounds.toJSON());
          }
        }
      });
    }



    ref.addListener("places_changed", onPlaceChangedStart);

    setSelectedStartLocation({ lat: userLocation.lat, lng: userLocation.lng });
  };


  function getSelectedStartLocation() {
    return selectedStartLocation;
  }

  const onPlaceChangedDestination = () => {
    if (autocompleteEnd !== null) {
      const places = autocompleteEnd.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          setSelectedEndLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });

          // define place.address_components
          const addressComponents = place.address_components;
          // extract street name
          const streetName = addressComponents?.find(component =>
            component.types.includes('route')
          )?.long_name;
          // we need to reset the mapCenter to the selected end location and the selected start location to fit on the page
          // first get the lat and lng of the selected start location from setSelectedStartLocation
          // then get the lat and lng of the selected end location from setSelectedEndLocation
          // then set the mapCenter to the midpoint between the two
          // then set the mapZoom to fit both locations on the map
          const selectedStartLocation = getSelectedStartLocation(); // You need to implement this function
          const selectedEndLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          const midpoint = {
            lat: (selectedStartLocation.lat + selectedEndLocation.lat) / 2,
            lng: (selectedStartLocation.lng + selectedEndLocation.lng) / 2,
          };
          setMapCenter(midpoint);


          setRouteEndStreetName(streetName ?? '');
          setRouteEndName(`${place.name}` ?? '');
          setRouteEndFormattedAddress(`${place.formatted_address}` ?? '');
          setShowCreateRouteButton(true);
          setShowGetDirectionsButton(true);

        }
      }
    }
    setIsEndLocationSelected(true);
  };

  interface LatLng {
    latitude: number;
    longitude: number;
  }

  function perpendicularDistance(point: LatLng, linePoint1: LatLng, linePoint2: LatLng): number {
    const { latitude: x, longitude: y } = point;
    const { latitude: x1, longitude: y1 } = linePoint1;
    const { latitude: x2, longitude: y2 } = linePoint2;

    const area = Math.abs(0.5 * (x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y));
    const bottom = Math.hypot(x1 - x2, y1 - y2);
    const height = (2 * area) / bottom;

    return height;
  }

  function ramerDouglasPeucker(pointList: LatLng[], epsilon: number): LatLng[] {
    let dmax = 0;
    let index = 0;
    const end = pointList.length - 1;

    for (let i = 1; i < end; i++) {
      const d = perpendicularDistance(pointList[i], pointList[0], pointList[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const recResults1 = ramerDouglasPeucker(pointList.slice(0, index + 1), epsilon);
      const recResults2 = ramerDouglasPeucker(pointList.slice(index, end + 1), epsilon);

      const resultPoints = [...recResults1, ...recResults2.slice(1)];
      return resultPoints;
    } else {
      return [pointList[0], pointList[end]];
    }
  }

  const getDirections = () => {
    return new Promise(async (resolve, reject) => {
      if (selectedStartLocation && selectedEndLocation) {
        getEndPointAdress();
        getStartPointAdress();
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(mapRef.current);
        directionsService.route(
          {
            origin: selectedStartLocation,
            destination: selectedEndLocation,
            travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
          },
          (response, status) => {
            if (status === "OK" && response) {
              directionsRenderer.setDirections(response);

              const pathPoints: LatLng[] = response.routes[0].overview_path.map((latLng: any) => ({
                latitude: latLng.lat(),
                longitude: latLng.lng(),
              }));
              const epsilon = 0.0001;
              const simplifiedPathPoints = ramerDouglasPeucker(pathPoints, epsilon);
              resolve(simplifiedPathPoints);
              setPathCoordinates(simplifiedPathPoints);
            } else {
              console.error("Directions request failed due to " + status);
              reject(status);
            }
          }
        );

        const service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
          {
            origins: [selectedStartLocation],
            destinations: [selectedEndLocation],
            travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
          },
          (response, status) => {
            if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
              const distance = response?.rows[0]?.elements[0]?.distance?.value;
              const duration = response?.rows[0]?.elements[0]?.duration?.value;
              console.log("Distance Matrix Response: ", response);

              setDistance(
                (Math.round((distance * 0.000621371192) * 100) / 100).toString()
              );

              setDuration(
                (Math.round((duration * 0.0166667) * 100) / 100).toString()
              );

              const arrivalTime = new Date();
              const durationInMinutes = duration / 60;
              arrivalTime.setMinutes(arrivalTime.getMinutes() + durationInMinutes);
              setArrivalTime(arrivalTime.toLocaleTimeString());
            } else {
              console.error("Error calculating distance:", status);
            }
          }
        );
      }
      setDirectionsFetched(true);
    });
  };

  const getStartPointAdress = async () => {
    if (startPoint) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${startPoint.lat},${startPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      setSelectedStartLocationAddress(data.results[0].formatted_address);

      console.log("getStartPointAdress called");
      console.log("selectedStartLocation: ", startPoint);
      console.log("selectedStartLocationAddress: ", data.results[0].formatted_address);
    }
  };


  const getEndPointAdress = async () => {
    if (endPoint) {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${endPoint.lat},${endPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      setSelectedEndLocationAddress(data.results[0].formatted_address);
    }
  };

  const createRoute = () => {
    try {
      getEndPointAdress();
      getStartPointAdress();

      const convertedPathCoordinates = pathCoordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));
      console.log("convertedPathCoordinates: ", convertedPathCoordinates);
      if (selectedStartLocation && selectedEndLocation) {
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(mapRef.current);
        directionsService.route(
          {
            origin: selectedStartLocation,
            destination: selectedEndLocation,
            travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode]
          },
          (response, status) => {
            if (status === "OK") {
              directionsRenderer.setDirections(response);
              const route = response?.routes[0];
              const routeData = {
                distance: route?.legs[0]?.distance?.value,
                duration: route?.legs[0]?.duration?.value,
                arrivalTime: new Date(),
                travelMode: travelModeSelector,
                origin: {
                  lat: route?.legs[0]?.start_location?.lat(),
                  lng: route?.legs[0]?.start_location?.lng()
                },
                destination: {
                  lat: route?.legs[0]?.end_location?.lat(),
                  lng: route?.legs[0]?.end_location?.lng()
                },
                startPointAddress: routeStartFormattedAddress,
                endPointAddress: routeEndFormattedAddress,
                startPoint: selectedStartLocation,
                endPoint: selectedEndLocation,
                routeName: `${routeStartName ? routeStartName + ' on ' : ''}${routeStartStreetName} to ${routeEndName ? routeEndName + ' on ' : ''}${routeEndStreetName}`,
                startPointName: routeStartName,
                startPointStreetName: routeStartStreetName,
                routeEndStreetName: routeEndStreetName,
                endPointName: routeEndName,
                routeDescription: description,
                pathCoordinates: convertedPathCoordinates,
                isBikeBus: false,
              };
              console.log("Route Data: ", routeData);
              console.log("routeName: ", routeStartName + " to " + routeEndName);
              handleCreateRouteSubmit();
            } else {
              console.error("Directions request failed due to " + status);
            }
          }
        );
      }
    } catch (error) {
      console.log("Error: ", error);
      console.log("createRoute called");
      console.log("selectedStartLocation: ", selectedStartLocation);
    }
  };


  const handleCreateRouteSubmit = async (routeType = "") => {
    try {
      getEndPointAdress();
      getStartPointAdress();

      const convertedPathCoordinates = pathCoordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));
      console.log("convertedPathCoordinates: ", convertedPathCoordinates);
      console.log("routeType: ", routeType);

      const routeDocRef = await addDoc(collection(db, 'routes'), {
        routeName: `${routeStartName ? routeStartName + ' on ' : ''}${routeStartStreetName} to ${routeEndName ? routeEndName + ' on ' : ''}${routeEndStreetName}`,
        description: description,
        isBikeBus: false,
        BikeBusGroupId: "",
        startPoint: selectedStartLocation,
        endPoint: selectedEndLocation,
        routeType: routeType,
        duration: duration,
        accountType: accountType,
        travelMode: travelModeSelector,
        routeCreator: "/users/" + user?.uid,
        routeLeader: "/users/" + user?.uid,
        pathCoordinates: convertedPathCoordinates,
        startPointName: routeStartName,
        startPointAddress: routeStartFormattedAddress,
        endPointName: routeEndName,
        endPointAddress: routeEndFormattedAddress,
        distance: distance,
      });
      console.log("routeName: ", routeStartName + " to " + routeEndName);
      console.log("routeDocRef: ", routeDocRef);
      // if this is not part of the open trip feature, then redirect to the view route page
      // if route is not "Open Trip", then redirect to the view route page
      // also set the converterPathCoordinates to the pathCoordinates to be used throughout document
      if (routeType !== "openTrip") {
        history.push(`/viewroute/${routeDocRef.id}`);
      }
      return routeDocRef;
    } catch (error) {
      console.log("Error: ", error);
    }
  };



  const saveDestination = () => {
    if (user) {
      console.log("user is logged in");
      const userRef = doc(db, "users", user.uid);
      updateDoc(userRef, {
        savedDestinations: arrayUnion({
          name: routeEndName,
          address: routeEndFormattedAddress,
        }),
      }).then(() => {
        console.log("Destination successfully saved to your account!");
        // set the showSaveDestinationButton to false so that the user can't save the same destination multiple times
        // setShowSaveDestinationButton(false);
      });

    } else {
      console.log("user is not logged in");
      setShowLoginModal(true);
    }
  };


  // when the bikebus button is clicked, show the bikebus routes on the map
  const handleBikeBusButtonClick = (routeId: string) => {
    const bikeBusGroup = bikeBusRoutes.find((route) => route.id === routeId);
    if (bikeBusGroup) {
      const bikeBusGroupName = bikeBusGroup.BikeBusName;
      const bikeBusGroupId = bikeBusGroup.BikeBusGroupId;
      const bikeBusGroupIdArray = bikeBusGroupId?.split("/");
      const bikeBusGroupIdString = bikeBusGroupIdArray?.[2];
      console.log("bikeBusGroupIdString: ", bikeBusGroupIdString);
      // Show an InfoWindow with the BikeBusGroup name
      const infoWindow = new google.maps.InfoWindow({
        content: `<div>${bikeBusGroupName}
            // link to the page for the corresponding bike/bus group
            <a href="/bikebusgrouppage/${bikeBusGroupIdString}">Go to Bike/Bus Group Page</a>
            </div>`,

      });
      infoWindow.open(mapRef.current, bikeBusGroupId);
      // Redirect to the page for the corresponding bike/bus group
      history.push(`/bikebusgrouppage/${bikeBusGroupIdString}`);
    }
  };

  const handleMarkerClick = (stop: any) => {
    console.log("handleMarkerClick called");
    console.log("stop: ", stop);
    const stopId = stop.id;
    const stopName = stop.name;
    const stopRoutes = stop.routes;
    const stopRoutesArray = stopRoutes?.split(",");
    const stopRoutesString = stopRoutesArray?.join(", ");
    console.log("stopRoutesString: ", stopRoutesString);
    // Show an InfoWindow with the stop name
    const infoWindow = new google.maps.InfoWindow({
      content: `<div>${stopName}
            <br>
            Routes: ${stopRoutesString}
            </div>`,
    });
    infoWindow.open(mapRef.current, stopId);
    // show the routes that stop at this stop and then show the next 3 arrival times for each route
    // get the routes that stop at this stop
    const stopRoutesArray2 = stopRoutes?.split(",");
    console.log("stopRoutesArray2: ", stopRoutesArray2);
    // get the routes that stop at this stop from firebase

  };

  const handleBikeBusRouteClick = async (route: any) => {

    // let's get the events for this bikebus group
    const bikeBusGroupId = route.BikeBusGroupId.id;
    console.log("bikeBusGroupId: ", bikeBusGroupId);
    const bikeBusGroupRef = doc(db, 'bikebusgroups', bikeBusGroupId);

    // get the events for this bikebus group
    const eventsRef = query(
      collection(db, "event"),
      where('BikeBusGroup', '==', bikeBusGroupRef),
    );
    const querySnapshot = getDocs(eventsRef);
    // once we have the docs, let's figure out the next 3 events for this bikebus group in order of start time
    const events: BikeBusEvent[] = [];
    const currentTime = new Date().getTime(); // Get the current time in milliseconds
    (await querySnapshot).forEach((doc) => {
      const eventData = { id: doc.id, ...doc.data() } as BikeBusEvent; // cast the object as BikeBusEvent
      const eventStartTime = eventData.startTimestamp.seconds * 1000;
      if (eventStartTime > currentTime) {
        events.push(eventData);
      }
    });
    // sort the events by start time
    events.sort((a, b) => (a.startTimestamp > b.startTimestamp) ? 1 : -1);
    // get the next 3 events
    const next3Events = events.slice(0, 3);
    // get the next 3 events' start times
    const next3EventsStartTimes = next3Events.map((event) => {
      const eventStartTime = event.startTime;
      return eventStartTime;
    });

    let next3EventsHTML = '<span style="color: black;">No Events Scheduled</span>'; // Default message

    if (next3Events.length > 0) {
      const next3EventsLinks = next3Events.map((event) => {
        const eventId = event.id;

        // Convert the Timestamp to a Date object
        const eventStartDate = new Date(event.startTimestamp.seconds * 1000);

        // Format the date
        const eventStartFormatted = eventStartDate.toLocaleString(); // or use date-fns or similar

        return `<a href="/event/${eventId}" style="color: black;">${eventStartFormatted}</a>`;
      });
      next3EventsHTML = next3EventsLinks.join('<br>');
    }

    // for each of the qualified next3Events, let's create a link to the event page for that event /event/id
    const next3EventsLinks = next3Events.map((event) => {
      const eventId = event.id;

      // Convert the Timestamp to a Date object
      const eventStartDate = new Date(event.startTimestamp.seconds * 1000);

      // Format the date
      const eventStartFormatted = eventStartDate.toLocaleString(); // or use date-fns or similar

      return `<a href="/event/${eventId}">${eventStartFormatted}</a>`;
    });


    // Set content to whatever you want to display inside the InfoWindow
    const content = `  
    <div style="margin-top: 10px;">
    <h4>Upcoming Events:</h4>
    ${next3EventsHTML}
  </div>
    <a href="/bikebusgrouppage/${route.BikeBusGroupId.id}" style="display: inline-block; padding: 10px; background-color: #ffd800; color: black; text-decoration: none;">
    View ${route.BikeBusName}
  </a>`
      ;

    // Set position to the startPoint of the route (or any other point you prefer)
    const position = route.startPoint;

    setInfoWindow({ isOpen: true, content, position });
  };

  const handleOpenTripRouteClick = (trip: any) => {
    const contentString = `
    <div class="info-window-content">
        <h2 class="trip-endpoint-title">Open Trip to ${trip.endPointName}</h2>
    </div>
    `;

    setJoinTripId(trip.id);
    setFocusTripId(trip.id);

    setInfoWindowOpenTrip({
      isOpen: true,
      position: trip.userLocation,
      trip: trip,
      content: contentString,
    });
  };

  const handleJoinClick = async (trip: { id: string; }) => {
    // Get the current user's ID
    if (user) {
      const userId = user.uid;

      // Add the user to the trip's list of participants in Firestore
      const tripRef = doc(db, 'trips', trip.id);
      await updateDoc(tripRef, {
        tripParticipants: arrayUnion('/users/' + userId),
      });
    }

    // Add any additional actions here, such as displaying a success message
    // close this info window
    handleCloseOpenTripClick();
  };

  // create a function to handle the click "Focus on Leader" - this will center the map on the leader's location
  const handleFocus = (position: any) => {
    setMapCenter(position);
    setMapZoom(15);
    handleCloseOpenTripClick();
  };



  const handleCloseOpenTripClick = () => {
    setInfoWindowOpenTrip({ isOpen: false, content: '', position: null, trip: null });
  };

  const handleCloseClick = () => {
    setInfoWindow({ isOpen: false, content: '', position: null });
  };


  // how do we do the uploadString function for the avatarElement?
  // we need to create a new document in the firestore storage document collection "avatars" sub folder "Open Trip Leaders"

  const createTripDocument = async (user: any, selectedStartLocation: any, selectedEndLocation: any, pathCoordinates: any) => {

    // get the convertedPathCoordinates
    const convertedPathCoordinates = pathCoordinates.map((coord: { latitude: any; longitude: any; }) => ({
      lat: coord.latitude,
      lng: coord.longitude,
    }));


    if (user) {
      const eventTripRef = collection(db, "event");
      const docRefPromise = await addDoc(eventTripRef, {
        eventName: "Open Trip to " + routeEndName,
        eventType: "openTrip",
        status: "active",
        userLocation: openTripLeaderLocation,
        startLocation: selectedStartLocation,
        endLocation: endPointAdress,
        startPoint: selectedStartLocation,
        startPointName: routeStartName,
        startPointAddress: routeStartFormattedAddress,
        endPoint: selectedEndLocation,
        endPointName: routeEndName,
        endPointAddress: routeEndFormattedAddress,
        route: null,
        start: new Date(),
        startTime: new Date(),
        startTimestamp: new Date(),
        endTime: null,
        tripLeader: user.uid,
        tripParticipants: [user.uid],
        pathCoordinates: convertedPathCoordinates,
        pathCoordinatesTrip: [''],
      })
        .then((docRefPromise) => {
          console.log("Trip Document written with ID: ", docRefPromise.id);
          // set docRef.id to a new const so that we can use it throughout the rest of the code
          const openTripId = docRefPromise.id;
          setOpenTripId(openTripId);
          console.log("openTripId: ", openTripId);
          // let's get the new document id and set it to the user's trips array of firestore reference documents in the firestore document collection "users"
          const userRef = doc(db, "users", user.uid);
          updateDoc(userRef, {
            trips: arrayUnion(docRefPromise),
          });
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });
      return docRefPromise;
    }
  };

  const createRouteDocument = async (user: any, selectedStartLocation: any, selectedEndLocation: any, pathCoordinates: any) => {
    if (user) {
      // get the convertedPathCoordinates
      const convertedPathCoordinates = pathCoordinates.map((coord: { latitude: any; longitude: any; }) => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));
      console.log("routeType: ", routeType);
      const routesRef = collection(db, "routes");
      const docRouteRef = await addDoc(routesRef, {
        routeName: "Open Trip to " + routeEndName,
        description: "Open Trip",
        startPoint: selectedStartLocation,
        startPointName: routeStartName,
        startPointAdress: routeStartFormattedAddress,
        endPointName: routeEndName,
        endPointAdress: routeEndFormattedAddress,
        endPoint: selectedEndLocation,
        distance: distance,
        duration: duration,
        isBikeBus: false,
        BikeBusGroupId: "",
        routeType: "openTrip",
        // set a tripId field to the openTripId
        tripId: openTripId,
        eventId: openTripEventId,
        userId: user.uid,
        travelMode: "BICYCLING",
        routeCreator: "/users/" + user.uid,
        routeLeader: "/users/" + user.uid,
        // get the actual path coordinates that the getDirections function returns
        pathCoordinates: convertedPathCoordinates,
        pathCoordinatesTrip: [''],
      })
        .then((docRouteRef) => {
          console.log("Document written with ID: ", docRouteRef.id);
          // set the docRef.id to a new const so that we can use it throughout the rest of the code
          const openTripRouteId = docRouteRef.id;
          setOpenTripRouteId(openTripRouteId);
          console.log("openTripRouteId: ", openTripRouteId);
          console.log("docRouteRef: ", docRouteRef);
          console.log("openTripId: ", openTripId)
          // now let's update the trip document with the routeId in the route field of the trip document
          const eventDocRef = doc(db, "event", openTripRouteId);
          updateDoc(eventDocRef, {
            route: docRouteRef,
          });
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });
      console.log("docRef: ", docRouteRef)
      return docRouteRef;
    }
  };

  const startOpenTrip = async () => {
    // get the user.uid
    if (user) {
      try {
        const uid = user.uid;

        // Check for active trips
        const activeTripsRef = collection(db, "event");
        const q = query(activeTripsRef, where("tripLeader", "==", `/users/${uid}`), where("status", "==", "active"));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          console.error("An active trip already exists for this user.");
          return;
        }
        setIsActiveEvent(true);

        // use the createTripDocument function to create a new trip document in the trip document collection "trips"
        const docTripRef = await createTripDocument(user, selectedStartLocation, selectedEndLocation, pathCoordinates);
        console.log("docTripRef: ", docTripRef);

      } catch (error) {
        console.log("Error: ", error);
      }
      const routesRef = await createRouteDocument(user, selectedStartLocation, selectedEndLocation, pathCoordinates);
      console.log("routesRef: ", routesRef);
      setTripActive(true);
      setShowEndOpenTripButton(true);

    }
  };

  async function endOpenTrip() {
    try {
      console.log(`user: ${user}, openTripId: ${openTripId}`);
      if (user && openTripId) {
        const uid = user.uid;
        const eventDocRef = doc(db, "event", openTripId); // Change this line to use openTripId
        console.log(`Updating document with reference: ${eventDocRef.path}`);

        console.log("openTripLeaderLocation: ", openTripLeaderLocation);
        console.log("openTripId: ", openTripId); // Log openTripId

        if (userLocation) {
          const updateData = {
            status: "inactive",
            endLocation: userLocation,
            endTime: new Date(),
          };
          console.log("Update data: ", updateData);

          const eventUpdateResult = await updateDoc(eventDocRef, updateData); // Update the document in the event collection
          console.log("Event Update Result: ", eventUpdateResult);
        }
      }
      setIsActiveEvent(false);
      setTripActive(false);
      setShowEndOpenTripButton(false);
      console.log("openTripId: ", openTripId)
      // take the user to the eventsummary page - use the event doc id to get the event doc and then pass the event doc to the eventsummary page
      history.push({
        pathname: `/EventSummary/${openTripId}`,
        state: { id: openTripId }
      });
    } catch (error) {
      console.error("Error ending trip:", error);
    }
  }

  function generateSVG(label: string, avatarUrl: string) {
    const encodedUrl = encodeURIComponent(avatarUrl);
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <image href="${encodedUrl}" x="0" y="0" height="100" width="100"/>
        <circle cx="50" cy="50" r="40" fill="#c3ecb2" filter="url(#glow)"/>
        <text x="50%" y="55%" alignment-baseline="middle" text-anchor="middle" fill="white" font-size="14px" font-family="Arial, sans-serif">${label}</text>
      </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  }

  function generateSVGBikeBus(label: string) {
    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill="#ffd800" filter="url(#glow)"/>
      <text x="50%" y="55%" alignment-baseline="middle" text-anchor="middle" fill="white" font-size="14px" font-family="Arial, sans-serif">${label}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }

  const handleBicyclingLayerToggle = (enabled: boolean) => {
    if (bicyclingLayerRef.current && mapRef.current) {
      if (enabled) {
        bicyclingLayerRef.current.setMap(mapRef.current); // Show the layer
      } else {
        bicyclingLayerRef.current.setMap(null); // Hide the layer
      }
    }
  };


  // once we have the events, we need to mark the polylines on the map with


  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  // }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
        {!showMap && !id && (
          <>
            <IonGrid className="location-app-intro-container">
              <IonRow>
                <IonCol>
                  <IonList lines="full">
                    <IonItem>
                      <IonLabel>
                        <IonCardTitle className="BikeBusFont">Welcome to BikeBus!</IonCardTitle>
                        <IonText>BikeBus is a group of people who want to bike together</IonText>
                      </IonLabel>
                    </IonItem>
                    <IonItem>
                      <IonLabel>
                        <IonText>Find, Create, and Join:</IonText>
                        <IonList>
                          <IonItem>
                            <IonIcon icon={clipboardOutline} slot="start" />
                            <IonLabel>Community Bulletin Boards</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={mapOutline} slot="start" />
                            <IonLabel>Routes</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={bicycleOutline} slot="start" />
                            <IonLabel>Open Trips</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={peopleOutline} slot="start" />
                            <IonLabel>BikeBus Groups</IonLabel>
                          </IonItem>
                          <IonItem>
                            <IonIcon icon={businessOutline} slot="start" />
                            <IonLabel>Organizations Near You</IonLabel>
                          </IonItem>
                        </IonList>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                  <IonLabel>
                    <IonItem button color="primary" onClick={handleStartMap} lines="none">
                      <IonText color="secondary">Start Map</IonText>
                    </IonItem>
                    or Visit
                    <IonItem button color="primary" routerLink="/Help" lines="none">
                      <IonText color="secondary">Help</IonText>
                    </IonItem>
                  </IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>

          </>
        )
        }
        {showMap && (
          <IonRow className="map-base">
            <GoogleMap
              onLoad={(map) => {
                mapRef.current = map;
                bicyclingLayerRef.current = new google.maps.BicyclingLayer();
              }}
              mapContainerStyle={{
                width: "100%",
                height: "100%",
              }}
              center={mapCenter}
              zoom={15}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                zoomControlOptions: {
                  position: window.google.maps.ControlPosition.LEFT_CENTER
                },
                mapTypeControl: true,
                mapTypeControlOptions: {
                  position: window.google.maps.ControlPosition.LEFT_CENTER, // Position of map type control
                  mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',],
                },
                disableDoubleClickZoom: true,
                minZoom: 8,
                maxZoom: 18,
                styles: [
                  {
                    "elementType": "geometry",
                    "stylers": [
                      {
                        "color": "#e5e5e5"
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
                      }
                    ]
                  },
                  {
                    "featureType": "poi.park",
                    "elementType": "geometry.fill",
                    "stylers": [
                      {
                        "visibility": "on"
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
                        "color": "#ffd800"
                      },
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
                        "color": "#4a90e2"
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
                        "visibility": "on"
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
                        "saturation": -50
                      },
                      {
                        "lightness": 50
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
              {!id && (
                <IonGrid className="search-container">
                  <IonRow>
                    <IonCol>
                      <StandaloneSearchBox
                        onLoad={onLoadStartingLocation}
                        onPlacesChanged={onPlaceChangedStart}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ color: 'red', marginRight: '10px', fontSize: '24px' }}>A</div>
                          <input
                            type="text"
                            autoComplete="on"
                            placeholder={userLocationAddress}
                            style={{
                              width: "350px",
                              height: "40px",
                            }}
                          />
                        </div>
                      </StandaloneSearchBox>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>
                      <StandaloneSearchBox
                        onLoad={onLoadDestinationValue}
                        onPlacesChanged={onPlaceChangedDestination}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ color: 'red', marginRight: '10px', fontSize: '24px' }}>B</div>
                          <input
                            type="text"
                            autoComplete="on"
                            placeholder="Enter a Destination"
                            style={{
                              width: "350px",
                              height: "40px",
                            }}
                          />
                        </div>
                      </StandaloneSearchBox>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    {isActiveEvent && (
                      <IonButton onClick={endOpenTrip}>End Open Trip</IonButton>
                    )}
                  </IonRow>
                  {showGetDirectionsButton && !isActiveEvent && !id && (
                    <IonRow>
                      <IonCol>
                        <IonLabel>Travel Mode:</IonLabel>
                        <IonSegment value={travelModeSelector} onIonChange={(e: CustomEvent) => {
                          setTravelMode(e.detail.value);
                          setTravelModeSelector(e.detail.value);
                        }}>
                          <IonSegmentButton value="WALKING">
                            <IonIcon icon={walkOutline} />
                          </IonSegmentButton>
                          <IonSegmentButton value="BICYCLING">
                            <IonIcon icon={bicycleOutline} />
                          </IonSegmentButton>
                          <IonSegmentButton value="DRIVING">
                            <IonIcon icon={carOutline} />
                          </IonSegmentButton>
                          <IonSegmentButton value="TRANSIT">
                            <IonIcon icon={busOutline} />
                          </IonSegmentButton>
                        </IonSegment>
                      </IonCol>
                    </IonRow>
                  )}
                  <IonRow>
                    <IonCol>
                      {showGetDirectionsButton && !isActiveEvent && <IonButton expand="block" onClick={getDirections}>Get Directions</IonButton>}
                    </IonCol>
                    <IonCol>
                      {showGetDirectionsButton && directionsFetched && !isAnonymous && !isActiveEvent && (
                        <IonButton expand="block" onClick={createRoute}>Create Route</IonButton>)
                      }
                    </IonCol>
                    <IonCol>
                      {showGetDirectionsButton && directionsFetched && !isAnonymous && !isActiveEvent && (
                        <IonButton expand="block" onClick={startOpenTrip}>Start Open Trip</IonButton>
                      )}
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>
                      {showGetDirectionsButton && directionsFetched && (
                        <>
                          {showGetDirectionsButton && directionsFetched && !isActiveEvent && (
                            <IonRow>
                              <IonLabel>Distance: {distance} miles </IonLabel>
                            </IonRow>
                          )}
                          {showGetDirectionsButton && directionsFetched && !isActiveEvent && (
                            <IonRow>
                              <IonLabel>Estimated Time of Trip: {duration} minutes</IonLabel>
                            </IonRow>
                          )}
                          {showGetDirectionsButton && directionsFetched && isActiveEvent && (
                            <IonRow>
                              <IonLabel>Estimated Time of Arrival: {arrivalTime}</IonLabel>
                            </IonRow>
                          )}
                        </>
                      )}
                    </IonCol>
                  </IonRow>
                </IonGrid>
              )}
              {!isActiveBikeBusEvent && bikeBusEnabled && bikeBusRoutes.map((route: any) => {
                const keyPrefix = route.id || route.routeName;
                return (
                  <div key={`${keyPrefix}`}>
                    <Polyline
                      key={`${keyPrefix}-border`}
                      path={route.pathCoordinates}
                      options={{
                        strokeColor: "#000000", // Border color
                        strokeOpacity: .7,
                        strokeWeight: 3, // Border thickness
                        clickable: true,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              strokeColor: "#000000", // Main line color
                              strokeOpacity: .7,
                              strokeWeight: 3,
                              fillColor: "#000000",
                              fillOpacity: .7,
                              scale: 3,
                            },
                            offset: "100%",
                            repeat: "100px",
                          },
                        ],
                      }}
                      onClick={() => { handleBikeBusRouteClick(route) }}
                    />
                    <Polyline
                      key={`${keyPrefix}-main`}
                      path={route.pathCoordinates}
                      options={{
                        strokeColor: "#ffd800", // Main line color
                        strokeOpacity: 1,
                        strokeWeight: 2,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              strokeColor: "#ffd800", // Main line color
                              strokeOpacity: 1,
                              strokeWeight: 2,
                              fillColor: "#ffd800",
                              fillOpacity: 1,
                              scale: 3,
                            },
                            offset: "100%",
                            repeat: "100px",
                          },
                        ],
                      }}
                    />
                    {infoWindow.isOpen && infoWindow.position && (
                      <InfoWindow
                        position={infoWindow.position}
                        onCloseClick={handleCloseClick}
                      >
                        <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
                      </InfoWindow>
                    )}

                    {route.startPoint && (
                      <Marker
                        key={`${keyPrefix}-start`}
                        label={`${route.BikeBusName}`}
                        position={route.startPoint}
                        icon={{
                          url: generateSVGBikeBus(route.BikeBusName),
                          scaledSize: new google.maps.Size(60, 20),
                        }}
                        onClick={() => { handleBikeBusRouteClick(route) }}
                      />
                    )}
                    {route.endPoint && (
                      <Marker
                        key={`${keyPrefix}-end`}
                        label={`${route.BikeBusName}`}
                        position={route.endPoint}
                        icon={{
                          url: generateSVGBikeBus(route.BikeBusName),
                          scaledSize: new google.maps.Size(60, 20),
                        }}
                        onClick={() => { handleBikeBusRouteClick(route) }}
                      />
                    )}
                  </div>
                );
              })}
              {isActiveBikeBusEvent && bikeBusRoutes.map((route: any) => {
                const keyPrefix = route.id || route.routeName;
                return (
                  <div key={`${keyPrefix}`}>
                    <Polyline
                      key={`${keyPrefix}-border`}
                      path={route.pathCoordinates}
                      options={{
                        strokeColor: "#80ff00",
                        strokeOpacity: .7,
                        strokeWeight: 3, // Border thickness
                        clickable: true,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              strokeColor: "#80ff00", // Main line color
                              strokeOpacity: .7,
                              strokeWeight: 3,
                              fillColor: "#80ff00",
                              fillOpacity: .7,
                              scale: 3,
                            },
                            offset: "100%",
                            repeat: "100px",
                          },
                        ],
                      }}
                      onClick={() => { handleBikeBusRouteClick(route) }}
                    />
                    <Polyline
                      key={`${keyPrefix}-main`}
                      path={route.pathCoordinates}
                      options={{
                        strokeColor: "#80ff00", // Main line color
                        strokeOpacity: 1,
                        strokeWeight: 2,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              strokeColor: "#80ff00", // Main line color
                              strokeOpacity: 1,
                              strokeWeight: 2,
                              fillColor: "#80ff00",
                              fillOpacity: 1,
                              scale: 3,
                            },
                            offset: "100%",
                            repeat: "100px",
                          },
                        ],
                      }}
                    />
                    {infoWindow.isOpen && infoWindow.position && (
                      <InfoWindow
                        position={infoWindow.position}
                        onCloseClick={handleCloseClick}
                      >
                        <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
                      </InfoWindow>
                    )}

                    {route.startPoint && (
                      <Marker
                        key={`${keyPrefix}-start`}
                        label={`${route.BikeBusName}`}
                        position={route.startPoint}
                        icon={{
                          url: generateSVGBikeBus(route.BikeBusName),
                          scaledSize: new google.maps.Size(60, 20),
                        }}
                        onClick={() => { handleBikeBusRouteClick(route) }}
                      />
                    )}
                    {route.endPoint && (
                      <Marker
                        key={`${keyPrefix}-end`}
                        label={`${route.BikeBusName}`}
                        position={route.endPoint}
                        icon={{
                          url: generateSVGBikeBus(route.BikeBusName),
                          scaledSize: new google.maps.Size(60, 20),
                        }}
                        onClick={() => { handleBikeBusRouteClick(route) }}
                      />
                    )}
                  </div>
                );
              }
              )
              }
              {openTripsEnabled && openTrips.map((trip: any) => {
                const keyPrefix = trip.id || trip.routeName;
                return (
                  <div key={`${keyPrefix}`}>
                    <Polyline
                      key={`${keyPrefix}-border`}
                      path={trip.pathCoordinates}
                      options={{
                        strokeColor: "#80ff00", // Border color
                        strokeOpacity: .7,
                        strokeWeight: 5, // Border thickness
                        clickable: true,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              // make the stroke color a nice complementary green color to #ffd800
                              strokeColor: "#80ff00", // Main line color
                              strokeOpacity: .7,
                              strokeWeight: 5,
                              fillColor: "#80ff00",
                              fillOpacity: .7,
                              scale: 3,
                            },
                            offset: "100%",
                            repeat: "100px",
                          },
                        ],
                      }}
                      onClick={() => { handleOpenTripRouteClick(trip) }}
                    />
                    {infoWindowOpenTrip.isOpen && infoWindowOpenTrip.position && infoWindowOpenTrip.trip && (
                      <InfoWindow
                        position={infoWindowOpenTrip.position}
                        onCloseClick={handleCloseOpenTripClick}
                      >
                        <div dangerouslySetInnerHTML={{ __html: infoWindowOpenTrip.content }} />
                      </InfoWindow>
                    )}

                    <Polyline
                      key={`${keyPrefix}-main`}
                      onClick={() => { handleOpenTripRouteClick(trip) }}
                      path={trip.pathCoordinates}
                      options={{
                        strokeColor: "#80ff00", // Main line color
                        strokeOpacity: 1,
                        strokeWeight: 2,
                        icons: [
                          {
                            icon: {
                              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                              strokeColor: "#80ff00", // Main line color
                              strokeOpacity: 1,
                              strokeWeight: 2,
                              fillColor: "#80ff00",
                              fillOpacity: 1,
                              scale: 3,
                            },
                            offset: "100%",
                            repeat: "100px",
                          },
                        ],
                      }}
                    />
                    {infoWindowOpenTrip.isOpen && infoWindowOpenTrip.position && infoWindowOpenTrip.trip && (
                      <InfoWindow
                        position={infoWindowOpenTrip.position}
                        onCloseClick={handleCloseOpenTripClick}
                      >
                        <div dangerouslySetInnerHTML={{ __html: infoWindowOpenTrip.content }} />
                      </InfoWindow>
                    )}
                    {trip.startPoint && (
                      <Marker
                        key={`${keyPrefix}-start`}
                        label={`Start of ${trip.eventName}`}
                        position={trip.startPoint}
                        onClick={() => { handleOpenTripRouteClick(trip) }}
                      />
                    )}
                    {trip.endPoint && (
                      <Marker
                        key={`${keyPrefix}-end`}
                        label={`End of ${trip.eventName}`}
                        position={trip.endPoint}
                        onClick={() => { handleOpenTripRouteClick(trip) }}
                      />
                    )}
                  </div>
                );
              })}
              <div>
                {user && isAnonymous && userLocation && <AnonymousAvatarMapMarker position={userLocation} uid={user.uid} />}
                {user && !isAnonymous && userLocation && <AvatarMapMarker uid={user.uid} position={userLocation} />}
              </div>
              <div>
                {isEventLeader && !id && !isActiveBikeBusEvent && isActiveEvent && (
                  <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                    <IonButton color="danger" onClick={endTripAndCheckOutAll}>End Trip For All</IonButton>
                  </div>
                )}
                {!isEventLeader && !isActiveBikeBusEvent && isActiveEvent && !id && (
                  <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                    <IonButton color="danger" onClick={endTripAndCheckOut}>Check Out of Trip</IonButton>
                  </div>
                )}
              </div>
              <div>
                {isEventLeader && id && isActiveBikeBusEvent && (
                  <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                    <IonButton color="danger" onClick={endBikeBusAndCheckOutAll}>End BikeBus Event For All</IonButton>
                  </div>
                )}
                {!isEventLeader && id && isActiveBikeBusEvent && (
                  <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                    <IonButton color="danger" onClick={endBikeBusAndCheckOut}>Check Out of BikeBus Event</IonButton>
                  </div>
                )}
              </div>
              <div>
                {selectedStartLocation && (
                  <Marker
                    position={selectedStartLocation}
                    icon={{
                      url: "/assets/markers/MarkerA.svg",
                      scaledSize: new google.maps.Size(20, 20),
                    }}
                  />
                )}
                {selectedEndLocation && (
                  <Marker position={selectedEndLocation}
                    icon={{
                      url: "/assets/markers/MarkerB.svg",
                      scaledSize: new google.maps.Size(20, 20),
                    }}
                  />
                )}
              </div>
              <div>
                <IonGrid className="toggle-bikebus-container">
                  <IonRow>
                    <IonCol>
                      <IonButton onClick={getLocation}>
                        <IonIcon icon={locateOutline} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>
                      <IonLabel>BikeBus</IonLabel>
                      <IonToggle checked={bikeBusEnabled} onIonChange={e => setBikeBusEnabled(e.detail.checked)} />
                    </IonCol>
                  </IonRow>
                  <IonRow>
                    <IonCol>
                      <IonLabel>Open Trips</IonLabel>
                      <IonToggle checked={openTripsEnabled} onIonChange={e => setOpenTripsEnabled(e.detail.checked)} />
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>
              <div>
                <IonGrid className="toggle-bicycling-map-layer">
                  <IonRow>
                    <IonCol>
                      <IonLabel>Bicycling Layer</IonLabel>
                      <IonToggle
                        checked={bicyclingLayerEnabled}
                        onIonChange={(e) => {
                          const enabled = e.detail.checked;
                          setBicyclingLayerEnabled(enabled);
                          handleBicyclingLayerToggle(enabled);
                        }}
                      />
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>

              <Polyline
                path={pathCoordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude }))}
                options={{
                  strokeColor: "#FF0000",
                  strokeOpacity: 1.0,
                  strokeWeight: 2,
                  geodesic: true,
                  editable: true,
                  draggable: true,
                }}
              />
            </GoogleMap>
          </IonRow>

        )
        }
      </IonContent >
    </IonPage >
  );

}

export default Map;