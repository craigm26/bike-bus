import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonMenuButton,
    IonButtons,
    IonButton,
    IonLabel,
    IonText,
    IonChip,
    IonAvatar,
    IonPopover,
    IonIcon,
  } from '@ionic/react';
  import { useState } from 'react';
  import './About.css';
  import useAuth from '../useAuth'; // Import useAuth hook
  import { useAvatar } from '../components/useAvatar';
  import Avatar from '../components/Avatar';
  import Profile from '../components/Profile'; // Import the Profile component
  import { personCircleOutline } from 'ionicons/icons';
  import AccountModeSelector from '../components/AccountModeSelector';
  import { useHistory } from 'react-router-dom';
  import { collection, addDoc } from 'firebase/firestore';
  import { db } from '../firebaseConfig';
  
  const CreateOrganization: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const { avatarUrl } = useAvatar(user?.uid);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const history = useHistory();
  
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
  
    const label = user?.displayName ? user.displayName : 'anonymous';
  
    const [accountMode, setAccountMode] = useState<string[]>([]);
  
    const onAccountModeChange = (mode: string[]) => {
      setAccountMode(mode);
    };
  
    const enabledModes = [
      'Member',
      'Leader',
      'Parent',
      'Kid',
      'Car Driver',
      'Org Admin',
      'App Admin',
    ];
  
    // Form state
    const [orgName, setOrgName] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerEmail, setOwnerEmail] = useState('');
    const [ownerUsername, setOwnerUsername] = useState('');
    const [geolocation, setGeolocation] = useState('');
  
    const requestOrg = async () => {
      try {
        // Create the organization in Firebase Storage
        // You can call the API or service to create the organization and return the organization data
        // For now, just use a hard-coded organization object
        const orgData = {
          uid: 'org1', // Replace with actual UID from Firebase
          orgName: orgName,
          orgOwnerAccount: user?.uid,
          orgOwnerUsername: ownerUsername,
          orgOwnerEmail: ownerEmail,
          accountMode: accountMode,
          geolocationPosition: geolocation, // Replace with actual geolocation data
          bikeBusLocationIdentifier: '',
          orgIdentifier: '',
          orgLeaders: [user?.uid],
          orgMembers: [user?.uid],
        };
  
        // Create a new document in the "organizations" collection with the organization's information
        const orgCollectionRef = collection(db, 'organizations');
        const newOrgData = {
          ...orgData,
          orgRoutes: [],
        };
        await addDoc(orgCollectionRef, newOrgData);
  
        // Redirect the user to the home page
        history.push('/Map');
      } catch (error) {
        console.error('Error requesting organization:', error);
      }
    };
  
    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      requestOrg();
    };
  
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton></IonMenuButton>
            </IonButtons>
            <IonText slot="start" color="primary" class="BikeBusFont">
              <h1>BikeBus</h1>
            </IonText>
            <AccountModeSelector
              enabledModes={enabledModes}
              value={accountMode}
              onAccountModeChange={onAccountModeChange}
            />
  
            <IonButton fill="clear" slot="end" onClick={togglePopover}>
              <IonChip>
                {avatarElement}
                <IonLabel>{label}</IonLabel>
              </IonChip>
            </IonButton>
            <IonPopover
              isOpen={showPopover}
              event={popoverEvent}
              onDidDismiss={() => setShowPopover(false)}
              className="my-popover"
            >
              <Profile />
            </IonPopover>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonHeader collapse="condense">
            <IonToolbar></IonToolbar>
          </IonHeader>
          <form onSubmit={handleFormSubmit}>
            <label>
              Name of the organization:
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </label>
            <label>
              Name of the owner:
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </label>
            <label>
              E-mail of the owner:
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </label>
            <label>
              UserName of the owner:
              <input
                type="text"
                value={ownerUsername}
                onChange={(e) => setOwnerUsername(e.target.value)}
              />
            </label>
            <label>
              Geolocation of the organization:
              <input
                type="text"
                value={geolocation}
                onChange={(e) => setGeolocation(e.target.value)}
              />
            </label>
            <button type="submit">Submit</button>
          </form>
          <IonText>An e-mail will be sent to the Application Administrator for approval.</IonText>
          <IonText>Once approved, the organization will be created.</IonText>
          {/* Add logic for sending email to App Admin and handling approval */}
        </IonContent>
      </IonPage>
    );
  };
  
  export default CreateOrganization;
  