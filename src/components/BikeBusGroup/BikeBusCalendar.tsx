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

interface BikeBusCalendarProps {
    schedules: any; // use a more specific type if possible
}

const BikeBusCalendar: React.FC<BikeBusCalendarProps> = ({ schedules }) => {
// check to see if BikeBusSchedules is null or undefined. If it is, then set it to an empty string.
    if (schedules === null || schedules === undefined) {
        schedules = '';
    }
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        // Initialize the array to hold our events
        const dailyEvents: Event[] = [];

        // Generate an event for each weekday
        for (let i = 0; i < 5; i++) {
            const start = moment().startOf('week').add(i, 'days').hours(8).minutes(0);
            const end = moment(start).add(1, 'hour'); 

            dailyEvents.push({
                start: start.toDate(),
                end: end.toDate(),
                title: 'Daily Event',
            });
        }

        setEvents(dailyEvents);
    }, []);

    useEffect(() => {
        // ... Convert scheduleData into the format required by the calendar
        // Assuming scheduleData is not an array of schedules
        if (schedules) {
        // and each schedule has a start and end date, and a title
        const convertedEvents = schedules.map((schedule: { startTime: string | number | Date; endTime: string | number | Date; scheduleName: any; }) => ({
            start: new Date(schedule.startTime),
            end: new Date(schedule.endTime),
            title: schedule.scheduleName,
        }));
    
        setEvents(convertedEvents);
        }
    }, [schedules]);
    

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
