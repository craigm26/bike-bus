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
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', id);
            const bikeBusGroupSnapshot = await getDoc(bikeBusGroupDocRef);
            const bikeBusGroupData = bikeBusGroupSnapshot.data();
            console.log('BikeBusGroup data:', bikeBusGroupData);
    
            // Check if schedule field is defined and is a Firestore document reference
            if (bikeBusGroupData && bikeBusGroupData.BikeBusSchedules instanceof DocumentReference) {
                // Get the referenced schedule document
                const scheduleDocSnapshot = await getDoc(bikeBusGroupData.BikeBusSchedules);
                const scheduleData = scheduleDocSnapshot.data();
                console.log('Schedule data:', scheduleData);
                
                // Your previous code assumed each schedule document is associated with multiple events.
                // However, it seems like each schedule document is associated with exactly one event document in the 'events' collection.
                // Let's get the event document associated with this schedule.
    
                // Get the referenced event document
                const eventDocRef: DocumentReference = doc(db, 'events', bikeBusGroupData.BikeBusSchedules.id); // Replace 'schedule.id' with the correct field name in your schedule document
                const eventDocSnapshot = await getDoc(eventDocRef);
                const eventData = eventDocSnapshot.data();
                console.log('Event data:', eventData);
    
                // The rest of your code...
            } else {
                console.warn(`BikeBusGroup document with id ${id} does not have a schedule field defined.`);
            }
        };
    
        fetchSchedules();
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
                <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
            </IonContent>
        </IonPage>
    );
};

export default ViewSchedule;
