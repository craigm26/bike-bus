import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonCard,
    IonButton,
    IonModal,
    IonTitle,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { doc, DocumentReference, getDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type Event = {
    id: string,
    start: Date,
    end: Date,
    title: string,
    route: string,
    schedule: string,
    startTime: string,
    endTime: string,
    BikeBusGroup: string,
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
};


const ViewSchedule: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const { id } = useParams<{ id: string }>();
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [eventLink, setEventLink] = useState<string>('');
    const [eventId, setEventId] = useState<string>('');

    useEffect(() => {
        const fetchSchedules = async () => {
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', id);
            const bikeBusGroupSnapshot = await getDoc(bikeBusGroupDocRef);
            const bikeBusGroupData = bikeBusGroupSnapshot.data();

            if (!bikeBusGroupData || !Array.isArray(bikeBusGroupData.BikeBusSchedules)) return;

            let allEvents: Event[] = [];

            for (let i = 0; i < bikeBusGroupData.BikeBusSchedules.length; i++) {
                const scheduleDocRef = bikeBusGroupData.BikeBusSchedules[i];

                if (scheduleDocRef instanceof DocumentReference) {
                    const scheduleDocSnapshot = await getDoc(scheduleDocRef);
                    const scheduleData = scheduleDocSnapshot.data();

                    if (!scheduleData) continue;


                    for (let j = 0; j < scheduleData.events.length; j++) {
                        const eventDocRef: DocumentReference = scheduleData.events[j];
                        const eventDocSnapshot = await getDoc(eventDocRef);
                        const eventData = eventDocSnapshot.data();

                        if (!eventData) continue;

                        const title = eventData.title;
                        const startTime = eventData.startTime.split('T')[1];
                        const endTime = eventData.endTime.split('T')[1];


                        if (eventData.recurring === "yes") {
                            for (let k = 0; k < eventData.eventDays.length; k++) {
                                const eventDayTimestamp = eventData.eventDays[k];
                                const eventDay = eventDayTimestamp.toDate(); // converts Timestamp to Date

                                // Create date string in 'YYYY-MM-DD' format
                                const year = eventDay.getFullYear();
                                const month = String(eventDay.getMonth() + 1).padStart(2, '0'); // Months are 0 based
                                const day = String(eventDay.getDate()).padStart(2, '0');
                                const eventDayStr = `${year}-${month}-${day}`;

                                const startDateTime = new Date(eventDayStr + 'T' + startTime);
                                const endDateTime = new Date(eventDayStr + 'T' + endTime);

                                const event: Event = {
                                    start: startDateTime,
                                    end: endDateTime,
                                    title: title,
                                    route: eventData.route,
                                    schedule: eventData.schedule,
                                    startTime: eventData.startTime,
                                    endTime: eventData.endTime,
                                    BikeBusGroup: eventData.BikeBusGroup,
                                    BikeBusStopTimes: eventData.BikeBusStopTimes,
                                    BikeBusStops: eventData.BikeBusStops,
                                    StaticMap: eventData.StaticMap,
                                    caboose: eventData.caboose,
                                    captains: eventData.captains,
                                    kids: eventData.kids,
                                    leader: eventData.leader,
                                    members: eventData.members,
                                    sheepdogs: eventData.sheepdogs,
                                    sprinters: eventData.sprinters,
                                    id: '',
                                };
                                allEvents.push(event);
                            }
                        } else {
                            const start = eventData.start.split('T')[0];
                            const end = eventData.end.split('T')[0];

                            const startDateTime = new Date(start + 'T' + startTime);
                            const endDateTime = new Date(end + 'T' + endTime);

                            const event: Event = {
                                start: startDateTime,
                                end: endDateTime,
                                title: title,
                                route: eventData.route,
                                schedule: eventData.schedule,
                                startTime: eventData.startTime,
                                endTime: eventData.endTime,
                                BikeBusGroup: eventData.BikeBusGroup,
                                BikeBusStopTimes: eventData.BikeBusStopTimes,
                                BikeBusStops: eventData.BikeBusStops,
                                StaticMap: eventData.StaticMap,
                                caboose: eventData.caboose,
                                captains: eventData.captains,
                                kids: eventData.kids,
                                leader: eventData.leader,
                                members: eventData.members,
                                sheepdogs: eventData.sheepdogs,
                                sprinters: eventData.sprinters,
                                id: '',
                            };
                            allEvents.push(event);
                        }
                    }
                }
            }
            setEvents(allEvents);
        };
        fetchSchedules();
    }, [events, id]);

    // write a new fetch for the event data in the firestore collection "event" by using the document id of the group
    // get the event id's listed in the "events" array of the bikebusgroups collection for the specific group id
    useEffect(() => {
        const fetchEvents = async () => {
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', id);
            const bikeBusGroupSnapshot = await getDoc(bikeBusGroupDocRef);
            const bikeBusGroupData = bikeBusGroupSnapshot.data();

            if (!bikeBusGroupData || !Array.isArray(bikeBusGroupData.events)) return;

            // for each document in the event collection, get the data and push it to the events array
            let eventDocs: Event[] = [];
            for (let i = 0; i < bikeBusGroupData.events.length; i++) {
                const eventDocRef: DocumentReference = bikeBusGroupData.events[i];
                console.log(eventDocRef);
                const eventDocSnapshot = await getDoc(eventDocRef);
                console.log(eventDocSnapshot);
                const eventData = eventDocSnapshot.data();
                console.log(eventData);

            }

            setEvents(eventDocs);
        };
        fetchEvents();
    }
        , [id]);

    const handleSelectEvent = (event: Event) => {
        setSelectedEvent(event);
        setEvents(events);
        setShowEventModal(true);
        // make it appear in the Event box of the calendar
        setEventLink(eventLink);
    };


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                    <div style={{ height: 500 }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            defaultView="agenda"
                            onSelectEvent={handleSelectEvent}
                        />
                    </div>
                </IonCard>
                <IonButton routerLink={`/addschedule/${id}`}>Add Schedule</IonButton>
                <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
                <IonModal isOpen={showEventModal} onDidDismiss={() => setShowEventModal(false)}>
                    <IonHeader>
                        <IonToolbar>
                            <IonTitle></IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent>
                        <IonButton routerLink={`/event/${eventId}`}>Edit Event</IonButton>
                        <IonButton onClick={() => setShowEventModal(false)}>Close</IonButton>
                    </IonContent>
                </IonModal>

            </IonContent>
        </IonPage>
    );
};

export default ViewSchedule;
