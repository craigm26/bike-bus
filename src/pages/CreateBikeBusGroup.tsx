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
  IonItem,
  IonCheckbox,
  IonItemGroup,
  IonSelect,
  IonSelectOption,
  IonFooter,
  IonModal,
  IonTitle,
  IonInput,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth'; // Import useAuth hook
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile'; // Import the Profile component
import { personCircleOutline } from 'ionicons/icons';
import { db } from '../firebaseConfig';
import { helpCircleOutline, cogOutline, alertCircleOutline } from 'ionicons/icons';
import GroupCalendar from '../components/BikeBusGroup/BikeBusCalendar';
import InviteUser from '../components/BikeBusGroup/InviteUser';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import RecurrenceSelect from '../components/BikeBusGroup/RecurrenceSelect';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { addDoc, collection, Timestamp, setDoc, doc, getDoc } from 'firebase/firestore';



const CreateBikeBusGroup: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const { RouteID } = useParams<{ RouteID: string }>();
  const localizer = momentLocalizer(moment);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [BikeBusName, setBikeBusName] = useState('');
  const [BikeBusDescription, setBikeBusDescription] = useState('');
  const [schedules, setSchedules] = useState<Array<any>>([]);



  console.log("RouteID: ", RouteID);




  // fetch route data from the previous step of "CreateBikeBusGroup" button with the id from the URL and user data from firestore
  const history = useHistory();



  const fetchRoute = async () => {
    const routeRef = doc(db, 'routes', RouteID);
    const routeSnapshot = await getDoc(routeRef);
    if (routeSnapshot.exists()) {
      const routeData = routeSnapshot.data();
      if (routeData) {
        setRoute(routeData);
      }
    }
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

  // add a button to save information from the calendar and invite user to the group


  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      fetchRoute();
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      });
    }
  }, [user, RouteID]);

  const label = user?.username ? user.username : "anonymous";

  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const time = `${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

// 1. create a new BikeBus group in firestore
const createBikeBusGroupInFirestore = async () => {
  const bikeBusData = {
    name: BikeBusName,
    description: BikeBusDescription,
    route: route,
    schedules: [] // This will be updated later
  };
  const docRef = await addDoc(collection(db, 'bikebusgroups'), bikeBusData);
  return docRef.id;
};

// 2. create the schedule with a unique id in a collection in firestore called "schedules"
const createScheduleInFirestore = async (schedule: any) => {
  const docRef = await addDoc(collection(db, 'schedules'), schedule);
  return docRef.id;
};


// 3. add the schedule to the BikeBus group in firestore
const addScheduleToBikeBusGroupInFirestore = async (bikebusgroupId: string, scheduleId: string) => {
  const bikebusgroupRef = doc(db, 'bikebusgroups', bikebusgroupId);
  await setDoc(bikebusgroupRef, { schedules: scheduleId }, { merge: true });
};

// 4. add the schedule to the BikeBus group in the UI
const createScheduleInMemoryAndAddtoUI = () => {
  // Create a unique id for the schedule
  const id = Date.now().toString();

  const newSchedule = {
    id,
    scheduleName,
    startTime,
    endTime,
    isRecurring,
    selectedDays,
  };

  // Add the new schedule to the schedules state
  setSchedules(prevState => [...prevState, newSchedule]);

  // Close the modal
  setShowScheduleModal(false);
};

// Combine all steps
const createBikeBusGroupAndSchedule = async () => {
  const bikebusgroupId = await createBikeBusGroupInFirestore();

  for (const schedule of schedules) {
    const scheduleId = await createScheduleInFirestore(schedule);
    await addScheduleToBikeBusGroupInFirestore(bikebusgroupId, scheduleId);
  }

  history.push(`/bikebusgrouppage/${bikebusgroupId}`);
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
          <IonPopover
            isOpen={showPopover}
            event={popoverEvent}
            onDidDismiss={() => setShowPopover(false)}
            className="my-popover"
          >
            <Profile />
          </IonPopover>
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
          <IonButtons slot="primary">
            <IonButton routerLink='/help'>
              <IonIcon slot="end" icon={helpCircleOutline}></IonIcon>
            </IonButton>
            <IonButton routerLink='/settings'>
              <IonIcon slot="end" icon={cogOutline}></IonIcon>
            </IonButton>
            <IonButton routerLink='/notifications'>
              <IonIcon slot="end" icon={alertCircleOutline}></IonIcon>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar></IonToolbar>
        </IonHeader>
        <IonItem>
          <IonLabel>BikeBus Name</IonLabel>
          <IonInput aria-label="BikeBusName"
              placeholder="BikeBus Name"
              value={BikeBusName}
              onIonChange={(e) => setBikeBusName(e.detail.value!)}
            />
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Description</IonLabel>
          <IonInput aria-label="BikeBusDescription"
              placeholder="BikeBus Description"
              value={BikeBusDescription}
              onIonChange={(e) => setBikeBusDescription(e.detail.value!)}
            />
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Schedule</IonLabel>
          <IonItem>
      <IonButton expand="full" onClick={() => setShowScheduleModal(true)}>Add BikeBus Schedule</IonButton>
    </IonItem>
    <IonModal isOpen={showScheduleModal}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Add BikeBus Schedule</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel>Schedule Name</IonLabel>
            <IonInput aria-label="scheduleName"
              placeholder="Schedule Name"
              value={scheduleName}
              onIonChange={(e) => setScheduleName(e.detail.value!)}
            />
        </IonItem>
        <IonItem>
          <IonLabel>Start Time</IonLabel>
          <IonSelect value={startTime} placeholder="Select Start Time" onIonChange={e => setStartTime(e.detail.value)}>
            {timeOptions.map((time, index) => (
              <IonSelectOption key={index} value={time}>
                {time}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>End Time</IonLabel>
          <IonSelect value={endTime} placeholder="Select End Time" onIonChange={e => setEndTime(e.detail.value)}>
            {timeOptions.map((time, index) => (
              <IonSelectOption key={index} value={time}>
                {time}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        <IonItem>
          <IonLabel>Is Recurring?</IonLabel>
          <IonCheckbox slot="start" checked={isRecurring} onIonChange={e => setIsRecurring(e.detail.checked)} />
        </IonItem>

        {isRecurring && (
          <IonItemGroup>
            <RecurrenceSelect selectedDays={selectedDays} setSelectedDays={setSelectedDays} />
          </IonItemGroup>
        )}
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton expand="full" onClick={createScheduleInMemoryAndAddtoUI}>Add Schedule</IonButton>
          <IonButton expand="full" onClick={() => setShowScheduleModal(false)}>Close</IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Route</IonLabel>
          <IonLabel>{route?.routeName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Starting Point</IonLabel>
          <IonLabel>{route?.startPointName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Ending Point</IonLabel>
          <IonLabel>{route?.endPointName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonButton onClick={createBikeBusGroupAndSchedule}>Create BikeBus</IonButton>
        </IonItem>
      </IonContent>
    </IonPage>
  );
};

export default CreateBikeBusGroup;
