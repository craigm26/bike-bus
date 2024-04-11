import {
  IonContent,
  IonPage,
  IonItem,
  IonInput,
  IonLabel,
  IonButton,
  IonTitle,
  IonSelect,
  IonSelectOption,
  IonCol,
  IonRow,
  IonGrid,
  IonHeader,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonToggle,
  IonModal,
  IonButtons,
  IonList,
  IonIcon,
} from '@ionic/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { db } from '../firebaseConfig';
import { DocumentReference, addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc, } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import SidebarEditRoute from "../components/Mapping/SidebarEditRoute";
import { GoogleMap, useJsApiLoader, Marker, Polyline, StandaloneSearchBox, OverlayView } from '@react-google-maps/api';
import React from 'react';
import { AuthContext } from '../AuthContext';
import { bicycle, playCircle, handRightOutline, pauseCircle } from 'ionicons/icons';

const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

interface DistanceDurationResult {
  distance: string;
  duration: string;
  arrivalTime: string;
}

type DirectionsWaypoint = {
  location: google.maps.LatLng | google.maps.LatLngLiteral;
};


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
  id?: string; // Now includes an optional id
  startPoint: Coordinate | google.maps.LatLng;
  endPoint: Coordinate | google.maps.LatLng;
  distance?: string;
  duration?: string;
}



