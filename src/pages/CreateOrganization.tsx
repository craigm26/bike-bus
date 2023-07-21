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
import { doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";
import { useJsApiLoader } from '@react-google-maps/api';
import React from "react";
import './CreateOrganization.css'
import { useHistory } from 'react-router-dom';
import { add } from 'date-fns';

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
      Schools: [''],
      SchoolDistrict: [''],
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

  // add the new organization to the user's organization list
  const addOrganizationToUser = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user?.uid);
    const docSnapshot = await getDoc(userRef);
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      if (userData && userData.organizations) {
        const enabledOrgModes = userData.enabledOrgModes;
        // set enabledOrgModes to include the orgnization's enabled account modes for the user. Make it set to OrganizationAdmin and OrganizationCreator by default
        enabledOrgModes.push('OrganizationAdmin');
        enabledOrgModes.push('OrganizationCreator');
        const userOrganizations = userData.organizations;
        userOrganizations.push(newOrgId);
        await updateDoc(userRef, {
          organizations: userOrganizations,
          enabledOrgModes: enabledOrgModes,
        });
      }
    }
  };

  const addBulletinBoardToOrganization = async () => {
    if (!user) return;
    // first we'll create a messages document for the organization
    // create a messages document in the firestore collection "messages" for the organization
    const messagesData = {
      Organization: doc(db, 'organizations', newOrgId),
      Messages: '',
      Timestamp: '',
      user: '',
    };
    await addDoc(collection(db, 'messages'), messagesData);
    // then we'll add the messages document to the organization's bulletin boards as a reference
    const orgRef = doc(db, 'organizations', newOrgId);
    const docSnapshot = await getDoc(orgRef);
    if (docSnapshot.exists()) {
      const orgData = docSnapshot.data();
      if (orgData && orgData.BulletinBoards) {
        const orgBulletinBoards = orgData.BulletinBoards;
        orgBulletinBoards.push(messagesData);
        await updateDoc(orgRef, {
          BulletinBoards: orgBulletinBoards,
        });
      }
    }
    // 
    // get the messages document id
    const messagesRef = await getDocs(collection(db, 'messages'));
    const messagesId = messagesRef.docs[messagesRef.docs.length - 1].id;
    console.log('messagesId:', messagesId);

    // create a reference in the bulletinboard collection in firestore for the organization
    const bulletinBoardData = {
      Organization: doc(db, 'ogranization', newOrgId),
      // make an array of messageIds references in "Messages"
      Messages: [],
    }
    await addDoc(collection(db, 'bulletinboard'), bulletinBoardData);

    // get the bulletinboard document id
    const bulletinBoardRef = await getDocs(collection(db, 'bulletinboard'));
    const bulletinBoardId = bulletinBoardRef.docs[bulletinBoardRef.docs.length - 1].id;
    console.log('bulletinBoardId:', bulletinBoardId);

    // add the bulletinboard reference to the organization document in firestore
    const OrgRef2 = doc(db, 'Organizations', newOrgId);
    await updateDoc(OrgRef2, {
      bulletinboard: doc(db, 'bulletinboard', bulletinBoardId),
    });

  };

  // Form submission handler
  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await createOrganization();
      await addOrganizationToUser();
      await addBulletinBoardToOrganization();
      history.push('/ViewOrganization/' + newOrgId);
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
          <form onSubmit={submitForm}>
            <IonItem>
              <IonLabel>Name of Organization:</IonLabel>
              <IonInput value={orgName} onIonChange={e => setOrgName(e.detail.value!)} required />
            </IonItem>
            <IonItem>
              <IonLabel>Type:</IonLabel>
              <IonSelect value={orgType} onIonChange={e => setOrgType(e.detail.value)} >
                <IonSelectOption value="School">School</IonSelectOption>
                <IonSelectOption value="School District">School District</IonSelectOption>
                <IonSelectOption value="Work">Work</IonSelectOption>
                <IonSelectOption value="Social">Social</IonSelectOption>
                <IonSelectOption value="Club">Club</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel>Website:</IonLabel>
              <IonInput value={orgWebsite} onIonChange={e => setOrgWebsite(e.detail.value!)} required />
            </IonItem>
            <IonItem>
              <IonLabel>Email:</IonLabel>
              <IonInput value={user?.email} onIonChange={e => setOrgEmail(e.detail.value!)} readonly required />
            </IonItem>
            <IonItem>
              <IonLabel>Phone Number:</IonLabel>
              <IonInput value={orgPhoneNumber} onIonChange={e => setOrgPhoneNumber(e.detail.value!)} />
            </IonItem>
            <IonItem>
              <IonLabel>Contact Name:</IonLabel>
              <IonInput value={orgContactName} onIonChange={e => setOrgContactName(e.detail.value!)} required />
            </IonItem>
            <IonButton expand="full" type="submit">Create Organization</IonButton>
          </form>
        </IonContent>
      </IonContent>
    </IonPage >
  );
};

export default CreateOrganization;
