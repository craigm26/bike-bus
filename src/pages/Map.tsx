import {
  IonContent,
  IonPage,
  IonButton,
  IonIcon,
  IonLabel,
  IonRow,
  IonGrid,
  IonCol,
  IonSegment,
  IonSegmentButton,
  IonCardContent,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { useEffect, useCallback, useState, useRef, useContext } from "react";
import { get, getDatabase, off, onValue, ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { arrayUnion, getDoc, query, doc, getDocs, updateDoc, where, setDoc, DocumentReference, deleteDoc } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import { bicycleOutline, busOutline, carOutline, closeOutline, locateOutline, walkOutline } from "ionicons/icons";
import { useTranslation } from 'react-i18next';
import { InfoBox } from "@react-google-maps/api";

import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader, StandaloneSearchBox } from "@react-google-maps/api";
//import { Wrapper, Status } from "@googlemaps/react-wrapper";
//import { MarkerClusterer } from "@googlemaps/markerclusterer";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";
import Sidebar from "../components/Mapping/Sidebar";
import useFirebaseRoutes from "../hooks/useFirebaseRoutes";
import React from "react";
import { useAvatar } from "../components/useAvatar";
import { addDoc, collection } from 'firebase/firestore';
import {
  DocumentData,
  doc as firestoreDoc,
} from "firebase/firestore";
// import global.css
import "../global.css";
import { AuthContext } from "../AuthContext";


const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusStop {
  id: string;
  BikeBusStopName: string;
  lat: number;
  lng: number;
  BikeBusGroupId: DocumentReference;
  BikeBusRouteId: string;
}

interface Route {
  eventCheckInLeader: any;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number, lng: number };
  pathCoordinates: { lat: number; lng: number }[];
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
  BikeBusStopName: string[];
  BikeBusStop: Coordinate[];
  BikeBusStops: Coordinate[];
  BikeBusStationsIds: string[];
  BikeBusGroup: DocumentReference;
  BikeBusStopIds: DocumentReference[];
  id: string;
  accountType: string;
  routeId: string;
  name: string;
  distance: string;
  duration: string;
  arrivalTime: string;
}

interface MarkerType {
  position: { lat: number; lng: number; };
  label: string;
  BikeBusGroupClusterId: string;
}

interface DistanceDurationResult {
  distance: string;
  duration: string;
  arrivalTime: string;
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
  start: {
    seconds: number;
    nanoseconds: number;
  };
}


