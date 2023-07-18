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
import { get } from 'http';

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
  const [showStartTimeModal, setShowStartTimeModal] = useState<boolean>(false);
  const [showStartDayModal, setShowStartDayModal] = useState<boolean>(false);
  const [showEndTimeModal, setShowEndTimeModal] = useState<boolean>(false);
  const [recurring, setRecurring] = useState<string>('no');
  const [showRecurringModal, setShowRecurringModal] = useState<boolean>(false);
  const [showRecurrenceDaysModal, setShowRecurrenceDaysModal] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState('no');
  const [isBikeBus, setIsBikeBus] = useState<boolean>(false);
  const [bulletinBoardData, setBulletinBoardData] = useState<any>(null);
  const [expectedDuration, setExpectedDuration] = useState<any>(0);
  const [duration, setDuration] = useState<number>(0);
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
  const [routesData, setRoutesData] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [selectedRoutes, setSelectedRoutes] = useState<any[]>([]);
  const [showRoutePicker, setShowRoutePicker] = useState<boolean>(false);
  const [showRoutePickerModal, setShowRoutePickerModal] = useState<boolean>(false);
  const [RouteID, setRouteID] = useState<string>('');
  const [BikeBusStopName, setBikeBusStopName] = useState<string>('');

  // when user loads the page, the Picker for choosing a route will be shown as a dropdown menu. The routes are populated from the bikebusgroup document in the database
  // grab the id from the url and get the bikebusgroup document from the database
  const [bikeBusGroup, setBikeBusGroup] = useState<any>(null);

  // when the setStartDate is called, format formattedStartDate to be in the format "Month Day, Year"
  const formattedStartDate = startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // when the setEndDate is called, format formattedEndDate to be in the format "Month Day, Year"
  const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  // format the startTime in am or pm (not 24 hour time)
  const formattedStartTime = startTime ? new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';


  // get the duration from the routes document in the database

  console.log('expectedDuration:', expectedDuration);

  // add the expectedDuration to the startTime to get the endTime
  const endTimeDate = formattedStartTime ? moment(formattedStartTime, 'hh:mm a').add(expectedDuration, 'minutes') : '';
  console.log('endTimeDate:', endTimeDate);
  // convert the endTimeDate to a string
  const endTime = endTimeDate.toString();

  // format the endTime in am or pm (not 24 hour time)
  const formattedEndTime = endTime ? new Date(endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';
  console.log('formattedEndTime:', formattedEndTime);



  const history = useHistory();

  const togglePopover = (e: any) => {
    console.log('togglePopover called');
    console.log('event:', e);
    setPopoverEvent(e.nativeEvent);
    setShowPopover((prevState) => !prevState);
    console.log('showPopover state:', showPopover);
  };

  useEffect(() => {
    const fetchBikeBusGroupAndRoutes = async () => {
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


      // get the route from the bikebusgroup document in the database
      const selectedRoutes = bikeBusGroupSnapshot.data()?.BikeBusRoutes;
      setSelectedRoutes(selectedRoutes);
      console.log('selectedRoutes:', selectedRoutes);
      // get the name of the routes from the route document in the database
      const routesData = await Promise.all(selectedRoutes.map((routeRef: any) => getDoc(routeRef)));
      const routes = routesData.map((route: any) => route.data());
      setRoutes(routes);
      console.log('routes:', routes);
      // get the name of the routes from the route document in the database
      const routesNames = routesData.map((route: any) => route.data()?.routeName);
      console.log('routesNames:', routesNames);

      // get the duration from the routes document in the database
      const expectedDuration = routesData.map((route: any) => route.data()?.duration);
      console.log('expectedDuration:', expectedDuration);
      setExpectedDuration(expectedDuration);

    };

    fetchBikeBusGroupAndRoutes();
  }, [id]);

  useEffect(() => {
    if (startDate && isRecurring) {
      const date = new Date(startDate);
      if (isRecurring === 'yes') {
        date.setDate(date.getDate() + 30);
      }
      setEndDate(date.toISOString());
    }
  }, [startDate, isRecurring]);

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

    // get the current endTimeDate from the startTimeDate and expectedDuration
    console.log('startTime:', startTime);
    console.log('expectedDuration:', expectedDuration);
    console.log('startDate:', startDate);
    console.log('endDate:', endDate);

    // Calculate the end time based on the start time and expected duration
    const startTimeDate = moment(`${startDate} ${startTime}`, 'YYYY-MM-DD HH:mm');
    const endTimeDate = moment(startTimeDate).add(expectedDuration, 'minutes');
    const endTime = endTimeDate.format('hh:mm a');

    console.log('startTimeDate:', startTimeDate);
    console.log('endTimeDate:', endTimeDate);
    console.log('endTime:', endTime);

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

    const scheduleNewRef = await addDoc(collection(db, 'schedules'), scheduleData);
    const scheduleNewId = scheduleNewRef.id;
    console.log('scheduleNewId:', scheduleNewId);

    const bikeBusData = {
      BikeBusSchedules: [doc(db, 'schedules', scheduleNewId)],
    };

    console.log('bikeBusData:', bikeBusData);


    // update the existing bikebusgroup document in firestore with the new schedule
    const bikeBusGroupRef = doc(db, 'bikebusgroups', id);
    await updateDoc(bikeBusGroupRef, {
      BikeBusSchedules: arrayUnion(doc(db, 'schedules', scheduleNewId)),
    });

    // add the bikebusgroup document id to the schedule document in firestore
    const scheduleNewRef2 = doc(db, 'schedules', scheduleNewId);
    await updateDoc(scheduleNewRef2, {
      BikeBusGroup: bikeBusGroupRef,
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
      groupId: bikeBusGroupRef,
      selectedDays: selectedDays,
      schedule: doc(db, 'schedules', scheduleNewId),
      BikeBusGroup: bikeBusGroupRef,
      status: '',
      days: Object.entries(selectedDays).reduce<number[]>((acc, [day, isSelected]) => {
        if (isSelected) acc.push(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day));
        return acc;
      }, []),
    };

    const eventsRef = await addDoc(collection(db, 'events'), eventsData);
    const eventId = eventsRef.id;
    console.log('eventId:', eventId);


    // add the events document id (as a reference) to the schedule document in firestore
    const scheduleRef3 = doc(db, 'schedules', scheduleNewId);
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
        groupId: bikeBusGroupRef,
        BikeBusGroup: bikeBusGroupRef,
        BikeBusStops: [],
        BikeBusStopTimes: [],
        schedule: doc(db, 'schedules', scheduleNewId),
        status: '',
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
          groupId: bikeBusGroupRef,
          startTime: startTime,
          startTimestamp: startTimestamp,
          endTime: endTimestamp,
          BikeBusGroup: bikeBusGroupRef,
          BikeBusStops: [],
          BikeBusStopTimes: [],
          schedule: doc(db, 'schedules', scheduleNewId),
          status: '',
        });
        // save the event document id to the bikebusgroup document in firestore as an array of references called event
        const bikeBusGroupRef2 = bikeBusGroupRef;
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
        const bikeBusGroupRef3 = bikeBusGroupRef
        await updateDoc(bikeBusGroupRef3, {
          event: arrayUnion(doc(db, 'event', eventId)),
        });
      } else {
        for (const eventId of eventIds) {
          const bikeBusGroupRef3 = bikeBusGroupRef;
          await updateDoc(bikeBusGroupRef3, {
            event: arrayUnion(doc(db, 'event', eventId)),
          });
        }
      }
    }

    // add the references to the event documents to the bikebusgroup document in firestore
    const bikeBusGroupRef2 = bikeBusGroupRef
    await updateDoc(bikeBusGroupRef2, {
      events: arrayUnion(doc(db, 'events', eventId)),
    });



    history.push(`/bikebusgrouppage/${bikeBusGroupRef}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel>BikeBus Name</IonLabel>
          <IonLabel>{BikeBusName}</IonLabel>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus Route</IonLabel>
          <IonSelect
            value={selectedRoute}
            placeholder='Select Route'
            onIonChange={e => {
              console.log('selectedRoute:', e.detail.value);
              setSelectedRoute(e.detail.value);
            }
            }
          >
            {routes.map((route: any) => (
              <IonSelectOption key={route.id} value={route.id}>
                {route.routeName}
              </IonSelectOption>
            ))}
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
                const selectedTime = e.detail.value as string; // Get the selected time as a string
                setStartTime(selectedTime); // Update the `startTime` state variable
              }}
            ></IonDatetime>
            <IonButton onClick={() => setShowStartTimeModal(false)}>Done</IonButton>
          </IonModal>
        </IonItem>
        <IonItem>
          <IonLabel>BikeBus End Time</IonLabel>
          <IonLabel>{formattedEndTime}</IonLabel>
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
