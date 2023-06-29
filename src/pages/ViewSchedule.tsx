import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonCard,
    IonButton,
    IonModal,
    IonTitle,
    IonLabel,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
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
import { parseISO } from 'date-fns';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import format from 'date-fns/format'
import parse from 'date-fns/parse'
import startOfWeek from 'date-fns/startOfWeek'
import getDay from 'date-fns/getDay'
import enUS from 'date-fns/locale/en-US'

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
    const history = useHistory();


    useEffect(() => {
        const fetchDetailedEvents = async () => {
            const eventsSnapshot = await getDocs(collection(db, "event")); // get all event documents
            const eventDocs: Event[] = [];

            eventsSnapshot.forEach((docSnapshot) => {
                const eventData = docSnapshot.data();
                if (eventData?.groupId === id) { // only process events related to the current group
                    const event: Event = {
                        start: new Date(eventData?.startTimestamp?.seconds * 1000),
                        end: new Date(eventData?.endTime?.seconds * 1000),
                        title: eventData?.title,
                        route: eventData?.route,
                        schedule: eventData?.schedule,
                        startTime: eventData?.startTime,
                        endTime: eventData?.endTime,
                        BikeBusGroup: eventData?.BikeBusGroup,
                        BikeBusStopTimes: eventData?.BikeBusStopTimes,
                        BikeBusStops: eventData?.BikeBusStops,
                        StaticMap: eventData?.StaticMap,
                        caboose: eventData?.caboose,
                        captains: eventData?.captains,
                        kids: eventData?.kids,
                        leader: eventData?.leader,
                        members: eventData?.members,
                        sheepdogs: eventData?.sheepdogs,
                        sprinters: eventData?.sprinters,
                        id: docSnapshot.id,
                        startTimestamp: eventData?.startTimestamp,
                    };
                    eventDocs.push(event);
                }
            });
            setEvents(eventDocs);
        };
        fetchDetailedEvents();
    }, [id]);

    const handleSelectEvent = (event: Event) => {
        const eventLink = `/event/${event.id}`;
        setSelectedEvent(event);
        setEvents(events);
        setEventId(event.id);
        setShowEventModal(true);
        setEventLink(eventLink);

        console.log(event.id);
        console.log(event);
        console.log(event.route);
        console.log(event.startTimestamp);
        console.log(event.endTime);
        console.log(event.title);
    };


    const handleEditEvent = () => {
        setShowEventModal(false); // Close the modal
        history.push(`/event/${eventId}`); // Navigate to the event page
    };

    // Before the return statement in the ViewSchedule component
    const eventData: Event | undefined = selectedEvent;


    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const startTime = eventData?.startTimestamp ? new Date(eventData?.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
    const endTime = eventData?.endTime ? new Date(eventData?.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';



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
                                    <IonLabel>Routes</IonLabel>
                                    <Link to={`/ViewRoute/${selectedEvent?.route.id}`}>
                                        <IonButton>{selectedEvent?.routeName}</IonButton>
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
                        <IonButton onClick={handleEditEvent}>Edit Event</IonButton>
                        <IonButton onClick={() => setShowEventModal(false)}>Close</IonButton>
                    </IonContent>
                </IonModal>

            </IonContent >
        </IonPage >
    );
};

export default ViewSchedule;
