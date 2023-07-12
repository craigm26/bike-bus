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
import { useJsApiLoader } from '@react-google-maps/api';
import React from "react";
import './CreateOrganization.css'
import { useHistory } from 'react-router-dom';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

interface Coordinate {
  lat: number;
  lng: number;
}


const CreateOrganization: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const history = useHistory();

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
  const [newOrgId, setNewOrgId] = useState<string>('');


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
          if (userData && userData.enabledAccountModes) {
            setAccountMode(userData.enabledAccountModes);
          }
        }
      });
    }
  }, [user]);

  const label = user?.username ? user.username : "anonymous";

  const createOrganization = async () => {
    // Add a new document in collection "organizations"
    const newOrg = await addDoc(collection(db, "organizations"), {
      NameOfOrg: orgName,
      OrganizationType: orgType,
      Website: orgWebsite,
      Email: orgEmail,
      PhoneNumber: orgPhoneNumber,
      ContactName: orgContactName,
      Description: orgDescription,
      Location: '',
      MailingAddress: '',
      SchoolDistrictName: '',
      SchoolDistrictLocation: '',
      SchoolNames: [''],
      SchoolLocations: [''],
      OrganizationCreator: user?.uid,
      // any user who has one role in the OrganizationMembers array will be able to view certain parts of the ViewOrganization page
      OrganizationMembers: [user?.uid],
      // admins can delete users, change user roles, and change organization settings
      OrganizationAdmins: [user?.uid],
      // managers can create events, create schedules, create bike bus groups, create routes, and create trips while assign employees to routes, bike bus groups, events, and trips
      OrganizationManagers: [''],
      // employees can view schedules, view events, view routes, view trips and accept assignments
      OrganizationEmployees: [''],
      // volunteers can view schedules, view events, and view routes and accept assignments
      OrganizationVolunteers: [''],
      Schedules: [''],
      Events: [''],
      Event: [''],
      BulletinBoards: [''],
      Trips: [''],
      Routes: [''],
      BikeBusGroups: [''],
      Messages: [''],
      CreatedOn: new Date(),
      LastUpdatedBy: user?.uid,
      LastUpdatedOn: new Date(),
    });
    // make the document id available to the rest of the app with setNewOrgId
    const newOrgId = newOrg.id;
    console.log("New organization created with ID: ", newOrg.id);
    return newOrgId;
  };

  
  // Form submission handler
  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createOrganization();
      history.push('/OrganizationProfile/' + newOrgId);
    }
    catch (error) {
      console.log(error);
    }
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
                  <IonInput value={orgName} onIonChange={e => setOrgName(e.detail.value!)} required/>
                </IonItem>
                <IonItem>
                  <IonLabel>Type:</IonLabel>
                  <IonSelect value={orgType} onIonChange={e => setOrgType(e.detail.value)} >
                    <IonSelectOption value="school">School</IonSelectOption>
                    <IonSelectOption value="schooldistrict">School District</IonSelectOption>
                    <IonSelectOption value="work">Work</IonSelectOption>
                    <IonSelectOption value="social">Social</IonSelectOption>
                    <IonSelectOption value="club">Club</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel>Website:</IonLabel>
                  <IonInput value={orgWebsite} onIonChange={e => setOrgWebsite(e.detail.value!)} required />
                </IonItem>
                <IonItem>
                  <IonLabel>Email:</IonLabel>
                  <IonInput value={orgEmail} onIonChange={e => setOrgEmail(e.detail.value!)} required />
                </IonItem>
                <IonItem>
                  <IonLabel>Phone Number:</IonLabel>
                  <IonInput value={orgPhoneNumber} onIonChange={e => setOrgPhoneNumber(e.detail.value!)} required />
                </IonItem>
                <IonItem>
                  <IonLabel>Contact Name:</IonLabel>
                  <IonInput value={orgContactName} onIonChange={e => setOrgContactName(e.detail.value!)} required />
                </IonItem>
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
