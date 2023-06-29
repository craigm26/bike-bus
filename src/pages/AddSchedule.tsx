import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonCheckbox,
  IonDatetime,
  IonItem,
  IonItemGroup,
  IonLabel,
  IonList,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonText,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDocs, getDoc, addDoc, Timestamp, arrayUnion, updateDoc, deleteDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useHistory, useParams } from 'react-router-dom';
import { momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type Event = {
  start: Date,
  end: Date,
  title: string
};

const AddSchedule: React.FC = () => {
  const { user } = useAuth(); // Use the useAuth hook to get the user object
  const { avatarUrl } = useAvatar(user?.uid);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const localizer = momentLocalizer(moment);
  const [BikeBusName, setBikeBusName] = useState('');
  const [BikeBusDescription, setBikeBusDescription] = useState('');
  const [startTime, setStartTime] = useState<string>('07:00');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [BikeBusType, setBikeBusType] = useState('');
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('08:00');
  const [showStartTimeModal, setShowStartTimeModal] = useState<boolean>(false);
  const [showStartDayModal, setShowStartDayModal] = useState<boolean>(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState<boolean>(false);
  const [recurring, setRecurring] = useState<string>('no');
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [showRecurrenceDaysModal, setShowRecurrenceDaysModal] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState('no');
  const [isBikeBus, setIsBikeBus] = useState<boolean>(false);
  const [bulletinBoardData, setBulletinBoardData] = useState<any>(null);
  const [expectedDuration, setExpectedDuration] = useState<number>(0);
  const eventIds: string[] = [];
  const { id } = useParams<{ id: string }>();

  const [selectedDays, setSelectedDays] = useState<{ [key: string]: boolean }>({
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
    Sunday: false
  });

  // when user loads the page, the Picker for choosing a route will be shown as a dropdown menu. The routes are populated from the bikebusgroup document in the database
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [showRoutePicker, setShowRoutePicker] = useState<boolean>(false);
  const [showRoutePickerModal, setShowRoutePickerModal] = useState<boolean>(false);
  const [RouteID, setRouteID] = useState<string>('');
  const [BikeBusStopName, setBikeBusStopName] = useState<string>('');

  // when user loads the page, the Picker for choosing a route will be shown as a dropdown menu. The routes are populated from the bikebusgroup document in the database
  // grab the id from the url and get the bikebusgroup document from the database
  const [bikeBusGroup, setBikeBusGroup] = useState<any>(null);

  useEffect(() => {
    const fetchBikeBusGroup = async () => {
      const bikeBusGroupRef = doc(db, 'bikebusgroups', id);
      const bikeBusGroupSnapshot = await getDoc(bikeBusGroupRef);
      if (bikeBusGroupSnapshot.exists()) {
        const bikeBusGroupData = bikeBusGroupSnapshot.data();
        if (bikeBusGroupData) {
          setBikeBusGroup(bikeBusGroupData);
          // get the routes from the bikebusgroup document
          const routes = bikeBusGroupData.routes;
          if (routes) {
            setRoutes(routes);
          }
        }
      }
    };
    fetchBikeBusGroup();
    // get the routes data from the database - use the routes from the bikebusgroup document as the identifiers
    const fetchRoutes = async () => {
      const routesRef = collection(db, 'routes');
      const routesSnapshot = await getDocs(routesRef);
      const routesData = routesSnapshot.docs.map(doc => doc.data());
      setRoutes(routesData);
    }
    fetchRoutes();
  }
    , [bikeBusGroup, id, routes]);

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

  const history = useHistory();

  const togglePopover = (e: any) => {
    console.log('togglePopover called');
    console.log('event:', e);
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
    console.log('showPopover state:', showPopover);
  };

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

  function getRecurringDates(startDate: Date, endDate: Date, selectedDays: { [key: string]: boolean }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const selectedDayIndices = Object.entries(selectedDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => days.indexOf(day));
    const dates = [];
  
    // Check if all selectedDays values are false (i.e., recurring option is 'no')
    const isRecurring = selectedDayIndices.length > 0;
  
    if (!isRecurring) {
      // If not recurring, return only the start date
      return [start];
    } else {
      // If recurring, return all matching dates between start and end
      for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        if (selectedDayIndices.includes(dt.getDay())) {
          dates.push(new Date(dt));
        }
      }
    }
  
    return dates;
  }
  




  // 1. create the schedule with a unique document id in a collection in firestore called "schedules"
  const updateSchedule = async () => {

    console.log('updateSchedule called');
    console.log('startTime:', startTime);

    // Calculate the end time based on the start time and expected duration
    const startTimeDate = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const endTimeDate = moment(startTimeDate).add(expectedDuration, 'minutes');
    const endTime = endTimeDate.format('hh:mm a');

    console.log('endTimeDate:', endTimeDate);
    console.log('endTime:', endTime);
    console.log('startTimeDate:', startTimeDate);

    // Convert the startTime to a Firestore timestamp
    const startTimestamp = Timestamp.fromDate(startTimeDate.toDate());
    // Convert the endTime to a Firestore timestamp
    const endTimestamp = Timestamp.fromDate(endTimeDate.toDate());

    const scheduleData = {
      startTime: startTime,
      startTimeStamp: startTimestamp,
      startDateTime: startDateTime,
      startDate: startDate,
      endDate: endDate,
      expectedDuration: expectedDuration,
      endTime: endTime,  // This should be a string, not a Firestore timestamp
      endTimeStamp: endTimestamp,  // Add this line to store the endTime as a Firestore timestamp
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
      BikeBusLeader: doc(db, 'users', user.uid),
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

    // create a new events document in the firestore collection "events" for the schedule. This will be used to populate the calendar
    const eventsData = {
      title: BikeBusName,
      BikeBusName: BikeBusName,
      start: startDate.split('T')[0],
      end: endDate.split('T')[0],
      startTime: startTime,
      startTimeStamp: startTimestamp,
      endTime: endTimestamp,
      duration: expectedDuration,
      eventDays: getRecurringDates(new Date(startDate), new Date(endDate), selectedDays),
      recurring: isRecurring,
      groupId: bikebusgroupId,
      selectedDays: selectedDays,
      schedule: doc(db, 'schedules', scheduleId),
      BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
      days: Object.entries(selectedDays).reduce<number[]>((acc, [day, isSelected]) => {
        if (isSelected) acc.push(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day));
        return acc;
      }, []),
    };

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
        BikeBusName: BikeBusName,
        start: day,
        leader: '',
        members: [],
        kids: [],
        sprinters: [],
        captains: [],
        sheepdogs: [],
        caboose: [],
        duration: expectedDuration,
        startTime: startTime,
        startTimestamp: startTimestamp,
        endTime: endTimestamp,
        groupId: bikebusgroupId,
        route: doc(db, 'routes', RouteID),
        BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
        BikeBusStops: [],
        BikeBusStopTimes: [],
        StaticMap: '',
        schedule: doc(db, 'schedules', scheduleId),
      };

      // if the eventsData isRecurring is set to "no", then create a single event document in firestore in the event collection
      if (!isRecurring) {
        // make a new document the event collection in firestore with the eventsData for the single event
        const eventsRef = await addDoc(collection(db, 'event'), eventData);
        const eventId = eventsRef.id;
        console.log('eventId:', eventId);
        // update the event document in firestore with the eventData
        const eventRef = doc(db, 'event', eventId);
        await updateDoc(eventRef, {
          title: BikeBusName + ' for ' + day,
          BikeBusName: BikeBusName,
          start: day,
          leader: '',
          members: [],
          kids: [],
          sprinters: [],
          captains: [],
          sheepdogs: [],
          caboose: [],
          duration: expectedDuration,
          groupId: bikebusgroupId,
          startTime: startTime,
          startTimestamp: startTimestamp,
          endTime: endTimestamp,
          route: doc(db, 'routes', RouteID),
          BikeBusGroup: doc(db, 'bikebusgroups', bikebusgroupId),
          BikeBusStops: [],
          BikeBusStopTimes: [],
          StaticMap: '',
          schedule: doc(db, 'schedules', scheduleId),
        });
       // save the event document id to the bikebusgroup document in firestore as an array of references called event
        const bikeBusGroupRef2 = doc(db, 'bikebusgroups', bikebusgroupId);
        await updateDoc(bikeBusGroupRef2, {
          event: arrayUnion(doc(db, 'event', eventId)),
        });
      } else {
        // add each event document id that was just created to the bikebusgroup document in firestore as an array of references called eventIds
        const eventRef = await getDocs(collection(db, 'event'));
        const eventIds = eventRef.docs.map((doc) => doc.id);
        console.log('eventIds:', eventIds);
      }


      // Add new event to Firestore and store the returned id
      const eventDocRef = await addDoc(collection(db, 'event'), eventData);
      const eventId = eventDocRef.id;
      eventIds.push(eventId); // Add the new id to the array

      if (!isRecurring) {
        // Add the new event id to the bikebusgroup document
        const bikeBusGroupRef3 = doc(db, 'bikebusgroups', bikebusgroupId);
        await updateDoc(bikeBusGroupRef3, {
          event: arrayUnion(doc(db, 'event', eventId)),
        });
      } else {
        for (const eventId of eventIds) {
          const bikeBusGroupRef3 = doc(db, 'bikebusgroups', bikebusgroupId);
          await updateDoc(bikeBusGroupRef3, {
            event: arrayUnion(doc(db, 'event', eventId)),
          });
        }
      }
    }

    // add the references to the event documents to the bikebusgroup document in firestore
    const bikeBusGroupRef2 = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef2, {
      events: arrayUnion(doc(db, 'events', eventId)),
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
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonLabel>Pick a Route to add a schedule: </IonLabel>
        <IonSelect value={RouteID} placeholder="Select Route" onIonChange={e => setRouteID(e.detail.value)}>
          {routes.map(route => (
            <IonSelectOption key={route.id} value={route.id}>{route.routeName}</IonSelectOption>
          ))}
        </IonSelect>
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
                console.log('End Time selected', e.detail.value);
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
          <IonButton onClick={updateSchedule}>Save</IonButton>
          <IonButton routerLink={`/viewschedule/${id}`}>View Schedule</IonButton>
          <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
        </IonItem>
      </IonContent>

    </IonPage>
  );
};

export default AddSchedule;
