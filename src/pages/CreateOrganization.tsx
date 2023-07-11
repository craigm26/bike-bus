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
} from '@ionic/react';
import { useEffect, useRef, useState } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";
import { GoogleMap, useLoadScript, useJsApiLoader, Marker, Polyline, InfoWindow, Autocomplete } from '@react-google-maps/api';
import { is } from 'date-fns/locale';
import { set } from 'date-fns';
import './CreateOrganization.css'

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];


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
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
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
            <><p>You cannot create an organization.</p><IonButton>Request Organization Account</IonButton></>
          )
            : (
              <p>You do not have permission to create an organization.</p>
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
                {orgType === "schooldistrict" && (
                  <IonItem>
                    <IonLabel>School District:</IonLabel>
                    <IonInput value={schoolDistrict} onIonChange={e => setSchoolDistrict(e.detail.value!)} />
                    <IonLabel>Add schools by name:</IonLabel>
                    <IonInput value={school} onIonChange={e => setSchool(e.detail.value!)} />
                    <IonButton onClick={() => updateSchools(school)}>Add School</IonButton>
                  </IonItem>
                )}
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
                <IonItem className='createOrganizationMap'>
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={containerMapStyle}
                      center={mapCenter}
                      zoom={18}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        scrollwheel: true,
                        disableDoubleClickZoom: true,
                        mapTypeControl: true,
                        streetViewControl: true,
                        fullscreenControl: true,
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
                          placeholder="Search location"
                        />
                      </Autocomplete>

                      {markers.map((marker, i) => <Marker key={i} position={marker.getPosition() as google.maps.LatLng} />)}
                      {markerPosition && <Marker position={markerPosition} />}
                    </GoogleMap>
                  ) : (
                    <p>Loading maps</p>
                  )}
                </IonItem>

                <br />
                <IonButton expand="full" type="submit">Create Organization</IonButton>
              </form>
            )
          }
        </IonContent>
      </IonContent>
    </IonPage >
  );
};

export default CreateOrganization;
