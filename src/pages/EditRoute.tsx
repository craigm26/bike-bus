import {
  IonContent,
  IonPage,
  IonItem,
  IonList,
  IonInput,
  IonLabel,
  IonButton,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSelect,
  IonSelectOption,
  IonCol,
  IonRow,
  IonGrid,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, FieldPath, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, StandaloneSearchBox, InfoWindow } from '@react-google-maps/api';
import React from 'react';
import { get } from 'http';
import { is } from 'date-fns/locale';
import { update } from 'firebase/database';
import { set } from 'date-fns';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


type DirectionsWaypoint = {
  location: google.maps.LatLng | google.maps.LatLngLiteral;
};


interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusStops {
  id: string;
  StopId: string;
  BikeBusStopName: string;
  BikBusGroupId: DocumentReference;
  BikeBusRouteId: DocumentReference;
  lat: Coordinate;
  lng: Coordinate;
  BikeBusStopIds: DocumentReference[];
  BikeBusGroupId: string;
}

interface BikeBusStop {
  BikeBusStopName: string;
}

interface Route {
  newStop: Coordinate | null;
  oldIds: Coordinate | null;
  stopPoint: Coordinate | null;
  BikeBusStopIds: DocumentReference[];
  isBikeBus: boolean;
  BikeBusGroupId: string;
  id: string;
  accountType: string;
  description: string;
  endPoint: Coordinate;
  endPointAddress: string;
  endPointName: string;
  routeCreator: string;
  routeLeader: string;
  routeName: string;
  routeType: string;
  startPoint: Coordinate;
  startPointAddress: string;
  startPointName: string;
  travelMode: string;
  pathCoordinates: Coordinate[];
}

