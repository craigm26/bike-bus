import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getDoc, collection, getDocs, query, where, doc, DocumentReference } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useParams } from 'react-router-dom';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';

const localizer = momentLocalizer(moment);

type Event = {
    start: Date,
    end: Date,
};

const BikeBusCalendar: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const { groupId } = useParams<{ groupId: string }>();
    console.log('groupId', groupId);

    // get the schedules from the schedules collection where the BikeBusGroup is equal to the groupId
    useEffect(() => {
        const fetchSchedules = async () => {
            const schedulesCollection = collection(db, 'schedules');
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', groupId);
            console.log('bikeBusGroupDocRef', bikeBusGroupDocRef);
            const q = query(schedulesCollection, where('BikeBusGroup', '==', bikeBusGroupDocRef));
            const querySnapshot = await getDocs(q);
            console.log('querySnapshot', querySnapshot);
            const fetchedEvents = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    start: new Date(data.startDateTime),
                    end: new Date(data.endTime),
                    title: data.scheduleName
                };
            });
            setEvents(fetchedEvents);
            console.log('fetchedEvents', fetchedEvents);
        };
        fetchSchedules();

        // get the data from the bikebusgroups in firestore collection where the id is equal to the groupId
        const fetchBikeBusGroup = async () => {
            const bikeBusGroupDocRef: DocumentReference = doc(db, 'bikebusgroups', groupId);
            const bikeBusGroupDoc = await getDoc(bikeBusGroupDocRef);
            const bikeBusGroupData = bikeBusGroupDoc.data();
            console.log('bikeBusGroupData', bikeBusGroupData);
        }
        fetchBikeBusGroup();

    }
    , [groupId]);

    return (
        <IonCard>
            <IonCardHeader>
                <IonCardTitle style={{ textAlign: 'center' }}>{}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
        <div style={{ height: 500 }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
            />
        </div>
            </IonCardContent>
        </IonCard>
    );
};

export default BikeBusCalendar;
