// src/pages/BikeBusMember.tsx
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
  
  const About: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const { avatarUrl } = useAvatar(user?.uid);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
  
    const togglePopover = (e: any) => {
      console.log('togglePopover called');
      console.log('event:', e);
      setPopoverEvent(e.nativeEvent);
      setShowPopover((prevState) => !prevState);
      console.log('showPopover state:', showPopover);
    };
  
    const avatarElement = avatarUrl ? (
      <IonAvatar>
        <Avatar uid={user?.uid} size="extrasmall" />
      </IonAvatar>
    ) : (
      <IonIcon icon={personCircleOutline} />
    );
  
    const label = user?.displayName ? user.displayName : "anonymous";
  
    const [accountMode, setAccountMode] = useState<string[]>([]);
  
  
  
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
              value={accountMode}
              onAccountModeChange={(value) => setAccountMode(value)}
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
        </IonContent>
      </IonPage>
    );
  };
  
  export default About;
  