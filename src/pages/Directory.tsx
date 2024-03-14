import { IonPage, IonContent, IonCardHeader, IonTitle, IonCard, IonCardContent, IonCardTitle, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonAccordionGroup, IonAccordion, IonHeader, IonToolbar } from "@ionic/react";
import React, { useCallback, useEffect, useState } from "react";
import useAuth from "../useAuth";
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc, query, where, DocumentReference } from 'firebase/firestore';
import { useHistory } from "react-router-dom";

interface BikeBus extends Route {
    BikeBusName: any;
    BikeBusRoutes: DocumentReference[];
    BikeBusDescription: any;
    BikeBusType: any;
    travelMode: any;
    AdditionalInformation: any;
    pathCoordinates: any;
    id: string;
    primaryRoute: DocumentReference;
}

interface Route {
    BikeBusDescription: string;
    RouteName: any;
    RouteDescription: any;
    RouteType: any;
    RouteCreator: any;
    RouteBikeBus: any;
    RouteStartPoint: any;
    endPoint: any;
    endPointAddress: string;
    BikeBusName: any;
    RoutePathCoordinates: any;
    id: string;
}

interface GroupedRoutes {
    [key: string]: Route[]; // key is 'City, State'

}

const Directory: React.FC = () => {
    const { user } = useAuth();
    const [accountType, setaccountType] = useState<string>('');
    const history = useHistory();


    const [groupedRoutes, setGroupedRoutes] = useState<GroupedRoutes>({});
    const [cityStateKeys, setCityStateKeys] = useState<string[]>([]);


    const goToBikeBusGroupPage = (id: string) => {
        history.push(`/bikebusgrouppage/${id}`);
    };

    const getCityState = (address: string) => {
        if (!address) {
            console.error('Address is undefined.');
            return 'Unknown Location';
        }
        const parts = address.split(',').map(part => part.trim());
        const country = parts[parts.length - 1];
        let city, state;

        if (country === "USA") {
            city = parts[parts.length - 3];
            state = parts[parts.length - 2].split(' ')[0];
        } else if (country === "UK") {
            city = parts[parts.length - 2];
            state = "UK"; // Since UK addresses don't have a state, you might use UK or some other logic
        } else {
            // Handle other countries or default case
            city = parts[parts.length - 2];
            state = parts[parts.length - 1];
        }

        return city && state ? `${city}, ${state}` : 'Unknown Location';
    };


    const fetchBikeBusAndRoutes = useCallback(async () => {
        if (!user?.uid) return;

        const BikeBusCollection = collection(db, 'bikebusgroups');
        const BikeBusSnapshot = await getDocs(BikeBusCollection);
        const BikeBusData = BikeBusSnapshot.docs.map(doc => ({ ...(doc.data() as BikeBus), id: doc.id }));

        const newGroupedRoutes: GroupedRoutes = {};
        let cityStateSet = new Set<string>();

        for (const bikeBus of BikeBusData) {
            let route: Route | undefined;

            // If primaryRoute is set, use it, otherwise, take the first route from BikeBusRoutes array
            if (bikeBus.primaryRoute) {
                const primaryRouteDoc = await getDoc(bikeBus.primaryRoute);
                route = primaryRouteDoc.exists() ? (primaryRouteDoc.data() as Route) : undefined;
            } else if (bikeBus.BikeBusRoutes.length > 0) {
                const routeDoc = await getDoc(bikeBus.BikeBusRoutes[0]);
                route = routeDoc.exists() ? (routeDoc.data() as Route) : undefined;
            }

            // If a route is found, process it
            if (route) {
                const cityState = getCityState(route.endPointAddress);
                cityStateSet.add(cityState);

                if (!newGroupedRoutes[cityState]) {
                    newGroupedRoutes[cityState] = [];
                }

                newGroupedRoutes[cityState].push({
                    ...bikeBus,
                    RouteName: route.RouteName,
                    RouteDescription: route.RouteDescription
                });
            } else {
                // Handle BikeBus without routes
                const noRouteKey = 'BikeBus without Routes';
                cityStateSet.add(noRouteKey);

                if (!newGroupedRoutes[noRouteKey]) {
                    newGroupedRoutes[noRouteKey] = [];
                }

                newGroupedRoutes[noRouteKey].push(bikeBus);
            }
        }

        setCityStateKeys(Array.from(cityStateSet));
        setGroupedRoutes(newGroupedRoutes);

    }, [user?.uid]);


    useEffect(() => {
        fetchBikeBusAndRoutes();
    }, [fetchBikeBusAndRoutes]);


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
        <IonPage className="ion-flex-offset-app">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Directory</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonList>
                    <IonAccordionGroup>
                        {cityStateKeys.map(cityState => (
                            <IonAccordion key={cityState}>
                                <IonItem slot="header">
                                    <IonLabel>{cityState}</IonLabel>
                                </IonItem>
                                <IonList slot="content">
                                    {groupedRoutes[cityState]?.map(bikeBus => (
                                        <IonItem key={bikeBus.id} button onClick={() => goToBikeBusGroupPage(bikeBus.id)}>
                                            <IonLabel>
                                                <h2>{bikeBus.BikeBusName}</h2>
                                                <p>{bikeBus.BikeBusDescription}</p>
                                            </IonLabel>
                                        </IonItem>
                                    ))}
                                </IonList>
                            </IonAccordion>
                        ))}
                    </IonAccordionGroup>
                </IonList>
            </IonContent>
        </IonPage>
    );
};

export default Directory;
