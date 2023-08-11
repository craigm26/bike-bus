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
import { useEffect, useState, useContext } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";
import React from "react";
import './CreateOrganization.css'
import { useHistory } from 'react-router-dom';
import { HeaderContext } from '../components/HeaderContext';





const CreateOrganization: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const history = useHistory();

  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhoneNumber, setOrgPhoneNumber] = useState("");
  const [orgContactName, setOrgContactName] = useState("");
  const [enabledAccountModes, setAccountMode] = useState<string[]>([]);
  const [newOrgId, setNewOrgId] = useState<string>('');
  const headerContext = useContext(HeaderContext);



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
    if (!user?.uid) {
      throw new Error("User not logged in");
    }
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
      OrganizationCreator: doc(db, 'users', user?.uid),
      // any user who has one role in the OrganizationMembers array will be able to view certain parts of the ViewOrganization page
      OrganizationMembers: [doc(db, 'users', user?.uid)],
      // admins can delete users, change user roles, and change organization settings
      OrganizationAdmins: [doc(db, 'users', user?.uid)],
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
      Trips: [''],
      Routes: [''],
      BikeBusGroups: [''],
      Messages: [''],
      CreatedOn: new Date(),
      LastUpdatedBy: doc(db, 'users', user?.uid),
      LastUpdatedOn: new Date(),
    });
    // make the document id available to the rest of the app with setNewOrgId
    console.log("New organization created with ID: ", newOrg.id);
    // we want to make the newOrg.id available to the rest of the app
    return newOrg.id;
  };

  // add the new organization to the user's organization list
  const addOrganizationToUser = async (newOrgId: string) => {
    console.log('addOrganizationToUser called');
    if (!user || !newOrgId) return;  // Check that newOrgId is defined and non-empty
    const userRef = doc(db, 'users', user.uid);
    const docSnapshot = await getDoc(userRef);
    if (docSnapshot.exists()) {
      const userData = docSnapshot.data();
      if (userData) {
        const userOrganizations = userData.organizations || [];
        const orgRef = doc(db, 'organizations', newOrgId); // Create a reference to the organization document
        userOrganizations.push(orgRef);
        const enabledOrgModes = ['OrganizationAdmin', 'OrganizationCreator', 'OrganizationManager', 'OrganizationEmployee', 'OrganizationVolunteer', 'OrganizationMember'];
        await updateDoc(userRef, {
          organizations: userOrganizations,
          enabledOrgModes: enabledOrgModes,
        });
      }
    }
  };

  const addBulletinBoardToOrganization = async (newOrgId: string) => {
    console.log('addBulletinBoardToOrganization called');
    if (!user) return;

    const bulletinBoardData = {
      Organization: doc(db, 'organizations', newOrgId),
      bulletinboardType: 'Organization',
      bulletinboardName: orgName,
      bulletinboardCreator: doc(db, 'users', user.uid),
      Messages: [],
    };

    // addDoc() returns a Promise that resolves with a DocumentReference
    // to the newly created document.
    const newBulletinBoardRef = await addDoc(collection(db, 'bulletinboard'), bulletinBoardData);

    // You can get the new document's ID from the DocumentReference.
    const bulletinBoardId = newBulletinBoardRef.id;
    console.log('bulletinBoardId:', bulletinBoardId);

    const OrgRef2 = doc(db, 'organizations', newOrgId);
    console.log('OrgRef2:', OrgRef2);
    await updateDoc(OrgRef2, {
      bulletinboard: doc(db, 'bulletinboard', bulletinBoardId),
    });
  };


  // Form submission handler
  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const newOrgId = await createOrganization();
      await addOrganizationToUser(newOrgId);
      await addBulletinBoardToOrganization(newOrgId);
      history.push('/ViewOrganization/' + newOrgId);
    }
    catch (error) {
      console.log(error);
    }
  };


  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
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
            <IonLabel>Contact Name:</IonLabel>
            <IonInput value={orgContactName} onIonChange={e => setOrgContactName(e.detail.value!)} required />
          </IonItem>
          <IonButton expand="full" type="submit">Create Organization</IonButton>
        </form>
      </IonContent>
    </IonPage >
  );
};

export default CreateOrganization;
