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
  IonTitle,
  IonCardSubtitle,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { collection, doc, getDocs, getDoc, addDoc, Timestamp, arrayUnion, updateDoc, query, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { Route, useHistory, useParams } from 'react-router-dom';
import { momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
const localizer = momentLocalizer(moment);
import './AddSchedule.css';

type Event = {
  start: Date,
  end: Date,
  title: string
};

interface BusRoute {
  routeName: string;
  description: any;
  distance: any;
  duration: any;
  routeType: any;
  routeCreator: any;
  RouteBikeBus: any;
  startPoint: any;
  endPoint: any;
  pathCoordinates: any;
  id: string;
}


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
  const [showStartTimeModal, setShowStartTimeModal] = useState<boolean>(false);
  const [showStartDayModal, setShowStartDayModal] = useState<boolean>(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState<boolean>(false);
  const [showStartDateTimeModal, setShowStartDateTimeModal] = useState<boolean>(false);
  const [recurring, setRecurring] = useState<string>('no');
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [showRecurrenceDaysModal, setShowRecurrenceDaysModal] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState('no');
  const [isBikeBus, setIsBikeBus] = useState<boolean>(false);
  const [bulletinBoardData, setBulletinBoardData] = useState<any>(null);
  const [expectedDuration, setExpectedDuration] = useState<any>(0);
  const [duration, setDuration] = useState<any>(0);
  const eventIds: string[] = [];
  const { id } = useParams<{ id: string }>();
  const [endTime, setEndTime] = useState<string>('07:00');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(''); // <-- Add this state if it doesn't exist



  // user the default value of today's date and 7:00 AM time in the user's location

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
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedRoutes, setSelectedRoutes] = useState<any[]>([]);
  const [showRoutePicker, setShowRoutePicker] = useState<boolean>(false);
  const [showRoutePickerModal, setShowRoutePickerModal] = useState<boolean>(false);
  const [RouteID, setRouteID] = useState<string>('');
  const [BikeBusStopName, setBikeBusStopName] = useState<string>('');
  const [userRoutes, setUserRoutes] = useState<BusRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  // when user loads the page, the Picker for choosing a route will be shown as a dropdown menu. The routes are populated from the bikebusgroup document in the database
  // grab the id from the url and get the bikebusgroup document from the database
  const [bikeBusGroup, setBikeBusGroup] = useState<any>(null);

  // when the setStartDate is called, format formattedStartDate to be in the format "Month Day, Year HH:MM AM/PM"
  const formattedStartDateTime = startDateTime ? new Date(startDateTime).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true }) : '';

  // when the setEndDate is called, format formattedEndDate to be in the format "Month Day, Year"
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // format the startTime in am or pm (not 24 hour time)
  const formattedStartTime = startDateTime ? new Date(startDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';

  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // format the endTime in am or pm (not 24 hour time)
  const formattedEndTime = endTime ? new Date(endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';

  const history = useHistory();





  useEffect(() => {
    let isMounted = true;

    const fetchBikeBusGroupAndRoutes = async () => {
      try {
        const bikeBusGroupRef = doc(db, 'bikebusgroups', id);
        const bikeBusGroupSnapshot = await getDoc(bikeBusGroupRef);

        // if the document exists, get the document from bikebusgroups collection in firestore
        if (bikeBusGroupSnapshot.exists()) {
          const bikeBusGroupData = bikeBusGroupSnapshot.data();
          setBikeBusGroup(bikeBusGroupData);
        }

        // get the name of the bikebusgroup from the bikebusgroup document in the database
        const BikeBusName = bikeBusGroupSnapshot.data()?.BikeBusName;
        setBikeBusName(BikeBusName);

        if (user) {
          setIsLoading(true); // Start the loader
          // Fetch the user's routes
          const routesCollectionRef = collection(db, 'routes');
          const q = query(routesCollectionRef, where("routeCreator", "==", `/users/${user.uid}`));
          console.log('q:', q);
          const querySnapshot = await getDocs(q);
          console.log('querySnapshot:', querySnapshot);

          if (isMounted) { // Only update state if component is mounted
            const fetchedRoutes: BusRoute[] = querySnapshot.docs.map(doc => ({
              ...doc.data() as BusRoute,
              id: doc.id,
            }));
            console.log('fetchedRoutes:', fetchedRoutes);
            setUserRoutes(fetchedRoutes);
            console.log('userRoutes:', userRoutes);
            setIsLoading(false); // Stop the loader
          }
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
        if (isMounted) setIsLoading(false); // Stop the loader even on error
      }
    };

    fetchBikeBusGroupAndRoutes();

    return () => {
      isMounted = false;
    }
  }, [user]);


  useEffect(() => {
    if (startDateTime && isRecurring) {
      const date = new Date(startDateTime);
      if (isRecurring === 'yes') {
        date.setDate(date.getDate() + 30);
      }
      setEndDate(date.toISOString());
    }
  }, [startDateTime, isRecurring]);

  useEffect(() => {
    const updateUserAccountType = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnapshot = await getDoc(userRef);
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData && userData.accountType) {
            setaccountType(userData.accountType);
          }
        }
      }
    };
    updateUserAccountType();
  }, [user]);

  useEffect(() => {
    const selectedRoute = userRoutes.find(route => route.id === selectedRouteId);
    if (selectedRoute) {
      setDuration(selectedRoute.duration);
    }
  }, [selectedRouteId, userRoutes]);


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

  // Helper function to add minutes to a date
  const addMinutes = (date: Date, minutes: number) => {
    return new Date(date.getTime() + minutes * 60000);
  };

  // Convert selected days object to array of day indices
  const getSelectedDayIndices = (selectedDays: { [key: string]: boolean }) => {
    console.log('selectedDays:', selectedDays);
    if (!selectedDays) return [];
    return Object.entries(selectedDays)
      .filter(([_, isSelected]) => isSelected)
      .map(([day]) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day));
  };

  // Calculate the end time based on the start time and duration
  const calculateEndTime = (startDateTime: string, duration: number) => {
    const startDate = new Date(startDateTime);
    return addMinutes(startDate, duration).toISOString();
  };


  // 1. create the schedule with a unique document id in a collection in firestore called "schedules"
  const updateSchedule = async () => {
    // look at default date and time values to see if they are correct
    console.log('startDateTime:', startDateTime);
    console.log('endTime:', endTime);
    console.log('duration:', duration);
    console.log('selectedDays:', selectedDays);
    console.log('selectedRouteId:', selectedRouteId);
    console.log('RouteID:', RouteID);
    console.log('BikeBusName:', BikeBusName);

    // also get the timezone to save it for the event(s)
    console.log('timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

    // extract the startDateTime to get the date separated from the time. use that date to set it to the startDate
    const startDate = startDateTime.split('T')[0];

    // Convert the startDateTime and endTime to Firestore timestamps
    const startTimestamp = Timestamp.fromDate(new Date(startDateTime));

    // set the startTime to match the hh:mm value of the startTimestamp
    const startTime = startTimestamp.toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    // set the start value of the schedule to be the startTimestamp
    //const start = startTimestamp;

    const endTimestamp = Timestamp.fromDate(new Date(endTime));

    //const end = endTimestamp;

    const start = new Date(startDateTime);
    const end = new Date(endDate);
    const selectedDayIndices = getSelectedDayIndices(selectedDays);
    const isRecurring = selectedDayIndices.length > 0;

    console.log('start:', start);
    console.log('end:', end);
    console.log('selectedDayIndices:', selectedDayIndices);
    console.log('isRecurring:', isRecurring);

    const bikeBusGroupRef = doc(db, 'bikebusgroups', id);


    // update the route document in firestore by switching the isBikeBus boolean to true
    const routeRef = doc(db, 'routes', RouteID);
    await updateDoc(routeRef, {
      isBikeBus: true,
      BikeBusGroupId: bikeBusGroupRef,
      BikeBusName: BikeBusName,
    });

    const eventsData = {
      title: BikeBusName,
      BikeBusName: BikeBusName,
      start: start,
      end: endDate.split('T')[0],
      startTime: startTime,
      route: doc(db, 'routes', RouteID),
      startTimeStamp: startTimestamp,
      endTime: endTimestamp,
      duration: duration,
      eventDays: getRecurringDates(new Date(startDateTime), new Date(endDate), selectedDays),
      recurring: isRecurring,
      groupId: bikeBusGroupRef,
      selectedDays: selectedDays,
      BikeBusGroup: bikeBusGroupRef,
      status: '',
      eventType: 'BikeBus',
      days: Object.entries(selectedDays).reduce<number[]>((acc, [day, isSelected]) => {
        if (isSelected) acc.push(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day));
        return acc;
      }, []),
    };

    // Create event documents based on eventDays
    const eventDays = getRecurringDates(new Date(startDateTime), new Date(endDate), selectedDays);
    console.log('eventDays:', eventDays);

    // if the eventsData isRecurring is set to "no", then create a single event document in firestore in the event collection
    if (!isRecurring) {
      console.log('isRecurring:', isRecurring);
      // make a new document the event collection in firestore with the eventsData for the single event
      const eventsRef = await addDoc(collection(db, 'event'), eventsData);
      const eventId = eventsRef.id;
      console.log('eventId:', eventId);
      // update the event document in firestore with the eventData
      const eventRef = doc(db, 'event', eventId);
      await updateDoc(eventRef, {
        title: BikeBusName,
        BikeBusName: BikeBusName,
        start: start,
        end: endDate.split('T')[0],
        leader: '',
        members: [],
        kids: [],
        sprinters: [],
        captains: [],
        sheepdogs: [],
        caboose: [],
        duration: duration,
        groupId: bikeBusGroupRef,
        route: doc(db, 'routes', RouteID),
        startTime: startTime,
        startTimestamp: startTimestamp,
        timezone: selectedTimezone,
        endTime: endTimestamp,
        endTimestamp: endTimestamp,
        BikeBusGroup: bikeBusGroupRef,
        BikeBusStops: [],
        BikeBusStopTimes: [],
        status: '',
        eventType: 'BikeBus',
      });

      // add the eventId to the bikebusgroup document in firestore
      await updateDoc(bikeBusGroupRef, {
        events: arrayUnion(eventRef),
      });
    } else {
      console.log('isRecurring:', isRecurring);
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        if (selectedDayIndices.includes(dt.getDay())) {
          const eventStart = new Date(dt);
          const eventEnd = addMinutes(eventStart, duration);
          console.log('eventStart:', eventStart);
          console.log('eventEnd:', eventEnd);

          // Create an event object
          const event = {
            start: Timestamp.fromDate(eventStart),
            end: Timestamp.fromDate(eventEnd),
            title: BikeBusName,
            BikeBusName: BikeBusName,
            leader: '',
            members: [],
            kids: [],
            sprinters: [],
            captains: [],
            sheepdogs: [],
            caboose: [],
            duration: duration,
            groupId: bikeBusGroupRef,
            route: doc(db, 'routes', RouteID),
            startTime: Timestamp.fromDate(eventStart),
            startTimestamp: Timestamp.fromDate(eventStart),
            endTime: Timestamp.fromDate(eventEnd),
            endTimestamp: Timestamp.fromDate(eventEnd),
            timezone: selectedTimezone,
            BikeBusGroup: bikeBusGroupRef,
            BikeBusStops: [],
            BikeBusStopTimes: [],
            status: '',
            eventType: 'BikeBus',
          };

          // Add the event to Firestore
          const eventRef = await addDoc(collection(db, 'event'), event);
          const eventId = eventRef.id;
          console.log('eventId:', eventId);
          console.log('event:', event);

          // add the eventId to the bikebusgroup document in firestore
          await updateDoc(bikeBusGroupRef, {
            events: arrayUnion(eventRef),
          });

        }

      }
    }


    history.push(`/bikebusgrouppage/${id}`);
  }


  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonItem>
          <IonLabel aria-label="Label">BikeBus Name</IonLabel>
          <IonLabel aria-label="Label">{BikeBusName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel aria-label="Label">BikeBus Route</IonLabel>
          {isLoading ? (
            <IonLabel aria-label="Label">Loading...</IonLabel>
          ) : (
            <IonSelect
              aria-label="Label"
              value={selectedRouteId}
              placeholder="Select a Route"
              onIonChange={e => {
                const newSelectedRouteId = e.detail.value;
                setRouteID(newSelectedRouteId);
                setSelectedRouteId(newSelectedRouteId);
                const selectedRoute = userRoutes.find(route => route.id === newSelectedRouteId);
                if (selectedRoute) {
                  setDuration(selectedRoute.duration);

                }
              }
              }
            >
              {userRoutes.map(route => (
                <IonSelectOption key={route.id} value={route.id}>
                  {route.routeName}
                </IonSelectOption>
              ))}
            </IonSelect>
          )}

        </IonItem>
        <IonItem>
          <IonLabel aria-label="Label">Route Duration</IonLabel>
          <IonLabel aria-label="Label">{duration} Minutes</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel aria-label="Label">BikeBus Start DateTime</IonLabel>
          <IonLabel>
            <IonText>{formattedStartDateTime}</IonText>
          </IonLabel>
          <IonButton onClick={() => setShowStartDateTimeModal(true)}>Select Start DateTime</IonButton>
          <IonModal isOpen={showStartDateTimeModal} onDidDismiss={() => setShowStartDateTimeModal(false)}>
            <IonDatetime
              presentation='date-time'
              onIonChange={e => {
                if (typeof e.detail.value === 'string') {
                  const startDateTime = new Date(e.detail.value);
                  console.log('Start DateTime selected', startDateTime);
                  setStartDateTime(startDateTime.toISOString());
                  setEndTime(startDateTime.toISOString());
                  console.log('duration:', duration)

                  // Define addDuration here
                  const addDuration = (duration: number) => {
                    const endTimeDate = new Date(startDateTime);
                    duration = Math.ceil(duration);
                    endTimeDate.setMinutes(endTimeDate.getMinutes() + duration);
                    const endTime = endTimeDate.toString();
                    setEndTime(endTime);
                  };

                  addDuration(duration);
                }
              }}

            ></IonDatetime>
            <IonLabel aria-label="Label">TimeZone:</IonLabel>
            <IonSelect
              value={selectedTimezone}
              onIonChange={e => setSelectedTimezone(e.detail.value)}
              placeholder="Select Timezone"
            >
              {/* North America */}
              <IonSelectOption value="America/St_Johns">Newfoundland Time</IonSelectOption>
              <IonSelectOption value="America/Halifax">Atlantic Time</IonSelectOption>
              <IonSelectOption value="America/New_York">Eastern Time</IonSelectOption>
              <IonSelectOption value="America/Chicago">Central Time</IonSelectOption>
              <IonSelectOption value="America/Denver">Mountain Time</IonSelectOption>
              <IonSelectOption value="America/Phoenix">Mountain Time (no DST)</IonSelectOption>
              <IonSelectOption value="America/Los_Angeles">Pacific Time</IonSelectOption>
              <IonSelectOption value="America/Anchorage">Alaska Time</IonSelectOption>
              <IonSelectOption value="Pacific/Honolulu">Hawaii Time</IonSelectOption>
              <IonSelectOption value="America/Adak">Hawaii Time (no DST)</IonSelectOption>

              {/* South America */}
              <IonSelectOption value="America/Caracas">Venezuela Time</IonSelectOption>
              <IonSelectOption value="America/Bogota">Colombia Time</IonSelectOption>
              <IonSelectOption value="America/Sao_Paulo">Brazil Time</IonSelectOption>
              <IonSelectOption value="America/Argentina/Buenos_Aires">Argentina Time</IonSelectOption>

              {/* Europe */}
              <IonSelectOption value="Europe/London">Greenwich Mean Time</IonSelectOption>
              <IonSelectOption value="Europe/Paris">Central European Time</IonSelectOption>
              <IonSelectOption value="Europe/Istanbul">Eastern European Time</IonSelectOption>
              <IonSelectOption value="Europe/Moscow">Moscow Time</IonSelectOption>

              {/* Africa */}
              <IonSelectOption value="Africa/Cairo">Eastern Africa Time</IonSelectOption>
              <IonSelectOption value="Africa/Johannesburg">South Africa Standard Time</IonSelectOption>

              {/* Asia */}
              <IonSelectOption value="Asia/Beirut">Arabia Standard Time</IonSelectOption>
              <IonSelectOption value="Asia/Tokyo">Japan Standard Time</IonSelectOption>
              <IonSelectOption value="Asia/Kolkata">India Standard Time</IonSelectOption>
              <IonSelectOption value="Asia/Shanghai">China Standard Time</IonSelectOption>

              {/* Australia/Oceania */}
              <IonSelectOption value="Australia/Sydney">Australian Eastern Time</IonSelectOption>
              <IonSelectOption value="Pacific/Auckland">New Zealand Time</IonSelectOption>

              {/* Etcetera */}
              <IonSelectOption value="UTC">Coordinated Universal Time</IonSelectOption>
            </IonSelect>

            <IonButton onClick={() => setShowStartDateTimeModal(false)}>Done</IonButton>
          </IonModal>
        </IonItem>
        <IonItem>
          <IonLabel aria-label="Label">BikeBus End Time</IonLabel>
          <IonLabel aria-label="Label">{formattedEndTime}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel aria-label="Label">BikeBus End Date</IonLabel>
          <IonLabel aria-label="Label">{formattedEndDate}</IonLabel>
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
                  <IonLabel aria-label="Label">Yes</IonLabel>
                  <IonRadio aria-label="Label" value='yes' />
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
            <IonTitle>Recurring Day of Week</IonTitle>
            <IonLabel>The default number of occurring events that are created are constrained to 30 days from the selected start date. After the BikeBus is created, additional schedules can be added.</IonLabel>
            <IonItemGroup>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <IonItem key={day}>
                  <IonLabel aria-label="Label">{day}</IonLabel>
                  <IonCheckbox
                    aria-label="Label"
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
          <IonButton onClick={updateSchedule}>Save</IonButton>
          <IonButton routerLink={`/viewschedule/${id}`}>View Schedule</IonButton>
          <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
        </IonItem>
      </IonContent>

    </IonPage>
  );
};

export default AddSchedule;
