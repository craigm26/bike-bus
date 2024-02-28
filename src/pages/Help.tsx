import {
  IonContent,
  IonPage,
  IonAvatar,
  IonIcon,
  IonCardTitle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonItem,
  IonList,
  IonButton,
  IonItemGroup,
  IonInput,
  IonLabel,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { db } from '../firebaseConfig';

const Help: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
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

  const writeMessageToFirebase = async () => {
    console.log("writeMessageToFirebase called");
    console.log("email:", email);
    console.log("message:", message);
    const date = new Date();
    const dateStr = date.toISOString();
    console.log("dateStr:", dateStr);
    const messageObj = {
      email: email,
      message: message,
      date: dateStr,
    };
    console.log("messageObj:", messageObj);
    // let's add the document to the document collection "feedback"
    try {
      const docRef = doc(collection(db, "feedback"));
      await setDoc(docRef, messageObj);
      setEmail('');
      setMessage('');
    } catch (e) {
      console.error("Error writing document: ", e);
    }
    setEmail('');
    setMessage('');
  }

  return (
    <IonPage className="ion-flex-offset-app">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Help</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
          <IonCardContent>
            <div>
              <IonItem lines="none" className="message-email-item">
                <IonLabel aria-required position="floating">Email Address</IonLabel>
                <IonInput
                  required={true}
                  aria-required
                  placeholder="Email Address"
                  value={email}
                  onIonChange={e => setEmail(e.detail.value!)}
                ></IonInput>
              </IonItem>
              <IonItem lines="none" className="message-text-item">
                <IonLabel position="floating">Message</IonLabel>
                <IonInput
                  required={true}
                  placeholder="Message"
                  value={message}
                  onIonChange={e => setMessage(e.detail.value!)}
                ></IonInput>
              </IonItem>
              <IonButton expand="block" className="message-send-button" onClick={writeMessageToFirebase}>Send Feedback or Ask for Help</IonButton>
            </div>
          </IonCardContent>
          <IonList>
            <IonItemGroup>
              <IonButton expand="full" onClick={() => toggleSection('section1')}>How do I create a BikeBus?</IonButton>
              {openSection === 'section1' &&
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>How do I create a BikeBus?</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      <IonItem>1. <IonButton className="ion-button-profile" fill="solid" routerLink="/Login">LogIn</IonButton></IonItem>
                      <IonItem>2. Create a Route:  <IonButton className="ion-button-profile" fill="solid" routerLink="/Help">Help</IonButton></IonItem>
                      <IonItem>3. View the Route:  <IonButton className="ion-button-profile" fill="solid" routerLink="/ViewRouteList">View your Routes</IonButton></IonItem>
                      <IonItem>4. Select the "Create BikeBus Group" button</IonItem>
                      <IonItem>5. Fill in the "Create BikeBus" form</IonItem>
                      <IonItem>6. Create your schedule of upcoming events</IonItem>
                      <IonItem>7. Invite people to join the BikeBus or share the event</IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              }
            </IonItemGroup>
            <IonItemGroup>
              <IonButton expand="full" onClick={() => toggleSection('section2')}>Creating a Route</IonButton>
              {openSection === 'section2' &&
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Creating a Route</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      <IonItem>1. Go to the Map Page</IonItem>
                      <IonItem>2. Search for a Starting Location</IonItem>
                      <IonItem>3. Search for a Destination</IonItem>
                      <IonItem>4. Click on the "Get Directions" button</IonItem>
                      <IonItem>5. Click on the "Create Route" button</IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              }
            </IonItemGroup>
            <IonItemGroup>
              <IonButton expand="full" onClick={() => toggleSection('section3')}>How do I join a BikeBus?</IonButton>
              {openSection === 'section3' &&
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>How do I join a BikeBus?</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      <IonItem>1. First, you should be signed up as a User</IonItem>
                      <IonItem>2. Click on the hamburger menu in the left-hand corner and find the "Search for BikeBus"</IonItem>
                      <IonItem>3. Click on the "Start Map by Retrieving your Current Location"</IonItem>
                      <IonItem>4. If you don't see any BikeBus near you, zoom out or start a BikeBus by establishing a route</IonItem>
                      <IonItem>5. If you do see a BikeBus that's near you, click on the map markers to see the button to view the BikeBus</IonItem>
                      <IonItem>6. Click on the "View BikeBus" button</IonItem>
                      <IonItem>7. If you like the route and the schedule, click on the "Join BikeBus" button</IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              }
            </IonItemGroup>
            <IonItemGroup>
              <IonButton expand="full" onClick={() => toggleSection('section4')}>What are the roles in a BikeBus?</IonButton>
              {openSection === 'section4' &&
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>What are the roles in a BikeBus?</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                      <IonItem>1. Leader: Schedules the BikeBus, makes adjustments to the route and starts the BikeBus in the app.</IonItem>
                      <IonItem>2. Members: Everyone is considered a member of the BikeBus when they join the BikeBus or make an RSVP to an Event.</IonItem>
                      <IonItem>3. Captains: Front of the BikeBus and keeping track of time.</IonItem>
                      <IonItem>4. Sheepdogs: Ride alongside the BikeBus, keeping the group together.</IonItem>
                      <IonItem>5. Sprinters: Ride back and forth to help block intersections when encountered. When the BikeBus has cleared the intersection, head to the front.</IonItem>
                      <IonItem>6. Parents: Parents can help their Kid RSVP for an event or help other kids enjoy the BikeBus.</IonItem>
                      <IonItem>7. Kids: Have fun!</IonItem>
                      <IonItem>8. Caboose: Keep to the back to handle any stragglers</IonItem>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              }
            </IonItemGroup>
            <IonItemGroup>
              <IonButton expand="full" onClick={() => toggleSection('section5')}>How do I invite people to my BikeBus?</IonButton>
              {openSection === 'section5' &&
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>How do I invite people to my BikeBus?</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonList>
                    </IonList>
                  </IonCardContent>
                </IonCard>
              }
            </IonItemGroup>
          </IonList>
      </IonContent>
    </IonPage>
  );
};

export default Help;
