import { useContext, useEffect, useState } from 'react';
import { getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useBikeBusGroupContext  } from './useBikeBusGroup';

const useEvent = () => {
    const [fetchedEvents, setFetchedEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { fetchedGroups } = useBikeBusGroupContext();




    if (!fetchedGroups) {
        throw new Error("useEvent must be used within a BikeBusGroupContext provider");
    }


    useEffect(() => {
        const fetchData = async () => {
            try {
                let events: any[] = [];

                for (const group of fetchedGroups) {
                    if (group.event && group.event.length > 0) {
                        for (const eventRef of group.event) {
                            const eventDocSnap = await getDoc(eventRef);

                            if (eventDocSnap.exists()) {
                                const eventData = eventDocSnap.data();
                                if (eventData) {
                                  events.push({ id: eventDocSnap.id, ...eventData });
                                }
                              }
                              
                        }
                    }
                }

                setFetchedEvents(events);
            } catch (error) {
                console.error("Error fetching data: ", error as Error);
                setError(error as Error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchedGroups]);

    return { fetchedEvents, loading, error };
};

export default useEvent;
