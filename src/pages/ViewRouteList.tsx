import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonInput,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonPopover,
    IonText,
    IonCard,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import ViewRouteMap from '../components/Mapping/ViewRouteMap';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import UseRoutes from '../components/useRoutes';



interface Coordinate {
    lat: number;
    lng: number;
}

interface Route {
    id: string;
    accountType: string;
    description: string;
    endPoint: Coordinate;
    routeCreator: string;
    routeLeader: string;
    routeName: string;
    routeType: string;
    startPoint: Coordinate;
    travelMode: string;
}

const ViewRouteList: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [popoverState, setPopoverState] = useState<{ open: boolean; event: Event | null }>({ open: false, event: null });
    const [editableRoute, setEditableRoute] = useState<Route | null>(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [routeType, setRouteType] = useState('');
    const [scheduleName, setScheduleName] = useState<string>('');
    const [scheduleDescription, setScheduleDescription] = useState<string>('');
    const [scheduleStartDate, setScheduleStartDate] = useState<string>('');
    const [scheduleEndDate, setScheduleEndDate] = useState<string>('');
    const [scheduleStartTime, setScheduleStartTime] = useState<string>('');
    const [scheduleEndTime, setScheduleEndTime] = useState<string>('');
    const [scheduleTypeSelector, setScheduleTypeSelector] = useState<string>('');
    const [scheduleFrequency, setScheduleFrequency] = useState<string>('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [schedules, setSchedules] = useState<Schedule[]>([{ scheduleStartTime: '', scheduleEndTime: '', frequency: '' }]);
    const { fetchedRoutes, loading: loadingRoutes, error } = UseRoutes();



    let geoPoint;

    if (editableRoute) {
        geoPoint = new GeoPoint(editableRoute.startPoint.lat, editableRoute.startPoint.lng);
    }

    type Schedule = {
        scheduleStartTime: string;
        scheduleEndTime: string;
        frequency: string;
        [key: string]: string;
    };

    const openPopover = (e: Event, route: Route) => {
        setPopoverState({ open: true, event: e });
        setEditableRoute(route);
    };

    const closePopover = () => {
        setPopoverState({ open: false, event: null });
        setEditableRoute(null);
    };

    const saveRouteChanges = async () => {
        if (editableRoute) {
            try {
                const routeRef = doc(db, "routes", editableRoute.id);
                await updateDoc(routeRef, { ...editableRoute }); // changed
                closePopover();
            } catch (error) {
                console.log("Error updating route: ", error);
            }
        }
    };
    const fetchRoutes = useCallback(async () => {
        // Assuming that your uid is stored in the user.uid
        const uid = user?.uid;

        if (!uid) {
            // If there's no user, we cannot fetch routes
            return;
        }

        // Create a reference to the 'routes' collection
        const routesCollection = collection(db, 'routes');

        // Create a query against the collection.
        // This will fetch all documents where the routeCreator equals the user's uid
        const q = query(routesCollection, where("routeCreator", "==", `/users/${uid}`));

        const querySnapshot = await getDocs(q);
        const routesData: Route[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as Route,
            id: doc.id,
        }));
        setRoutes(routesData);
    }, [user]); // here user is a dependency



    useEffect(() => {
        fetchRoutes();
    }, [fetchRoutes]);



    const handleRouteChange = (field: keyof Route, value: any) => {
        if (editableRoute) {
            setEditableRoute({
                ...editableRoute,
                [field]: value,
            });
        }
    };

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
                        setaccountType(userData.accountType);
                    }
                }
            });
        }
    }, [user]);

    const editRoute = () => {
        if (editableRoute) {
            setSelectedRoute(editableRoute);
            closePopover();
        }
    };



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
                        {routes.map((route) => (
                            <IonItem>
                                <IonLabel>{route.routeName}</IonLabel>
                                <IonButton routerLink={`/ViewRoute/${route.id}`}>View Route</IonButton>
                            </IonItem>
                        ))}
                    </IonList>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default ViewRouteList;
