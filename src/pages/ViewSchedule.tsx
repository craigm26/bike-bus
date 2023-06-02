import {
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonCard,
    IonTitle,
    IonButton,
} from '@ionic/react';
import { useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDocs, query, where, DocumentReference, getDoc } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

type Event = {
    start: Date,
    end: Date,
    title: string
};

const ViewSchedule: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        const fetchSchedules = async () => {
            const schedulesCollection = collection(db, 'schedules');
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', id);
            const q = query(schedulesCollection, where('BikeBusGroup', '==', bikeBusGroupDocRef));
            const querySnapshot = await getDocs(q);
            const fetchedEvents: ((prevState: Event[]) => Event[]) | { start: Date; end: Date; title: any; }[] = [];
        
            for (const scheduleDoc of querySnapshot.docs) {
                const scheduleData = scheduleDoc.data();
                console.log('Schedule data:', scheduleData);
                
                // Get the referenced event document
                const eventDocRef: DocumentReference = doc(db, 'events', scheduleData.eventId); // Replace 'eventId' with the correct field name in your schedule document
                const eventDocSnapshot = await getDoc(eventDocRef);
                const eventData = eventDocSnapshot.data();
        
                if (!eventData) {
                    console.warn(`Event document with id ${scheduleData.eventId} does not exist.`);
                    continue;
                }
        
                console.log('Event data:', eventData);
        
                const startTime = new Date(eventData.startTime);
                const endTime = new Date(eventData.endTime);
        
                // Check if eventData.eventDays is defined and is an array before using forEach on it
                if (Array.isArray(eventData.eventDays)) {
                    eventData.eventDays.forEach((eventDay: string) => {
                        const eventDate = new Date(eventDay);
                        const start = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), startTime.getHours(), startTime.getMinutes());
                        const end = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), endTime.getHours(), endTime.getMinutes());
                        
                        fetchedEvents.push({
                            start,
                            end,
                            title: eventData.title,
                        });
                    });
                } else {
                    console.warn(`Event document with id ${scheduleData.eventId} does not have eventDays defined.`);
                }
            }
        
            setEvents(fetchedEvents);
            console.log('fetchedEvents:', fetchedEvents); // To check the resultant array
        };
        
        

        fetchSchedules();
        
    }, [id]);

    // Rest of your code...

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                        <IonTitle style={{ textAlign: 'center' }}>Schedule</IonTitle>
                <div style={{ height: 500 }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                    />
                </div>
                </IonCard>
                <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
            </IonContent>
        </IonPage>
    );
};

export default ViewSchedule;
