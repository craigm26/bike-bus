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
import { collection, deleteDoc, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import ViewRouteMap from '../components/Mapping/ViewRouteMap';
import useAuth from "../useAuth";
import { GeoPoint } from 'firebase/firestore';
import { useParams, useHistory } from 'react-router-dom';

interface Coordinate {
    latitude: number;
    longitude: number;
    lat: number;
    lng: number;
}

interface Route {
    id: string;
    BikeBusGroupId: string;
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
    isBikeBus: boolean;
}

const ViewRoute: React.FC = () => {
    const { user } = useAuth();
    const history = useHistory();

    const { avatarUrl } = useAvatar(user?.uid);
    const headerContext = useContext(HeaderContext);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routes, setRoutes] = useState<Route[]>([]);
    const { id } = useParams<{ id: string }>();

    // retrieve the route from the database using the id from the url. 
    useEffect(() => {
        const getRoute = async () => {
            const routeRef = doc(db, 'routes', id);
            const routeSnapshot = await getDoc(routeRef);
            if (routeSnapshot.exists()) {
                const routeData = routeSnapshot.data();
                if (routeData) {
                    const route = {
                        id: routeSnapshot.id,
                        ...routeData
                    } as Route;
                    setSelectedRoute(route);
                }
            }
        };
        getRoute();
    }
        , [id]);

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


    const deleteRoute = async () => {
        if (selectedRoute) {
            const routeRef = doc(db, 'routes', selectedRoute.id);
            await deleteDoc(routeRef);
            goToRouteList();
        }
    };
    // go to the /viewroutelist/ page after deleting a route
    const goToRouteList = () => {
        history.push('/ViewRouteList');
    };

    console.log(selectedRoute)

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    {headerContext?.showHeader && <IonHeader></IonHeader>}
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonTitle>
                    {selectedRoute?.routeName}
                </IonTitle>
                <IonList>
                    <IonItem>
                        <IonLabel>Route Name: {selectedRoute?.routeName}</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Description: {selectedRoute?.description}</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>Travel Mode: {selectedRoute?.travelMode}</IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>
                            Starting Point: {selectedRoute?.startPointName}
                        </IonLabel>
                    </IonItem>
                    <IonItem>
                        <IonLabel>
                            Ending Point: {selectedRoute?.endPointName}
                        </IonLabel>
                    </IonItem>
                    <IonItem>BikeBus Group: {selectedRoute?.BikeBusGroupId}</IonItem>
                </IonList>
                <IonButton routerLink={`/EditRoute/${id}`}>Edit Route</IonButton>
                <IonButton onClick={deleteRoute}>Delete Route</IonButton>
                <IonButton onClick={goToRouteList}>Go to Route List</IonButton>
                <IonButton routerLink={`/CreateBikeBusGroup/${id}`}>Create BikeBus Group</IonButton>


                {selectedRoute && selectedRoute.startPoint && selectedRoute.endPoint && selectedRoute.pathCoordinates && (
  <>
    {console.log('startPoint:', selectedRoute.startPoint)}
    {console.log('endPoint:', selectedRoute.endPoint)}
    <ViewRouteMap
      path={selectedRoute.pathCoordinates.map(coordinate => new GeoPoint(coordinate.latitude, coordinate.longitude))}
      startGeo={new GeoPoint(selectedRoute.startPoint.latitude, selectedRoute.startPoint.longitude)}
      endGeo={new GeoPoint(selectedRoute.endPoint.latitude, selectedRoute.endPoint.longitude)}
      stations={[]}
    />
  </>
)}


            </IonContent >
        </IonPage >
    );

};

export default ViewRoute;
