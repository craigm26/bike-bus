import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
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
    startPointName: string;
    endPointName: string;
    startPointAddress: string;
    endPointAddress: string;
    travelMode: string;
    pathCoordinates: Coordinate[];
}

const ViewRoute: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const { id } = useParams<{ id: string }>();

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
                })), 
            };
            setSelectedRoute(routeData);
            console.log(routeData.pathCoordinates, routeData.startPoint, routeData.endPoint);

        }
    };


    useEffect(() => {
        if (headerContext) {
            headerContext.setShowHeader(true);
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
                    Viewing Route
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
                    <IonItem>Starting Point: {selectedRoute?.startPointName}, {selectedRoute?.startPointAddress}</IonItem>
                    <IonItem>Ending Point: {selectedRoute?.endPointName}, {selectedRoute?.endPointAddress}</IonItem>
                </IonList>
                <IonButton routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
                <IonButton routerLink={`/CreateBikeBusGroup/`}>Create BikeBus Group</IonButton>
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

export default ViewRoute;
