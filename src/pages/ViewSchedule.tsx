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
        const fetchDetailedEvents = async () => {
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', id);
            const bikeBusGroupSnapshot = await getDoc(bikeBusGroupDocRef);
            const bikeBusGroupData = bikeBusGroupSnapshot.data();

            if (!bikeBusGroupData || !Array.isArray(bikeBusGroupData.event)) return;

            let eventDocs: Event[] = [];
            for (let i = 0; i < bikeBusGroupData.event.length; i++) {
                const eventDocRef: DocumentReference = bikeBusGroupData.event[i];
                const eventDocSnapshot = await getDoc(eventDocRef);
                const eventData = eventDocSnapshot.data();
                console.log(eventData);

                const event: Event = {
                    start: eventData?.start.toDate(),
                    end: new Date(eventData?.endTime),
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
                    id: eventDocSnapshot.id,
                };
                eventDocs.push(event);
            }
            setEvents(eventDocs);
        };
        fetchDetailedEvents();
    }, [id]); // removed events from dependency array


    const handleSelectEvent = (event: Event) => {
        const eventLink = `/event/${event.id}`;
        setSelectedEvent(event);
        setEvents(events);
        setEventId(event.id);
        setShowEventModal(true);
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
                    <IonContent>
                        <IonCard>
                            <IonCardHeader>
                                <IonCardTitle>Details for {moment(selectedEvent?.start).format('MM/DD/YYYY')} Event:</IonCardTitle>
                                <IonCardSubtitle>{selectedEvent?.title}</IonCardSubtitle>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonItem>
                                    <IonLabel>Start Time:</IonLabel>
                                    <IonText>{moment(selectedEvent?.startTime).format('hh:mm a')}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Route:</IonLabel>
                                    <IonText>{selectedEvent?.route}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Leader:</IonLabel>
                                    <IonText>{selectedEvent?.leader}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Captains:</IonLabel>
                                    <IonText>{selectedEvent?.captains}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Sheepdogs:</IonLabel>
                                    <IonText>{selectedEvent?.sheepdogs}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Sprinters:</IonLabel>
                                    <IonText>{selectedEvent?.sprinters}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Caboose:</IonLabel>
                                    <IonText>{selectedEvent?.caboose}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Kids:</IonLabel>
                                    <IonText>{selectedEvent?.kids}</IonText>
                                </IonItem>
                                <IonItem>
                                    <IonLabel>Members:</IonLabel>
                                    <IonText>{selectedEvent?.members}</IonText>
                                </IonItem>
                            </IonCardContent>
                        </IonCard>
                        <IonButton routerLink={`/event/${eventId}`}>Edit Event</IonButton>
                        <IonButton onClick={() => setShowEventModal(false)}>Close</IonButton>
                    </IonContent>
                </IonModal>

            </IonContent>
        </IonPage>
    );
};

export default ViewSchedule;
