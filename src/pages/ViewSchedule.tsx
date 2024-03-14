import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonCard,
    IonButton,
    IonModal,
    IonLabel,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonText,
    IonInput,
    IonCol,
    IonCardSubtitle,
    IonGrid,
    IonRow,
    IonSelect,
    IonSelectOption,
    IonTitle,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentData, DocumentReference, FieldValue, Timestamp, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { Link, useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'
import { utcToZonedTime } from 'date-fns-tz';
import { set } from 'date-fns';
import { Organization, BikeBus } from '../components/BulletinBoards/MessageTypes';
import { use } from 'i18next';
import { group } from 'console';

const locales = {
    'en-US': enUS,
}

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
})

type Event = {
    id: string,
    start: Timestamp,
    end: Timestamp,
    title: string,
    route: any,
    groupId: any,
    schedule: any,
    startTime: string,
    startTimestamp: Timestamp,
    endTime: Timestamp,
    BikeBusGroup: string,
    BikeBusName: any,
    BikeBusStopTimes: [],
    BikeBusStops: [],
    StaticMap: string,
    caboose: [],
    captains: [],
    kids: [],
    leader: string,
    members: [],
    sheepdogs: [],
    sprinters: [],
    status: string,
    handCountEvent: number,
};


const ViewSchedule: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const { id } = useParams<{ id: string }>();
    const [selectedBBOROrgValue, setSelectedBBOROrgValue] = useState<string>('');
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [eventLink, setEventLink] = useState<string>('');
    const [eventId, setEventId] = useState<string>('');
    const history = useHistory();
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [eventSummaryLink, setEventSummaryLink] = useState<string>('');
    const [isEventDone, setIsEventDone] = useState<boolean>(false);
    const [modifiedHandCount, setModifiedHandCount] = useState<number>(0);
    const [username, setusername] = useState<string>('');
    const [combinedList, setCombinedList] = useState<{ value: string, label: string }[]>([]);
    const [eventRouteName, setEventRouteName] = useState<string>('');
    const [routeEventId, setRouteEventId] = useState<string>('');
    const [eventRouteString, setEventRouteString] = useState<string>('');
    const [isUserLeader, setIsUserLeader] = useState(false);


    const parseDate = (dateString: string) => {
        const dateFormat = "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX";
        const date = parse(dateString, dateFormat, new Date());
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return utcToZonedTime(date, timeZone);
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const fetchOrganizations = useCallback(async () => {
        let formattedData: { value: string, label: string }[] = [];
        try {
            const uid = user?.uid;

            if (!uid) {
                return formattedData;
            }

            const userRef = doc(db, 'users', uid);
            const OrganizationCollection = collection(db, 'organizations');
            const q = query(OrganizationCollection, where('OrganizationMembers', 'array-contains', userRef));
            const querySnapshot = await getDocs(q);

            const OrganizationData: Organization[] = querySnapshot.docs.map(doc => ({
                ...doc.data() as Organization,
                id: doc.id,
            }));

            formattedData = OrganizationData.map(org => ({
                value: org.id,
                label: org.NameOfOrg
            }));

        } catch (error) {
            console.log("Error fetching organizations:", error);
        }

        return formattedData;

    }, [user]);


    const fetchBikeBus = useCallback(async () => {
        let formattedData: { value: string, label: string }[] = [];
        const uid = user?.uid;
        if (!uid) {
            return formattedData;
        }

        const BikeBusCollection = collection(db, 'bikebusgroups');
        const q = query(BikeBusCollection, where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
        const querySnapshot = await getDocs(q);

        const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as BikeBus,
            id: doc.id,
        }));

        formattedData = BikeBusData.map(bus => ({
            value: bus.id,
            label: bus.BikeBusName,
        }));

        return formattedData;
    }, [user]);

    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData && userData.username) {
                        setusername(userData.username);
                    }
                }
            });
        }
        setSelectedBBOROrgValue(id);
        const fetchData = async () => {
            try {
                const organizationsData = await fetchOrganizations();
                const bikeBusData = await fetchBikeBus();
                const combinedData = [...organizationsData, ...bikeBusData];

                setCombinedList(combinedData);

                const initialValue = id || localStorage.getItem('selectedBBOROrgValue') || (combinedData.length > 0 ? combinedData[0].value : '');
                setSelectedBBOROrgValue(initialValue);

                if (initialValue) {
                    localStorage.setItem('selectedBBOROrgValue', initialValue);
                }
                console.log('initial value', initialValue);
                await fetchDetailedEvents(initialValue);
            } catch (error) {
                console.error("Error in fetching data:", error);
            }
        };
        fetchData();

        const fetchAndCombineData = async () => {
            try {
                // Fetch organizations and bike bus data
                const organizationsData = await fetchOrganizations();
                const bikeBusData = await fetchBikeBus();
                const combinedData = [...organizationsData, ...bikeBusData];

                // Update the combinedList state
                setCombinedList(combinedData);

                // Determine the initial value for selectedBBOROrgValue
                const initialValue = id || localStorage.getItem('selectedBBOROrgValue') || '';
                setSelectedBBOROrgValue(initialValue);

                // Fetch detailed events based on the selectedBBOROrgValue
                await fetchDetailedEvents(initialValue);
            } catch (error) {
                console.error("Error in fetching data:", error);
            }
        }

        const fetchDetailedEvents = async (id: string) => {
            try {
                let eventsSnapshot;
                if (id === "OZrruuBJptp9wkAAVUt7") {
                    eventsSnapshot = await getDocs(collection(db, "event"));
                } else {
                    const bikeBusGroupRef = doc(db, 'bikebusgroups', id);
                    eventsSnapshot = await getDocs(query(collection(db, "event"), where("BikeBusGroup", "==", bikeBusGroupRef)));
                }

                // we'll need to eventually fill the events array with the events from the database (eventsSnapshot)


                // Helper function to convert a Firestore snapshot to an Event object
                const convertEventSnapshotToEvent = async (eventData: DocumentData, eventId: string) => {

                    // Convert Timestamps to Dates and return the event object
                    const startTimestamp = eventData.start.toDate();
                    // convert the Timestamp to a Date
                    const endTimestamp = eventData.endTimestamp?.toDate();


                    // if the DocumentReference for the field is there, Fetch the route, schedule, BikeBusGroup, and groupId data
                    try {
                        const BikeBusGroupData = await getDoc(eventData?.BikeBusGroup);
                        const groupIdData = await getDoc(eventData?.groupId);

                        const routeSnapshot = await getDoc(eventData.route);
                        const routeData = routeSnapshot.data();

                        // get the route id (document id) from the route snapshot
                        const routeId = routeSnapshot.id;
                        setRouteEventId(routeId);

                        return {
                            ...eventData,
                            start: startTimestamp,
                            end: endTimestamp,
                            route: routeData,
                            BikeBusGroup: BikeBusGroupData.data(),
                            groupId: groupIdData.data(),
                            id: eventId,
                        };
                    } catch (error) {
                        // skip the document reference fetches but continue to return the event object

                        console.error("Error in fetching data:", error);
                        return {
                            ...eventData,
                            start: startTimestamp,
                            end: endTimestamp,
                            id: eventId,
                        };
                    }
                }

                // Convert the events snapshot to an array of events
                const eventDocs = await Promise.all(eventsSnapshot.docs.map(async (docSnapshot) => {
                    const eventData = docSnapshot.data();
                    return await convertEventSnapshotToEvent(eventData, docSnapshot.id);
                }
                ));

                const filteredEventDocs = eventDocs.filter((event): event is Event => event !== null);
                setEvents(filteredEventDocs);
            }
            catch (error) {
                console.error("Error in fetching data:", error);
            }
        }

        fetchAndCombineData();
        console.log('id', id);
        fetchDetailedEvents(id);
        console.log('events', events);

    }, [id, timeZone, setModifiedHandCount, user, user?.uid]);

    const handleSelectEvent = async (event: Event) => {
        const eventLink = `/event/${event.id}`;
        console.log('event', event);
        setSelectedEvent(event);
        setEventRouteName(event.route.routeName);
        // when there's a routeName, let's look for the document id with a fresh query to the route collection
        if (event.route.routeName) {
            const routeQuery = query(collection(db, 'route'), where('routeName', '==', event.route.routeName));
            const routeQuerySnapshot = await getDocs(routeQuery);
            routeQuerySnapshot.forEach(doc => {
                console.log('routeQuerySnapshot', doc.id, '=>', doc.data());
                setEventRouteString(doc.data().routeString);
                console.log('routeString', doc.data().routeString);
            });
        } else {
            console.error('Invalid route data:', event.route);
        }
        setEvents(events);
        setEventId(event.id);
        setShowEventModal(true);
        setEventLink(eventLink);

        const isLeader = selectedEvent?.BikeBusGroup?.BikeBusLeader?.id === user?.uid;
        setIsUserLeader(isLeader);

        // make a const for eventSummarlink
        const eventSummaryLink = `/eventsummary/${event.id}`;
        console.log(eventSummaryLink);
        setEventSummaryLink(eventSummaryLink);

        if (event.start && event.end) {
            // Check if event.start is a Firestore Timestamp and convert it
            const startDateTime = event.start instanceof Timestamp ? event.start.toDate() : event.start;
            const endDateTime = event.end instanceof Timestamp ? event.end.toDate() : event.end;

            // check the status of the event
            const isEventDone = event.status === 'ended' || startDateTime.getTime() < Date.now();
            setIsEventDone(isEventDone);

            const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const startTime = startDateTime.toLocaleString('en-US', dateOptions);
            const endTime = endDateTime.toLocaleString('en-US', dateOptions);
            setStartTime(startTime);
            setEndTime(endTime);
        } else {
            console.error('Invalid event data:', event);
        }
    };

    const handleEditEvent = () => {
        setShowEventModal(false); // Close the modal
        history.push(`/event/${eventId}`); // Navigate to the event page
    };

    const isEventLeader = selectedEvent?.leader.includes(username);

    const deleteEvent = async () => {
        // first check that the user is the leader of the BikeBus
        console.log('isUserLeader', isUserLeader);
        if (!isUserLeader) {
            alert('You are not the BikeBus leader, please ask the leader to delete this event.');
            return;
        }

        // Create DocumentReference and Delete from Firestore using v9 syntax
        const docRef = doc(db, 'event', eventId);
        await deleteDoc(docRef);
        // also delete the event from the BikeBusGroup
        const BikeBusGroupRef = doc(db, 'bikebusgroups', selectedBBOROrgValue);
        await deleteDoc(doc(BikeBusGroupRef, 'event', eventId));
        setShowEventModal(false);
        // refresh page
        window.location.reload();
    };

    const handleHandCountModification = () => {
        // first check that the user is the leader of the event
        if (!isEventLeader) {
            alert('You are not the leader of this event');
            return;
        }

        const updatedEvent = { ...selectedEvent, handCountEvent: modifiedHandCount };
        // Update Firestore
        // Create DocumentReference and Update Firestore
        const cleanedEvent: { [key: string]: FieldValue | Partial<unknown> | undefined } =
            Object.fromEntries(
                Object.entries(updatedEvent).filter(([key, val]) => val !== undefined)
            ) as { [key: string]: FieldValue | Partial<unknown> | undefined };

        const docRef = doc(db, 'event', eventId);
        updateDoc(docRef, cleanedEvent);


        setShowEventModal(false);
    };

    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" className="bulletin-board-selection-title">
                            <IonCardSubtitle className="bulletin-board-selection-title">
                                <IonSelect
                                    value={selectedBBOROrgValue}
                                    onIonChange={e => {
                                        const id = e.detail.value;
                                        setSelectedBBOROrgValue(id);
                                        history.push(`/ViewSchedule/${id}`);
                                    }}
                                >
                                    {combinedList.map((item, index) => (
                                        <IonSelectOption key={index} value={item.value}>
                                            {item.label}
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>

                            </IonCardSubtitle>

                        </IonCol>
                    </IonRow>
                    <IonCard>
                        <div style={{ height: 500 }}>
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                defaultView="agenda"
                                onSelectEvent={handleSelectEvent}
                                onSelectSlot={(slotInfo) =>
                                    alert(
                                        `selected slot: \nstart ${slotInfo.start.toLocaleString()} ` +
                                        `\nend: ${slotInfo.end.toLocaleString()}`
                                    )
                                }
                            />
                        </div>
                    </IonCard>
                    {id !== "OZrruuBJptp9wkAAVUt7" && (
                        <>
                            <IonButton size="small" shape="round" routerLink={`/addschedule/${id}`}>Add Schedule</IonButton>
                            <IonButton size="small" shape="round" routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
                        </>
                    )}
                    <IonModal isOpen={showEventModal} onDidDismiss={() => setShowEventModal(false)}>
                        <IonContent>
                            <IonTitle>{selectedEvent?.BikeBusName}</IonTitle>
                            <IonItem lines="none">
                                <IonLabel>{startTime} to {endTime}</IonLabel>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Route</IonLabel>
                                {/*if the id is OZrruuBJptp9wkAAVUt7, then don't display the View Route button*/}
                                {id !== "OZrruuBJptp9wkAAVUt7" && (  
                                <IonButton size="small" shape="round" routerLink={`/ViewRoute/${routeEventId}`}>View {selectedEvent?.route?.routeName}</IonButton>
                                )}
                                {id === "OZrruuBJptp9wkAAVUt7" && (
                                    <IonText>{selectedEvent?.route?.routeName}</IonText>
                                )}
                            </IonItem>
                            <IonTitle>RSVPs</IonTitle>
                            <IonItem lines="none">
                                <IonLabel>Leader:</IonLabel>
                                <IonText>{selectedEvent?.leader}</IonText>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Captains:</IonLabel>
                                <IonText>{selectedEvent?.captains?.join(', ')}</IonText>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Sheepdogs:</IonLabel>
                                <IonText>{selectedEvent?.sheepdogs?.join(', ')}</IonText>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Sprinters:</IonLabel>
                                <IonText>{selectedEvent?.sprinters?.join(', ')}</IonText>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Caboose:</IonLabel>
                                <IonText>{selectedEvent?.caboose?.join(', ')}</IonText>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Kids:</IonLabel>
                                <IonText>{selectedEvent?.kids?.join(', ')}</IonText>
                            </IonItem>
                            <IonItem lines="none">
                                <IonLabel>Members:</IonLabel>
                                <IonText>{selectedEvent?.members?.join(', ')}</IonText>
                            </IonItem>
                            {(isEventDone) ?
                                <>
                                    <IonItem lines="none">
                                        <IonCol>
                                            <IonLabel>Hand Count Event:</IonLabel>
                                            <IonText>{selectedEvent?.handCountEvent}</IonText>
                                        </IonCol>
                                        <IonCol>
                                            <IonLabel>Modify Hand Count:</IonLabel>
                                            <IonInput type="number" value={modifiedHandCount} onIonChange={e => setModifiedHandCount(Number(e.detail.value!))} />
                                        </IonCol>
                                    </IonItem>
                                    <IonButton size="small" shape="round" onClick={handleHandCountModification}>Modify</IonButton>
                                </> : null}
                            {(!isEventDone) ? <IonButton size="small" shape="round" onClick={deleteEvent}>Delete Event</IonButton> : null}
                            {(!isEventDone) ? <IonButton size="small" shape="round" onClick={handleEditEvent}>Go to Event</IonButton> : null}
                            {(id !== "OZrruuBJptp9wkAAVUt7") ? <IonButton size="small" shape="round" routerLink={`/bikebusgrouppage/${selectedBBOROrgValue}`}>BikeBusGroup</IonButton> : null}
                            {(isEventDone) ? <IonButton size="small" shape="round" routerLink={eventSummaryLink}>Event Summary</IonButton> : null}
                            <IonButton size="small" shape="round" onClick={() => setShowEventModal(false)}>Close</IonButton>
                        </IonContent>
                    </IonModal>
                </IonGrid>
            </IonContent >
        </IonPage >
    );
};

export default ViewSchedule;
