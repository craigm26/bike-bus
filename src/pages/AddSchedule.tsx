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
  const [events, setEvents] = useState<Event[]>([]);
  const { user } = useAuth();
  const { avatarUrl } = useAvatar(user?.uid);
  const headerContext = useContext(HeaderContext);
  const [accountType, setaccountType] = useState<string>('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const localizer = momentLocalizer(moment);
  const [BikeBusName, setBikeBusName] = useState('');
  const [BikeBusDescription, setBikeBusDescription] = useState('');
  const [startTime, setStartTime] = useState('07:00');
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


  // 1. create the schedule with a unique document id in a collection in firestore called "schedules"
  const updateSchedule = async () => {


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

    const scheduleNewRef = await addDoc(collection(db, 'schedules'), scheduleData);
    const scheduleNewId = scheduleNewRef.id;
    console.log('scheduleNewId:', scheduleNewId);

    const bikeBusData = {
      // add the schedule to the BikeBus group in firestore as a single document
      BikeBusSchedules: [doc(db, 'schedules', scheduleNewId)],
    };


    const bikeBusRef = await addDoc(collection(db, 'bikebusgroups'), bikeBusData);
    const bikebusgroupId = bikeBusRef.id;
    console.log('bikebusgroupId:', bikebusgroupId);

    // add the schedule document to the bikebus group in firestore
    const bikeBusGroupRef = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef, {
      BikeBusSchedules: arrayUnion(doc(db, 'schedules', scheduleNewId)),
    });

    // add the bikebusgroupid to the routes collection in the firestore document for the route
    const routeRef = doc(db, 'routes', RouteID);
    await updateDoc(routeRef, {
      isBikeBus: true,
    });

    // add the bikebusgroup document id to the schedule document in firestore
    const scheduleNewRef2 = doc(db, 'schedules', scheduleNewId);
    await updateDoc(scheduleNewRef2, {
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
      schedule: doc(db, 'schedules', scheduleNewId),
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
    const scheduleNewRef3 = doc(db, 'schedules', scheduleNewId);
    await updateDoc(scheduleNewRef3, {
      events: arrayUnion(doc(db, 'events', eventId)),
    });

    // Create event documents based on eventDays
    const eventDays = getRecurringDates(new Date(startDate), new Date(endDate), selectedDays);
    for (const day of eventDays) {
      const eventData = {
        title: BikeBusName + ' BikeBus on route ' + route.routeName + ' for ' + day,
        start: day,
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
        schedule: doc(db, 'schedules', scheduleNewId),
      };

      await addDoc(collection(db, 'event'), eventData);
    }

    // add the references to the event documents to the bikebusgroup document in firestore
    const bikeBusGroupRef2 = doc(db, 'bikebusgroups', bikebusgroupId);
    await updateDoc(bikeBusGroupRef2, {
      events: arrayUnion(doc(db, 'events', eventId)),
    });

    history.push(`/bikebusgrouppage/${bikebusgroupId}`);
  };



  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {headerContext?.showHeader && <IonHeader></IonHeader>}
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
