import {
    IonContent,
    IonPage,
    IonList,
    IonHeader,
    IonToolbar,
    IonCard,
    IonLabel,
    IonTitle,
    IonText,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import BikeBusCalendar from '../components/BikeBusGroup/BikeBusCalendar';


interface Schedule {
    id: string;
    accountType: string;
}

const ViewSchedule: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const { id } = useParams<{ id: string }>();
    const [accountType, setAccountType] = useState<string>('');
    const [scheduleData, setscheduleData] = useState<any>(null);
    const [schedulesData, setSchedulesData] = useState<any[]>([]);



    useEffect(() => {
        if (headerContext) {
            headerContext.setShowHeader(true); // Hide the header for false, Show the header for true (default)
        }
    }, [headerContext]);

    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData && userData.accountType) {
                        setAccountType(userData.accountType);
                    }
                }
            });
        }
        const scheduleRef = doc(db, 'schedules', id);
        getDoc(scheduleRef)
            .then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const scheduleData = docSnapshot.data();
                    setscheduleData(scheduleData);

                } else {
                    console.log("No such document!");
                }
            })
            .catch((error) => {
                console.log("Error getting schedule document:", error);
            });
    }, [user, id]);

    // take the scheduleData and get the schedule from the references generated from the scheduleData. 
    const fetchSchedules = useCallback(async () => {
        if (scheduleData?.BikeBusSchedules && Array.isArray(scheduleData.BikeBusSchedules)) {
            const schedules = scheduleData && scheduleData.BikeBusSchedules
                ? scheduleData.BikeBusSchedules.map((schedules: any) => {
                    return getDoc(schedules).then((docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const schedulesData = docSnapshot.data();
                            // Check if leaderData exists before spreading
                            return schedulesData ? {
                                ...schedulesData,
                                id: docSnapshot.id,
                            } : { id: docSnapshot.id };
                        } else {
                            console.log("No such document!");
                        }
                    })
                        .catch((error) => {
                            console.log("Error getting leader document:", error);
                        });
                }
                ) : [];
            console.log(schedules);
            const schedulesData = await Promise.all(schedules);
            setSchedulesData(schedulesData);
        }
    }, [scheduleData]);

    useEffect(() => {
        fetchSchedules();
    }
        , [fetchSchedules]);


    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                    <IonList>
                        <IonLabel>
                            <IonTitle>{scheduleData?.scheduleName}</IonTitle>
                        </IonLabel>
                    </IonList>
                    <BikeBusCalendar schedules={schedulesData} />

                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default ViewSchedule;
