// src/pages/BikeBusMember.tsx
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonAvatar,
  IonIcon,
  IonTitle,
  IonLabel,
  IonButton,
  IonInput,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonCard,
  IonCol,
  IonGrid,
  IonRow,
} from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { locateOutline, personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";
import { GoogleMap, useLoadScript, useJsApiLoader, Marker, Polyline, InfoWindow, Autocomplete, StandaloneSearchBox } from '@react-google-maps/api';
import React from "react";
import { is } from 'date-fns/locale';
import { set } from 'date-fns';
import './CreateOrganization.css'

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

const DEFAULT_ACCOUNT_MODES = ["Member"];

type RouteType = "SCHOOL" | "WORK";

type Point = {
  lat: number;
  lng: number;
};

type Place = {
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
};

interface Coordinate {
  lat: number;
  lng: number;
}


const CreateOrganization: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgLocation, setOrgLocation] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhoneNumber, setOrgPhoneNumber] = useState("");
  const [orgContactName, setOrgContactName] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [school, setSchool] = useState("");
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const autocompleteInputRef = useRef(null);
  const [autocompleteInput, setAutocompleteInput] = useState<any>(null);
  const [markerPosition, setMarkerPosition] = useState<Coordinate | null>(null);
  const [schoolArray, setSchoolArray] = useState<Coordinate[]>([]);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [enabledAccountModes, setAccountMode] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [autocompleteStart, setAutocompleteStart] = useState<google.maps.places.SearchBox | null>(null);
  const [getLocationClicked, setGetLocationClicked] = useState(false);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState<Point>({ lat: 0, lng: 0 });
  const [userLocation, setUserLocation] = useState<Point>({ lat: 0, lng: 0 });
  const [selectedStartLocation, setSelectedStartLocation] = useState<Point>({ lat: 0, lng: 0 });
  const [routeStartName, setRouteStartName] = useState<string>("");
  const [routeStartStreetName, setRouteStartStreetName] = useState<string>("");
  const [routeStartFormattedAddress, setRouteStartFormattedAddress] = useState<string>("");
  const [userLocationAddress, setUserLocationAddress] = useState("Loading...");

  // Update the useEffect to also update the marker position
  useEffect(() => {
    if (isLoaded && autocompleteInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current
      );
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.formatted_address) {
          setOrgLocation(place.formatted_address);
          // If the place has a geometry, then update the marker position
          if (place.geometry && place.geometry.location) {
            const latLng = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            setMarkerPosition(latLng);
            setMapCenter(latLng);
          }
        } else {
          console.log('No address available');
        }
      });
    }
  }, [isLoaded]);

  // When the map is loaded, store its instance
  const handleMapLoad = (map: google.maps.Map) => {
    setMapInstance(map);
  };

  const getLocation = () => {
    setGetLocationClicked(true);
    setShowMap(true);
    setMapCenter(userLocation);
    onPlaceChangedStart();
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
            lng: place.geometry.location.lng(),
          });
          // define place.address_components
          const addressComponents = place.address_components;
          // extract street name
          const streetName = addressComponents?.find((component) =>
            component.types.includes("route")
          )?.long_name;

          setRouteStartStreetName(streetName ?? "");
          setRouteStartName(`${place.name}` ?? "");
          setRouteStartFormattedAddress(`${place.formatted_address}` ?? "");
        }
      }
    }
  };

  const onLoadStartingLocation = (ref: google.maps.places.SearchBox) => {
    setAutocompleteStart(ref);
    onPlaceChangedStart();

    setSelectedStartLocation({ lat: userLocation.lat, lng: userLocation.lng });
  };


  // Update the updateSchools function
  const updateSchools = (newSchool: string) => {
    setSchool(newSchool);
    setSchoolDistrict(schoolDistrict);

    // If mapInstance is null, return early
    if (!mapInstance) {
      return;
    }

    // Create a new marker and add it to the map
    const newSchoolMarker = new window.google.maps.Marker({
      position: { lat: 0, lng: 0 }, // You will need to update this with the actual lat/lng
      map: mapInstance,
      title: newSchool,
    });

    // Add the new marker to the markers array
    setMarkers(oldMarkers => [...oldMarkers, newSchoolMarker]);
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

  const containerMapStyle = {
    width: '100%',
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
          if (userData && userData.enabledAccountModes) {
            setAccountMode(userData.enabledAccountModes);
          }
          console.log('userData.enabledAccountModes: ', userData.enabledAccountModes);
        }
      });
    }
  }, [user]);

  const label = user?.username ? user.username : "anonymous";

  // Form submission handler
  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Add a new document in collection "organizations"
    const newOrg = await addDoc(collection(db, "organizations"), {
      NameOfOrg: orgName,
      OrganizationType: orgType,
      // ... rest of the fields
    });

    console.log("New organization created with ID: ", newOrg.id);
  };


  return (
    <IonPage>
      <IonContent fullscreen className="ion-flex ion-flex-direction-column">
        <IonHeader>
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonTitle>
          <h1>Create Organization</h1>
        </IonTitle>
        <IonContent className="ion-flex-grow">
          <div className="ion-padding">
            <p>
              <strong>Account Type:</strong> {accountType}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
          </div>
          {enabledAccountModes.includes('Org Admin') ? (
            <>
              <p>Welcome to the BikeBus App "create an organization" feature. Please let me know if you have any questions at <a href="mailto:craigm26@gmail.com">craigm26@gmail.com</a></p>
            </>
          )

            : (
              <p>You do not have permission to create an organization.
                <IonButton>Request Organization Account</IonButton></p>
            )}

          {
            enabledAccountModes.includes('Org Admin') && (
              <form onSubmit={submitForm}>
                <IonItem>
                  <IonLabel>Name of Organization:</IonLabel>
                  <IonInput value={orgName} onIonChange={e => setOrgName(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel>Type:</IonLabel>
                  <IonSelect value={orgType} onIonChange={e => setOrgType(e.detail.value)}>
                    <IonSelectOption value="school">School</IonSelectOption>
                    <IonSelectOption value="schooldistrict">School District</IonSelectOption>
                    <IonSelectOption value="work">Work</IonSelectOption>
                    <IonSelectOption value="social">Social</IonSelectOption>
                    <IonSelectOption value="club">Club</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel>Website:</IonLabel>
                  <IonInput value={orgWebsite} onIonChange={e => setOrgWebsite(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel>Email:</IonLabel>
                  <IonInput value={orgEmail} onIonChange={e => setOrgEmail(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel>Phone Number:</IonLabel>
                  <IonInput value={orgPhoneNumber} onIonChange={e => setOrgPhoneNumber(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel>Contact Name:</IonLabel>
                  <IonInput value={orgContactName} onIonChange={e => setOrgContactName(e.detail.value!)} />
                </IonItem>
                <IonButton expand="full" type="submit">Create Organization</IonButton>
              </form>
            )
          }
          {!showMap && enabledAccountModes.includes('Org Admin') && (
            <>
              <IonGrid>
                <IonRow className="location-button-container">
                  <IonCol>
                    <IonButton onClick={getLocation}>
                      Start Map by retrieving your Current Location
                    </IonButton>
                  </IonCol>
                </IonRow>
                <IonRow></IonRow>
              </IonGrid>
            </>
          )}
          {showMap && enabledAccountModes.includes('Org Admin') && (
            <IonGrid fixed={false}>
              <IonRow className="map-base">
                <GoogleMap
                  onLoad={(map) => {
                    mapRef.current = map;
                  }}
                  mapContainerStyle={containerMapStyle}
                  center={mapCenter}
                  zoom={18}
                  options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    mapTypeControl: false,
                    disableDoubleClickZoom: true,
                    maxZoom: 18,
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
                  <Autocomplete
                    onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                    onPlaceChanged={() => {
                      if (autocomplete !== null) {
                        const place = autocomplete.getPlace();
                        setOrgLocation(place.geometry.location); // Update the location state here
                      } else {
                        console.log('Autocomplete is not loaded yet!');
                      }
                    }}
                  >
                    <input
                      ref={autocompleteInputRef}
                      type="text"
                      placeholder={userLocationAddress}
                    />
                  </Autocomplete>

                  {markers.map((marker, i) => <Marker key={i} position={marker.getPosition() as google.maps.LatLng} />)}
                  {markerPosition && <Marker position={markerPosition} />}
                  <IonGrid className="search-container">
                    <IonRow className="current-location">
                      <IonButton onClick={getLocation}>
                        <IonIcon icon={locateOutline} />
                      </IonButton>
                      <IonCol>
                        <StandaloneSearchBox
                          onLoad={onLoadStartingLocation}
                          onPlacesChanged={onPlaceChangedStart}
                        >
                          <input
                            type="text"
                            autoComplete="on"
                            placeholder={userLocationAddress}
                            style={{
                              width: "300px",
                              height: "40px",
                            }}
                          />
                        </StandaloneSearchBox>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol>
                        {orgType === "schooldistrict" && (
                          <IonItem>
                            <IonLabel>Add School District:</IonLabel>
                            <IonInput value={schoolDistrict} onIonChange={e => setSchoolDistrict(e.detail.value!)} />
                            <IonButton onClick={() => updateSchools(schoolDistrict)}>Add School District</IonButton>
                          </IonItem>
                        )}
                        {orgType === "schooldistrict" && (
                          <IonItem>
                            <IonLabel>Add schools by name:</IonLabel>
                            <IonInput value={school} onIonChange={e => setSchool(e.detail.value!)} />
                            <IonButton onClick={() => updateSchools(school)}>Add School</IonButton>
                          </IonItem>
                        )}
                        {orgType !== "schooldistrict" && (
                          <IonItem>
                            <IonLabel>Location:</IonLabel>
                            <IonInput value={orgLocation} onIonChange={e => setOrgLocation(e.detail.value!)} />
                          </IonItem>
                        )}
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                  <div>
                    {selectedStartLocation && <Marker position={selectedStartLocation} />}
                  </div>
                </GoogleMap >
              </IonRow>
            </IonGrid>
          )}
        </IonContent>
      </IonContent>
    </IonPage >
  );
};

export default CreateOrganization;
