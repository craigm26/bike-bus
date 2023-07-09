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
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './About.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";



const CreateOrganization: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
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
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonTitle>
          <h1>Create Organization</h1>
        </IonTitle>
        <IonHeader collapse="condense">
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding">
            <p>
              <strong>Account Type:</strong> {accountType}
            </p>
            <p>
              <strong>Username:</strong> {label}
            </p>
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>UID:</strong> {user?.uid}
            </p>
          </div>
          {accountType === "appAdmin" || accountType === "orgAdmin" ? (
            <><p>You cannot create an organization.</p><IonButton>Request Organization Account</IonButton></>
          ) : (
            <form onSubmit={submitForm}>
              <IonItem>
                <IonLabel>Organization Name:</IonLabel>
                <IonInput value={orgName} onIonChange={e => setOrgName(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Description:</IonLabel>
                <IonInput value={orgDescription} onIonChange={e => setOrgDescription(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Type:</IonLabel>
                <IonInput value={orgType} onIonChange={e => setOrgType(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Location:</IonLabel>
                <IonInput value={orgLocation} onIonChange={e => setOrgLocation(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Website:</IonLabel>
                <IonInput value={orgWebsite} onIonChange={e => setOrgWebsite(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Email:</IonLabel>
                <IonInput value={orgEmail} onIonChange={e => setOrgEmail(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Phone Number:</IonLabel>
                <IonInput value={orgPhoneNumber} onIonChange={e => setOrgPhoneNumber(e.detail.value!)} />
              </IonItem>
              <IonItem>
                <IonLabel>Organization Contact Name:</IonLabel>
                <IonInput value={orgContactName} onIonChange={e => setOrgContactName(e.detail.value!)} />
              </IonItem>
              <br />
              <IonButton expand="full" type="submit">Create Organization</IonButton>
            </form>
          )}

        </IonContent>
      </IonContent>
    </IonPage >
  );
};

export default CreateOrganization;
