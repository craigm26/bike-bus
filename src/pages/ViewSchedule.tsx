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

            if (!bikeBusGroupData || !Array.isArray(bikeBusGroupData.BikeBusSchedules)) return;

            let allEvents: Event[] = [];

            for (let i = 0; i < bikeBusGroupData.BikeBusSchedules.length; i++) {
                const scheduleDocRef = bikeBusGroupData.BikeBusSchedules[i];

                if (scheduleDocRef instanceof DocumentReference) {
                    const scheduleDocSnapshot = await getDoc(scheduleDocRef);
                    const scheduleData = scheduleDocSnapshot.data();
                    console.log('Schedule data:', scheduleData);

                    if (!scheduleData) continue;


                    for (let j = 0; j < scheduleData.events.length; j++) {
                        const eventDocRef: DocumentReference = scheduleData.events[j];
                        const eventDocSnapshot = await getDoc(eventDocRef);
                        const eventData = eventDocSnapshot.data();
                        console.log('Event data:', eventData);

                        if (!eventData) continue;

                        const title = eventData.title;
                        const startTime = eventData.startTime.split('T')[1];
                        const endTime = eventData.endTime.split('T')[1];

                        if (eventData.recurring === "yes") {
                            for (let k = 0; k < eventData.eventDays.length; k++) {
                                const eventDay = eventData.eventDays[k];
                                const startDateTime = new Date(eventDay + 'T' + startTime);
                                const endDateTime = new Date(eventDay + 'T' + endTime);

                                const event: Event = {
                                    start: startDateTime,
                                    end: endDateTime,
                                    title: title,
                                };

                                console.log(event);
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
                            };

                            console.log(event);
                            allEvents.push(event);
                        }
                    }
                }
            }
setEvents(allEvents);
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
                <div style={{ height: 500 }}>
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        defaultView="week"
                    />
                </div>
            </IonCard>
            <IonButton routerLink={`/editschedule/${id}`}>Edit Schedule</IonButton>
            <IonButton routerLink={`/bikebusgrouppage/${id}`}>Back to BikeBusGroup</IonButton>
        </IonContent>
    </IonPage>
);
};

export default ViewSchedule;
