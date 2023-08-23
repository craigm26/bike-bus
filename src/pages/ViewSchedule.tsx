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
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { Timestamp, collection, getDocs } from 'firebase/firestore';
import useAuth from "../useAuth";
import { Link, useParams } from 'react-router-dom';
import 'react-big-calendar/lib/css/react-big-calendar.css';
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
    start: Date,
    end: Date,
    title: string,
    route: string,
    schedule: string,
    startTime: string,
    startTimestamp: Timestamp,
    endTime: Timestamp,
    BikeBusGroup: string,
    BikeBusName: string,
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
    const history = useHistory();
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');
    const [eventSummaryLink, setEventSummaryLink] = useState<string>('');
    const [isEventDone, setIsEventDone] = useState<boolean>(false);

    const parseDate = (dateString: string) => {
        const dateFormat = "MMMM d, yyyy 'at' h:mm:ss a 'UTC'XXX";
        const date = parse(dateString, dateFormat, new Date());
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        return utcToZonedTime(date, timeZone);
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    useEffect(() => {
        const fetchDetailedEvents = async () => {
            const eventsSnapshot = await getDocs(collection(db, "event")); // get all event documents
            const eventDocs: Event[] = [];
            // Inside fetchDetailedEvents function
            console.log('fetchDetailedEvents');
            console.log(eventsSnapshot);
            console.log(id);
            console.log(eventDocs)
            eventsSnapshot.forEach((docSnapshot) => {
                const eventData = docSnapshot.data();
                if (eventData?.groupId && typeof eventData.groupId === 'object') { // only process events related to the current group
                    console.log('Processing event with groupId:', eventData.groupId.id);
                    console.log('eventData:', eventData);
                    const startTimestamp = new Date(eventData.start.seconds * 1000); // Convert seconds to milliseconds
                    const endTimestamp = new Date(eventData.endTime.seconds * 1000); // Convert seconds to milliseconds

                    console.log('startTimestamp:', startTimestamp);
                    console.log('endTimestamp:', endTimestamp);

                    const startTimeHours = startTimestamp.getHours();
                    const startTimeMinutes = startTimestamp.getMinutes();

                    const startDate = eventData.start.toDate();
                    const startEventDate = new Date(startDate.setHours(startTimeHours, startTimeMinutes));

                    // Create the end date using the same date as start, but with time from endTime
                    const endDate = eventData.endTime.toDate();
                    const endEventDate = new Date(startEventDate);
                    endEventDate.setHours(endDate.getHours(), endDate.getMinutes());

                    const event: Event = {
                        start: startEventDate,
                        end: endEventDate,
                        title: eventData.title,
                        route: eventData.route,
                        schedule: eventData.schedule,
                        startTime: eventData.startTime,
                        endTime: eventData.endTime,
                        BikeBusGroup: eventData.BikeBusGroup,
                        BikeBusName: eventData.BikeBusName,
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
                        id: docSnapshot.id,
                        status: eventData.status,
                        startTimestamp: eventData.startTimestamp,
                    };
                    eventDocs.push(event);
                }
            });


            setEvents(eventDocs);
            console.log(eventDocs);
            // check the start and end times for the event
            const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const startTime = eventDocs?.[0]?.startTimestamp ? new Date(eventDocs?.[0]?.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
            const endTime = eventDocs?.[0]?.endTime ? new Date(eventDocs?.[0]?.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
            setStartTime(startTime);
            console.log(startTime);
            setEndTime(endTime);
            console.log(endTime);
        };
        fetchDetailedEvents();
    }, [id, timeZone]);

    const handleSelectEvent = (event: Event) => {
        const eventLink = `/event/${event.id}`;
        setSelectedEvent(event);
        setEvents(events);
        setEventId(event.id);
        setShowEventModal(true);
        setEventLink(eventLink);

        // make a const for eventSummarlink
        const eventSummaryLink = `/eventsummary/${event.id}`;
        console.log(eventSummaryLink);
        setEventSummaryLink(eventSummaryLink);

        // check the status of the event
        const isEventDone = event.status === 'ended' ? true : false;
        setIsEventDone(isEventDone);

        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const startTime = event.start ? event.start.toLocaleString(undefined, dateOptions) : 'Loading...';
        const endTime = event.end ? event.end.toLocaleString(undefined, dateOptions) : 'Loading...';
        setStartTime(startTime);
        setEndTime(endTime);
    };



    const handleEditEvent = () => {
        setShowEventModal(false); // Close the modal
        history.push(`/event/${eventId}`); // Navigate to the event page
    };

    console.log("Events: ", events.map(event => ({
        start: event.start.toString(),
        end: event.end.toString(),
        title: event.title,
    })));


    return (
        <IonPage className="ion-flex-offset-app">
            <IonContent fullscreen>
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
                <IonButton routerLink={`/addschedule/${id}`}>Add Schedule</IonButton>
                <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
                <IonModal isOpen={showEventModal} onDidDismiss={() => setShowEventModal(false)}>
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>{selectedEvent?.BikeBusName}</IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonItem>
                                    <IonLabel>{startTime} to {endTime}</IonLabel>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Route</IonLabel>
                                    <Link to={`/ViewRoute/${selectedEvent?.route?.id}`}>
                                        <IonButton>View Route</IonButton>
                                    </Link>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Leader:</IonLabel>
                                    <IonText>{selectedEvent?.leader}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Captains:</IonLabel>
                                    <IonText>{selectedEvent?.captains?.join(', ')}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Sheepdogs:</IonLabel>
                                    <IonText>{selectedEvent?.sheepdogs?.join(', ')}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Sprinters:</IonLabel>
                                    <IonText>{selectedEvent?.sprinters?.join(', ')}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Caboose:</IonLabel>
                                    <IonText>{selectedEvent?.caboose?.join(', ')}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Kids:</IonLabel>
                                    <IonText>{selectedEvent?.kids?.join(', ')}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Members:</IonLabel>
                                    <IonText>{selectedEvent?.members?.join(', ')}</IonText>
                                </IonItem>
                            </IonCardContent>
                        </IonCard>
                        {(!isEventDone) ?<IonButton onClick={handleEditEvent}>Go to Event</IonButton> : null}
                        {(isEventDone) ?<IonButton routerLink={eventSummaryLink}>Event Summary</IonButton> : null}
                        <IonButton onClick={() => setShowEventModal(false)}>Close</IonButton>
                    </IonContent>
                </IonModal>

            </IonContent >
        </IonPage >
    );
};

export default ViewSchedule;
