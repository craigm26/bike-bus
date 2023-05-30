import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment)

interface Event {
    start: Date;
    end: Date;
    title: string;
}

const GroupCalendar: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        // Fetch data from Firestore here
        // After fetching data, format it as the array of 'Event' objects and call setEvents
        // For now, let's use a dummy event data
        const dummyEvents: Event[] = [
            {
                start: new Date(),
                end: new Date(moment().add(1, "days").toDate()),
                title: "Dummy Event"
            },
        ];
        setEvents(dummyEvents);
    }, []);

    return (
        <div>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 500 }}
            />
        </div>
    );
};

export default GroupCalendar;