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
import { DocumentReference, FieldPath, arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, StandaloneSearchBox, InfoWindow } from '@react-google-maps/api';
import React from 'react';
import { get } from 'http';
import { is } from 'date-fns/locale';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


type DirectionsWaypoint = {
  location: google.maps.LatLng | google.maps.LatLngLiteral;
};


interface Coordinate {
  lat: number;
  lng: number;
}

interface BikeBusStop {
  id: string;
  BikeBusStopName: string;
  BikBusGroupId: DocumentReference;
  BikeBusRouteId: DocumentReference;
  lat: Coordinate;
  lng: Coordinate;
  BikeBusStopIds: DocumentReference[];
  BikeBusGroupId: string;
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
  const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);
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
  const [BikeBusStops, setBikeBusStops] = useState<BikeBusStop[]>([]);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const bikeBusStopsRef = getDoc(doc(db, 'bikebusstops', id));
  const bikeBusStopsQuery = bikeBusStopsRef;




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
      const fetchBikeBusStops = async () => {
        const bikeBusStopsQuery = await getDocs(query(collection(db, 'bikebusstops'), where('__name__', 'in', selectedRoute?.BikeBusStopIds)));
        const bikeBusStops = bikeBusStopsQuery.docs.map(doc => {
          const data = doc.data() as BikeBusStop;
          // Update Coordinate object
          data.lat = { lat: parseFloat(data.lat.lat as unknown as string), lng: parseFloat(data.lat.lng as unknown as string) };
          data.lng = { lat: parseFloat(data.lng.lat as unknown as string), lng: parseFloat(data.lng.lng as unknown as string) };
          return data;
        });
        setBikeBusStops(bikeBusStops);
      };
      fetchBikeBusStops();
    }
  }, [selectedRoute?.BikeBusStopIds]);

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
      console.log('batch: ', batch);
      const origin = batch.length > 0 ? batch[0].location : undefined;
      const destination = batch.length > 0 ? batch[batch.length - 1].location : undefined;
      const batchWaypoints = batch.slice(1, batch.length - 1);

      if (origin && destination) {
        routeRequests.push(new Promise<Coordinate[]>((resolve, reject) => {
          directionsService.route({
            origin: startPoint,
            destination: endPoint,
            waypoints: batchWaypoints,
            optimizeWaypoints: true,
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

    return Promise.all(routeRequests).then(routeResults => {
      return routeResults.flat();
    });
  };


  const onGenerateNewRouteClick = async () => {




    // Add a confirm dialog
    const confirmed = window.confirm("This will delete the existing route and create a new one. Are you sure you want to continue?");
    if (!confirmed) {
      // User clicked "Cancel", so we return and don't continue with generating the new route
      return;
    }

    if (selectedRoute) {

      const routeRef = doc(db, 'routes', id);
      const routeSnap = await getDoc(routeRef);
      const routeData = routeSnap.data() as Route;
      const routeBikeBusStopIds = routeData.BikeBusStopIds;

      // Fetch all bike bus stops using getDocs and the routeBikeBusStopIds array
      const bikeBusStopsQuery = await getDocs(query(collection(db, 'bikebusstops'), where('__name__', 'in', routeBikeBusStopIds)));
      const bikeBusStopsData = bikeBusStopsQuery.docs.map(doc => doc.data());
      console.log('bikeBusStopsData: ', bikeBusStopsData);



      // Create an array of coordinates from the bikeBusStopsData
      const bikeBusStopsCoordinates = bikeBusStopsData.map((coord: any) => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));
      console.log('bikeBusStopsCoordinates: ', bikeBusStopsCoordinates);

      // now let's create a new array of coordinates with the start point, the end point, and the bikeBusStopsCoordinates
      const waypoints = [
        ...bikeBusStopsCoordinates.map(coord => ({ location: new google.maps.LatLng(coord.lat, coord.lng) })),
      ];
      console.log('waypoints: ', waypoints);

      const selectedTravelMode = google.maps.TravelMode[selectedRoute.travelMode.toUpperCase() as keyof typeof google.maps.TravelMode];

      const newCoordinates = await calculateRoute(selectedRoute.startPoint, selectedRoute.endPoint, waypoints, selectedTravelMode, true);
      setSelectedRoute({ ...selectedRoute, pathCoordinates: newCoordinates });
      alert('Route Updated, if you like it, click save to save the new route. If you want to make additional route changes manually, click on "update route manually".');
      console.log('newPathCoordinates: ', newCoordinates);
      // set the isClicked to true
      setIsClicked(true);
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


  const handleDeleteStop = async (index: number) => {
    if (selectedRoute) {
      // Create a new array without the stop to be deleted
      const newStops = selectedRoute.BikeBusStopIds.filter((stop, i) => i !== index);
      const newRoute: Route = {
        ...selectedRoute,
        BikeBusStopIds: newStops,
      };
      console.log(newStops);
      console.log(newRoute);

      // Update the route in Firebase here
      await updateRoute(newRoute);
      alert('Stop deleted, if you like it, save to save the new route. If you want to make additional route changes manually, click on "update route manually".');
      setSelectedStopIndex(null);
    }
  };

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
    <IonPage style={{ height: '100%' }}>
      <IonHeader>
        <IonToolbar>
          {headerContext?.showHeader && <IonHeader></IonHeader>}
        </IonToolbar>
      </IonHeader>
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
                    mapTypeControl: true,
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
                      position={{ lat: stop.lat.lat, lng: stop.lat.lng }}
                      title={stop.BikeBusStopName}
                    >
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
      </IonContent >
    </IonPage >
  );
};

export default EditRoute;
