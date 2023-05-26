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
    IonTitle,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import ViewRouteMap from '../components/Mapping/ViewRouteMap';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams } from 'react-router-dom';




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
    pathCoordinates: Coordinate[];
}

const EditRoute: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [popoverState, setPopoverState] = useState<{ open: boolean; event: Event | null }>({ open: false, event: null });
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
    const { id } = useParams<{ id: string }>();



    type Schedule = {
        scheduleStartTime: string;
        scheduleEndTime: string;
        frequency: string;
        [key: string]: string;
    };


    const fetchRoutes = useCallback(async () => {
        const uid = user?.uid;
        if (!uid) {
            return;
        }
        const routesCollection = collection(db, 'routes');
        const q = query(routesCollection, where("routeCreator", "==", `/users/${uid}`));
        const querySnapshot = await getDocs(q);
        const routesData: Route[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as Route,
            id: doc.id,
        }));
        setRoutes(routesData);
    }, [user]);

    useEffect(() => {
        fetchRoutes();
    }, [fetchRoutes]);

    useEffect(() => {
        if (id) fetchSingleRoute(id);
    }, [id]);

    const fetchSingleRoute = async (id: string) => {
        const docRef = doc(db, 'routes', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const routeData = {
                ...docSnap.data() as Route,
                id: docSnap.id,
                pathCoordinates: (docSnap.data().pathCoordinates || []).map((coord: any) => ({
                    lat: coord.latitude,
                    lng: coord.longitude,
                })), // Transform pathCoordinates
            };
            setSelectedRoute(routeData);
            console.log(routeData.pathCoordinates, routeData.startPoint, routeData.endPoint);

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



    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
            <IonTitle>
                    Editing Route
                </IonTitle>
                <IonList>
                    <IonItem>
                        <IonLabel>Route Name: {selectedRoute?.routeName}</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Description: {selectedRoute?.description}</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Route Type: {selectedRoute?.routeType}</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Travel Mode: {selectedRoute?.travelMode}</IonLabel>
                    </IonItem>
                    <IonItem>Starting Point: Lat {selectedRoute?.startPoint.lat}, Lng {selectedRoute?.startPoint.lng}</IonItem>
                    <IonItem>End Point: Lat {selectedRoute?.endPoint.lat}, Lng {selectedRoute?.endPoint.lng}</IonItem>
                </IonList>
                <IonButton onClick={() => { }}>Save</IonButton>
                <IonButton routerLink={`/ViewRoute/${id}`}>Cancel</IonButton>
                {selectedRoute && (
                    <ViewRouteMap
                        path={selectedRoute.pathCoordinates.map(coordinate => new GeoPoint(coordinate.lat, coordinate.lng))}
                        startGeo={new GeoPoint(selectedRoute.startPoint.lat, selectedRoute.startPoint.lng)}
                        endGeo={new GeoPoint(selectedRoute.endPoint.lat, selectedRoute.endPoint.lng)}
                        stations={[]}
                    />
                )}

            </IonContent >
        </IonPage >
    );

};

export default EditRoute;