const EditRoute: React.FC = () => {
  const { user, loadingAuthState } = useContext(AuthContext);
  const [selectedRoute, setSelectedRoute] = useState<Route>();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const bicyclingLayerRef = useRef<google.maps.BicyclingLayer | null>(null);

  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });

  const [isClicked, setIsClicked] = useState<boolean>(false);
  const [bicyclingSpeed, setBicyclingSpeed] = useState<string>("");
  const [bicyclingSpeedSelector, setBicyclingSpeedSelector] = useState<string>("");
  const [travelModeSelector, setTravelModeSelector] = useState<string | null>(null);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [pathCoordinates, setPathCoordinates] = useState<{ lat: number; lng: number; }[]>([]);
  const [directionsFetched, setDirectionsFetched] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const [isBicyclingLayerVisible, setIsBicyclingLayerVisible] = useState(false);
  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);
  };

  const [showInfoStopModal, setshowInfoStopModal] = useState(false);
  // Assuming you're trying to store a Google Maps Polyline instance
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [bikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [leg, setLeg] = useState<RouteLeg | null>(null);
  const [bikeBusStopName, setBikeBusStopName] = useState<string>('');
  const [waypoints, SetWaypoints] = useState<DirectionsWaypoint[]>([]);
  const [updatedPath, setUpdatedPath] = useState<{ lat: number; lng: number; }[]>([]);
  const [route, setRoute] = useState<{ pathCoordinates: { lat: number; lng: number; }[]; distance: string; duration: string } | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState<boolean>(false);
  const [bicyclingLayerEnabled, setBicyclingLayerEnabled] = useState(false);
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [routeLegsEnabled, setRouteLegsEnabled] = useState(true);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(13);
  const [timingSidebarEnabled, setTimingSidebarEnabled] = useState(true);
  const [bikeBusStopOrder, setBikeBusStopOrder] = useState<number>(0);



  const containerMapStyle = {
    width: '100%',
    height: '100%',
  };

  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {

    setAutocompleteStart(ref);
  };

  // if the field isbikeBus is set to true, then make the isBikeBus variable true
  const isBikeBus = selectedRoute?.isBikeBus ?? false;

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const fetchBikeBusStops = async () => {
    // first let's get the bikebusstop documents from the selectedRoute.BikeBusStops
    const BikeBusStopsSnapshot = await getDocs(collection(db, 'routes', id, 'BikeBusStops'));
    // now we want to map through the BikeBusStopsSnapshot and return the data and then set to state
    const BikeBusStops = BikeBusStopsSnapshot.docs.map((doc) => {

      const data = doc.data() as any; // use 'any' temporarily to bypass type checking
      // Assume 'location' is a GeoPoint, extract 'latitude' and 'longitude'
      const location = data.location; // This should be a Firestore GeoPoint
      return {
        ...doc.data() as BikeBusStop,
        id: doc.id,
        location: {
          lat: location.latitude,
          lng: location.longitude,
        },
      };
    });
    // Assuming there is a way to determine the correct order of the stops, for example, by a 'sequence' field

    setBikeBusStops(BikeBusStops.sort((a, b) => a.order - b.order));

    // since we're setting BikeBusStops, let's also set the waypoints
    const waypoints = BikeBusStops.map(stop => ({
      location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
      stopover: true,
    }));
    SetWaypoints(waypoints);

    // since we're setting BikeBusStops, let's also fetch the existing legs of the route
    const legsRef = collection(db, 'routes', id, 'legs');
    const legsSnapshot = await getDocs(legsRef);
    const legs = legsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as RouteLeg }));
    setRouteLegs(legs);


  };

  // when the map is loading, set startGeo to the route's startPoint
  useEffect(() => {
    if (selectedRoute) {
      setStartGeo(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
      setMapCenter(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
      setRouteStartFormattedAddress(selectedRoute.startPointAddress);
      setRouteEndFormattedAddress(selectedRoute.endPointAddress);
      setRouteStartName(selectedRoute.startPointName);
      setRouteEndName(selectedRoute.endPointName);
      setBicyclingSpeed(selectedRoute.bicyclingSpeed);
      setBicyclingSpeedSelector(selectedRoute.bicyclingSpeedSelector);
      setTravelModeSelector(selectedRoute.travelMode);
      setPathCoordinates(selectedRoute.pathCoordinates.map(coord => ({
        lat: coord.lat,
        lng: coord.lng,
      })));
      setDistance(selectedRoute.distance);
      setDuration(selectedRoute.duration);
    }

  }
    , [selectedRoute]);

  const onPlaceChangedStart = () => {
    if (autocompleteStart !== null) {
      const places = autocompleteStart.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          setSelectedStartLocation({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          });
          setRouteStartName(`${place.name}` ?? '');
          setRouteStartFormattedAddress(`${place.formatted_address}` ?? '');
          // need to set startPointAddress to the address of the selected start point
          // need to set startPointName to the name of the selected start point

        }
      }
    }
  };

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
          setRouteEndName(`${place.name}` ?? '');
          setRouteEndFormattedAddress(`${place.formatted_address}` ?? '');

        }
      }
    }
  };

  const fetchSingleRoute = async (id: string) => {
    const docRef = doc(db, 'routes', id);
    const docSnap = await getDoc(docRef);


    if (docSnap.exists()) {
      const routeData = {
        ...docSnap.data() as Route,
        id: docSnap.id,
        routeName: docSnap.data().routeName,
        startPoint: docSnap.data().startPoint,
        startGeo: docSnap.data().startPoint,
        endGeo: docSnap.data().endPoint,
        endPoint: docSnap.data().endPoint,
        BikeBusStops: docSnap.data().BikeBusStops,
        BikeBusGroupId: docSnap.data().BikeBusGroupId,
        pathCoordinates: docSnap.data().pathCoordinates,
        travelMode: docSnap.data().travelMode,
        bicyclingSpeed: docSnap.data().bicyclingSpeed,
        bicyclingSpeedSelector: docSnap.data().bicyclingSpeedSelector,
        distance: docSnap.data().distance,
        duration: docSnap.data().duration,
        routeCreator: docSnap.data().routeCreator,
      };
      // we want to console log BikeBusStops to see if it's an array of BikeBusStops
      setSelectedRoute(routeData);

      if (routeData.routeCreator !== user.uid) {
        alert('You are not the creator of this route');
        history.push('/ViewRoute/' + id);
      }
    }
  };


  useEffect(() => {

    if (id) fetchSingleRoute(id);

    fetchBikeBusStops();

    const bikeBusStopsRef = collection(db, 'routes', id, 'BikeBusStops');
    // now we can console.log the bikeBusStopsRef to see if it's a collection reference
    // we can use the getDocs function to get the documents from the collection reference
    const bikeBusStopsSnapshot = getDocs(bikeBusStopsRef);
    // we should also fetch the legs of the route in the id of the route as a subcollection called "legs"
    const legsRef = collection(db, 'routes', id, 'legs');
    // now we can console.log the legsRef to see if it's a collection reference
    // we can use the getDocs function to get the documents from the collection reference
    const legsSnapshot = getDocs(legsRef);

    // set bikeBusStops as waypoints
    const waypoints = bikeBusStops.map(stop => ({
      location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
      stopover: true,
    }));
    SetWaypoints(waypoints);

  }
    , [id]);




  function perpendicularDistance(point: Coordinate, linePoint1: Coordinate, linePoint2: Coordinate): number {
    const { lat: x, lng: y } = point;
    const { lat: x1, lng: y1 } = linePoint1;
    const { lat: x2, lng: y2 } = linePoint2;

    const area = Math.abs(0.5 * (x1 * y2 + x2 * y + x * y1 - x2 * y1 - x * y2 - x1 * y));
    const bottom = Math.hypot(x1 - x2, y1 - y2);
    const height = (2 * area) / bottom;

    return height;
  }

  function ramerDouglasPeucker(pointList: Coordinate[], epsilon: number): Coordinate[] {
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



  //calculate route without legs
  const calculateRoute = async (startPoint: Coordinate, endPoint: Coordinate, waypoints: google.maps.DirectionsWaypoint[], travelMode: google.maps.TravelMode, bicyclingSpeed: number,
  ): Promise<{ pathCoordinates: { lat: number; lng: number; }[]; distance: string; duration: string }> => {


    const directionsService = new google.maps.DirectionsService();
    let totalDistance = 0; // in meters
    let totalDuration = 0; // in seconds

    const request = {
      origin: startPoint,
      destination: endPoint,
      waypoints: waypoints,
      travelMode: travelMode,
    };

    if (!startPoint || !endPoint) {
      console.warn("Missing startPoint or endPoint!");
      throw new Error("Missing startPoint or endPoint!");
    }
    // now inspect the type that is returned from startPoint and endPoint

    const batchSize = 10;
    const batches = [];
    const epsilon = 0.00005; // Define epsilon for Douglas-Peucker algorithm. Distance in degrees. 0.00005 is about 5.5 meters.
    const routeRequests = [];

    for (let i = 0; i < waypoints.length; i += batchSize) {
      const batch: google.maps.DirectionsWaypoint[] = waypoints.slice(i, Math.min(i + batchSize, waypoints.length));
      if (i !== 0) {
        batch.unshift(waypoints[i - 1]);
      }
      if (i + batchSize < waypoints.length) {
        batch.push(waypoints[i + batchSize]);
      }
      batches.push(batch);
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const origin = batch.length > 0 ? batch[0].location : undefined;
      const destination = batch.length > 0 ? batch[batch.length - 1].location : undefined;

      if (!origin || !destination) {
        console.warn("Origin or Destination is missing in batch!");
        return {
          pathCoordinates: [],
          distance: "0",
          duration: "0",
        };
      }

      // Modified slicing logic
      const batchWaypoints = batch.length <= 2 ? batch : batch.slice(1, batch.length - 1);


      // Debugging for empty array
      if (batchWaypoints.length === 0) {
        console.warn("batchWaypoints is empty!");
      }
      // deeply inspect the batchWaypoints array
      if (origin && destination) {
        // If batchWaypoints is empty, it will just route from origin to destination
        routeRequests.push(new Promise<Coordinate[]>((resolve, reject) => {
          directionsService.route({
            origin: startPoint,
            destination: endPoint,
            waypoints: batchWaypoints,
            optimizeWaypoints: false,
            travelMode: travelMode,
          }, (response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
            if (status === google.maps.DirectionsStatus.OK && response) {
              const newRoute = response.routes[0];
              let newRoutePathCoordinates = newRoute.overview_path.map(coord => ({ lat: coord.lat(), lng: coord.lng() }));
              newRoutePathCoordinates = ramerDouglasPeucker(newRoutePathCoordinates, epsilon);
              resolve(newRoutePathCoordinates);
              // log the response and status from the directionsService.route
            } else {
              reject('Directions request failed due to ' + status);
            }
          });
        }));
      }

      // we have to figure out how to get the distance and duration for the new route
      // we can use the same function calculateDistanceAndDuration
      // we can also use the same function getDirectionsAndSimplifyRoute

    }


    const calculateRouteLegs = async (startPoint: Coordinate, endPoint: Coordinate, BikeBusStops: BikeBusStop[]) => {
      let legs: RouteLeg[] = [];
      let currentStart = startPoint;



      for (let i = 0; i <= BikeBusStops.length; i++) {
        // Example of accessing lat and lng
        const currentEnd = i < BikeBusStops.length ? { lat: BikeBusStops[i].location.lat, lng: BikeBusStops[i].location.lng } : endPoint;
        const leg: RouteLeg = {
          startPoint: currentStart,
          endPoint: currentEnd,
        };
        // Calculate distance and duration for the leg
        const { pathCoordinates, distance, duration } = await calculateRoute(currentStart, currentEnd, [], travelMode, bicyclingSpeed);
        leg.distance = distance;
        leg.duration = duration;

        legs.push(leg);
        currentStart = currentEnd;
      }

      return legs;
    };

    try {
      const { routes } = await directionsService.route(request);
      const route = routes[0];
      route.legs.forEach(leg => {
        if (leg.distance && leg.duration) {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        }
      });

      // Convert to desired units if necessary
      const distanceInMiles = totalDistance / 1609.34; // meters to miles
      const durationInMinutes = totalDuration / 60; // seconds to minutes

      return {
        pathCoordinates: route.overview_path.map(coord => ({ lat: coord.lat(), lng: coord.lng() })),
        distance: distanceInMiles.toFixed(2), // rounded to 2 decimal places
        duration: durationInMinutes.toFixed(2), // rounded to 2 decimal places
      };
    } catch (error) {
      console.error("Failed to calculate route:", error);
      return {
        pathCoordinates: [], // Default value if route calculation fails
        distance: "0",       // Default value
        duration: "0",       // Default value
      };
    }

  }



  const calculateDistanceAndDuration = (origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, travelMode: string, speedSelector: string, waypoints: google.maps.DirectionsWaypoint[] = []): Promise<DistanceDurationResult> => {

    return new Promise<DistanceDurationResult>((resolve, reject) => {
      // how do we pass in waypoints to the calculateDistanceAndDuration function?


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
          setDuration(formatDurationToFixed(durationInMinutes.toString()));

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


  // build a function that takes in the updatedPath and calculates the distance and duration
  const calculateDistanceAndDurationOnUpdatedPath = (origin: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, destination: string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place, travelMode: string, speedSelector: string, waypoints: google.maps.DirectionsWaypoint[] = []): Promise<DistanceDurationResult> => {

    return new Promise<DistanceDurationResult>((resolve, reject) => {
      // how do we pass in the updatedPath and/or waypoints to the calculateDistanceAndDuration function?

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
          setDuration(formatDurationToFixed(durationInMinutes.toString()));

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
  }


  const getSpeedAdjustmentFactor = (speedSelector: any) => {
    switch (speedSelector) {
      case "VERY SLOW": return 1.2;
      case "SLOW": return 1.1;
      case "MEDIUM": return 1;
      case "FAST": return 0.9;
      default: return 1; // Default to no adjustment
    }
  };


  const getDirectionsAndSimplifyRoute = async () => {
    await fetchBikeBusStops();

    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }

    try {
      const travelMode = selectedRoute.travelMode;
      console.log(waypoints);

      if (!selectedRoute || !selectedRoute.endPoint) {
        console.error("End point is not defined.");
        return;
      }

      // Now that we've confirmed selectedRoute and selectedRoute.endPoint exist, use them
      const endPointToSave = {
        lat: selectedRoute.endPoint.lat, // Accessing lat of endPoint from selectedRoute
        lng: selectedRoute.endPoint.lng  // Accessing lng of endPoint from selectedRoute
      };

      const calculateRouteLegs = async (startPoint: { lat: number; lng: number; }, endPoint: Coordinate, waypoints: string | any[], travelMode: string) => {
        let legs = [];

        // Starting point for the first leg is the route's starting point
        let currentStart = startPoint;

        // Iterate over each waypoint to calculate the leg to it from the current start
        for (let i = 0; i < waypoints.length; i++) {
          const legEndPoint = waypoints[i].location;
          const legResult = await calculateRoute(currentStart, legEndPoint, [], google.maps.TravelMode[travelMode as keyof typeof google.maps.TravelMode], 0);
          legs.push({
            startPoint: currentStart,
            endPoint: legEndPoint,
            distance: legResult.distance, // Assuming calculateRoute returns an object with distance and duration
            duration: legResult.duration,
          });
          // Update currentStart to the end of the last leg
          currentStart = legEndPoint;
        }

        // Calculate the final leg from the last waypoint to the route's end point
        const finalLegResult = await calculateRoute(currentStart, endPoint, [], google.maps.TravelMode[travelMode as keyof typeof google.maps.TravelMode], 0);
        legs.push({
          startPoint: currentStart,
          endPoint: endPoint,
          distance: finalLegResult.distance,
          duration: finalLegResult.duration,
        });

        return legs;
      };

      // Now call calculateRouteLegs with the correct arguments
      const legs = await calculateRouteLegs(selectedRoute.startPoint, selectedRoute.endPoint, waypoints, selectedRoute.travelMode);

      console.log("Calculated Legs:", legs);

      const adjustDurationByBicyclingSpeed = (durationInSeconds: number, bicyclingSpeedSelector: string): number => {
        const speedFactor = getSpeedAdjustmentFactor(bicyclingSpeedSelector);
        const adjustedDuration = durationInSeconds * speedFactor;
        // update the duration in the RouteLeg object while also rounding to 2 decimal places
        setDuration(formatDurationToFixed(adjustedDuration.toString()));
        return adjustedDuration;
      };

      // since we have the leg durations, we need to adjust the duration based on the bicyclingSpeedSelector
      legs.forEach(leg => {
        leg.duration = adjustDurationByBicyclingSpeed(Number(leg.duration), selectedRoute.bicyclingSpeedSelector).toString();
      });

      const saveRouteLegsToFirebase = async (routeId: string, legs: RouteLeg[]) => {
        const legsRef = collection(db, `routes/${routeId}/legs`);
        const saveRouteLeg = async (leg: RouteLeg) => {
          const startPointLat = typeof leg.startPoint.lat === 'function' ? leg.startPoint.lat() : leg.startPoint.lat;
          const startPointLng = typeof leg.startPoint.lng === 'function' ? leg.startPoint.lng() : leg.startPoint.lng;
          const endPointLat = typeof leg.endPoint.lat === 'function' ? leg.endPoint.lat() : leg.endPoint.lat;
          const endPointLng = typeof leg.endPoint.lng === 'function' ? leg.endPoint.lng() : leg.endPoint.lng;

          const legToSave = {
            ...leg,
            startPoint: { lat: startPointLat, lng: startPointLng },
            endPoint: { lat: endPointLat, lng: endPointLng },
          };

          // Assuming 'legsRef' is a Firestore collection reference where you're saving legs
          await addDoc(legsRef, legToSave);
        };
      };



      saveRouteLegsToFirebase(selectedRoute.id, legs);


      setDirectionsFetched(true);
    } catch (error) {
      console.error("Failed to get directions and simplify route:", error);
      alert("Error getting directions and simplifying route.");
    }
  };

  const getNumber = (value: number | (() => number)): number => typeof value === 'function' ? value() : value;


  useEffect(() => {

    const updateRouteInformation = async () => {

      if (selectedRoute) {
        const origin = selectedRoute.startPoint;
        const destination = selectedRoute.endPoint;
        const travelMode = selectedRoute.travelMode;
        // get the current state of the speedSelector from the UI and pass it to the function
        const speedSelector = bicyclingSpeedSelector;
        // we also need to pass the bikebusstop waypoints to the function

        try {
          // somehow, we need to pass in waypoints to the calculateDistanceAndDuration function
          const { distance, duration } = await calculateDistanceAndDuration(origin, destination, travelMode, speedSelector, waypoints);
          // Update state or UI with calculated distance and duration
          setDistance(distance);
          // Example of setting duration state with formatting
          setDuration(formatDurationToFixed(duration));
          setBicyclingSpeed(bicyclingSpeed);
          return { distance, duration };
        } catch (
        error
        ) {
          console.error("Failed to calculate distance and duration:", error);
          // Optionally, handle setting state to reflect the error to the user
        }
      }
    };

    updateRouteInformation();

  }, [bicyclingSpeedSelector]);

  const formatDuration = (duration: string | undefined) => {
    const durationNumber = Number(duration);
    if (isNaN(durationNumber)) {
      return '0.00'; // Return a default or error value if the conversion fails
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2, // Minimum number of digits after the decimal
      maximumFractionDigits: 2, // Maximum number of digits after the decimal
    }).format(durationNumber);
  };



  const adjustDurationByBicyclingSpeed = (duration: string | number | undefined, speedSelector: any): number => {
    const adjustmentFactor = getSpeedAdjustmentFactor(speedSelector);
    return (Number(duration) || 0) * adjustmentFactor; // Assuming 'duration' is numeric
  };



  const adjustLegDurationsForSpeed = (newSpeedSelector: any) => {
    const adjustedLegs = routeLegs.map(leg => {
      const adjustedDuration = adjustDurationByBicyclingSpeed(leg.duration?.toString() ?? '0', newSpeedSelector); // Convert duration to string and provide default value of '0'
      return { ...leg, duration: adjustedDuration.toString() }; // Convert adjustedDuration to string
    });

    setRouteLegs(adjustedLegs);
  };


  const handleUpdateClick = async (stopId: string, updatedName: string, updatedOrder: number) => {
    console.log({ db, routeId: id, stopId, updatedName, updatedOrder });

    try {
      // Update the BikeBusStop in Firestore
      await updateDoc(doc(db, 'routes', id, 'BikeBusStops', stopId), {
        BikeBusStopName: updatedName,
        order: updatedOrder,
      });
      alert("BikeBusStop updated successfully.");
      // Refresh map
      fetchBikeBusStops();
    } catch (error) {
      console.error("Error updating BikeBusStop:", error);
      alert("Error updating BikeBusStop.");
    }
  };


  const handleDeleteClick = async (stopId: string) => {
    console.log({ db, routeId: id, stopId });
    // Confirm the delete operation
    if (window.confirm("Are you sure you want to delete this BikeBusStop?")) {
      try {
        await deleteDoc(doc(db, 'routes', id, 'BikeBusStops', stopId));
        // Filter out the deleted stop from the local state to update the UI
        setBikeBusStops(bikeBusStops.filter(stop => stop.id !== stopId));
        alert("BikeBusStop deleted successfully.");
      } catch (error) {
        console.error("Error deleting BikeBusStop:", error);
        alert("Error deleting BikeBusStop.");
      }
    }
  };

  const handleBikeBusStopClick = async (BikeBusStop: BikeBusStop) => {
    setshowInfoStopModal(true);
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


  const formatDurationToFixed = (duration: string) => {
    // Convert to number if it's a string
    const numDuration = typeof duration === 'string' ? parseFloat(duration) : duration;
    // Return as a string formatted to two decimal places
    return numDuration.toFixed(2);
  };


  const handleRouteSave = async () => {

    if (!selectedRoute) {
      console.error("No route selected.");
      return;
    }
    // test to see if updatedPath is an empty array or filled in
    console.log("Updated path coordinates:", updatedPath);

    adjustLegDurationsForSpeed(bicyclingSpeedSelector);


    // if it's filled in, then we want to use the updatedPath instead of the pathCoordinates
    // we also want to use the updatedPath for the pathCoordinates in the Firestore document
    if (updatedPath.length > 0 && bikeBusStops.length < 1) {
      setPathCoordinates(updatedPath);
      // also, we need to recalculate the distance and duration using the updatedPath on calculateDistanceAndDurationOnUpdatedPath
      const origin = selectedRoute.startPoint;
      const destination = selectedRoute.endPoint;
      const travelMode = selectedRoute.travelMode;
      const speedSelector = selectedRoute.bicyclingSpeedSelector;
      const waypoints = updatedPath.map(coord => ({
        location: new google.maps.LatLng(coord.lat, coord.lng),
        stopover: true,
      }));
      const { distance, duration } = await calculateDistanceAndDurationOnUpdatedPath(origin, destination, travelMode, speedSelector, waypoints);
      setDistance(distance);
      // Example of setting duration state with formatting
      setDuration(formatDurationToFixed(duration));

    }

    // let's do the same above action but with bikeBusStops
    if (bikeBusStops.length > 0) {
      // we need to set the waypoints to the bikeBusStops
      const waypoints = bikeBusStops.map(stop => ({
        location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
        stopover: true,
      }));
      // we need to set the updatedPath to the pathCoordinates of the route
      const updatedPath = pathCoordinates;
      // we need to set the pathCoordinates to the updatedPath
      setPathCoordinates(updatedPath);
      // we need to recalculate the distance and duration using the updatedPath on calculateDistanceAndDurationOnUpdatedPath
      const origin = selectedRoute.startPoint;
      const destination = selectedRoute.endPoint;
      const travelMode = selectedRoute.travelMode;
      const speedSelector = selectedRoute.bicyclingSpeedSelector;
      const { distance, duration } = await calculateDistanceAndDurationOnUpdatedPath(origin, destination, travelMode, speedSelector, waypoints);
      setDistance(distance);
      setDuration(formatDurationToFixed(duration));

    }

    try {


      const routeRef = doc(db, 'routes', id);

      // Construct the updated route object
      const updatedRouteData = {
        routeName: selectedRoute?.routeName,
        startPoint: selectedRoute?.startPoint,
        endPoint: selectedRoute?.endPoint,
        startPointName: selectedRoute.startPointName,
        endPointName: selectedRoute.endPointName,
        startPointAddress: routeStartFormattedAddress,
        endPointAddress: routeEndFormattedAddress,
        travelMode: selectedRoute?.travelMode,
        // updatedPath is currently an empty array, so we need to use the pathCoordinates from the selectedRoute
        pathCoordinates: pathCoordinates,
        bicyclingSpeed: bicyclingSpeedSelector,
        bicyclingSpeedSelector: selectedRoute.bicyclingSpeedSelector,
        duration: formatDurationToFixed(selectedRoute.duration),
        distance: distance,
      };

      console.log("Updated route data:", updatedRouteData);

      // Update the route in Firestore
      await updateDoc(routeRef, updatedRouteData);

      for (let leg of routeLegs) {
        if (!leg.id) {
          console.error("Leg ID is missing.");
          continue; // Skip this iteration if id is missing
        }
        // before we update the leg, we need to convert the string duration to a number that has 2 decimal places
        const durationNumber = Number(leg.duration);
        const durationString = durationNumber.toFixed(2);
        leg.duration = durationString;

        const legRef = doc(db, `routes/${selectedRoute.id}/legs`, leg.id);
        await updateDoc(legRef, {
          startPoint: leg.startPoint,
          endPoint: leg.endPoint,
          distance: leg.distance,
          duration: leg.duration,
        });

      }

      alert("Route successfully updated.");
    } catch (error) {
      console.error("Failed to update the route:", error);
      alert("Error updating route.");
      history.push(`/ViewRouteList/`);
    }
    // Redirect or other post-save actions
    history.push(`/ViewRoute/${id}`);
  };




  const polylinePath = selectedRoute?.pathCoordinates
    .filter(coord => coord.lat !== undefined && coord.lng !== undefined) // Filter out coordinates with undefined lat or lng
    .map(coord => ({
      lat: coord.lat || 0, // Provide a default value of 0 if lat is undefined
      lng: coord.lng || 0, // Provide a default value of 0 if lng is undefined
    }));

  useEffect(() => {
    // This effect sets up event listeners whenever the polylineRef.current changes
    // Ensures we clean up listeners when the component unmounts or the polyline changes
    const polyline = polylineRef.current;
    if (polyline) {
      const path = polyline.getPath();

      // Define the update function
      const updatePathInState = () => {
        const updatedPath = path.getArray().map(coord => ({
          lat: coord.lat(),
          lng: coord.lng(),
        }));
        console.log("Updated path coordinates:", updatedPath);
        setUpdatedPath(updatedPath);
        // Additional state updates as needed
        console.log("pathCoordinates:", pathCoordinates);
        setPathCoordinates(updatedPath);
        console.log("pathCoordinates:", pathCoordinates);
      };

      // Attach listeners
      google.maps.event.addListener(path, 'set_at', updatePathInState);
      google.maps.event.addListener(path, 'insert_at', updatePathInState);
      google.maps.event.addListener(path, 'remove_at', updatePathInState);

      // Cleanup function to remove listeners
      return () => {
        google.maps.event.clearListeners(path, 'set_at');
        google.maps.event.clearListeners(path, 'insert_at');
        google.maps.event.clearListeners(path, 'remove_at');
      };
    }
  }, [polylineRef.current]); // Dependency array ensures effect runs only when polylineRef.current changes

  // Base offset at zoom level 13 (you can adjust this according to your preferences)
  const BASE_LAT_OFFSET = 0.0090; // 0.0010 is approximately 111 meters
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
          <IonText>Editing {selectedRoute?.routeName}</IonText>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonToggle
            checked={isDetailVisible}
            onIonChange={e => {
              setIsDetailVisible(e.detail.checked);
            }}
          >
            <IonLabel className="toggle-detail-layer">Toggle Details</IonLabel>
          </IonToggle>
          {isDetailVisible && selectedRoute && (
            <>
              <IonRow>
                <IonInput
                  value={selectedRoute?.routeName}
                  onIonChange={e => {
                    if (selectedRoute && e.detail.value !== null && e.detail.value !== undefined) {
                      setSelectedRoute({ ...selectedRoute, routeName: e.detail.value });
                    }
                  }}
                />
              </IonRow>
              <IonItem>
                <IonLabel>Travel Mode:</IonLabel>
                <IonSelect aria-label='Travel Mode' value={selectedRoute?.travelMode} onIonChange={e => selectedRoute && setSelectedRoute({ ...selectedRoute, travelMode: e.detail.value })}>
                  <IonSelectOption value="WALKING">Walking</IonSelectOption>
                  <IonSelectOption value="BICYCLING">Bicycling</IonSelectOption>
                  <IonSelectOption value="CAR">Car</IonSelectOption>
                  <IonSelectOption value="TRANSIT">Transit</IonSelectOption>
                </IonSelect>
              </IonItem>
              {selectedRoute?.travelMode === "BICYCLING" && (
                <IonItem>
                  <IonSegment value={bicyclingSpeedSelector} onIonChange={(e: CustomEvent) => {
                    const newSpeedSelector = e.detail.value;
                    setBicyclingSpeedSelector(newSpeedSelector);
                    if (selectedRoute) {
                      setSelectedRoute({ ...selectedRoute, bicyclingSpeedSelector: newSpeedSelector });
                      setBicyclingSpeed(newSpeedSelector);
                      adjustLegDurationsForSpeed(newSpeedSelector);
                    }
                  }
                  }>
                    <IonSegmentButton value="VERY SLOW">
                      <IonText>Very Slow</IonText>
                      <IonText>0-5mph</IonText>
                    </IonSegmentButton>
                    <IonSegmentButton value="SLOW">
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
                </IonItem>
              )}
              <IonItem>
                <IonLabel>Start Point:</IonLabel>
                <StandaloneSearchBox
                  onLoad={onLoadStartingLocation}
                  onPlacesChanged={onPlaceChangedStart}
                >
                  <input
                    type="text"
                    autoComplete="on"
                    placeholder={routeStartFormattedAddress}
                    style={{
                      width: "250px",
                      height: "40px",
                    }}
                  />
                </StandaloneSearchBox>
              </IonItem>
              <IonItem>
                <IonLabel>End Point:</IonLabel>
                <StandaloneSearchBox
                  onLoad={onLoadDestinationValue}
                  onPlacesChanged={onPlaceChangedDestination}
                >
                  <input
                    type="text"
                    autoComplete="on"
                    placeholder={routeEndFormattedAddress}
                    style={{
                      width: "250px",
                      height: "40px",
                    }}
                  />
                </StandaloneSearchBox>
              </IonItem>
              <IonItem>
                <IonText>Duration: </IonText>
                <IonText>{duration} Minutes</IonText>
              </IonItem>
              <IonRow>
                <IonCol>
                  {isBikeBus && (
                    <IonButton size="small" shape="round" onClick={() => setshowInfoStopModal(true)}>Manage BikeBusStops</IonButton>
                  )}
                  <IonButton size="small" shape="round" onClick={getDirectionsAndSimplifyRoute}>Generate New Path</IonButton>
                  <IonButton size="small" shape="round" color="success" onClick={handleRouteSave}>Save</IonButton>
                  <IonButton size="small" shape="round" color="danger" routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
                </IonCol>
              </IonRow>
            </>
          )}
          {selectedRoute && (
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
                      path={selectedRoute.pathCoordinates}
                      options={{
                        zIndex: 1,
                        strokeColor: "#1a73e8",
                        strokeOpacity: 1,
                        strokeWeight: 5,
                        geodesic: true,
                        draggable: true,
                        editable: true,
                        visible: true,
                      }}
                      onLoad={(polyline) => {
                        polylineRef.current = polyline;
                        // ensure this changes the polylineRef.current
                        console.log("polylineRef.current:", polylineRef.current);
                      }}
                    />


                    {bikeBusStops.map((BikeBusStop, index) => (
                      <Marker
                        key={index}
                        label={BikeBusStop.BikeBusStopName || 'BikeBus Stop'}
                        position={BikeBusStop.location}
                        title={BikeBusStop.BikeBusStopName}
                        onClick={() =>
                          handleBikeBusStopClick(BikeBusStop)
                        }
                      />
                    ))}
                    {routeLegsEnabled && routeLegs.map((leg, index) => {
                      const midLat = (getNumber(leg.startPoint.lat) + getNumber(leg.endPoint.lat)) / 2;
                      const midLng = (getNumber(leg.startPoint.lng) + getNumber(leg.endPoint.lng)) / 2;

                      const { latOffset, lngOffset } = getCurrentOffset(currentZoomLevel);

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
                              <div>Duration: {formatDuration(leg.duration)} minutes</div>
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
                    <IonModal isOpen={showInfoStopModal} onDidDismiss={() => setshowInfoStopModal(false)}>
                      <IonHeader>
                        <IonToolbar>
                          <IonTitle>Add, Update or Delete BikeBusStops</IonTitle>
                          <IonButtons slot="end">
                            <IonButton onClick={() => setshowInfoStopModal(false)}>Close</IonButton>
                          </IonButtons>
                        </IonToolbar>
                      </IonHeader>
                      <IonContent>
                        <IonGrid>
                          <IonRow>
                            <IonCol size="12">
                              <IonButton
                                color="primary"
                                onClick={() => {
                                  history.push(`/CreateBikeBusStops/${id}`);
                                }}
                              >
                                Add BikeBusStop
                              </IonButton>
                            </IonCol>
                          </IonRow>
                          <IonRow>
                            <IonList>
                              {/* Display the list of BikeBusStops based on the order field/value */}
                              {bikeBusStops.map((stop) => (
                                <IonItem key={stop.id}>
                                  <IonLabel position="stacked">Order:</IonLabel>
                                  <IonInput
                                    type="number"
                                    value={stop.order}
                                    placeholder="Enter Order"
                                    onIonChange={(e) => setBikeBusStopOrder(Number(e.detail.value!))}
                                  />
                                  <IonLabel position="stacked">BikeBusStop Name:</IonLabel>
                                  <IonInput
                                    value={stop.BikeBusStopName}
                                    placeholder="Enter Stop Name"
                                    onIonChange={(e) => setBikeBusStopName(e.detail.value!)}
                                  />
                                  <IonButton color="light" onClick={() => handleUpdateClick(stop.id, bikeBusStopName, bikeBusStopOrder)}>
                                    Update Stop
                                  </IonButton>

                                  <IonButton color="danger" onClick={() => handleDeleteClick(stop.id)}>
                                    Delete
                                  </IonButton>
                                </IonItem>
                              ))}
                            </IonList>
                          </IonRow>
                        </IonGrid>
                      </IonContent>
                    </IonModal>

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
          )}
        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default EditRoute;
