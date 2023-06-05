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

            // Check if schedule field is defined and is an array of Firestore document references
            if (bikeBusGroupData && Array.isArray(bikeBusGroupData.BikeBusSchedules)) {
                for (let i = 0; i < bikeBusGroupData.BikeBusSchedules.length; i++) {
                    const scheduleDocRef = bikeBusGroupData.BikeBusSchedules[i];

                    if (scheduleDocRef instanceof DocumentReference) {
                        // Get the referenced schedule document
                        const scheduleDocSnapshot = await getDoc(scheduleDocRef);
                        const scheduleData = scheduleDocSnapshot.data();
                        console.log('Schedule data:', scheduleData);

                        // If scheduleData doesn't exist, we continue to the next iteration
                        if (!scheduleData) continue;

                        // Prepare an array to store the events for this schedule
                        const scheduleEvents: Event[] = [];

                        // Iterate over the events array
                        for (let j = 0; j < scheduleData.events.length; j++) {

                            // Get the reference to the event document
                            const eventDocRef: DocumentReference = scheduleData.events[j];

                            // Fetch the event document
                            const eventDocSnapshot = await getDoc(eventDocRef);
                            const eventData = eventDocSnapshot.data();
                            console.log('Event data:', eventData);

                            // If eventData doesn't exist, we continue to the next iteration
                            if (!eventData) continue;

                            // use the eventData to grab the startTime after the T value and set that as startTime
                            const startTime = eventData.startTime.split('T')[1];
                            console.log(startTime);

                            // use the eventData to grab the endTime after the T value and set that as endTime
                            const endTime = eventData.endTime.split('T')[1];
                            console.log(endTime);

                            // use the eventData to grab the start (as a date)
                            const start = eventData.start.split('T')[0];
                            console.log(start);

                            // use the eventData to grab the end (as a date)
                            const end = eventData.end.split('T')[0];
                            console.log(end);

                            // now combine the startTime and start fields to create a startDateTime field that is a Date object that big-calendar can use
                            const startDateTime = new Date(start + 'T' + startTime);
                            console.log(startDateTime.toISOString());    

                            // now combine the endTime and end fields to create a endDateTime field that is a Date object that big-calendar can use
                            const endDateTime = new Date(end + 'T' + endTime);
                            console.log(endDateTime.toISOString());


                            // if the eventDays field in events document with the field "recurring" and is set to "no", then only one event will be created and the event is startTime and endTime from the events document
                            if (eventData.isRecurring === "no") {
                                const event: Event = {
                                    start: startDateTime,
                                    end: endDateTime,
                                    title: bikeBusGroupData.title,
                                };
                                setEvents(prevEvents => {
                                    const newEvents = [...prevEvents, event];
                                    console.log(newEvents);
                                    return newEvents;
                                });                                
                                console.log(event);
                                scheduleEvents.push(event);
                            }

                            // if the eventDays field in events document with the field "recurring" and is set to "yes", then multiple events will be created and the event is startTime and endTime from the events document
                            if (eventData.isRecurring === "yes") {
                                // Here you would need to implement logic to handle recurring events
                                const event: Event = {
                                    start: startDateTime,
                                    end: endDateTime,
                                    title: bikeBusGroupData.title,
                                };
                                console.log(event);
                                scheduleEvents.push(event);
                            }
                        }

                        // After iterating over all events for this schedule, update the events state
                        setEvents(prevEvents => [...prevEvents, ...scheduleEvents]);
                    }
                }
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

export default ViewSchedule;

