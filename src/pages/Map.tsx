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
  IonText,
  IonCardTitle,
} from "@ionic/react";
import { useEffect, useCallback, useState, useRef } from "react";
import useAuth from "../useAuth";
import { get, getDatabase, off, onValue, ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { arrayUnion, getDoc, query, doc, getDocs, updateDoc, where, setDoc, DocumentReference, deleteDoc } from "firebase/firestore";
import { useHistory, useParams } from "react-router-dom";
import { bicycleOutline, busOutline, carOutline, locateOutline, locationOutline, walkOutline } from "ionicons/icons";
import { useTranslation } from 'react-i18next';


import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader, StandaloneSearchBox, MarkerClusterer, KmlLayer } from "@react-google-maps/api";
import AnonymousAvatarMapMarker from "../components/AnonymousAvatarMapMarker";
import AvatarMapMarker from "../components/AvatarMapMarker";
import Sidebar from "../components/Mapping/Sidebar";
import SearchBar from "../components/SearchBar";
import React from "react";
import { useAvatar } from "../components/useAvatar";
import { addDoc, collection } from 'firebase/firestore';
import {
  DocumentData,
  doc as firestoreDoc,
} from "firebase/firestore";

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

interface RouteData {
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
  BikeBusStopIds: DocumentReference[];
  id: string;
  accountType: string;
  routeId: string;
  name: string;
}

interface MarkerType {
  position: { lat: number; lng: number; };
  label: string;
  BikeBusGroupClusterId: string;
}


type School = {
  id: string;
  SchoolName: string;
  Location: string;
  Organization?: DocumentReference;
}


