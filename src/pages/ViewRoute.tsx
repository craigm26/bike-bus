import {
    IonContent,
    IonPage,
    IonAvatar,
    IonIcon,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewRouteMap from '../components/Mapping/ViewRouteMap';
import { useParams } from 'react-router-dom';
import { GeoPoint } from 'firebase/firestore';

interface RouteParams {
    id: string;
}

interface Station {
    id: string;
    location: GeoPoint;
}

interface RouteData {
    id: string;
    destination: string;
    bikebusgroup: string;
    bikebusstations: string[];
    description: string;
    distance: number;
    endGeo: GeoPoint;
    path: GeoPoint[];
    routecreator: string;
    routeleader: string;
    routename: string;
    startGeo: GeoPoint;
}

const ViewRoute: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const { id } = useParams<RouteParams>();
    const [route, setRoute] = useState<RouteData | null>(null);
    const [stations, setStations] = useState<Station[]>([]);
    const [BikeBusStations, setBikeBusStations] = useState<google.maps.DirectionsWaypoint[] | undefined>(undefined);
    const [BikeBusStationsMarkers, setBikeBusStationsMarkers] = useState<google.maps.Marker[] | undefined>(undefined);
    const [path, setPath] = useState<google.maps.LatLngLiteral[] | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [publicRoute, setPublicRoute] = useState<boolean>(false);

    // const { path } = useParams<RouteParams>(); the route data may already be declared in app.tsx, but we'll have to see console data to be sure
    // const [path, setPath] = useState<GeoPoint[]>([]); // this is the path data from the route data

    useEffect(() => {
        const fetchData = async () => {
            const docRef = doc(db, 'routes', id);
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
                const routeData = docSnapshot.data() as RouteData;
                setRoute(routeData);

                // Fetch stations
                const stationPromises = routeData.bikebusstations.map(async (stationId: string) => {
                    const stationDocRef = doc(db, 'bikebusstations', stationId);
                    const stationDocSnapshot = await getDoc(stationDocRef);
                    const stationData = stationDocSnapshot.data();
                    if (stationData && stationData.location) {
                        return {
                            id: stationId,
                            location: stationData.location,
                        };
                    }
                    return null;
                });
                const fetchedStations = await Promise.all(stationPromises);
                setStations(fetchedStations.filter(station => station !== null) as Station[]);
            } else {
                console.log("No such document!");
            }
        };
        fetchData();
    }, [id]);


    const togglePopover = (e: any) => {
        setPopoverEvent(e.nativeEvent);
        setShowPopover((prevState) => !prevState);
    };

    const avatarElement = user ? (
        avatarUrl ? (
            <IonAvatar>
                <Avatar uid={user.uid} size="extrasmall" />
            </IonAvatar>
        ) : (
            <IonIcon icon={personCircleOutline} />
        )
    ) : (
        <IonIcon icon={personCircleOutline} />
    );

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
            <IonContent>
                {route && (
                    <div>
                        <h1>{route.routename}</h1>
                        <p>{route.description}</p>
                        <ViewRouteMap path={route.path} startGeo={route.startGeo} endGeo={route.endGeo} stations={stations} />
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
};

export default ViewRoute;
