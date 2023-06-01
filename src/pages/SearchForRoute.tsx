import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonToolbar, IonMenuButton, IonButtons, IonButton, IonLabel, IonText, IonChip, IonPopover, IonIcon, IonTitle } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';
import { useAvatar } from '../components/useAvatar';
import Avatar from '../components/Avatar';
import Profile from '../components/Profile';
import { helpCircleOutline, cogOutline, alertCircleOutline } from 'ionicons/icons';


type Location = {
    lat: number;
    lng: number;
}

type Route = {
    id: string;
    destination: string; // replace with appropriate type
    bikebusgroup: string; // replace with appropriate type
    bikebusstations: string[]; // replace with appropriate type
    description: string;
    distance: number;
    endGeo: string; // replace with appropriate type
    path: Location[];
    routecreator: string; // replace with appropriate type
    routeleader: string; // replace with appropriate type
    routename: string;
    startGeo: string; // replace with appropriate type
}


function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    function toRad(x: number) {
        return (x * Math.PI) / 180;
    }

    var R = 6371; // km

    var x1 = lat2 - lat1;
    var dLat = toRad(x1);
    var x2 = lon2 - lon1;
    var dLon = toRad(x2);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;

    return d;
}

const SearchForRoute: React.FC = () => {
    const { user } = useAuth(); // Use the useAuth hook to get the user object
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const [showPopover, setShowPopover] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(null);
    const [routes, setRoutes] = useState<Route[]>([]); // Add state to hold routes


    const togglePopover = (e: any) => {
        setShowPopover(!showPopover);
        setPopoverEvent(e.nativeEvent);
    };

    const avatarElement = avatarUrl ? (
        <Avatar uid={user?.uid} size="extrasmall" />
    ) : (
        <IonIcon icon={personCircleOutline} />
    );

    useEffect(() => {
        if (user) {
            setaccountType(user.accountType);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const currentLocation: Location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                const routesRef = collection(db, "routes");
                const routesSnapshot = await getDocs(routesRef);
                const nearbyRoutes: Route[] = [];
                routesSnapshot.docs.forEach((doc) => {
                    const routeData = doc.data() as Route;
                    const processedRoute: Route = {
                        ...routeData,
                        path: routeData.path.map(geoPoint => {
                            // Convert GeoPoints to Location objects
                            return { lat: geoPoint.lat, lng: geoPoint.lng };
                        }),
                    };
                    const distance = haversine(
                        currentLocation.lat,
                        currentLocation.lng,
                        processedRoute.path[0].lat,
                        processedRoute.path[0].lng
                    );
                    if (distance < 5) {
                        nearbyRoutes.push(processedRoute);
                    }
                }); // Closing forEach here
                setRoutes(nearbyRoutes); // Setting the state for routes
            });
        }
    }, [user]); // Closing useEffect here

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
                    <IonPopover
                        isOpen={showPopover}
                        event={popoverEvent}
                        onDidDismiss={() => setShowPopover(false)}
                        className="my-popover"
                    >
                        <Profile />
                    </IonPopover>
                    <IonButton fill="clear" slot="end" onClick={togglePopover}>
                        <IonChip>
                            {avatarElement}
                            <IonLabel>{label}</IonLabel>
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
                    <IonButtons slot="primary">
                        <IonButton routerLink='/help'>
                            <IonIcon slot="end" icon={helpCircleOutline}></IonIcon>
                        </IonButton>
                        <IonButton routerLink='/settings'>
                            <IonIcon slot="end" icon={cogOutline}></IonIcon>
                        </IonButton>
                        <IonButton routerLink='/notifications'>
                            <IonIcon slot="end" icon={alertCircleOutline}></IonIcon>
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonHeader collapse="condense">
                    <IonToolbar></IonToolbar>
                </IonHeader>
                <IonTitle>Search for Routes</IonTitle>
                {/* Add a section to display routes */}
                {routes.map((route) => (
                    <div key={route.id}>
                        <h2>{route.routename}</h2>
                        <p>{route.description}</p>
                    </div>
                ))}
            </IonContent>
        </IonPage>
    );
};

export default SearchForRoute;