const Map: React.FC = () => {
  const { user, isAnonymous, loadingAuthState } = useContext(AuthContext);
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const { t } = useTranslation();
  const [isActiveEvent, setIsActiveEvent] = useState(false);
  const [enabledAccountModes, setEnabledAccountModes] = useState<string[]>([]);
  const [username, setUsername] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("");
  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 41.8827, lng: -87.6227 });
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showCreateRouteButton, setShowCreateRouteButton] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 41.8827, lng: -87.6227 });
  const [showGetDirectionsButton, setShowGetDirectionsButton] = useState(false);
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const [mapZoom, setMapZoom] = useState(13);
  const { routes, loading } = useFirebaseRoutes(user?.uid);
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
  const [userLocationAddress, setUserLocationAddress] = useState("Set Your Starting Point");
  const [route, setRoute] = useState<DocumentData | null>(null);

  type Point = {
    lat: number;
    lng: number;
  };
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [currentLocationRow, setCurrentLocationRow] = useState(true);
  const [destinationRow, setDestinationRow] = useState(false);
  const [directionsRow, setDirectionsRow] = useState(false);
  const [detailedDirectionsRow, setDetailedDirectionsRow] = useState(false);
  const [travelModeRow, setTravelModeRow] = useState(false);
  const [createRouteRow, setCreateRouteRow] = useState(false);
  const [directionsFetched, setDirectionsFetched] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [description, setDescription] = useState('');
  const [isBikeBus, setIsBikeBus] = useState(false);
  const [bikeBusEnabled, setBikeBusEnabled] = useState(true);
  const [userRoutesEnabled, setUserRoutesEnabled] = useState(false);



  const [openTripsEnabled, setOpenTripsEnabled] = useState(true);
  const [bikeBusRoutes, setBikeBusRoutes] = useState<any[]>([]);
  const [openTrips, setOpenTrips] = useState<any[]>([]);

  const [showEndOpenTripButton, setShowEndOpenTripButton] = useState(false);
  const [openTripId, setOpenTripId] = useState('');
  const [openTripEventId, setOpenTripEventId] = useState('');
  const [tripActive, setTripActive] = useState(false);
  const [openTripRouteId, setOpenTripRouteId] = useState('');
  const [openTripLeaderLocation, setOpenTripLeaderLocation] = useState<{ lat: number, lng: number } | null>(null);

  const [isEndLocationSelected, setIsEndLocationSelected] = useState(false);
  const [joinTripId, setJoinTripId] = useState('');
  const [focusTripId, setFocusTripId] = useState('');
  const [map, setMap] = useState(null);
  // use the default value of startGeo to set the initial map center location
  const [leaderLocation, setLeaderLocation] = useState<Coordinate>({ lat: startGeo.lat, lng: startGeo.lng });
  // the leaderUID is the user.uid of the leader which is stored in the selectedRoute.routeLeader
  const [leaderUID, setLeaderUID] = useState<string>('');
  const isEventLeader = user?.uid === leaderUID;
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [bikeBusGroupId, setBikeBusGroupId] = useState<string>('');
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string>('');
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [BikeBusStopIds, setBikeBusStopIds] = useState<DocumentReference[]>([]);
  const [bikeBusStopData, setBikeBusStopData] = useState<BikeBusStop[]>([]);
  const [PlaceLocation, setPlaceLocation] = useState('');
  const [PlaceName, setPlaceName] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [PlaceAddress, setPlaceAddress] = useState('');
  const [PlaceLatitude, setPlaceLatitude] = useState<number | null>(null);
  const [PlaceLongitude, setPlaceLongitude] = useState<number | null>(null);
  const [searchInfoWindow, setSearchInfoWindow] = useState<{ isOpen: boolean, content: { PlaceName: any, PlaceAddress: any, PlaceLatitude: number, PlaceLongitude: number } | null, position: { lat: number, lng: number } | null }>({ isOpen: false, content: null, position: null });
  const [destinationValue, setDestinationValue] = useState('');
  const [destinationInput, setDestinationInput] = useState(PlaceName);
  const [markerData, setMarkerData] = useState<MarkerType[]>([]);
  const [BikeBusGroupClusterId, setBikeBusGroupClusterId] = useState<string[]>([]);
  const [position, setPosition] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [startPointName, setStartPointName] = useState("");
  const [endPointName, setEndPointName] = useState("");
  const [routeId, setRouteId] = useState('');
  const [shouldShowInfoBoxRoute, setShouldShowInfoBoxRoute] = useState(false);
  const [infoBoxContent, setInfoBoxContent] = useState(<></>);
  const [bicyclingSpeedSelector, setBicyclingSpeedSelector] = useState('SLOW');
  const [bicyclingSpeed, setBicyclingSpeed] = useState(10);
  const [showSearchContainer, setShowSearchContainer] = useState(true);


  let routeInfoBoxPosition;
  if (selectedRoute !== null) {
    routeInfoBoxPosition = new window.google.maps.LatLng(selectedRoute.startPoint.lat, selectedRoute.startPoint.lng);
  }



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

  const [infoWindowOpenTrip, setInfoWindowOpenTrip] = useState<InfoWindowOpenTrip>({
    isOpen: false,
    content: '',
    position: null,
    trip: null,
  });

  const [infoWindow, setInfoWindow] = useState<{ isOpen: boolean, content: string, position: { lat: number, lng: number } | null }>
    ({ isOpen: false, content: '', position: null });

  const [infoWindowClusterBikeBus, setInfoWindowClusterBikeBus] = useState<{ isOpen: boolean, content: string, position: { lat: number, lng: number } | null }>({ isOpen: false, content: '', position: null });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const userLocationDefault = {
    lat: 41.8827,
    lng: -87.6227, // Coordinates for Chicago's Cloud Gate
  };

  const renderMap = (location: React.SetStateAction<{ lat: number; lng: number; }>) => {
    setGetLocationClicked(true);
    //setMapCenter(location);
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
      // set a new boolean to true to indicate that the user has given permission
      getLocation();
    } else {
      setUserLocation(userLocationDefault);
      setMapCenter(userLocationDefault);
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
          // set mapCenter to userLocation
          setMapCenter(userLocation);
          // set the map zoom level to 15
          setMapZoom(15);
        },
        (error) => {
          alert("An error occurred while fetching your location. Please enable location services in your browser settings.");
          console.error(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 50000,
          maximumAge: 30,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      // return the user to the home page "/"
      history.push("/");
    }
  };

  const handleStartMap = () => {
    onPlaceChangedDestination();
    if (PlaceName) {
      setDestinationValue(formattedAddress);
      setEndPoint({ lat: PlaceLatitude!, lng: PlaceLongitude! });
      setEndPointAdress(formattedAddress);
      setMapCenter({ lat: PlaceLatitude!, lng: PlaceLongitude! });
      // update the end location to the selected location of PlaceLatitude and PlaceLongitude
      setSelectedEndLocation({ lat: PlaceLatitude!, lng: PlaceLongitude! });
      // we need to show the getDirections row by setting the state to true
      setGetLocationClicked(true);
      renderMap({ lat: PlaceLatitude!, lng: PlaceLongitude! });
      setShowCreateRouteButton(true);
      setShowGetDirectionsButton(true);
      // show the infoWindow of the place
      setSearchInfoWindow({
        isOpen: true,
        content: { PlaceName, PlaceAddress, PlaceLatitude: PlaceLatitude!, PlaceLongitude: PlaceLongitude! },
        position: { lat: PlaceLatitude!, lng: PlaceLongitude! },
      });
    } else {
      requestLocationPermission();
    }
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

      const bikeBusGroupsRef = collection(db, 'bikebusgroups');
      const q = query(bikeBusGroupsRef);
      const querySnapshot = await getDocs(q);

      const BikeBusRoutesData: Route[] = [];

      let endPointCoordinates: any[] = [];
      let BikeBusNames: string[] = [];

      querySnapshot.docs.forEach(doc => {
        const bikeBusGroupData = doc.data();
        BikeBusNames.push(bikeBusGroupData.BikeBusName || '');
        BikeBusGroupClusterId.push(doc.id);
      });

      // usually, there's one route for each bikebusgroup, so we can get the BikeBusRoutes from the bikebusgroup document. now, we can set any route - which means any route that has a valid endPoint can be set to a marker

      // so how do we solve this problem? - I think the best way to solve this problem is to get the BikeBusRoutes from the bikebusgroup document and then get the endPoint from the BikeBusRoutes document

      let BikeBusRoutesRef = querySnapshot.docs.flatMap(doc => doc.data().BikeBusRoutes || []);

      for (const routeRef of BikeBusRoutesRef) {
        if (routeRef instanceof DocumentReference) {
          const routeDoc = await getDoc(routeRef);
          const Route = routeDoc.data() as Route;
          if (Route) {
            BikeBusRoutesData.push(Route);
            if (Route.endPoint) {
              endPointCoordinates.push(Route.endPoint);
              BikeBusNames.push(Route.routeName || 'Unnamed'); // Assume routeName exists
            } else {
              console.error('Missing endPoint for route:', Route);
            }
          } else {
            console.error('No data for routeRef:', routeRef);
          }
        }
      }

      const markers = endPointCoordinates.map((coordinate, index) => {
        return {
          position: coordinate,
          label: BikeBusNames[index] || 'Unnamed',
          BikeBusGroupClusterId: BikeBusGroupClusterId[index],
        };
      });
      setMarkerData(markers);


      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          if (userData) {
          }
        }

        if (id) {
          const tripsRef = doc(db, 'event', id);

          const eventDataRef = doc(db, 'event', id);
          const eventSnapshot = await getDoc(eventDataRef);

          if (eventSnapshot.exists()) {
            const eventData = eventSnapshot.data();
            if (eventData?.eventType === 'BikeBus') {
              setIsActiveBikeBusEvent(true);
            }
            const extractedUID = eventData.eventCheckInLeader;
            setLeaderUID(extractedUID);

            const selectedRouteRef = eventData?.eventRoute;
            if (selectedRouteRef) {
              const routeSnapshot = await getDoc(selectedRouteRef);
              const Route = routeSnapshot.data() as Route;

              if (Route) {
                setSelectedRoute(Route);
                setBikeBusGroupId(Route.BikeBusGroup.id);
                setPath(Route.pathCoordinates);
                setStartGeo(Route.startPoint);
                setEndGeo(Route.endPoint);
                setBikeBusStopIds(Route.BikeBusStopIds);

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
      catch (error) {
        console.error(error);
      }
    }

    fetchData();

  }, [user, id,]);


  const endTripAndCheckOutAll = async () => {
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('headCountEvent')
    const tripDataIdDoc = doc(db, 'event', id);
    // get the serverTimeStamp() and set it as eventEndTimeStamp
    const serverTimestamp = () => {
      return new Date();
    };
    await setDoc(tripDataIdDoc, { status: 'ended', tripStatus: 'ended', eventStatus: 'ended', eventEndeventEndTimeStamp: serverTimestamp() }, { merge: true });
    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();
    const eventDataId = tripData?.eventId;

    const eventDataIdDoc = doc(db, 'event', eventDataId);
    await setDoc(eventDataIdDoc, { status: 'ended' }, { merge: true });
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });

    // and then check out all the users (by role) in the trip by setting their timestamp to serverTimestamp
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    // find any other of user's ids in the event add them to the appropriate role arrays
    // if the user is a parent in the eventData field parents, add them to the parents array
    if (tripData?.parents) {
      await setDoc(tripDataIdDoc, {
        eventEndEventParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids) {
      await setDoc(tripDataIdDoc, {
        eventEndEventKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members) {
      await setDoc(tripDataIdDoc, {
        eventEndEventMembers: arrayUnion(username),
      }, { merge: true });
    }


    const eventDataURL = eventDataIdDoc.id;
    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('headCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const headCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the headCountEvent to the number the user inputted
    const headCountEvent = parseInt(headCountEventBox!);
    const headCountEventDoc = doc(db, 'event', id);
    // update the headCountEvent to the number the user inputted
    await updateDoc(headCountEventDoc, { headCountEvent: headCountEvent });
    history.push(eventSummaryUrl);

  };

  const endTripAndCheckOut = async () => {
    const tripDataIdDoc = doc(db, 'event', id);

    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();


    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });

    if (tripData?.tripCheckInParents.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventMembers: arrayUnion(username),
      }, { merge: true });
    }

    const eventDataURL = tripDataIdDoc.id;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('headCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const headCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the headCountEvent to the number the user inputted
    const headCountEvent = parseInt(headCountEventBox!);
    const headCountEventDoc = doc(db, 'event', id);
    await updateDoc(headCountEventDoc, { headCountEvent: headCountEvent });

    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    history.push(eventSummaryUrl);

  };

  const endBikeBusAndCheckOutAll = async () => {
    const tripDataIdDoc = doc(db, 'event', id);
    // get the serverTimeStamp() and set it as eventEndTimeStamp
    const serverTimestamp = () => {
      return new Date();
    };
    await setDoc(tripDataIdDoc, { status: 'ended', tripStatus: 'ended', eventEndeventEndTimeStamp: serverTimestamp() }, { merge: true });
    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();
    const eventDataId = tripDataIdDoc;

    const eventDataIdDoc = doc(db, 'event', id);
    await setDoc(eventDataIdDoc, { status: 'ended' }, { merge: true });
    const eventSnapshot = await getDoc(eventDataIdDoc);
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });

    // and then check out all the users (by role) in the trip by setting their timestamp to serverTimestamp
    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    // find any other of user's ids in the event add them to the appropriate role arrays
    // if the user is a parent in the eventData field parents, add them to the parents array
    if (tripData?.parents) {
      await setDoc(tripDataIdDoc, {
        eventEndEventParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids) {
      await setDoc(tripDataIdDoc, {
        eventEndEventKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members) {
      await setDoc(tripDataIdDoc, {
        eventEndEventMembers: arrayUnion(username),
      }, { merge: true });
    }

    const eventDataURL = eventDataIdDoc.id;
    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('headCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const headCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the headCountEvent to the number the user inputted
    const headCountEvent = parseInt(headCountEventBox!);
    const headCountEventDoc = doc(db, 'event', id);
    await updateDoc(headCountEventDoc, { headCountEvent: headCountEvent });
    history.push(eventSummaryUrl);

  };

  const endBikeBusAndCheckOut = async () => {
    const tripDataIdDoc = doc(db, 'event', id);

    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();


    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });

    if (tripData?.eventCheckInParents.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventParents: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.kids.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventKids: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sheepdogs.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSheepdogs: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.sprinters.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventSprinters: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.captains.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaptains: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.caboose.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventCaboose: arrayUnion(username),
      }, { merge: true });
    }
    if (tripData?.members.includes(username)) {
      await setDoc(tripDataIdDoc, {
        eventEndEventMembers: arrayUnion(username),
      }, { merge: true });
    }

    const eventDataURL = tripDataIdDoc.id;

    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('headCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const headCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the headCountEvent to the number the user inputted
    const headCountEvent = parseInt(headCountEventBox!);
    // save the headCountEvent to the database
    const headCountEventDoc = doc(db, 'event', id);
    await updateDoc(headCountEventDoc, { headCountEvent: headCountEvent });
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
    // Set the isActiveBikeBusEvent based on the number of active events
    setIsActiveBikeBusEvent(events.length > 0);
  };

  useEffect(() => {
    if (leaderUID) {
      const rtdb = getDatabase();
      const leaderLocationRef = ref(rtdb, 'userLocations/' + leaderUID);
      const listener = onValue(leaderLocationRef, (snapshot) => {
        const leaderLocationData = snapshot.val();
        if (leaderLocationData) {
          setLeaderLocation({ lat: leaderLocationData.lat, lng: leaderLocationData.lng });
          setMapCenter({
            lat: leaderLocationData.lat,
            lng: leaderLocationData.lng,
          });
        }
      });

      // Clean up the listener when the component unmounts
      return () => {
        off(leaderLocationRef, 'value', listener);
      };
    }
  }, [leaderUID]);

  const watchLocation = useCallback(() => {
    if (!isLoaded || !user) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLocation);
          setMapCenter(userLocation);
          // Get user location address and set it to the userLocationAddress state
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
  }, [user, isLoaded]);

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
        .then(async (querySnapshot) => {
          const routes: Route[] = [];
          const allBikeBusStops: BikeBusStop[] = [];

          for (const doc of querySnapshot.docs) {
            const Route = doc.data() as Route;
            routes.push(Route);

            const bikeBusStopIds = Route.BikeBusStopIds;
            if (bikeBusStopIds) {
              for (const stopid of bikeBusStopIds) {
                try {
                  const bikeBusStopSnapshot = await getDoc(stopid);
                  const bikeBusStopData = bikeBusStopSnapshot.data() as BikeBusStop;
                  if (bikeBusStopData) {
                    allBikeBusStops.push(bikeBusStopData);
                  } else {
                  }
                } catch (error) {
                }
              }
            }

          }

          setBikeBusRoutes(routes);
          setBikeBusStops(allBikeBusStops);
        })

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
      // we're going to query for routes that the user has created and is not a BikeBus route
      const queryObj3 = query(
        routesRef,
        where("isBikeBus", "==", false),
      );
      getDocs(queryObj3)
        .then((querySnapshot) => {
          const routes: any[] = [];
          querySnapshot.forEach((doc) => {
            const userRoute = doc.data();
            routes.push(userRoute);
          });
          setUserRoutes(routes);
        })
        .catch((error) => {
          console.log("Error fetching user routes:", error);
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

  useEffect(() => {
    if (id) {
      handleStartMap();
    }
  }, [id]);
  useEffect(() => {
    let timer: string | number | NodeJS.Timeout | undefined;
    if (tripActive && user && openTripId && openTripEventId) {  // Check openTripId and openTripEventId are not undefined
      const uid = user.uid;
      const userLocationRef = ref(rtdb, `userLocations/${uid}`);


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
  }, [tripActive, user, openTripId, openTripEventId, shouldShowInfoBoxRoute]);

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


  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);

    // if the page has a selected end location, then update some const values that are updated when the destination is changed
    if (PlaceAddress !== null) {
      // then we need to set a bunch of const values to the values of the selected end location
      setRouteEndFormattedAddress(`${PlaceAddress}` ?? '');
    }

    const map = mapRef.current;
    if (map) {
      map.addListener("bounds_changed", () => {
        const bounds = map.getBounds();
        if (bounds) {
          ref.setBounds(bounds);

          const searchBoxBounds = ref.getBounds();
          if (searchBoxBounds) {
          }
        }
      });
    }




  };

  const onPlaceChangedStart = () => {

    // if the page is loaded as a active event, then don't do the following:
    if (autocompleteStart !== null) {
      const places = autocompleteStart.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
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
          setStartPointName(`${place.name}` ?? '');
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
          ref.setBounds(bounds);

          const searchBoxBounds = ref.getBounds();
          if (searchBoxBounds) {
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

  function getSelectedEndLocation() {
    return selectedEndLocation;
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
          const selectedStartLocation = getSelectedStartLocation();
          const selectedEndLocation = getSelectedEndLocation();
          if (selectedStartLocation && selectedEndLocation) {
            const midpoint = {
              lat: (selectedStartLocation.lat + selectedEndLocation.lat) / 2,
              lng: (selectedStartLocation.lng + selectedEndLocation.lng) / 2,
            };
            setMapCenter(midpoint);
          }
          setDestinationInput(`${place.formatted_address}` ?? { PlaceAddress });
          setRouteEndStreetName(streetName ?? '');
          const newDestinationValue = place.formatted_address || '';
          setDestinationValue(newDestinationValue);
          setRouteEndFormattedAddress(newDestinationValue);
          setRouteEndName(`${place.name}` ?? '');
          setRouteEndFormattedAddress(`${place.formatted_address}` ?? { PlaceAddress });
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

  const getDirections = async () => {
    window.alert("The blue line on the map allows you to drag the route to change it. After the route is saved by clicking 'Create Route', you can modify the route.");
    try {
      if (!selectedStartLocation || !selectedEndLocation) {
        throw new Error("Start or end location is not set");
      }

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        map: mapRef.current,
        preserveViewport: true,
      });

      let distanceValue = '';
      let durationValue = '';
      let arrivalTimeValue = '';

      if (travelModeSelector) {
        // Use travelModeSelector
        console.log(travelModeSelector);
        const travelMode: keyof typeof google.maps.TravelMode = travelModeSelector as keyof typeof google.maps.TravelMode;
        let speedSelector = ''; // Default to an empty string or a sensible default for other modes
        if (travelModeSelector === 'BICYCLING') {
          // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
          speedSelector = bicyclingSpeedSelector;
        }
        const result = await directionsService.route({
          origin: selectedStartLocation,
          destination: selectedEndLocation,
          travelMode: google.maps.TravelMode[travelMode],
        });

        directionsRenderer.setDirections(result);

        // Call calculateDistanceAndDuration and destructure its result
        const calculationResult = await calculateDistanceAndDuration(
          selectedStartLocation,
          selectedEndLocation,
          travelModeSelector,
          speedSelector
        );

        // Assign the results from calculationResult to the scoped variables
        distanceValue = calculationResult.distance;
        durationValue = calculationResult.duration;
        arrivalTimeValue = calculationResult.arrivalTime;

        setDistance(distanceValue);
        setDuration(durationValue);
        setArrivalTime(arrivalTimeValue);


      } else {
        // Handle the case where travelModeSelector is undefined
        console.log('travelModeSelector is undefined');
      }

      // Indicate that directions have been fetched
      setDirectionsFetched(true);
    } catch (error) {
      console.error("Failed to get directions:", error);
      // Optionally, handle setting state to reflect the error to the user
    }
  };


  const calculateDistanceAndDuration = (origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, travelMode: string, speedSelector: string) => {


    return new Promise<DistanceDurationResult>((resolve, reject) => {
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode[travelMode as keyof typeof google.maps.TravelMode],
      }, (response, status) => {
        if (status === "OK" && response?.rows[0]?.elements[0]?.status === "OK") {
          const distance = response.rows[0].elements[0].distance.value; // meters
          let duration = response.rows[0].elements[0].duration.value; // seconds

          // Adjust duration based on the selected speed
          const speedFactor = getSpeedAdjustmentFactor(speedSelector);
          duration *= speedFactor;

          const distanceInMiles = Math.round((distance * 0.000621371) * 100) / 100;
          const durationInMinutes = Math.round((duration / 60) * 100) / 100;

          const arrivalTime = new Date();
          arrivalTime.setSeconds(arrivalTime.getSeconds() + duration);
          const arrivalTimeString = arrivalTime.toLocaleTimeString();

          resolve({
            distance: distanceInMiles.toString(),
            duration: durationInMinutes.toString(),
            arrivalTime: arrivalTimeString,
          });
        } else {
          reject("Error calculating distance and duration: " + status);
        }
      });
    });
  };

  const getSpeedAdjustmentFactor = (speedSelector: any) => {
    switch (speedSelector) {
      case "VERY SLOW": return 1.2;
      case "SLOW": return 1.1;
      case "MEDIUM": return 1;
      case "FAST": return 0.9;
      default: return 1; // Default to no adjustment
    }
  };

  const handleRouteChange = async (directionsResult: google.maps.DirectionsResult | null) => {
    // Simplify route if necessary and calculate distance and duration
    if (!directionsResult) {
      throw new Error("Directions result is null");
    }
    const pathPoints = directionsResult.routes[0].overview_path.map(latLng => ({ latitude: latLng.lat(), longitude: latLng.lng() }));
    const simplifiedPathPoints = ramerDouglasPeucker(pathPoints, 0.0001);

    // Optionally update the state with the new simplified path points
    setPathCoordinates(simplifiedPathPoints);

    console.log(travelModeSelector);
    const travelMode: keyof typeof google.maps.TravelMode = travelModeSelector as keyof typeof google.maps.TravelMode;
    let speedSelector = ''; // Default to an empty string or a sensible default for other modes
    if (travelModeSelector === 'BICYCLING') {
      // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
      speedSelector = bicyclingSpeedSelector;
    }

    if (selectedStartLocation === null || selectedEndLocation === null) {
      console.error("Start or end location is null");
      return; // Stop the function if either is null
    }


    // Call calculateDistanceAndDuration and destructure its result
    const calculationResult = await calculateDistanceAndDuration(
      selectedStartLocation,
      selectedEndLocation,
      travelModeSelector,
      speedSelector
    );

    let distanceValue = '';
    let durationValue = '';
    let arrivalTimeValue = '';

    // Assign the results from calculationResult to the scoped variables
    distanceValue = calculationResult.distance;
    durationValue = calculationResult.duration;
    arrivalTimeValue = calculationResult.arrivalTime;

    setDistance(distanceValue);
    setDuration(durationValue);
    setArrivalTime(arrivalTimeValue);
  };

  const getDirectionsAndSimplifyRoute = async () => {
    try {
      if (!selectedStartLocation || !selectedEndLocation) {
        throw new Error("Start or end location is not set");
      }

      // Setup DirectionsService and DirectionsRenderer
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        draggable: true,
        map: mapRef.current,
        preserveViewport: true,
      });

      let distanceValue = '';
      let durationValue = '';
      let arrivalTimeValue = '';

      if (travelModeSelector) {
        // Use travelModeSelector
        console.log(travelModeSelector);
        const travelMode = google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode];
        let speedSelector = ''; // Default to an empty string or a sensible default for other modes
        if (travelModeSelector === 'BICYCLING') {
          // Set speedSelector for BICYCLING mode based on the selected speed from the user in the state of speedSelector
          speedSelector = bicyclingSpeedSelector;
          // also enable the bicycling layer if the ref is not null
        }


        // Fetch and set initial directions
        const initialResult = await directionsService.route({
          origin: selectedStartLocation,
          destination: selectedEndLocation,
          travelMode: travelMode,
        });
        directionsRenderer.setDirections(initialResult);
        handleRouteChange(initialResult); // Function to process the route, calculate distances, etc.

        // Listen for directions changes (e.g., user drags the route)
        google.maps.event.addListener(directionsRenderer, 'directions_changed', () => {
          const newDirections = directionsRenderer.getDirections();
          handleRouteChange(newDirections); // Re-process the new route
        });

        // Indicate that directions have been fetched
        setDirectionsFetched(true);
      }
    }
    catch (error) {
      console.error("Failed to get directions:", error);
      // Optionally, handle setting state to reflect the error to the user
    }
  }

  const updateRoute = (newRoute: google.maps.DirectionsResult) => {
    if (directionsRenderer) {
      // Clear the existing route
      directionsRenderer.setMap(null);
    }

    const newDirectionsRenderer = new google.maps.DirectionsRenderer({
      // Your renderer options here
    });
    newDirectionsRenderer.setDirections(newRoute);
    newDirectionsRenderer.setMap(mapRef.current);
    setDirectionsRenderer(newDirectionsRenderer);
  };

  directionsRenderer?.addListener('directions_changed', () => {
    const newDirections = directionsRenderer.getDirections();
    if (newDirections) {
      updateRoute(newDirections);
    }
  });


  const getStartPointAddress = async (startPoint: Point) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${startPoint.lat},${startPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].formatted_address;
      } else {
        throw new Error('Failed to get start point address');
      }
    } catch (error) {
      console.error('Error fetching start point address:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  const getEndPointAddress = async (endPoint: Point) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${endPoint.lat},${endPoint.lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`);
      const data = await response.json();
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].formatted_address;
      } else {
        throw new Error('Failed to get end point address');
      }
    } catch (error) {
      console.error('Error fetching end point address:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };


  // Utility function to convert path coordinates
  const convertPathCoordinates = (pathCoordinates: any[]) =>
    pathCoordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude }));

  // Utility function to generate route name
  const generateRouteName = (startName: string, endName: string) =>
    `${startName} to ${endName}`;

  const createRoute = async () => {
    if (!user || !selectedStartLocation || !selectedEndLocation) {
      console.error('Required user and location data is missing');
      return;
    }

    try {
      const [startPointAddress, endPointAddress] = await Promise.all([
        getStartPointAddress(selectedStartLocation),
        selectedEndLocation ? getEndPointAddress(selectedEndLocation) : '',
      ]);

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      directionsRenderer.setMap(mapRef.current);

      directionsService.route({
        origin: selectedStartLocation,
        destination: selectedEndLocation,
        travelMode: google.maps.TravelMode[travelModeSelector as keyof typeof google.maps.TravelMode],
      }, async (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
          const Route = prepareRoute(response?.routes[0], startPointAddress, endPointAddress);
          await handleCreateRouteSubmit(Route);
        } else {
          console.error("Directions request failed due to " + status);
        }
      });
    } catch (error) {
      console.error("Error creating route:", error);
    }
  };

  // Function to prepare route data
  const prepareRoute = (route: google.maps.DirectionsRoute | undefined, startPointAddress: any, endPointAddress: any) => {
    const convertedPathCoordinates = convertPathCoordinates(pathCoordinates);
    return {
      routeName: generateRouteName(routeStartName, routeEndName),
      startPointAddress,
      endPointAddress,
      pathCoordinates: convertedPathCoordinates,
      routeCreator: user.uid,
      routeLeader: user.uid,
      distance: distance,
      duration: duration,
      endPoint: selectedEndLocation,
      startPoint: selectedStartLocation,
      endPointName: routeEndName,
      startPointName: routeStartName,
      isBikeBus: false,
      travelMode: travelModeSelector,
      bicyclingSpeed: bicyclingSpeedSelector,
      bicyclingSpeedSelector: bicyclingSpeedSelector,
    };
  };

  const handleCreateRouteSubmit = async (Route: {
    routeName: string;
    startPointAddress: any;
    endPointAddress: any;
    pathCoordinates: { lat: any; lng: any; }[];
    routeCreator: DocumentReference<any>;
    routeLeader: DocumentReference<any>;
    distance: string;
    duration: string;
    endPoint: any;
    startPoint: any;
    endPointName: string;
    startPointName: string;
    isBikeBus: boolean;
    travelMode: string;
    bicyclingSpeed: string;
    bicyclingSpeedSelector: string;
  }) => {
    try {
      if (!user) {
        console.error('User data is missing');
        return;
      }

      const routeDocRef = await addDoc(collection(db, 'routes'), Route);
      console.log('Route created with ID: ', routeDocRef.id);
      // go to the route page
      history.push(`/viewroute/${routeDocRef.id}`);

    } catch (error) {
      console.error("Error submitting route:", error);
    }
  };



  const handleBikeBusRouteClick = async (route: any) => {

    // let's not show the search container
    setShowSearchContainer(false);

    // let's get the events for this bikebus group
    const bikeBusGroupId = route.BikeBusGroup.id;
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

      // Extract the date from the 'start' field
      const eventStartDate = new Date(eventData.start.seconds * 1000);
      const eventStartTime = new Date(eventData.start.seconds * 1000);

      // Combine the date and time
      eventStartDate.setHours(eventStartTime.getHours());
      eventStartDate.setMinutes(eventStartTime.getMinutes());
      eventStartDate.setSeconds(eventStartTime.getSeconds());

      // Convert the combined date and time back to seconds

      if (eventStartDate.getTime() > currentTime) {
        events.push(eventData);
      }
    });
    // sort the events by start time
    events.sort((a, b) => (a.start.seconds - b.start.seconds));
    // get the next 3 events
    const next3Events = events.slice(0, 3);
    // get the next 3 events' start times

    let next3EventsHTML = '<span style="color: black;">No Events Scheduled</span>'; // Default message

    if (next3Events.length > 0) {
      const next3EventsLinks = next3Events.map((event) => {
        const eventId = event.id;

        // Convert the Timestamp to a Date object
        const eventStartDate = new Date(event.start.seconds * 1000);

        // Format the date
        const eventStartFormatted = eventStartDate.toLocaleString(); // or use date-fns or similar

        return `<a href="/event/${eventId}" style="color: black;">${eventStartFormatted}</a>`;
      });
      next3EventsHTML = next3EventsLinks.join('<br>');
    }

    // for each of the qualified next3Events, let's create a link to the event page for that event /event/id

    // we'll have to convert this infoWindow into a infoBox and include this: 
    /*{isUserMember && (
      <IonButton shape="round" size="small" routerLink={`/BulletinBoards/${selectedBBOROrgValue}`}>
        Bulletin Board
      </IonButton>
    )}
    */

    // Set content to whatever you want to display inside the InfoWindow
    const content = `  
    <div style="margin-top: 10px;">
    
    <h4>Upcoming Events:</h4>
    ${next3EventsHTML}
  </div>
    <a href="/bikebusgrouppage/${route.BikeBusGroup.id}" style="display: inline-block; padding: 10px; background-color: #ffd800; color: black; text-decoration: none;">
    View ${route.BikeBusName}
  </a>`
      ;

    // Set position to the startPoint of the route (or any other point you prefer)
    const position = route.startPoint;

    setInfoWindow({ isOpen: true, content, position });



  };

  const createInfoBoxContentBikeBus = async (routeName: string, routeId: string) => {

    return (
      <>
        <h4>{routeName}</h4>
        <div>
          <IonButton
            size="small"
            onClick={() => {
              history.push(`/editroute/${routeId}`);
            }}
          >
            Edit Route
          </IonButton>
          <IonButton
            size="small"
            onClick={() => {
              deleteRoute(routeId);
            }}
          >
            Delete Route
          </IonButton>
          <IonButton
            size="small"
            routerLink={`/CreateBikeBusGroup/${routeId}`}
          >
            Create BikeBus
          </IonButton>
          <IonCardContent>
            {/* if the route is a bikebus, then show the bikebus map 
              {Drone3DMap ? (
                <Drone3DMap
                  routeId={routeId}
                  routeName={routeName}
                  startPoint={selectedStartLocation}
                  endPoint={selectedEndLocation}
                  pathCoordinates={pathCoordinates}
                />
              ) : (
                <IonSpinner name="crescent" />
              )}
              */}
          </IonCardContent>
        </div>

      </>
    );
  };

  const handleBikeBusRouteClusterClick = async (route: any) => {
    // let's get the events for this bikebus group
    const bikeBusGroupId = route;
    try {

      const bikeBusGroupId = route;
      const bikeBusGroupRef = doc(db, 'bikebusgroups', bikeBusGroupId);
      const eventsRef = query(
        collection(db, "event"),
        where('BikeBusGroup', '==', bikeBusGroupRef)
      );

      // Fetch both the bikeBusGroup data and the events in a single step
      const [bikeBusGroupDoc, querySnapshot] = await Promise.all([
        getDoc(bikeBusGroupRef),
        getDocs(eventsRef)
      ]);

      if (!bikeBusGroupDoc.exists) {
        console.error("bikeBusGroup document doesn't exist!");
        return;
      }

      const bikeBusGroupData = bikeBusGroupDoc.data();

      const events: BikeBusEvent[] = [];
      const currentTime = new Date().getTime();
      querySnapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() } as BikeBusEvent;

        const eventStartDate = new Date(eventData.start.seconds * 1000);
        const eventStartTime = new Date(eventData.start.seconds * 1000);

        eventStartDate.setHours(eventStartTime.getHours());
        eventStartDate.setMinutes(eventStartTime.getMinutes());
        eventStartDate.setSeconds(eventStartTime.getSeconds());

        if (eventStartDate.getTime() > currentTime) {
          events.push(eventData);
        }
      }
      );
      events.sort((a, b) => (a.start.seconds - b.start.seconds));
      const next3Events = events.slice(0, 3);

      let next3EventsHTML = '<span style="color: black;">No Events Scheduled</span>';
      if (next3Events.length > 0) {
        const next3EventsLinks = next3Events.map((event) => {
          const eventId = event.id;

          const eventStartDate = new Date(event.start.seconds * 1000);

          const eventStartFormatted = eventStartDate.toLocaleString();

          return `<a href="/event/${eventId}" style="color: black;">${eventStartFormatted}</a>`;
        });
        next3EventsHTML = next3EventsLinks.join('<br>');
      }

      const content = `
        <div style="margin-top: 10px;">
        <h4>Upcoming Events:</h4>
        ${next3EventsHTML}
        </div>
        <a href="/bikebusgrouppage/${route}" style="display: inline-block; padding: 10px; background-color: #ffd800; color: black; text-decoration: none;">
        View BikeBus
        </a>`
        ;

      // position is actually a field from the document that is passed in bikeBusGroupData?.BikeBusRoutes array of document references. The endPoint can be found in the routes document collection
      // first step is to get the document reference from the bikeBusGroupData?.BikeBusRoutes array of document references
      // then get the document from the document reference
      // then get the endPoint from the document

      // let's ensure the endPoint is set before we set the position
      await getDoc(bikeBusGroupData?.BikeBusRoutes[0]).then((doc) => {
        if (doc.exists()) {
          const Route = doc.data() as Route;
          // set Route to the Route from the document reference
          setEndPoint(Route?.endPoint);
          setPosition(Route?.endPoint);
          setMapCenter(Route?.endPoint);
        }
      });

      // ensure the position is set before we set the infoWindow


      setInfoWindow({ isOpen: true, content, position });

      setInfoWindowClusterBikeBus({ isOpen: true, content, position });

    } catch (error) {
      console.log("Error: ", error);
    }
  };


  const handleUserRouteClick = async (route: any) => {
    console.log(route);


    // set shouldShowInfoBoxRoute to true
    setShouldShowInfoBoxRoute(true);

    if (!route.routeName) {
      console.error("No ID found for route: ", route);
      return;
    }

    const routeName = route.routeName;
    const routesRef = collection(db, "routes");
    const queryRef = query(routesRef, where("routeName", "==", routeName));
    const querySnapshot = await getDocs(queryRef);

    let foundRouteId = ''; // Temporary variable to hold the found route ID
    querySnapshot.forEach((docSnapshot) => {
      foundRouteId = docSnapshot.id; // Assuming this gives the correct ID
    });

    // the foundRouteId is the id of the document in the routes collection, we need to set the selectedRoute to a variable that we can use to get the route data
    // set routeId as foundRouteId
    setRouteId(foundRouteId);
    // let's get the document from the foundRouteId
    const routeRef = doc(db, 'routes', foundRouteId);
    const routeDoc = await getDoc(routeRef);
    if (!routeDoc.exists()) {
      console.error("No document found for routeName:", routeName);
      return;
    }

    // routeDoc should be set to selectedRoute
    setSelectedRoute(routeDoc.data() as Route);

    // Check if a route ID was found
    if (foundRouteId) {
      setRouteId(foundRouteId); // Set the state with the found route ID
      // we need to update the selectedRoute variable with the foundRouteId
      setShouldShowInfoBoxRoute(true);
      setInfoBoxContent(await createInfoBoxContentRoute(route.routeName, foundRouteId));
    } else {
      console.error("No document found for routeName:", routeName);
      return;
    }
  };

  const createInfoBoxContentRoute = async (routeName: string, routeId: string) => {

    return (
      <>
        <h4>{routeName}</h4>
        <div>
          <IonButton
            size="small"
            onClick={() => {
              history.push(`/editroute/${routeId}`);
            }}
          >
            Edit Route
          </IonButton>
          <IonButton
            size="small"
            onClick={() => {
              deleteRoute(routeId);
            }}
          >
            Delete Route
          </IonButton>
          {selectedRoute?.accountType !== 'Anonymous' && (
            <IonButton
              size="small"
              routerLink={`/CreateBikeBusGroup/${routeId}`}
            >
              Create BikeBus
            </IonButton>
          )}
          <IonCardContent>
            {/* if the route is a bikebus, then show the bikebus map 
              {Drone3DMap ? (
                <Drone3DMap
                  routeId={routeId}
                  routeName={routeName}
                  startPoint={selectedStartLocation}
                  endPoint={selectedEndLocation}
                  pathCoordinates={pathCoordinates}
                />
              ) : (
                <IonSpinner name="crescent" />
              )}
              */}
          </IonCardContent>
        </div>

      </>
    );
  };


  const handleCloseInfoBox = () => {
    setShouldShowInfoBoxRoute(false);
  };

  const deleteRoute = async (routeId: string) => {
    const routeRef = doc(db, 'routes', routeId);
    await deleteDoc(routeRef);
    alert('Route Deleted');
    history.push('/Map/');
  };

  const createBikeBus = async (routeId: string) => {
    <IonButton shape="round" routerLink={`/CreateBikeBusGroup/${routeId}`}>Create BikeBus Group</IonButton>
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


  // create a function to handle the click "Focus on Leader" - this will center the map on the leader's location

  const handleClusterClick = (cluster: any) => {
    // when the cluster is clicked, we want to zoom in on the cluster
    // get the cluster's center
    const clusterCenter = cluster.center;
    // set the mapCenter to the clusterCenter
    setMapCenter(clusterCenter);
    // set the mapZoom to 13
    setMapZoom(13);
  };


  const handleCloseOpenTripClick = () => {
    setInfoWindowOpenTrip({ isOpen: false, content: '', position: null, trip: null });
    setShowSearchContainer(true);
  };

  const handleCloseClick = () => {
    setInfoWindow({ isOpen: false, content: '', position: null });
    setShowSearchContainer(true);
  };

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
        endPointAddress: selectedEndLocationAddress,
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
          // set docRef.id to a new const so that we can use it throughout the rest of the code
          const openTripId = docRefPromise.id;
          setOpenTripId(openTripId);
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
          // set the docRef.id to a new const so that we can use it throughout the rest of the code
          const openTripRouteId = docRouteRef.id;
          setOpenTripRouteId(openTripRouteId);

          // now let's update the trip document with the routeId in the route field of the trip document
          const eventDocRef = doc(db, "event", openTripRouteId);
          updateDoc(eventDocRef, {
            route: docRouteRef,
          });
        })
        .catch((error) => {
          console.error("Error adding document: ", error);
        });
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

      } catch (error) {
      }
      const routesRef = await createRouteDocument(user, selectedStartLocation, selectedEndLocation, pathCoordinates);
      setTripActive(true);
      setShowEndOpenTripButton(true);

    }
  };

  async function endOpenTrip() {
    try {
      if (user && openTripId) {
        const eventDocRef = doc(db, "event", openTripId); // Change this line to use openTripId


        if (userLocation) {
          const updateData = {
            status: "inactive",
            endLocation: userLocation,
            endTime: new Date(),
          };

          const eventUpdateResult = await updateDoc(eventDocRef, updateData); // Update the document in the event collection
        }
      }
      setIsActiveEvent(false);
      setTripActive(false);
      setShowEndOpenTripButton(false);
      // take the user to the eventsummary page - use the event doc id to get the event doc and then pass the event doc to the eventsummary page
      history.push({
        pathname: `/EventSummary/${openTripId}`,
        state: { id: openTripId }
      });
    } catch (error) {
      console.error("Error ending trip:", error);
    }
  }

  function generateSVGBikeBus(label: string) {
    const fontSize = 14;
    const padding = 0;

    // Create a temporary SVG to measure text width
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElem.setAttribute('font-size', `${fontSize}px`);
    textElem.setAttribute('font-family', 'Arial, sans-serif');
    textElem.textContent = label;
    tempSvg.appendChild(textElem);
    document.body.appendChild(tempSvg);
    const textWidth = textElem.getBBox().width;
    document.body.removeChild(tempSvg);

    // Calculate the dimensions
    const rectWidth = textWidth + padding * 2;
    const rectHeight = fontSize + padding * 2;

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rectWidth}" height="${rectHeight}">
        <text x="50%" y="50%" alignment-baseline="middle" text-anchor="middle" 
              fill="#ffd800" stroke="#ffd800" stroke-width="10px" 
              font-size="${fontSize}px" font-family="Arial, sans-serif">${label}</text>
      </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }



  function generateSVGUserRoutes(label: string) {
    const fontSize = 14;
    const padding = 10;

    // Create a temporary SVG to measure text width
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const textElem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElem.setAttribute('font-size', `${fontSize}px`);
    textElem.setAttribute('font-family', 'Arial, sans-serif');
    textElem.textContent = label;
    tempSvg.appendChild(textElem);
    document.body.appendChild(tempSvg);
    const textWidth = textElem.getBBox().width;
    document.body.removeChild(tempSvg);

    // Calculate the dimensions
    const rectWidth = textWidth + padding * 2;
    const rectHeight = fontSize + padding * 2;

    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rectWidth}" height="${rectHeight}">
      <rect x="0" y="0" width="${rectWidth}" height="${rectHeight}" fill="#88C8F7"/>
      <text x="50%" y="50%" alignment-baseline="middle" text-anchor="middle" fill="#88C8F7" font-size="${fontSize}px" font-family="Arial, sans-serif" stroke="white" stroke-width="1"></text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }

  useEffect(() => {
    if (pathCoordinates.length) {
    }
  }, [pathCoordinates]);


  const handleBicyclingLayerToggle = (enabled: boolean) => {
    if (bicyclingLayerRef.current && mapRef.current) {
      if (enabled) {
        bicyclingLayerRef.current.setMap(mapRef.current); // Show the layer
      } else {
        bicyclingLayerRef.current.setMap(null); // Hide the layer
      }
    }
  };

  // if the setPlaceLocation has changed, run onPlaceChangedDestination function
  useEffect(() => {
    if (PlaceLocation) {
      onPlaceChangedDestination();
    }
  }, [PlaceLocation]);

  useEffect(() => {
    if (mapRef.current) {
      google.maps.event.trigger(mapRef.current, 'resize');
    }
  }, []);


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

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (loadingAuthState) {
    // Show a loading spinner while auth state is loading
    return <IonSpinner />;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
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
              clickableIcons: false,
              disableDefaultUI: true,
              zoomControl: true,
              zoomControlOptions: {
                position: window.google.maps.ControlPosition.LEFT_CENTER
              },
              mapTypeControl: false,
              mapTypeControlOptions: {
                position: window.google.maps.ControlPosition.LEFT_CENTER, // Position of map type control
                mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain',],
              },
              disableDoubleClickZoom: true,
              minZoom: 3,
              maxZoom: 18,
              mapId: 'b75f9f8b8cf9c287',
            }}
            onUnmount={() => {
              mapRef.current = null;
            }}
          >
            {infoWindowClusterBikeBus.isOpen && infoWindowClusterBikeBus.position && (
              <InfoWindow
                position={infoWindowClusterBikeBus.position}
                onCloseClick={() => setInfoWindowClusterBikeBus({ isOpen: false, position: null, content: '' })}
              >
                <div dangerouslySetInnerHTML={{ __html: infoWindow.content }} />
              </InfoWindow>
            )}
            {!id && showSearchContainer && (
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
                        <IonButton size="small" onClick={getLocation}>
                          <IonIcon icon={locateOutline} />
                        </IonButton>
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
                          placeholder="Enter Destination"
                          value={destinationValue}
                          onChange={(e) => setDestinationValue(e.target.value)}
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
                    <IonButton shape="round" onClick={endOpenTrip}>End Open Trip</IonButton>
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
                {travelModeSelector === "BICYCLING" && showGetDirectionsButton && !isActiveEvent && !id && (
                  <IonRow>
                    <IonCol>
                      <IonLabel>Speed:</IonLabel>
                      <IonSegment value={bicyclingSpeedSelector} onIonChange={(e: CustomEvent) => {
                        setBicyclingSpeed(e.detail.value);
                        setBicyclingSpeedSelector(e.detail.value);
                      }
                      }>
                        <IonSegmentButton value="VERY SLOW">
                          <IonText>Very Slow</IonText>
                          <IonText>0-5mph</IonText>
                        </IonSegmentButton>
                        <IonSegmentButton value="SLOW">
                          {/*need to find svg font awesome icons to represent animals and speed*/}
                          <IonText>Slow</IonText>
                          <IonText>5-10mph</IonText>
                        </IonSegmentButton>
                        <IonSegmentButton value="MEDIUM">
                          <IonText>Medium</IonText>
                          <IonText>10-12mph</IonText>
                        </IonSegmentButton>
                        <IonSegmentButton value="FAST">
                          <IonText>Fast</IonText>
                          <IonText>12-20mph</IonText>
                        </IonSegmentButton>
                      </IonSegment>
                    </IonCol>
                  </IonRow>
                )}
                <IonRow>
                  <IonCol>
                    {showGetDirectionsButton && !isActiveEvent && <IonButton shape="round" expand="block" onClick={getDirectionsAndSimplifyRoute}>Get Directions</IonButton>}
                  </IonCol>
                  <IonCol>
                    {showGetDirectionsButton && directionsFetched && !isAnonymous && !isActiveEvent && (
                      <IonButton shape="round" expand="block" onClick={createRoute}>Create Route</IonButton>)
                    }
                  </IonCol>
                  <IonCol>
                    {showGetDirectionsButton && directionsFetched && !isAnonymous && !isActiveEvent && (
                      <IonButton shape="round" expand="block" onClick={startOpenTrip}>Start Open Trip</IonButton>
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
                        {showGetDirectionsButton && directionsFetched && (
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
                      zIndex: 10,
                      strokeColor: "#000000", // Border color
                      strokeOpacity: .7,
                      strokeWeight: 4, // Border thickness
                      clickable: true,
                      icons: [
                        {
                          icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            strokeColor: "#000000", // Main line color
                            strokeOpacity: .7,
                            strokeWeight: 4,
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
                      zIndex: 10,
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
                  {route.endPoint && (
                    <Marker
                      key={`${keyPrefix}-end`}
                      label={`${route.BikeBusName}`}
                      position={route.endPoint}
                      icon={{
                        url: generateSVGBikeBus(route.BikeBusName),
                        scaledSize: new google.maps.Size(260, 20),
                      }}
                      onClick={() => { handleBikeBusRouteClick(route) }}
                    />
                  )}
                  {bikeBusStopData?.map((bikeBusStop: BikeBusStop) => {
                    return (
                      <Marker
                        key={bikeBusStop.id}
                        label={bikeBusStop.BikeBusStopName}
                        position={{ lat: bikeBusStop.lat, lng: bikeBusStop.lng }}
                      />
                    );
                  })}

                </div>
              );
            })}
            {!isActiveBikeBusEvent && userRoutesEnabled && userRoutes.map((route: any, index: number) => {
              const keyPrefix = route.id || `${route.routeName}-${index}`;
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
                      draggable: true,
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
                    onClick={() => handleUserRouteClick(route)}
                  />
                  <Polyline
                    key={`${keyPrefix}-main`}
                    path={route.pathCoordinates}
                    options={{
                      strokeColor: "#88C8F7", // Main line color
                      strokeOpacity: 1,
                      strokeWeight: 2,
                      icons: [
                        {
                          icon: {
                            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            strokeColor: "#88C8F7", // Main line color
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            fillColor: "#88C8F7",
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
                  {route.endPoint && (
                    <Marker
                      key={`${keyPrefix}-end`}
                      label={`${route.routeName}`}
                      position={route.endPoint}
                      icon={{
                        url: generateSVGUserRoutes(route.routeName),
                        scaledSize: new google.maps.Size(260, 20),
                      }}
                      onClick={() => handleUserRouteClick(route)}
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
                      draggable: false,
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
                      position={route.startPoint}
                      onClick={() => { handleBikeBusRouteClick(route) }}
                    />
                  )}
                  {route.bikeBusStops && route.bikeBusStops.map((stop: any) => {
                    const keyPrefix = stop.id || stop.stopName;
                    return (
                      <Marker
                        key={`${keyPrefix}-stop`}
                        label={`${stop.stopName}`}
                        position={stop.stopLocation}
                        icon={{
                          url: generateSVGBikeBus(stop.stopName),
                          scaledSize: new google.maps.Size(260, 20),
                        }}
                        onClick={() => { handleBikeBusRouteClick(route) }}
                      />
                    );
                  }
                  )
                  }
                  {route.endPoint && (
                    <Marker
                      key={`${keyPrefix}-end`}
                      label={`${route.BikeBusName}`}
                      position={route.endPoint}
                      icon={{
                        url: generateSVGBikeBus(route.BikeBusName),
                        scaledSize: new google.maps.Size(260, 20),
                      }}
                      onClick={() => { handleBikeBusRouteClick(route) }}
                    />
                  )}
                </div>
              );
            }
            )
            }
            {openTripsEnabled && !isActiveBikeBusEvent && openTrips.map((trip: any) => {
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
                  {trip.eventLeaderLocation && (
                    <Marker
                      key={`${keyPrefix}-leader`}
                      label={`Leader of ${trip.eventName}`}
                      position={trip.eventLeaderLocation}
                      icon={{
                        url: generateSVGBikeBus(trip.eventName),
                        scaledSize: new google.maps.Size(260, 20),
                      }}
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
                  <IonButton shape="round" color="danger" onClick={endTripAndCheckOutAll}>End Trip For All</IonButton>
                </div>
              )}
              {!isEventLeader && !isActiveBikeBusEvent && isActiveEvent && !id && (
                <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                  <IonButton shape="round" color="danger" onClick={endTripAndCheckOut}>Check Out of Trip</IonButton>
                </div>
              )}
            </div>
            <div>
              {isEventLeader && id && isActiveBikeBusEvent && (
                <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                  <IonButton shape="round" color="danger" onClick={endBikeBusAndCheckOutAll}>End BikeBus Event For All</IonButton>
                </div>
              )}
              {!isEventLeader && id && isActiveBikeBusEvent && (
                <div style={{ position: 'absolute', top: '17px', right: '60px' }}>
                  <IonButton shape="round" color="danger" onClick={endBikeBusAndCheckOut}>Check Out of BikeBus Event</IonButton>
                </div>
              )}
            </div>
            <div>
              {shouldShowInfoBoxRoute && selectedRoute && (
                <InfoBox
                  position={routeInfoBoxPosition}
                  options={{
                    boxClass: "route-info-box",
                    disableAutoPan: false,
                    pixelOffset: new google.maps.Size(0, -40),
                    zIndex: 1,
                    closeBoxURL: "",
                    enableEventPropagation: true,
                  }}
                >
                  <div style={{ padding: '5px', position: 'relative' }}>
                    {infoBoxContent}
                    <IonIcon
                      icon={closeOutline}
                      className="route-info-box-close"
                      onClick={handleCloseInfoBox}
                    />
                  </div>
                </InfoBox>
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
            <Sidebar
              mapRef={mapRef}
              getLocation={getLocation}
              bikeBusEnabled={bikeBusEnabled}
              userRoutesEnabled={userRoutesEnabled}
              setBikeBusEnabled={setBikeBusEnabled}
              setUserRoutesEnabled={setUserRoutesEnabled}
              openTripsEnabled={openTripsEnabled}
              setOpenTripsEnabled={setOpenTripsEnabled}
              bicyclingLayerEnabled={bicyclingLayerEnabled}
              setBicyclingLayerEnabled={setBicyclingLayerEnabled}
              handleBicyclingLayerToggle={handleBicyclingLayerToggle}
            />
          </GoogleMap>
        </IonRow>
      </IonContent >
    </IonPage >
  );

}

export default Map;