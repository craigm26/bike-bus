import {
    IonItem,
    IonList,
    IonLabel,
    IonButton,
} from '@ionic/react';
import { useCallback, useContext, useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { HeaderContext } from "../components/HeaderContext";
import { DocumentReference, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import useAuth from "../useAuth";
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader, MarkerClusterer } from "@react-google-maps/api";
const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];




interface Coordinate {
    lat: number;
    lng: number;
}

interface BikeBus {
    id: string;
    accountType: string;
    description: string;
    endPoint: Coordinate;
    BikeBusRoutes: DocumentReference[];
    BikeBusCreator: string;
    BikeBusLeader: string;
    BikeBusName: string;
    BikeBusType: string;
    startPoint: Coordinate;
    travelMode: string;
}

interface Route {
    eventCheckInLeader: any;
    startPoint: { lat: number; lng: number };
    endPoint: { lat: number; lng: number };
    pathCoordinates: { lat: number; lng: number }[];
    startPointName: string;
    endPointName: string;
    startPointAddress: string;
    endPointAddress: string;
    routeName: string;
    routeType: string;
    routeCreator: string;
    routeLeader: string;
    description: string;
    travelMode: string;
    isBikeBus: boolean;
    BikeBusName: string;
    BikeBusStopName: string[];
    BikeBusStop: Coordinate[];
    BikeBusStops: Coordinate[];
    BikeBusStationsIds: string[];
    BikeBusGroup: DocumentReference;
    BikeBusStopIds: DocumentReference[];
    id: string;
    accountType: string;
    routeId: string;
    name: string;
  }

const BikeBusDirectory: React.FC = () => {
    const { user } = useAuth();
    const [accountType, setaccountType] = useState<string>('');
    const [BikeBus, setBikeBus] = useState<BikeBus[]>([]);
    const [route, setRoute] = useState<Route>();
    const [routeId, setRouteId] = useState<string>('');
    const [endPointAddress, setEndPointAddress] = useState<string>('');
    const [endPoint, setEndPoint] = useState<Coordinate>();
    const [cityGroups, setCityGroups] = useState<Record<string, BikeBus[]>>({});
    const [RouteArray, setRouteArray] = useState<Route[]>([]);



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

    const fetchBikeBus = useCallback(async () => {
        const uid = user?.uid;
    
        if (!uid) {
            return;
        }
    
        const BikeBusCollection = collection(db, 'bikebusgroups');
        const q = query(BikeBusCollection, where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user?.uid}`)));
        const querySnapshot = await getDocs(q);
    
        const BikeBusData: BikeBus[] = querySnapshot.docs.map(doc => ({
            ...doc.data() as BikeBus,
            id: doc.id,
        }));
        setBikeBus(BikeBusData);
    
        const RouteArrayTemp: Route[] = [];
    
        for (const bikeBusDoc of querySnapshot.docs) {
            const BikeBusRoutesRef = bikeBusDoc.data().BikeBusRoutes;
    
            if (Array.isArray(BikeBusRoutesRef)) {
                for (const routeRef of BikeBusRoutesRef) {
                    const routeDoc = await getDoc(routeRef as DocumentReference);
                    const Route = routeDoc.data() as Route;
                    RouteArrayTemp.push(Route);
                }
            }
        }
    
        setRouteArray(RouteArrayTemp);
    }, [user]);
    


    useEffect(() => {
        console.log(user);
        fetchBikeBus();
    }, [fetchBikeBus, user]);

    const extractCity = (address: string): string => {
        const parts = address?.split(",");
        if (parts && parts[1]) {
            return parts[1].trim();
        }
        return "Unknown City"; // fallback
    };
    

    console.log("RouteArray:", RouteArray);
    console.log("BikeBusArray:", BikeBus);

    console.log("Length of RouteArray:", RouteArray.length);
    console.log("Length of BikeBusArray:", BikeBus.length);



    const groupByCity = (BikeBusArray: BikeBus[], RouteArray: Route[]): Record<string, BikeBus[]> => {
        return BikeBusArray.reduce((acc: Record<string, BikeBus[]>, curr: BikeBus, index: number) => {
            const routeInfo = RouteArray[index];
            if (!routeInfo || !routeInfo.endPointAddress) {
                console.error(`Missing route info for index ${index}.`);
                return acc;
            }
            const city = extractCity(routeInfo.endPointAddress);
            if (!acc[city]) {
                acc[city] = [];
            }
            acc[city].push(curr);
            return acc;
        }, {});
    };
    

    const BikeBusByCity = groupByCity(BikeBus, RouteArray);

    return (
        <div>
            {Object.keys(BikeBusByCity).map((city, index) => (
                <div key={index}>
                    <h2>{city}</h2>
                    <IonList>
                        {BikeBusByCity[city].map((BikeBus) => (
                            <IonItem key={BikeBus.id}>
                                <IonLabel>{BikeBus.BikeBusName}</IonLabel>
                                <IonButton routerLink={`/bikebusgrouppage/${BikeBus.id}`}>
                                    View BikeBus
                                </IonButton>
                            </IonItem>
                        ))}
                    </IonList>
                </div>
            ))}
        </div>
    );
};

export default BikeBusDirectory;
