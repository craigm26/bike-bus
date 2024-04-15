import { IonButton, IonIcon, IonContent, IonLabel, IonToggle, IonRow, IonCol } from '@ionic/react';
import { arrowForward, arrowBack } from 'ionicons/icons';
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

    const handleZoomIn = () => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom() || 0;
            mapRef.current.setZoom(currentZoom + 1);
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current) {
            const currentZoom = mapRef.current.getZoom() || 0;
            mapRef.current.setZoom(currentZoom - 1);
        }
    };

    const handleSetMapType = (mapTypeId: google.maps.MapTypeId) => {
        if (mapRef.current) {
            mapRef.current.setMapTypeId(mapTypeId);
        }
    };

    return (
        <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
            <IonButton onClick={toggleSidebar} className="toggle-button">
                <IonIcon icon={isOpen ? arrowBack : arrowForward} />
            </IonButton>
            <IonContent className="sidebar-content">
                <div className="content-wrapper">
                    <div>
                        <IonLabel>Map Options</IonLabel>
                    </div>
                    <div>
                        <div className="map-type-controls">
                            <IonLabel>Map Type</IonLabel>
                            <IonButton size="small" onClick={() => handleSetMapType(google.maps.MapTypeId.ROADMAP)}>Roadmap</IonButton>
                            <IonButton size="small" onClick={() => handleSetMapType(google.maps.MapTypeId.SATELLITE)}>Satellite</IonButton>
                            <IonButton size="small" onClick={() => handleSetMapType(google.maps.MapTypeId.HYBRID)}>Hybrid</IonButton>
                            <IonButton size="small" onClick={() => handleSetMapType(google.maps.MapTypeId.TERRAIN)}>Terrain</IonButton>
                        </div>
                        <IonRow>
                            <IonCol>
                                <IonLabel>BikeBus</IonLabel>
                                <IonToggle checked={bikeBusEnabled} onIonChange={e => setBikeBusEnabled(e.detail.checked)} />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonLabel>Routes</IonLabel>
                                <IonToggle checked={userRoutesEnabled} onIonChange={e => setUserRoutesEnabled(e.detail.checked)} />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonLabel>Open Trips</IonLabel>
                                <IonToggle checked={openTripsEnabled} onIonChange={e => setOpenTripsEnabled(e.detail.checked)} />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonLabel>Bicycling Layer</IonLabel>
                                <IonToggle
                                    checked={bicyclingLayerEnabled}
                                    onIonChange={(e) => {
                                        const enabled = e.detail.checked;
                                        setBicyclingLayerEnabled(enabled);
                                        handleBicyclingLayerToggle(enabled);
                                    }}
                                />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol>
                                <IonLabel>Weather Forecast</IonLabel>
                                <IonToggle
                                    checked={weatherForecastEnabled}
                                    onIonChange={e => setWeatherForecastEnabled(e.detail.checked)}
                                />
                            </IonCol>
                        </IonRow>
                    </div>
                </div>
            </IonContent>
        </div>
    );
};

export default Sidebar;
