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

const BikeBusCalendar: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        // Initialize the array to hold our events
        const dailyEvents: Event[] = [];

        // Generate an event for each weekday
        for (let i = 0; i < 5; i++) {
            const start = moment().startOf('week').add(i, 'days').hours(8).minutes(0);
            const end = moment(start).add(1, 'hour'); // Adjust this if you want a different end time

            dailyEvents.push({
                start: start.toDate(),
                end: end.toDate(),
                title: 'Daily Event',
            });
        }

        setEvents(dailyEvents);
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

export default BikeBusCalendar;
