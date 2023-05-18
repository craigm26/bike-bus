import {
    IonContent,
    IonHeader,
    IonPage,
    IonToolbar,
    IonMenuButton,
    IonButtons,
    IonButton,
    IonLabel,
    IonText,
    IonChip,
    IonAvatar,
    IonPopover,
    IonIcon,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import './Help.css';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile';
import { personCircleOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ViewRouteMap from '../components/viewRouteMap';
import { useParams } from 'react-router-dom';
import { GeoPoint } from 'firebase/firestore';
import { LatLng } from '@react-google-maps/api';

interface RouteParams {
    id: string;
}

interface RouteData {
    id: string;
    destination: string; 
    bikebusgroup: string; 
    bikebusstations: string[]; 
    description: string;
    distance: number;
    endGeo: string; 
    path: GeoPoint[];
    routecreator: string;
    routeleader: string; 
    routename: string;
    startGeo: string;
}

interface RouteLatLng {
    id: string;
    destination: string; 
    bikebusgroup: string; 
    bikebusstations: string[]; 
    description: string;
    distance: number;
    endGeo: string; 
    path: GeoPoint[];
    routecreator: string;
    routeleader: string; 
    routename: string;
    startGeo: string;
}


const ViewRoute: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const { id } = useParams<RouteParams>();
    const { routeId } = useParams<{ routeId: string }>();
    const [route, setRoute] = useState<RouteLatLng | null>(null);


    useEffect(() => {
        const fetchData = async () => {
            const docRef = doc(db, 'routes', routeId);
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
                const routeData = docSnapshot.data() as RouteData;
                // Convert path data to LatLng format
                const convertedPath = routeData.path.map(point => ({ lat: point.latitude, lng: point.longitude }));
                // Replace the path in route data
                const routeWithConvertedPath = { ...routeData, path: convertedPath };
                setRoute(routeWithConvertedPath as RouteLatLng);
            } else {
                console.log("No such document!");
            }
        };
        fetchData();
    }, [id, routeId]);
    

    const togglePopover = (e: any) => {
        console.log('togglePopover called');
        console.log('event:', e);
        setPopoverEvent(e.nativeEvent);
        setShowPopover((prevState) => !prevState);
        console.log('showPopover state:', showPopover);
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

    const label = user?.username ? user.username : "anonymous";

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonText slot="start" color="primary" class="BikeBusFont">
                        <h1>BikeBus</h1>
                    </IonText>
                    <IonButton fill="clear" slot="end" onClick={togglePopover}>
                        <IonChip>
                            {avatarElement}
                            <IonLabel>{label}</IonLabel>
                            <IonText>({accountType})</IonText>
                        </IonChip>
                    </IonButton>
                    <IonPopover
                        isOpen={showPopover}
                        event={popoverEvent}
                        onDidDismiss={() => setShowPopover(false)}
                        className="my-popover"
                    >
                        <Profile />
                    </IonPopover>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar></IonToolbar>
                </IonHeader>
                {route && <ViewRouteMap route={route} />}
            </IonContent>
        </IonPage>
    );
};

export default ViewRoute;