interface Point {
  lat: number;
  lng: number;
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
  const { user, isAnonymous } = useAuth();
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [showMap, setShowMap] = useState(true);
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
  const [bikeBusEnabled, setBikeBusEnabled] = useState(true);
  const [userRoutesEnabled, setUserRoutesEnabled] = useState(true);


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
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [path, setPath] = useState<Coordinate[]>([]);
  const [leaderAvatarUrl, setLeaderAvatarUrl] = useState<string>('');
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);
  const [permissions, setPermissions] = useState(false);
  const [myrouteslayer, setMyRoutesLayer] = useState(false);
  const [myroutes, setMyRoutes] = useState<any[]>([]);
  const [userRoutes, setUserRoutes] = useState<any[]>([]);
  const [BikeBusStopIds, setBikeBusStopIds] = useState<DocumentReference[]>([]);
  const [bikeBusStopData, setBikeBusStopData] = useState<BikeBusStop[]>([]);
  const [PlaceLocation, setPlaceLocation] = useState('');
  const [PlaceName, setPlaceName] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [fetchedSchools, setFetchedSchools] = useState<School[]>([]);
  const [PlaceAddress, setPlaceAddress] = useState('');
  const [PlaceFormattedAddress, setPlaceFormattedAddress] = useState('');
  const [PlaceLatitude, setPlaceLatitude] = useState<number | null>(null);
  const [PlaceLongitude, setPlaceLongitude] = useState<number | null>(null);
  const [searchMarkerRef, setSearchMarkerRef] = useState<google.maps.Marker | null>(null);
  const [searchInfoWindow, setSearchInfoWindow] = useState<{ isOpen: boolean, content: { PlaceName: any, PlaceAddress: any, PlaceLatitude: number, PlaceLongitude: number } | null, position: { lat: number, lng: number } | null }>({ isOpen: false, content: null, position: null });
  const [destinationValue, setDestinationValue] = useState('');
  const [destinationInput, setDestinationInput] = useState(PlaceName);
  const [markerData, setMarkerData] = useState<MarkerType[]>([]);
  const [BikeBusGroupClusterId, setBikeBusGroupClusterId] = useState<string[]>([]);
  const [position, setPosition] = useState<Coordinate>({ lat: 41.8827, lng: -87.6227 });
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [showKmlChicagoLayer, setShowKmlChicagoLayer] = useState(false);
  const [handleChicagoLayerToggle, setHandleChicagoLayerToggle] = useState(false);
  const [endPointAddress, setEndPointAddress] = useState("");
  const [startPointName, setStartPointName] = useState("");
  const [endPointName, setEndPointName] = useState("");
  const [routeId, setRouteId] = useState('');



  const toggleKmlChicagoLayer = async () => {
    console.log('toggleKmlChicagoLayer');
    setShowKmlChicagoLayer(!showKmlChicagoLayer);
    console.log('showKmlChicagoLayer', showKmlChicagoLayer);
  };

  const kmlFileName = 'Chicago Bike Network.kml';
  const kmlUrl = `${window.location.origin}/${encodeURIComponent(kmlFileName)}`;




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
    setShowMap(true);
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
      console.log("User denied location permission.");
      setUserLocation(userLocationDefault);
      setMapCenter(userLocationDefault);
      renderMap(userLocationDefault);
    }
  };


  const getLocation = () => {
    console.log("Getting location...");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("userLocation", userLocation);
          setUserLocation(userLocation);
          renderMap(userLocation);
          // set mapCenter to userLocation
          setMapCenter(userLocation);
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

      let endPointCoordinates: any[] = [];
      let BikeBusNames: string[] = [];

      querySnapshot.docs.forEach(doc => {
        const bikeBusGroupData = doc.data();
        BikeBusNames.push(bikeBusGroupData.BikeBusName || '');
        BikeBusGroupClusterId.push(doc.id);
      });


      let BikeBusRoutesRef = querySnapshot.docs.map(doc => doc.data().BikeBusRoutes);
      BikeBusRoutesRef = BikeBusRoutesRef.flat();

      const BikeBusRoutesData: RouteData[] = [];
      for (const routeRef of BikeBusRoutesRef) {
        if (routeRef instanceof DocumentReference) {
          const routeDoc = await getDoc(routeRef);
          const routeData = routeDoc.data() as RouteData;
          BikeBusRoutesData.push(routeData);

          if (routeData && routeData.endPoint) {
            endPointCoordinates.push(routeData.endPoint);
          } else {
            console.error('routeData.endPoint is undefined');
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
              const routeData = routeSnapshot.data() as RouteData;

              if (routeData) {
                setSelectedRoute(routeData);
                setBikeBusGroupId(routeData.BikeBusGroupId.id);
                setPath(routeData.pathCoordinates);
                setStartGeo(routeData.startPoint);
                setEndGeo(routeData.endPoint);
                setBikeBusStopIds(routeData.BikeBusStopIds);
                console.log('routeData', routeData);
                console.log('BikeBusStops', bikeBusStops);
                // since we have an array of BikeBusStopIds, let's iterate through them and get the BikeBusStop data from the bikebusstop document collection

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
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('handCountEvent')
    const tripDataIdDoc = doc(db, 'event', id);
    console.log('tripDataIdDoc', tripDataIdDoc)
    // get the serverTimeStamp() and set it as eventEndTimeStamp
    const serverTimestamp = () => {
      return new Date();
    };
    await setDoc(tripDataIdDoc, { status: 'ended', tripStatus: 'ended', eventEndeventEndTimeStamp: serverTimestamp() }, { merge: true });
    const tripSnapshot = await getDoc(tripDataIdDoc);
    console.log('tripSnapshot', tripSnapshot)
    const tripData = tripSnapshot.data();
    console.log('tripData', tripData)
    const eventDataId = tripData?.eventId;
    console.log('eventDataId', eventDataId)

    const eventDataIdDoc = doc(db, 'event', eventDataId);
    console.log('eventDataIdDoc', eventDataIdDoc)
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
    console.log('tripDataIdDoc', tripDataIdDoc)
    console.log('tripData?.eventEndEventMembers', tripData?.eventEndEventMembers)
    console.log('tripData?.members', tripData?.members)
    console.log('username', username)
    console.log('eventEndeventEndTimeStamp', tripData?.eventEndeventEndTimeStamp)

    const eventDataURL = eventDataIdDoc.id;
    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('handCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const handCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the handCountEvent to the number the user inputted
    const handCountEvent = parseInt(handCountEventBox!);
    const handCountEventDoc = doc(db, 'event', id);
    console.log('handCountEventDoc', handCountEventDoc)
    await setDoc(handCountEventDoc, { handCountEvent: handCountEvent }, { merge: true });
    console.log('handCountEvent', handCountEvent)
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
      console.log('members', tripData?.members)
      console.log('username', username)
      console.log('eventEndEventMembers', tripData?.eventEndEventMembers)
    }

    const eventDataURL = tripDataIdDoc.id;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('handCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const handCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the handCountEvent to the number the user inputted
    const handCountEvent = parseInt(handCountEventBox!);
    const handCountEventDoc = doc(db, 'event', id);
    console.log('handCountEventDoc', handCountEventDoc)
    await setDoc(handCountEventDoc, { handCountEvent: handCountEvent }, { merge: true });
    console.log('handCountEvent', handCountEvent)

    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    history.push(eventSummaryUrl);

  };

  const endBikeBusAndCheckOutAll = async () => {
    const tripDataIdDoc = doc(db, 'event', id);
    console.log('tripDataIdDoc', tripDataIdDoc)
    // get the serverTimeStamp() and set it as eventEndTimeStamp
    const serverTimestamp = () => {
      return new Date();
    };
    await setDoc(tripDataIdDoc, { status: 'ended', tripStatus: 'ended', eventEndeventEndTimeStamp: serverTimestamp() }, { merge: true });
    const tripSnapshot = await getDoc(tripDataIdDoc);
    console.log('tripSnapshot', tripSnapshot)
    const tripData = tripSnapshot.data();
    console.log('tripData', tripData)
    const eventDataId = tripDataIdDoc;
    console.log('eventDataId', eventDataId)

    const eventDataIdDoc = doc(db, 'event', id);
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
    console.log('tripDataIdDoc', tripDataIdDoc)
    console.log('tripData?.eventEndEventMembers', tripData?.eventEndEventMembers)
    console.log('tripData?.members', tripData?.members)
    console.log('username', username)
    console.log('eventEndeventEndTimeStamp', tripData?.eventEndeventEndTimeStamp)
    const eventDataURL = eventDataIdDoc.id;
    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('handCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const handCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the handCountEvent to the number the user inputted
    const handCountEvent = parseInt(handCountEventBox!);
    const handCountEventDoc = doc(db, 'event', id);
    console.log('handCountEventDoc', handCountEventDoc)
    await setDoc(handCountEventDoc, { handCountEvent: handCountEvent }, { merge: true });
    console.log('handCountEvent', handCountEvent)
    history.push(eventSummaryUrl);

  };

  const endBikeBusAndCheckOut = async () => {
    const tripDataIdDoc = doc(db, 'event', id);

    const tripSnapshot = await getDoc(tripDataIdDoc);
    const tripData = tripSnapshot.data();


    await setDoc(tripDataIdDoc, {
      JoinedMembersCheckOut: arrayUnion(username)
    }, { merge: true });
    console.log('tripData', tripData)

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
      console.log('members', tripData?.members)
      console.log('username', username)
      console.log('eventEndEventMembers', tripData?.eventEndEventMembers)
    }

    const eventDataURL = tripDataIdDoc.id;

    const eventSummaryUrl = `/eventsummary/${eventDataURL}`;
    // in case nobody actually checks in, we need the leader to be able to input a number to represent the number of people on the trip ('handCountEvent')
    // first, show a dialog box for the user in case they want to input a number for the number of people on the trip
    const handCountEventBox = window.prompt('Please enter the number of people on the trip', '0');
    // then set the handCountEvent to the number the user inputted
    const handCountEvent = parseInt(handCountEventBox!);
    // save the handCountEvent to the database
    const handCountEventDoc = doc(db, 'event', id);
    console.log('handCountEventDoc', handCountEventDoc)
    await setDoc(handCountEventDoc, { handCountEvent: handCountEvent }, { merge: true });
    console.log('handCountEvent', handCountEvent)
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
          const routes: RouteData[] = [];
          const allBikeBusStops: BikeBusStop[] = [];

          for (const doc of querySnapshot.docs) {
            const routeData = doc.data() as RouteData;
            routes.push(routeData);

            const bikeBusStopIds = routeData.BikeBusStopIds;
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
            const userRouteData = doc.data();
            routes.push(userRouteData);
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
          console.log(place.formatted_address)
          console.log(PlaceAddress)
          setRouteEndFormattedAddress(`${place.formatted_address}` ?? { PlaceAddress });
          console.log('routeEndFormattedAddress', routeEndFormattedAddress);
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
    // let's show a message to the user that we're getting directions
    window.alert("The blue line on the map allows you to drag the route to change it. After the route is saved by clicking 'Create Route', you can modify the route");
    return new Promise(async (resolve, reject) => {
      if (selectedStartLocation && selectedEndLocation) {
        console.log("getDirections called");
        console.log("selectedStartLocation: ", selectedStartLocation);
        console.log("selectedEndLocation: ", selectedEndLocation);
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

              directionsRenderer.setOptions({
                draggable: true,
                preserveViewport: true,
              });

              directionsRenderer.addListener('directions_changed', () => {
                // did the user drag the route?
                const newDirections = directionsRenderer.getDirections();
                const newRoute = newDirections?.routes[0];
                if (newRoute?.overview_path) {
                  const newRoutePathPoints: LatLng[] = newRoute.overview_path.map((latLng: any) => ({
                    latitude: latLng.lat(),
                    longitude: latLng.lng(),
                  }));
                  const newSimplifiedPathPoints = ramerDouglasPeucker(newRoutePathPoints, epsilon);

                  // Update pathCoordinates state
                  setPathCoordinates(newRoutePathPoints);
                  resolve(newSimplifiedPathPoints);
                }
              });
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


  const createRoute = async () => {
    try {
      console.log("createRoute called");
      console.log("selectedEndLocation: ", selectedEndLocation);
      const startPointAddress = await getStartPointAddress(selectedStartLocation);

      // Check if selectedEndLocation is not null before calling getEndPointAddress
      let endPointAddress = '';
      if (selectedEndLocation) {
        endPointAddress = await getEndPointAddress(selectedEndLocation);
      }
      // Verify user and locations
      if (!user || !selectedStartLocation || !selectedEndLocation) {
        throw new Error('Required user and location data is missing');
      }

      if (user) {

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
                  startPointAddress: startPointAdress,
                  startPoint: selectedStartLocation,
                  endPoint: selectedEndLocation,
                  // if routeStartName is '', then set the routeStartName to be startPointAddress
                  routeName: `${routeStartName ? routeStartName + ' on ' : ''}${routeStartStreetName} to ${routeEndName}`,

                  startPointName: routeStartName,
                  startPointStreetName: routeStartStreetName,
                  routeEndStreetName: routeEndStreetName,
                  endPointName: routeEndName,
                  endPointAddress: endPointAddress,
                  routeCreator: "/users/" + user.uid,
                  routeLeader: "/users/" + user.uid,
                  routeDescription: description,
                  pathCoordinates: convertedPathCoordinates,
                  isBikeBus: false,
                };
                console.log("Route Data: ", routeData);
                console.log("routeName: ", routeStartName + " to " + routeEndName);
                handleCreateRouteSubmit("", startPointAddress, endPointAddress);
              } else {
                console.error("Directions request failed due to " + status);
              }
            }
          );
        }
      }
    } catch (error) {
      console.log("Error: ", error);
      console.log("createRoute called");
      console.log("selectedStartLocation: ", selectedStartLocation);
    }
  };


  const handleCreateRouteSubmit = async (routeType = "", startPointAddress: string, endPointAddress: string) => {
    try {

      if (user) {

        const convertedPathCoordinates = pathCoordinates.map(coord => ({
          lat: coord.latitude,
          lng: coord.longitude,
        }));
        console.log("convertedPathCoordinates: ", convertedPathCoordinates);
        console.log("routeType: ", routeType);
        console.log("user.uid: ", user?.uid);

        const routeDocRef = await addDoc(collection(db, 'routes'), {
          routeName: `${routeStartName ? routeStartName + ' on ' : ''}${routeStartStreetName} to ${routeEndName}`,
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
          startPointName: startPointAddress,
          endPointName: routeEndName,
          startPointAddress: startPointAddress,
          endPointAddress: endPointAddress,
          distance: distance,
        });


        console.log("routeName: ", routeStartName + " to " + routeEndName);
        console.log("routeDocRef: ", routeDocRef);
        // if this is not part of the open trip feature, then redirect to the view route page
        // if route is not "Open Trip", then redirect to the view route page
        // also set the converterPathCoordinates to the pathCoordinates to be used throughout document
        console.log("Route created with ID: ", routeDocRef.id);
        if (routeType !== "openTrip") {
          history.push(`/viewroute/${routeDocRef.id}`);
        }
        return routeDocRef;
      }
    } catch (error) {
      console.log("Error: ", error);
    }
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
    console.log("events: ", events);
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

  const handleBikeBusRouteClusterClick = async (route: any) => {
    console.log("Function handleBikeBusRouteClusterClick triggered");
    // let's get the events for this bikebus group
    const bikeBusGroupId = route;
    console.log("bikeBusGroupId: ", bikeBusGroupId);
    try {
      console.log("bikebusgroups document id ", route);

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
      console.log("bikeBusGroupData: ", bikeBusGroupData);

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
      console.log("events: ", events);
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
          const routeData = doc.data() as RouteData;
          console.log("routeData: ", routeData);
          // set routeData to the routeData from the document reference
          setEndPoint(routeData?.endPoint);
          setPosition(routeData?.endPoint);
          setMapCenter(routeData?.endPoint);
          console.log("routeData?.endPoint: ", routeData?.endPoint);
        }
      });

      // ensure the position is set before we set the infoWindow
      console.log("position: ", position);
      console.log("content: ", content);

      setInfoWindow({ isOpen: true, content, position });
      console.log("InfoWindow state: ", infoWindow);

      console.log("Before update: ", infoWindow);
      setInfoWindowClusterBikeBus({ isOpen: true, content, position });
      console.log("After update: ", infoWindow);

    } catch (error) {
      console.log("Error: ", error);
    }
  };


  const handleUserRouteClick = async (route: any) => {
    console.log("handleUserRouteClick called");
    console.log("route: ", route);
    console.log("routeName: ", route.routeName);

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
      console.log("foundRouteId: ", foundRouteId);
    });

    // Check if a route ID was found
    if (foundRouteId) {
      console.log("foundRouteId: ", foundRouteId);
      setRouteId(foundRouteId); // Set the state with the found route ID
      console.log("routeId: ", routeId);
      console.log("route.id: ", route.id);
    } else {
      console.error("No document found for routeName:", routeName);
      return;
    }
    console.log("handleUserRouteClick called");
    console.log("route: ", route);


    const content = `
    <div style="margin-top: 1px;">
      <H4>${route.routeName}</H4>
      <div style="margin-top: 10px;">
        <button id="viewRoute">View Route</button>
        <button id="editRoute">Edit Route</button>
        <button id="deleteRouteButton">Delete Route</button>
      </div>
      <div style="margin-top: 10px;">
        <button id="viewRouteClip">View Route Clip</button>
        <button id="createBikeBus">Create BikeBus</button>
      </div>
    `;

    // Set position to the startPoint of the route
    const position = route.startPoint;

    // Open an InfoWindow at the startPoint of the route
    setInfoWindow({ isOpen: true, content, position });
    setTimeout(() => {
      const deleteButton = document.getElementById('deleteRouteButton');
      if (deleteButton) {
        deleteButton.onclick = () => {
          if (routeId) { // Use the state variable here
            deleteRoute(routeId);
          } else {
            console.error('No ID found for route:', route);
          }
        };
      }
      const viewRouteButton = document.getElementById('viewRoute');
      if (viewRouteButton) {
        viewRouteButton.onclick = () => {
          if (routeId) { // Use the state variable here
            history.push(`/viewroute/${routeId}`);
          } else {
            console.error('No ID found for route:', route);
          }
        };
      }
    }, 0);
  };

  const deleteRoute = async (routeId: string) => {
    console.log("deleteRoute called");
    const routeRef = doc(db, 'routes', routeId);
    await deleteDoc(routeRef);
    alert('Route Deleted');
    history.push('/Map/');
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
    console.log("handleClusterClick called");
    // when the cluster is clicked, we want to zoom in on the cluster
    // get the cluster's center
    const clusterCenter = cluster.center;
    // set the mapCenter to the clusterCenter
    setMapCenter(clusterCenter);
    // set the mapZoom to 13
    setMapZoom(13);
    console.log("clusterCenter: ", clusterCenter);
  };


  const handleCloseOpenTripClick = () => {
    console.log("handleCloseOpenTripClick called");
    setInfoWindowOpenTrip({ isOpen: false, content: '', position: null, trip: null });
  };

  const handleCloseClick = () => {
    console.log("handleCloseClick called");
    setInfoWindow({ isOpen: false, content: '', position: null });
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


  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    const schoolName = place.name;
    setSchoolName(schoolName || null);
  };

  const handlePhotos = (photos: string) => {
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
  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent>
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
                minZoom: 8,
                maxZoom: 18,
                mapId: 'b75f9f8b8cf9c287',
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
                          <IonButton onClick={getLocation}>
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
                          scaledSize: new google.maps.Size(260, 20),
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

                    {route.startPoint && (
                      <Marker
                        key={`${keyPrefix}-start`}
                        label={`${route.routeName}`}
                        position={route.startPoint}
                        icon={{
                          url: generateSVGUserRoutes(route.routeName),
                          scaledSize: new google.maps.Size(260, 20),
                        }}
                        onClick={() => handleUserRouteClick(route)}
                      />
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
                        label={`${route.BikeBusName}`}
                        position={route.startPoint}
                        icon={{
                          url: generateSVGBikeBus(route.BikeBusName),
                          scaledSize: new google.maps.Size(260, 20),
                        }}
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
              <Sidebar
                mapRef={mapRef}
                toggleKmlChicagoLayer={toggleKmlChicagoLayer}
                handleChicagoLayerToggle={() => handleChicagoLayerToggle}
                showKmlChicagoLayer={showKmlChicagoLayer}
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
              <Polyline
                path={pathCoordinates.map(coord => ({ lat: coord.latitude, lng: coord.longitude }))}
                options={{
                  strokeColor: "#FF0000",
                  strokeOpacity: 1.0,
                  strokeWeight: 2,
                  geodesic: true,
                  clickable: false,
                  editable: false,
                  draggable: false,
                }}
              />
              {showKmlChicagoLayer && (
                <KmlLayer
                  url={kmlUrl}
                  options={{
                    preserveViewport: true,
                    suppressInfoWindows: false,
                    clickable: true,
                  }}
                />
              )}
            </GoogleMap>
          </IonRow>
        )
        }
      </IonContent >
    </IonPage >
  );

}

export default Map;