const EditRoute: React.FC = () => {
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const headerContext = useContext(HeaderContext);
  const [accountType, setaccountType] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [selectedStartLocation, setSelectedStartLocation] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0, });
  const [selectedEndLocation, setSelectedEndLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeStartName, setRouteStartName] = useState<string>('');
  const [routeEndName, setRouteEndName] = useState<string>('');
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>('');
  const [routeEndFormattedAddress, setRouteEndFormattedAddress] = useState<string>('');
  const [bikeBusStationsIds, setBikeBusStationsIds] = useState<Coordinate[]>([]);
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [autocompleteEnd, setAutocompleteEnd] = useState<google.maps.places.SearchBox | null>(null);
  const [startGeo, setStartGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [endGeo, setEndGeo] = useState<Coordinate>({ lat: 0, lng: 0 });
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: startGeo.lat,
    lng: startGeo.lng,
  });
  const [BikeBusStop, setBikeBusStop] = useState<Coordinate>({ lat: 0, lng: 0 });
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });
  const [BikeBusStops, setBikeBusStops] = useState<BikeBusStops[]>([]);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const bikeBusStopsRef = getDoc(doc(db, 'bikebusstops', id));
  const bikeBusStopsQuery = bikeBusStopsRef;
  const [selectedStop, setSelectedStop] = React.useState(null);
  const [selectedStopId, setSelectedStopId] = React.useState(null);
  const [selectedStopIndex, setSelectedStopIndex] = React.useState<string | null>(null);





  const onLoadDestinationValue = (ref: google.maps.places.SearchBox) => {
    setAutocompleteEnd(ref);
  };

  const containerMapStyle = {
    width: '100%',
    height: '100%',
  };

  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {

    setAutocompleteStart(ref);
  };

  // if the field isbikeBus is set to true, then make the isBikeBus variable true
  const isBikeBus = selectedRoute?.isBikeBus ?? false;

  // when the map is loading, set startGeo to the route's startPoint
  useEffect(() => {
    if (selectedRoute) {
      setStartGeo(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
      setMapCenter(selectedRoute.startPoint);
      setEndGeo(selectedRoute.endPoint);
      setRouteStartFormattedAddress(selectedRoute.startPointAddress);
      setRouteEndFormattedAddress(selectedRoute.endPointAddress);
    }
  }
    , [selectedRoute]);

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
          setRouteStartName(`${place.name}` ?? '');
          setRouteStartFormattedAddress(`${place.formatted_address}` ?? '');
          // need to set startPointAddress to the address of the selected start point
          // need to set startPointName to the name of the selected start point

        }
      }
    }
  };

  const onPlaceChangedDestination = () => {
    console.log("onPlaceChangedDestination called");
    if (autocompleteEnd !== null) {
      const places = autocompleteEnd.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        console.log("Place: ", place);
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

    const fetchSingleRoute = async (id: string) => {
      const docRef = doc(db, 'routes', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const routeData = {
          ...docSnap.data() as Route,
          id: docSnap.id,
          routeName: docSnap.data().routeName,
          startPoint: docSnap.data().startPoint,
          endPoint: docSnap.data().endPoint,
          // BikeBusStopIds is an array of DocumentReferences
          BikeBusStopIds: (docSnap.data().BikeBusStopIds ?? []) as DocumentReference[],
          BikeBusGroupId: docSnap.data().BikeBusGroupId,
          pathCoordinates: docSnap.data().pathCoordinates, // directly assign the array
        };
        setSelectedRoute(routeData);
      }

    };
    fetchSingleRoute(id);

  }, []);



  useEffect(() => {
    if (selectedRoute?.BikeBusStopIds && selectedRoute.BikeBusStopIds.length > 0) {
      // let's fetch the bikebusstop data from the firestore document collection "bikebusstops" and store it in the state variable BikeBusStops
      const fetchBikeBusStops = async () => {
        // first let's get the bikebusstop ids from the selectedRoute
        const bikeBusStopIds = selectedRoute.BikeBusStopIds;
        console.log('bikeBusStopIds: ', bikeBusStopIds);
        // for each bikeBusStopId, let's create a query
        const bikeBusStopsQuery = query(collection(db, 'bikebusstops'), where('__name__', 'in', bikeBusStopIds));
        console.log('bikeBusStopsQuery: ', bikeBusStopsQuery);
        getDocs(bikeBusStopsQuery);
        // for each document, get the actual object document data and store it in the state variable BikeBusStops
        const bikeBusStopsSnapshot = await getDocs(bikeBusStopsQuery);
        console.log('bikeBusStopsSnapshot: ', bikeBusStopsSnapshot);
        const bikeBusStopsData = bikeBusStopsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as unknown as BikeBusStops[]; // this is the array of BikeBusStops
        console.log('bikeBusStopsData: ', bikeBusStopsData);
        setBikeBusStops(bikeBusStopsData);

      };

      console.log('bikeBusStops: ', BikeBusStops);
      fetchBikeBusStops();
    }
  }
    , [selectedRoute]);

  // center the map between the start point of the route and the end point of the route
  useEffect(() => {
    if (selectedRoute) {
      setMapCenter({
        lat: (selectedRoute.startPoint.lat + selectedRoute.endPoint.lat) / 2,
        lng: (selectedRoute.startPoint.lng + selectedRoute.endPoint.lng) / 2,
      });
    }
  }
    , [selectedRoute]);

  useEffect(() => {
    if (selectedStartLocation) {
      setStartGeo(selectedStartLocation);
      setMapCenter(selectedStartLocation);
    }
  }
    , [selectedStartLocation]);

  useEffect(() => {
    if (selectedEndLocation) {
      setEndGeo(selectedEndLocation);
    }
  }
    , [selectedEndLocation]);

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

  const calculateRoute = async (startPoint: Coordinate, endPoint: Coordinate, waypoints: google.maps.DirectionsWaypoint[], travelMode: google.maps.TravelMode, optimize = false) => {
    const directionsService = new google.maps.DirectionsService();
    const batchSize = 10;
    const batches = [];
    const epsilon = 0.00005; // Define epsilon for Douglas-Peucker algorithm. Distance in degrees. 0.00005 is about 5.5 meters.
    const routeRequests = [];
    console.log('pathCoordinates: ', selectedRoute?.pathCoordinates);
    console.log('waypoints: ', waypoints);

    for (let i = 0; i < waypoints.length; i += batchSize) {
      console.log('i: ', i)
      const batch: google.maps.DirectionsWaypoint[] = waypoints.slice(i, Math.min(i + batchSize, waypoints.length));
      console.log('batch: ', batch)
      if (i !== 0) {
        batch.unshift(waypoints[i - 1]);
        console.log('batch: ', batch)
      }
      if (i + batchSize < waypoints.length) {
        batch.push(waypoints[i + batchSize]);
        console.log('batch: ', batch)
      }
      batches.push(batch);
      console.log('batches: ', batches)
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log('batch: ', batch);
      const origin = batch.length > 0 ? batch[0].location : undefined;
      const destination = batch.length > 0 ? batch[batch.length - 1].location : undefined;
      
      // Modified slicing logic
      const batchWaypoints = batch.length <= 2 ? batch : batch.slice(1, batch.length - 1);
      
      console.log('batchWaypoints: ', batchWaypoints);
      
      // Debugging for empty array
      if (batchWaypoints.length === 0) {
        console.warn("batchWaypoints is empty!");
      } 
      // deeply inspect the batchWaypoints array
      console.log('batchWaypoints[0]: ', batchWaypoints[0]);
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
            } else {
              reject('Directions request failed due to ' + status);
            }
          });
        }));
      }

    }

    try {
      return await Promise.all(routeRequests).then(routeResults => {
        return routeResults.flat();
      });
    } catch (error) {
      console.error("An error occurred during route calculation:", error);
      throw new Error("Route calculation failed. Please try again.");
    }
  }

  const onGenerateNewRouteClick = async () => {
    if (!selectedRoute) {
      alert("No route selected!");
      return;
    }
  
    const routeRef = doc(db, 'routes', id);
    const routeSnap = await getDoc(routeRef);
    const routeData = routeSnap.data() as Route;
    const routeBikeBusStopIds = routeData.BikeBusStopIds;
  
    let bikeBusStopsData: BikeBusStops[] = [];
  
    if (routeBikeBusStopIds.length > 0) {
      const bikeBusStopsQuery = query(collection(db, 'bikebusstops'), where('__name__', 'in', routeBikeBusStopIds));
      const bikeBusStopsSnapshot = await getDocs(bikeBusStopsQuery);
      bikeBusStopsData = bikeBusStopsSnapshot.docs.map(doc => doc.data()) as unknown as BikeBusStops[];
      setBikeBusStops(bikeBusStopsData);
    }
  
    setBikeBusStops(bikeBusStopsData);
    console.log('bikeBusStopsData: ', bikeBusStopsData);
  
    const waypoints = bikeBusStopsData.map((stop) => ({
      // bikeBusStopsData is an array of BikeBusStops which contain two fields: lat and lng which are numbers
      // but google.maps.LatLng takes in a google.maps.LatLngLiteral which is an object with lat and lng as numbers
      // so we need to convert the lat and lng to a google.maps.LatLngLiteral, which is what the following line does
      location: new google.maps.LatLng(stop.lat.lat, stop.lat.lng)
    }));
    console.log('location: ', waypoints[0].location);
    console.log('waypoints: ', waypoints);

  
    if (!selectedRoute.startPoint || !selectedRoute.endPoint) {
      alert("Missing startPoint or endPoint!");
      return;
    }
  
    const selectedTravelMode = google.maps.TravelMode[selectedRoute.travelMode.toUpperCase() as keyof typeof google.maps.TravelMode];
  
    try {
      const newCoordinates = await calculateRoute(
        selectedRoute.startPoint,
        selectedRoute.endPoint,
        waypoints,
        selectedTravelMode
      );
  
      setSelectedRoute(prevState => {
        if (!prevState) return null;
        return { ...prevState, pathCoordinates: newCoordinates } as Route;
      });
        
      const alertMessage = newCoordinates.length === 0 ? 'New route generated. Click save to update the route.' : 'Route Updated, if you like it, click save to save the new route.';
      alert(alertMessage);
  
      setIsClicked(true);
  
    } catch (error) {
      console.error('Error generating new route:', error);
      alert('Failed to generate new route. Please try again.');
    }
  };
  
  

  const updateRoute = async (updatedRoute: Route) => {
    const routeRef = doc(db, 'routes', id);

    const bikeBusStopRefs = updatedRoute.BikeBusStopIds;


    await updateDoc(routeRef, {
      ...updatedRoute,
      BikeBusStopIds: bikeBusStopRefs,
    });
  };

  const handleDeleteStop = async (StopId: string) => {
    try {
      if (selectedRoute) {
        console.log('selectedRoute:', selectedRoute);
        console.log('id:', id);
        console.log('StopId:', StopId);
        console.log('BikeBusStops:', BikeBusStops);

        // Create the DocRefStopid using the id of the stop to be deleted
        const DocRefStopid = doc(db, 'bikebusstops', StopId);
        console.log('DocRefStopid:', DocRefStopid);

        // Get the current route data
        const routeRef = doc(db, 'routes', id);
        const routeSnap = await getDoc(routeRef);
        const routeData = routeSnap.data() as Route;

        // Manually filtering out the DocRefStopId
        const updatedBikeBusStopIds = routeData.BikeBusStopIds.filter((stopId: any) => {
          return stopId.path !== DocRefStopid.path; // replace with your actual path matching logic
        });


        console.log('routeData:', routeData);
        console.log('routeData.BikeBusStopIds:', routeData.BikeBusStopIds);

        await updateDoc(routeRef, {
          ...routeData,
          BikeBusStopIds: updatedBikeBusStopIds,
        });

        // Delete the entry from the BikeBusStops array
        await deleteDoc(doc(db, 'bikebusstops', StopId));  // Changed from 'id' to 'StopId'
        console.log('Step executed: Deleted BikeBusStop document');

        alert('Stop deleted');
        setSelectedStopIndex(null);
        history.push(`/ViewRoute/${id}`)
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const saveBikeBusStopName = async (StopId: string) => {
    try {
      if (selectedRoute) {
        // Find the specific stop to update
        const stopToUpdate = BikeBusStops.find(stop => stop.id === StopId);
        if (!stopToUpdate) {
          console.error("Stop not found");
          return;
        }

        console.log('Stop to update:', stopToUpdate);

        // Create the DocRefStopid using the id of the stop to be updated
        const DocRefStopid = doc(db, 'bikebusstops', StopId);

        // Perform the update to the document
        await updateDoc(DocRefStopid, {
          BikeBusStopName: stopToUpdate.BikeBusStopName,
        });

        // Close the InfoWindow
        setSelectedStopIndex(null);
      }
    } catch (error) {
      console.error("Error updating document:", error);
    }
  }


  const handleRouteSave = async () => {
    if (selectedRoute === null) {
      console.error("selectedRoute is null");
      return;
    }

    const routeRef = doc(db, 'routes', selectedRoute.id);
    const updatedRoute: Partial<Route> = {};
    if (selectedRoute.routeName !== undefined) updatedRoute.routeName = selectedRoute.routeName;
    if (selectedRoute.BikeBusGroupId !== undefined) updatedRoute.BikeBusGroupId = selectedRoute.BikeBusGroupId;
    if (selectedRoute.description !== undefined) updatedRoute.description = selectedRoute.description;
    if (selectedRoute.routeType !== undefined) updatedRoute.routeType = selectedRoute.routeType;
    if (selectedRoute.travelMode !== undefined) updatedRoute.travelMode = selectedRoute.travelMode;
    if (selectedRoute.startPoint !== undefined) updatedRoute.startPoint = selectedRoute.startPoint;
    if (selectedRoute.endPoint !== undefined) updatedRoute.endPoint = selectedRoute.endPoint;
    if (selectedRoute.BikeBusStopIds !== undefined) updatedRoute.BikeBusStopIds = selectedRoute.BikeBusStopIds;
    if (selectedRoute.pathCoordinates !== undefined) updatedRoute.pathCoordinates = selectedRoute.pathCoordinates;

    await updateDoc(routeRef, updatedRoute);
    alert('Route Updated');
    history.push(`/ViewRoute/${id}`)
  };

  useEffect(() => {
    console.log("Google Maps script loaded: ", isLoaded);
  }, [isLoaded]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent style={{ height: '100%' }}>
        <IonGrid style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <IonRow>
            <IonCol>
              <IonTitle>
                Editing Route
              </IonTitle>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonLabel>Route Name:</IonLabel>
            <IonInput value={selectedRoute?.routeName} onIonChange={e => selectedRoute && setSelectedRoute({ ...selectedRoute, routeName: e.detail.value! })} />
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
          <IonRow>
            <IonCol>
              {isBikeBus && (
                <IonButton routerLink={`/CreateBikeBusStops/${id}`}>Add BikeBusStop</IonButton>
              )}
              {!isClicked && (
                <IonButton onClick={onGenerateNewRouteClick}>Generate New Route</IonButton>
              )}
              <IonButton routerLink={`/UpdateRouteManually/${id}`}>Update Route Manually</IonButton>
              <IonButton color="success" onClick={handleRouteSave}>Save</IonButton>
              <IonButton color="danger" routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
            </IonCol>
          </IonRow>
          {selectedRoute && (
            <IonRow style={{ flex: '1' }}>
              <IonCol>
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
                    mapId: 'b75f9f8b8cf9c287',
                  }}
                >
                  {BikeBusStops.map((stop, index) => (
                    <Marker
                      key={index}
                      position={{ lat: Number(stop.lat), lng: Number(stop.lng) }}
                      label={stop.BikeBusStopName}
                      title={stop.BikeBusStopName}
                      onClick={() => setSelectedStopIndex(stop.StopId)}
                    >
                      {selectedStopIndex !== null && (

                        <InfoWindow>
                          <div>
                            <h2>{stop.BikeBusStopName}</h2>
                            <IonInput value={stop.BikeBusStopName} helperText="Enter new BikeBusStopName"
                              onIonChange={e => {
                                const updatedStop = { ...stop, BikeBusStopName: e.detail.value! };
                                setBikeBusStops(prevStops => prevStops.map(s => s.id === stop.id ? updatedStop : s));
                              }} />
                            <IonButton onClick={() => saveBikeBusStopName(stop.id)}>Save BikeBusStop</IonButton>
                            <IonButton onClick={() => handleDeleteStop(String(stop.id))}>Delete BikeBusStop</IonButton>
                          </div>
                        </InfoWindow>
                      )}
                    </Marker>
                  ))}
                  <Marker
                    position={{ lat: startGeo.lat, lng: startGeo.lng }}
                    title="Start"
                    label={"Start"}
                  >
                  </Marker>
                  <Marker
                    position={{ lat: endGeo.lat, lng: endGeo.lng }}
                    title="End"
                    label={"End"}
                  >
                  </Marker>
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
                </GoogleMap>

              </IonCol>
            </IonRow>
          )}

        </IonGrid>
      </IonContent>
    </IonPage >
  );
};

export default EditRoute;
