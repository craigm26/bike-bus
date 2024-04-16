import { IonButton, IonIcon, IonContent, IonLabel, IonToggle, IonRow, IonCol, IonCheckbox, IonSegment, IonSegmentButton, IonCardSubtitle, IonGrid, IonImg } from '@ionic/react';
import { arrowForward, arrowBack, bicycleOutline, sunny } from 'ionicons/icons';
import { useState } from 'react';

type SidebarProps = {
    mapRef: React.RefObject<google.maps.Map | null>;
    getLocation: () => void;
    bikeBusEnabled: boolean;
    userRoutesEnabled: boolean;
    setBikeBusEnabled: (value: boolean) => void;
    setUserRoutesEnabled: (value: boolean) => void;
    openTripsEnabled: boolean;
    setOpenTripsEnabled: (value: boolean) => void;
    bicyclingLayerEnabled: boolean;
    setBicyclingLayerEnabled: (value: boolean) => void;
    handleBicyclingLayerToggle: (enabled: boolean) => void;
    weatherForecastEnabled: boolean;
    setWeatherForecastEnabled: (value: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({
    mapRef,
    getLocation,
    bikeBusEnabled,
    setBikeBusEnabled,
    userRoutesEnabled,
    setUserRoutesEnabled,
    openTripsEnabled,
    setOpenTripsEnabled,
    bicyclingLayerEnabled,
    setBicyclingLayerEnabled,
    handleBicyclingLayerToggle,
    weatherForecastEnabled,
    setWeatherForecastEnabled,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleSetMapType = (mapTypeId: google.maps.MapTypeId) => {
        if (mapRef.current) {
            mapRef.current.setMapTypeId(mapTypeId);
        }
    };

    return (
        <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            <IonButton onClick={toggleSidebar} className="toggle-button">
                <IonIcon size="large" icon={isOpen ? arrowBack : arrowForward} />
            </IonButton>
            <IonContent className="sidebar-content">
                <IonGrid>
                    <IonRow>
                        <IonCardSubtitle>Map Options</IonCardSubtitle>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Map Type</IonLabel>
                            <IonSegment onIonChange={e => handleSetMapType(e.detail.value as google.maps.MapTypeId)}>
                                <IonSegmentButton value={google.maps.MapTypeId.ROADMAP}>Roadmap</IonSegmentButton>
                                <IonSegmentButton value={google.maps.MapTypeId.SATELLITE}>Satellite</IonSegmentButton>
                                <IonSegmentButton value={google.maps.MapTypeId.HYBRID}>Hybrid</IonSegmentButton>
                                <IonSegmentButton value={google.maps.MapTypeId.TERRAIN}>Terrain</IonSegmentButton>
                            </IonSegment>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>
                                BikeBus
                            </IonLabel>
                        </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={bikeBusEnabled}
                                onIonChange={e => setBikeBusEnabled(e.detail.checked)}
                            />
                        </IonCol>
                        <IonCol>
                            <IonImg src="assets/images/SideContainer/BikeBus.png" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Routes</IonLabel>
                            </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={userRoutesEnabled}
                                onIonChange={e => setUserRoutesEnabled(e.detail.checked)}
                            />
                        </IonCol>
                        <IonCol>
                            <IonImg src="assets/images/SideContainer/Route.png" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Active Open Trips</IonLabel>
                        </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={openTripsEnabled}
                                onIonChange={e => setOpenTripsEnabled(e.detail.checked)}
                            />
                        </IonCol>
                        <IonCol>
                            <IonImg src="assets/images/SideContainer/ActiveOpenTrip.png" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Bicycling Layer</IonLabel>
                            </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={bicyclingLayerEnabled}
                                onIonChange={(e) => {
                                    const enabled = e.detail.checked;
                                    setBicyclingLayerEnabled(enabled);
                                    handleBicyclingLayerToggle(enabled);
                                }}
                            />
                        </IonCol>
                        <IonCol>
                            <IonImg src="assets/images/SideContainer/BicyclingLayer.png" />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Weather Forecast</IonLabel>
                        </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={weatherForecastEnabled}
                                onIonChange={e => setWeatherForecastEnabled(e.detail.checked)}
                            />
                        </IonCol>
                        <IonCol>
                            <IonIcon icon={sunny}></IonIcon>
                        </IonCol>
                           
                    </IonRow>
                </IonGrid>
            </IonContent >
        </div >
    );
};

export default Sidebar;
