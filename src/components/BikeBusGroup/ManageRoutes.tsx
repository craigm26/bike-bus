import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCardContent, IonCardHeader, IonItem, IonButton, IonLabel, IonModal, IonCol, IonGrid, IonRow, IonText, IonSelect, IonSelectOption, IonCardSubtitle, IonIcon, IonList } from '@ionic/react';
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import useAuth from '../../useAuth';
import { useParams } from 'react-router-dom';
import { updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { star, starOutline } from 'ionicons/icons';




const ManageRoutes: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [groupData, setGroupData] = useState<any>();
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const getGroupData = async () => {
      const groupRef = doc(db, 'bikebusgroups', id);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        setGroupData(groupSnap.data());
        const routesPromises = groupSnap.data().BikeBusRoutes.map(async (route: any) => {
          const routeRef = doc(db, 'routes', route.id);
          return getDoc(routeRef);
        });

        const routesSnaps = await Promise.all(routesPromises);
        const fetchedRoutes = routesSnaps.map(snap => {
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        }).filter(Boolean);

        setRoutes(fetchedRoutes);
      }
    };
    getGroupData();
  }, [id]);

  const deleteRoute = async (routeId: string) => {
    const groupRef = doc(db, 'bikebusgroups', id);
    const routeRef = doc(db, 'routes', routeId);
    await updateDoc(groupRef, {
      BikeBusRoutes: arrayRemove(routeRef)
    });
    // Remove the BikeBusGroup field data from the route
    await updateDoc(routeRef, {
      BikeBusName: '',
      BikeBusGroupId: '',
      isBikeBus: false
    });
  };

  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();

  useEffect(() => {
    const fetchAvailableRoutes = async () => {
      if (user?.uid) {
        const routeCreatorPath = `/users/${user.uid}`;
        const q = query(collection(db, 'routes'), where('routeCreator', '==', routeCreatorPath));

        const querySnapshot = await getDocs(q);
        const routes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setAvailableRoutes(routes);
      }
    };

    fetchAvailableRoutes();
  }, [user?.uid]);

  const addRoute = async () => {
    if (selectedRouteId) {
      const groupRef = doc(db, 'bikebusgroups', id);
      const routeRef = doc(db, 'routes', selectedRouteId);
      await updateDoc(groupRef, {
        BikeBusRoutes: arrayUnion(routeRef)
      });
      const routeDoc = await getDoc(routeRef);
      const routeData = routeDoc.data();
      if (routeData) {
        await updateDoc(routeRef, {
          BikeBusName: groupData.BikeBusName,
          BikeBusGroup: groupRef,
          isBikeBus: true
        });
      }
      setShowModal(false); // Close modal after adding
    }
  };

  // for the primary route designation, we want to update the BikeBusGroup document to have a primaryRoute field and set it to the route id as a document reference
  // we also want to update the route document to have a isPrimaryRoute field set to true
  // we also want to update the current primary route to have isPrimaryRoute set to false
  const makePrimaryRouteFunction = async (routeId: string) => {
    const groupRef = doc(db, 'bikebusgroups', id);
    const routeRef = doc(db, 'routes', routeId);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      const groupData = groupSnap.data();
      if (groupData) {
        await updateDoc(groupRef, {
          primaryRoute: routeRef
        });
      }
    }
  }
  // we also want to update the route document to have a isPrimaryRoute field set to true
  const updateRoute = async (routeId: string) => {
    const routeRef = doc(db, 'routes', routeId);
    const routeSnap = await getDoc(routeRef);
    if (routeSnap.exists()) {
      const routeData = routeSnap.data();
      if (routeData) {
        await updateDoc(routeRef, {
          isPrimaryRoute: true
        });
      }
    }
  }
  // we also want to update the current primary route to have isPrimaryRoute set to false
  const updateCurrentPrimaryRoute = async (routeId: string) => {
// look up the current primary route in the bikebusgroup document and set it to false
    const groupRef = doc(db, 'bikebusgroups', id);
    const groupSnap = await getDoc(groupRef);
    if (groupSnap.exists()) {
      const groupData = groupSnap.data();
      if (groupData) {
        const currentPrimaryRoute = groupData.primaryRoute;
        if (currentPrimaryRoute) {
          await updateDoc(currentPrimaryRoute, {
            isPrimaryRoute: false
          });
        }
      }
    }
  }

  // now that we have all three functions for when to make a route the primary route, we can call them in the makePrimaryRoute function
  const makePrimaryRoute = async (routeId: string) => {
    makePrimaryRouteFunction(routeId);
    updateRoute(routeId);
    updateCurrentPrimaryRoute(routeId);
  }


   



  return (
    <IonPage className="ion-flex-offset-app">
      <IonContent fullscreen>
        <IonCardHeader>
          <IonGrid>
            <IonRow>
              <IonCol>
                <IonButton size="large" color="light" routerLink={`/bikebusgrouppage/${id}`}>{groupData?.BikeBusName}</IonButton>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol><strong>Route Name</strong></IonCol>
              <IonCol><strong>Distance</strong></IonCol>
              <IonCol><strong>Duration</strong></IonCol>
              <IonCol><strong>Start Point</strong></IonCol>
              <IonCol><strong>End Point</strong></IonCol>
              <IonCol><strong>Actions</strong></IonCol>
            </IonRow>
            {routes.map((route, index) => (
              <IonRow key={index}>
                <IonCol>{route.routeName}</IonCol>
                <IonCol>{route.distance} miles</IonCol>
                <IonCol>{route.duration} mins</IonCol>
                <IonCol>{route.startPointName}</IonCol>
                <IonCol>{route.endPointName}</IonCol>
                <IonCol>
                <IonButton routerLink={`/EditRoute/${route.id}`} color="primary" size="small">Edit Route</IonButton>
                <IonButton color="secondary" size="small" onClick={() => makePrimaryRoute(route.id)}>
                  Make Primary
                </IonButton>
                {groupData.primaryRoute && groupData.primaryRoute === route.id ? (
                  <IonIcon icon={star} color="warning" />
                ) : (
                  <IonIcon icon={starOutline} />
                )}
                <IonButton routerLink={`/ViewRoute/${route.id}`} color="tertiary" size="small">View Route</IonButton>
                <IonButton color="danger" size="small" onClick={() => deleteRoute(route.id)}>Remove from BikeBus</IonButton>
              </IonCol>
              </IonRow>
            ))}
            <IonRow>
              <IonCol>
                <IonButton color="success" expand="block" onClick={() => setShowModal(true)}>Add Route to Group</IonButton>

                <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                  <IonHeader>
                    <IonToolbar color="primary">
                      <IonTitle>Add Route to Group</IonTitle>
                      <IonButton fill="clear" slot="end" onClick={() => setShowModal(false)}>
                        <IonIcon slot="icon-only" name="close"></IonIcon>
                      </IonButton>
                    </IonToolbar>
                  </IonHeader>
                  <IonContent className="ion-padding">
                    <IonText color="medium">
                      <p>Select a route you've created to add it to the BikeBus group. You can only add routes you own.</p>
                    </IonText>
                    <IonButton expand="block" color="primary" routerLink="/Map">Go to Map to create a Route</IonButton>
                    <IonList>
                      <IonItem>
                        <IonLabel>Route:</IonLabel>
                        <IonSelect value={selectedRouteId} placeholder="Select One" onIonChange={e => setSelectedRouteId(e.detail.value)}>
                          {availableRoutes.map(route => (
                            <IonSelectOption key={route.id} value={route.id}>{route.routeName}</IonSelectOption>
                          ))}
                        </IonSelect>
                      </IonItem>
                    </IonList>
                    <div className="ion-padding-top">
                      <IonButton expand="block" onClick={addRoute} color="success">Add Route</IonButton>
                      <IonButton expand="block" color="medium" onClick={() => setShowModal(false)}>Cancel</IonButton>
                    </div>
                  </IonContent>
                </IonModal>

              </IonCol>
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonContent >
    </IonPage >
  );
};


export default ManageRoutes;
