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
  IonModal,
  IonRadioGroup,
  IonRadio,
  IonList,
  IonInput,
  IonDatetime,
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
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import { addDoc, collection, setDoc, doc, getDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import React from 'react';




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
  const [startTime, setStartTime] = useState('07:00');
  const [allSchedules, setAllSchedules] = useState<Array<any>>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('08:00');
  const [showStartTimeModal, setShowStartTimeModal] = useState<boolean>(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState<boolean>(false);
  const [recurring, setRecurring] = useState<string>('No');
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [showRecurrenceDaysModal, setShowRecurrenceDaysModal] = useState<boolean>(false);
  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });


  // set the endDate to be 6 months after the start date
  useEffect(() => {
    if (startDateTime) {
      const date = new Date(startDateTime);
      const endDate = new Date(date.setMonth(date.getMonth() + 6));
      setEndDate(endDate.toISOString());
    }
  }
    , [startDateTime]);

  // set the initial start date to be today's date
  useEffect(() => {
    const today = new Date();
    setStartDate(today.toISOString());
  }
    , []);

  useEffect(() => {
    if (startDateTime) {
      const dateParts = startDateTime.split('T');
      const timeParts = dateParts[1].split(':');
      const date = new Date();
      date.setHours(parseInt(timeParts[0]));
      date.setMinutes(parseInt(timeParts[1]));
      date.setSeconds(0);
      date.setMilliseconds(0);

      const endDateTime = new Date(date.getTime() + 60 * 60 * 1000); // add one hour

      let hours = endDateTime.getHours().toString();
      if (hours.length < 2) hours = '0' + hours;

      let minutes = endDateTime.getMinutes().toString();
      if (minutes.length < 2) minutes = '0' + minutes;

      setEndTime(`${hours}:${minutes}`);
    }
  }, [startDateTime]);


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

  const [isRecurring, setIsRecurring] = useState(false);

  const timeOptions = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j++) {
      const time = `${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  if (!user || !user.uid) {
    // If the user object is null, redirect to the login page
    return <></>;
  }
  // 1. create the schedule with a unique document id in a collection in firestore called "schedules"
  const createBikeBusGroupAndSchedule = async () => {

    const scheduleData = {
      startTime: startTime,
      startDateTime: startDateTime,
      startDate: startDate,
      endDate: endDate,
      endTime: endTime,
      isRecurring: isRecurring,
      selectedDays: selectedDays,
      scheduleCreator: doc(db, 'users', user.uid),
    };

    const scheduleRef = await addDoc(collection(db, 'schedules'), scheduleData);
    const scheduleId = scheduleRef.id;
    console.log('scheduleId:', scheduleId);

    // create a new BikeBus group in firestore with the schedule id
      const bikeBusData = {
        BikeBusName: BikeBusName,
        BikeBusDescription: BikeBusDescription,
        BikeBusRoutes: [doc(db, 'routes', RouteID)],
        BikeBusLeaders: [doc(db, 'users', user.uid)],
        BikeBusMembers: [doc(db, 'users', user.uid)],
        BikeBusCreator: doc(db, 'users', user.uid),
        // add the schedule to the BikeBus group in firestore as a single document
        BikeBusSchedules: [doc(db, 'schedules', scheduleId)],
      };

      const bikeBusRef = await addDoc(collection(db, 'bikeBusGroups'), bikeBusData);
      const bikebusgroupId = bikeBusRef.id;
      console.log('bikebusgroupId:', bikebusgroupId);

      // add the schedule document to the bikebus group in firestore
      const bikeBusGroupRef = doc(db, 'bikeBusGroups', bikebusgroupId);
      await updateDoc(bikeBusGroupRef, {
        BikeBusSchedules: arrayUnion(doc(db, 'schedules', scheduleId)),
      });

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
              <IonLabel>BikeBus Start Date and Start Time</IonLabel>
              <IonLabel>
                {startDateTime}
              </IonLabel>
              <IonButton onClick={() => setShowStartTimeModal(true)}>Select Starting Date and Time</IonButton>
              <IonModal isOpen={showStartTimeModal} onDidDismiss={() => setShowStartTimeModal(false)}>
                <IonDatetime
                  onIonChange={e => {
                    console.log('Start DateTime selected', e.detail.value);
                    setStartDateTime(e.detail.value as string);
                    setShowStartTimeModal(false);
                  }}
                ></IonDatetime>
              </IonModal>
            </IonItem>
            <IonItem>
              <IonLabel>BikeBus End Time</IonLabel>
              <IonLabel>{endTime}</IonLabel>
              <IonButton onClick={() => setShowEndTimeModal(true)}>Select End Time</IonButton>
              <IonModal isOpen={showEndTimeModal} onDidDismiss={() => setShowEndTimeModal(false)}>
                <IonDatetime
                  presentation='time'
                  onIonChange={e => {
                    console.log('End Time selected', e.detail.value);
                    setEndTime(e.detail.value as string);
                    setShowEndTimeModal(false);
                  }}
                ></IonDatetime>
              </IonModal>
            </IonItem>
            <IonItem>
              <IonLabel>Is Recurring?</IonLabel>
              <IonLabel>{recurring}</IonLabel>
              <IonButton onClick={() => setShowRecurringModal(true)}>Select Option</IonButton>
              <IonModal isOpen={showRecurringModal} onDidDismiss={() => setShowRecurringModal(false)}>
                <IonList>
                  <IonRadioGroup
                    onIonChange={e => {
                      console.log('Recurring selected', e.detail.value);
                      setRecurring(e.detail.value as string);
                      if (e.detail.value === 'yes') {
                        setShowRecurrenceDaysModal(true);
                      }
                      setShowRecurringModal(false);
                    }}
                  >
                    <IonItem>
                      <IonLabel>Yes</IonLabel>
                      <IonRadio value='yes' />
                    </IonItem>
                    <IonItem>
                      <IonLabel>No</IonLabel>
                      <IonRadio value='no' />
                    </IonItem>
                  </IonRadioGroup>
                </IonList>
                <IonButton onClick={() => setShowRecurringModal(false)}>Done</IonButton>
              </IonModal>
              <IonModal isOpen={showRecurrenceDaysModal} onDidDismiss={() => setShowRecurrenceDaysModal(false)}>
                <IonItemGroup>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <IonItem key={day}>
                      <IonLabel>{day}</IonLabel>
                      <IonCheckbox
                        checked={selectedDays[day]}
                        onIonChange={e => setSelectedDays(prevState => ({ ...prevState, [day]: e.detail.checked }))}
                      />
                    </IonItem>
                  ))}
                </IonItemGroup>
                <IonButton onClick={() => setShowRecurrenceDaysModal(false)}>Done</IonButton>
              </IonModal>
              <IonModal isOpen={showRecurrenceDaysModal} onDidDismiss={() => setShowRecurrenceDaysModal(false)}>
                <IonItemGroup>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <IonItem key={day}>
                      <IonLabel>{day}</IonLabel>
                      <IonCheckbox
                        checked={selectedDays[day]}
                        onIonChange={e => setSelectedDays(prevState => ({ ...prevState, [day]: e.detail.checked }))}
                      />
                    </IonItem>
                  ))}
                </IonItemGroup>
                <IonButton onClick={() => setShowRecurrenceDaysModal(false)}>Done</IonButton>
              </IonModal>
            </IonItem>
            <IonItem>
              <IonLabel>BikeBus End Date</IonLabel>
              <IonLabel>{endDate}</IonLabel>
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
        </IonPage >
      );
    };

    export default CreateBikeBusGroup;
