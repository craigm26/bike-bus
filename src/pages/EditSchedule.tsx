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

const EditSchedule: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        const fetchSchedules = async () => {
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', id);
            const bikeBusGroupSnapshot = await getDoc(bikeBusGroupDocRef);
            const bikeBusGroupData = bikeBusGroupSnapshot.data();
            console.log('BikeBusGroup data:', bikeBusGroupData);
    
            // Check if schedule field is defined and is a Firestore document reference
            if (bikeBusGroupData && bikeBusGroupData.schedule instanceof DocumentReference) {
                // Get the referenced schedule document
                const scheduleDocSnapshot = await getDoc(bikeBusGroupData.schedule);
                const scheduleData = scheduleDocSnapshot.data();
                console.log('Schedule data:', scheduleData);
    
                // Your previous code assumed each schedule document is associated with multiple events.
                // However, it seems like each schedule document is associated with exactly one event document in the 'events' collection.
                // Let's get the event document associated with this schedule.
    
                // Get the referenced event document
                const eventDocRef: DocumentReference = doc(db, 'events', scheduleData.id); // Replace 'schedule.id' with the correct field name in your schedule document
                const eventDocSnapshot = await getDoc(eventDocRef);
                const eventData = eventDocSnapshot.data();
                console.log('Event data:', eventData);
    
                // Check if eventDays field is defined and is an array
                if (eventData && Array.isArray(eventData.eventDays)) {
                    // Map each eventDay string into an Event object
                    const events: Event[] = eventData.eventDays.map(eventDayStr => {
                        // Convert eventDayStr to a Date object
                        const eventDay = new Date(eventDayStr);
    
                        // Assume that each event lasts for one hour, adjust this as needed
                        const eventDurationInHours = 1;
    
                        // Create end Date object
                        const end = new Date(eventDay);
                        end.setHours(end.getHours() + eventDurationInHours);
    
                        // Create and return an Event object
                        return {
                            start: eventDay,
                            end: end,
                            title: bikeBusGroupData.name, // or whatever is the title of the event
                        };
                    });
    
                    // Update the state
                    setEvents(events);
                } else {
                    console.warn(`Event document with id ${scheduleData.id} does not have an eventDays field defined or it's not an array.`);
                }
            }
    
            fetchSchedules();
        };
    }, [id]);
    


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
                <IonButton routerLink={`/editschedule/${id}`}>Edit Schedule</IonButton>
                <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
            </IonContent>
        </IonPage>
    );
};

export default EditSchedule;
