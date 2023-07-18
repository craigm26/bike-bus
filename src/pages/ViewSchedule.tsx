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
    formattedStartDate: Timestamp,
    formattedEndDate: Timestamp,
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


    useEffect(() => {
        const fetchDetailedEvents = async () => {
            const eventsSnapshot = await getDocs(collection(db, "event")); // get all event documents
            const eventDocs: Event[] = [];
            // the above eventDocs does not seem to fill up with events
            // Inside fetchDetailedEvents function
            eventsSnapshot.forEach((docSnapshot) => {
                const eventData = docSnapshot.data();
                if (eventData?.groupId.id === id) { // only process events related to the current group
                    const startDate = eventData.start.toDate();
                    const year = startDate.getFullYear();
                    const month = startDate.getMonth() + 1; // Months are zero-based in JavaScript
                    const day = startDate.getDate();

                    // Format the date as MM/DD/YYY and convert it to a firestore timestamp
                    const formattedStartDate = Timestamp.fromDate(new Date(`${month}/${day}/${year}`));

                    // Convert startTime to a Date object
                    const startTimeDate = new Date(eventData.startTime); // Use eventData.startTime
                    console.log('startTimeDate: ', startTimeDate)

                    // Extract hours and minutes
                    const hours = startTimeDate.getHours();
                    const minutes = startTimeDate.getMinutes();

                    // Create a new Date object from formattedStartDate and set the hours and minutes
                    const startEventDate = formattedStartDate.toDate();
                    console.log('startEventDate: ', startEventDate)
                    startEventDate.setHours(hours, minutes);

                    console.log('eventData.endTime: ', eventData.endTime)

                    // Convert the endTime timestamp to a Date object
                    const endTimeDate = eventData.endTime.toDate();

                    // Get the hours and minutes from endTime
                    const endTimeHours = endTimeDate.getHours();
                    const endTimeMinutes = endTimeDate.getMinutes();

                    // Set the hours and minutes of startEventDate to the hours and minutes of endTime
                    // Create a new Date object for endEventDate and set the hours and minutes
                    const endEventDate = new Date(startEventDate);
                    endEventDate.setHours(endTimeHours, endTimeMinutes);



                    // convert the endTimeTimeTime to a firestore timestamp
                    const formattedEndDate = Timestamp.fromDate(endEventDate);

                    const event: Event = {
                        start: startEventDate,
                        end: formattedEndDate.toDate(),
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
                        startTimestamp: eventData.startTimestamp,
                        formattedStartDate: formattedStartDate,
                        formattedEndDate: formattedEndDate,
                    };
                    eventDocs.push(event);
                    console.log('eventDocs: ', eventDocs);
                }
            });
            setEvents(eventDocs);
            // check the start and end times for the event
            const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const startTime = eventDocs?.[0]?.startTimestamp ? new Date(eventDocs?.[0]?.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
            const endTime = eventDocs?.[0]?.endTime ? new Date(eventDocs?.[0]?.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
            console.log('startTime: ', startTime);
            console.log('endTime: ', endTime);
            setStartTime(startTime);
            setEndTime(endTime);
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

        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const startTime = event.start ? new Date(event.startTimestamp.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
        const endTime = event.endTime ? new Date(event.endTime.toDate()).toLocaleString(undefined, dateOptions) : 'Loading...';
        setStartTime(startTime);
        setEndTime(endTime);

        console.log(event.endTime);
    };


    const handleEditEvent = () => {
        setShowEventModal(false); // Close the modal
        history.push(`/event/${eventId}`); // Navigate to the event page
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
                        <IonButton onClick={handleEditEvent}>Edit Event</IonButton>
                        <IonButton onClick={() => setShowEventModal(false)}>Close</IonButton>
                    </IonContent>
                </IonModal>

            </IonContent >
        </IonPage >
    );
};

export default ViewSchedule;
