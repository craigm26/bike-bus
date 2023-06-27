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
  IonSelect,
  IonSelectOption,
  IonTitle,
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
import { addDoc, collection, Timestamp, doc, getDoc, arrayUnion, updateDoc, getDocs } from 'firebase/firestore';
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
  const [BikeBusName, setBikeBusName] = useState('');
  const [BikeBusDescription, setBikeBusDescription] = useState('');
  const [startTime, setStartTime] = useState('07:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [BikeBusType, setBikeBusType] = useState('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endTime, setEndTime] = useState('08:00');
  const [showStartTimeModal, setShowStartTimeModal] = useState<boolean>(false);
  const [showStartDayModal, setShowStartDayModal] = useState<boolean>(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState<boolean>(false);
  const [recurring, setRecurring] = useState<string>('no');
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [showRecurrenceDaysModal, setShowRecurrenceDaysModal] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState('no');
  const [isBikeBus, setIsBikeBus] = useState<boolean>(false);
  const [BikeBusStopName, setBikeBusStopName] = useState('');
  const [bulletinBoardData, setBulletinBoardData] = useState<any>(null);

  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });

  // when the setStartDate is called, set the setEndDate to 30 days from that date - only if the recurring option is set to Yes
  useEffect(() => {
    if (startDate && isRecurring === 'yes') {
      const date = new Date(startDate);
      date.setDate(date.getDate() + 30);
      setEndDate(date.toISOString());
    } else {  // if the recurring option is set to No, set the setEndDate to the same date as the setStartDate
      if (startDate && isRecurring === 'no') {
        setEndDate(startDate);
      }
    }
  }, [startDate, isRecurring]);

  // when the setStartDate is called, format formattedStartDate to be in the format "Month Day, Year"
  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // when the setEndDate is called, format formattedEndDate to be in the format "Month Day, Year"
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // format the startTime in am or pm (not 24 hour time)
  const formattedStartTime = startTime ? new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';

  // format the endTime in am or pm (not 24 hour time)
  const formattedEndTime = endTime ? new Date(endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';


  console.log("RouteID: ", RouteID);

  // fetch route data from the previous step of "CreateBikeBusGroup" button with the id from the URL and user data from firestore
  const history = useHistory();

  useEffect(() => {
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
    fetchRoute();
  }, [RouteID]);


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
  }, [user, RouteID,]);

  const label = user?.username ? user.username : "anonymous";

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

    const endDateObj = new Date(endDate);
  
    // Create the end timestamp by combining the event date and end time
    const endTimeObj = new Date(`${endDateObj.toDateString()} ${endTime}`);
  
    // Convert the end timestamp to a Firebase Timestamp
    const endTimestamp = Timestamp.fromDate(endTimeObj);

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
      BikeBusType: BikeBusType,
      BikeBusRoutes: [doc(db, 'routes', RouteID)],
      BikeBusLeaders: [doc(db, 'users', user.uid)],
      BikeBusMembers: [doc(db, 'users', user.uid)],
      BikeBusCreator: doc(db, 'users', user.uid),
      // add the schedule to the BikeBus group in firestore as a single document
    };


    const bikeBusRef = await addDoc(collection(db, 'bikebusgroups'), bikeBusData);
    const bikebusgroupId = bikeBusRef.id;
    console.log('bikebusgroupId:', bikebusgroupId);

    // add the schedule document to the bikebus group in firestore
    const bikeBusGroupRef = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef, {
      BikeBusSchedules: arrayUnion(doc(db, 'schedules', scheduleId)),
    });

    // add the bikebusgroupid to the routes collection in the firestore document for the route
    const routeRef = doc(db, 'routes', RouteID);
    await updateDoc(routeRef, {
      BikeBusGroupId: doc(db, 'bikebusgroups', bikebusgroupId),
      BikeBusName: BikeBusName,
      isBikeBus: true,
      ScheduleId: doc(db, 'schedules', scheduleId),
    });

    // add the bikebus group to the user's bikebusgroups array in firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      bikebusgroups: arrayUnion(doc(db, 'bikebusgroups', bikebusgroupId)),
    });

    // add the bikebusgroup document id to the schedule document in firestore
    const scheduleRef2 = doc(db, 'schedules', scheduleId);
    await updateDoc(scheduleRef2, {
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      // update the schedule name in firestore to match the bikebus name
      scheduleName: BikeBusName,
    });



    function getRecurringDates(startDate: Date, endDate: Date, selectedDays: { [key: string]: boolean }) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const selectedDayIndices = Object.entries(selectedDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day]) => days.indexOf(day));
      const dates = [];

      for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        if (selectedDayIndices.includes(dt.getDay())) {
          dates.push(new Date(dt));
        }
      }

      return dates;
    }

    // create a new events document in the firestore collection "events" for the schedule. This will be used to populate the calendar
    const eventsData = {
      title: BikeBusName,
      start: startDate.split('T')[0],
      end: endDate.split('T')[0],
      startTime: startTime,
      endTime: endTime,
      eventDays: getRecurringDates(new Date(startDate), new Date(endDate), selectedDays),
      recurring: isRecurring,
      selectedDays: selectedDays,
      schedule: doc(db, 'schedules', scheduleId),
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      days: Object.entries(selectedDays).reduce<number[]>((acc, [day, isSelected]) => {
        if (isSelected) acc.push(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day));
        return acc;
      }, []),
    };



    // add the events document to the events collection in firestore
    const eventsRef = await addDoc(collection(db, 'events'), eventsData);
    const eventId = eventsRef.id;
    console.log('eventId:', eventId);

    // add the events document id (as a reference) to the schedule document in firestore
    const scheduleRef3 = doc(db, 'schedules', scheduleId);
    await updateDoc(scheduleRef3, {
      events: arrayUnion(doc(db, 'events', eventId)),
    });

    // Create event documents based on eventDays
    const eventDays = getRecurringDates(new Date(startDate), new Date(endDate), selectedDays);
    for (const day of eventDays) {
      const eventData = {
        title: BikeBusName + ' for ' + day,
        start: day,
        end: endTimestamp,
        leader: '',
        members: [],
        kids: [],
        sprinters: [],
        captains: [],
        sheepdogs: [],
        caboose: [],
        startTime: startTime,
        endTime: endTime,
        route: doc(db, 'routes', RouteID),
        BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
        BikeBusStops: [],
        BikeBusStopTimes: [],
        StaticMap: '',
        schedule: doc(db, 'schedules', scheduleId),
      };

      await addDoc(collection(db, 'event'), eventData);
      // add each event document id that was just created to the bikebusgroup document in firestore as an array of references called eventIds
      const eventRef = await getDocs(collection(db, 'event'));
      const eventIds = eventRef.docs.map((doc) => doc.id);
      console.log('eventIds:', eventIds);

      for (const eventId of eventIds) {
        const bikeBusGroupRef3 = doc(db, 'bikebusgroups', bikebusgroupId);
        await updateDoc(bikeBusGroupRef3, {
          event: arrayUnion(doc(db, 'event', eventId)),
        });
      }


    }

    // add the references to the event documents to the bikebusgroup document in firestore
    const bikeBusGroupRef2 = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef2, {
      events: arrayUnion(doc(db, 'events', eventId)),
    });

    // add the references to the event documents to the events document in firestore
    const eventsRef2 = doc(db, 'events', eventId);
    await updateDoc(eventsRef2, {
      event: arrayUnion(doc(db, 'event', eventId)),
    });

    // create a messages document in the firestore collection "messages" for the bikebusgroup
    const messagesData = {
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      Messages: '',
      Timestamp: '',
      user: '',
    };
    await addDoc(collection(db, 'messages'), messagesData);

    // get the messages document id
    const messagesRef = await getDocs(collection(db, 'messages'));
    const messagesId = messagesRef.docs[messagesRef.docs.length - 1].id;
    console.log('messagesId:', messagesId);

    // create a reference in the bulletinboard collection in firestore for the bikebusgroup
    const bulletinBoardData = {
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      // make an array of messageIds references in "Messages"
      Messages: [],
    }
    await addDoc(collection(db, 'bulletinboard'), bulletinBoardData);

    // get the bulletinboard document id
    const bulletinBoardRef = await getDocs(collection(db, 'bulletinboard'));
    const bulletinBoardId = bulletinBoardRef.docs[bulletinBoardRef.docs.length - 1].id;
    console.log('bulletinBoardId:', bulletinBoardId);

    // add the bulletinboard reference to the bikebusgroup document in firestore
    const bikeBusGroupRef3 = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef3, {
      bulletinboard: doc(db, 'bulletinboard', bulletinBoardId),
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
          <IonLabel>BikeBus Type:</IonLabel>
          <IonSelect value={BikeBusType} placeholder="Select One" onIonChange={e => setBikeBusType(e.detail.value)}>
            <IonSelectOption value="Work">Work</IonSelectOption>
            <IonSelectOption value="School">School</IonSelectOption>
            <IonSelectOption value="Social">Social</IonSelectOption>
            <IonSelectOption value="Club">Club</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Start Date</IonLabel>
          <IonLabel>
            <IonText>{formattedStartDate}</IonText>
          </IonLabel>
          <IonButton onClick={() => setShowStartDayModal(true)}>Select Start Date</IonButton>
          <IonModal isOpen={showStartDayModal} onDidDismiss={() => setShowStartDayModal(false)}>
            <IonDatetime
              presentation='date'
              onIonChange={e => {
                if (typeof e.detail.value === 'string') {
                  const date = new Date(e.detail.value);
                  console.log('Start DateTime selected', date);
                  setStartDate(date.toISOString());
                }
              }}

            ></IonDatetime>
            <IonButton onClick={() => setShowStartDayModal(false)}>Done</IonButton>
          </IonModal>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Start Time</IonLabel>
          <IonLabel>{formattedStartTime}</IonLabel>
          <IonButton onClick={() => setShowStartTimeModal(true)}>Select Start Time</IonButton>
          <IonModal isOpen={showStartTimeModal} onDidDismiss={() => setShowStartTimeModal(false)}>
            <IonDatetime
              presentation='time'
              onIonChange={e => {
                console.log('Start Time selected', e.detail.value);
                setStartTime(e.detail.value as string);

              }}
            ></IonDatetime>
            <IonButton onClick={() => setShowStartTimeModal(false)}>Done</IonButton>
          </IonModal>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus End Time</IonLabel>
          <IonLabel>{formattedEndTime}</IonLabel>
          <IonButton onClick={() => setShowEndTimeModal(true)}>Select End Time</IonButton>
          <IonModal isOpen={showEndTimeModal} onDidDismiss={() => setShowEndTimeModal(false)}>
            <IonDatetime
              presentation='time'
              onIonChange={e => {
                console.log('End Time selected', e.detail.value);
                setEndTime(e.detail.value as string);
              }}
            ></IonDatetime>
            <IonButton onClick={() => setShowEndTimeModal(false)}>Done</IonButton>
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
                  setIsRecurring(e.detail.value as string);
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
            <IonTitle>Recurring Days</IonTitle>
            <IonLabel>The default number of occurring events that are created are constrained to 30 days from the selected start date. After the BikeBus is created, additional schedules can be added.</IonLabel>
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
          <IonLabel>{formattedEndDate}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Route</IonLabel>
          <IonLabel>{route?.routeName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Starting Point</IonLabel>
          <IonLabel>{route?.startPointAddress}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>Ending Point</IonLabel>
          <IonLabel>{route?.endPointAddress}</IonLabel>
        </IonItem>
        <IonItem>
          <IonButton onClick={createBikeBusGroupAndSchedule}>Create BikeBus</IonButton>
        </IonItem>
      </IonContent>
    </IonPage >
  );
};

export default CreateBikeBusGroup;
