import { IonButton, IonIcon, IonContent, IonLabel, IonToggle, IonGrid, IonRow, IonCol, IonText, IonPage } from '@ionic/react';
import { arrowForward, arrowBack, locateOutline, pulseOutline, addOutline, removeOutline } from 'ionicons/icons';
import { useState } from 'react';

type SidebarProps = {
    mapRef: React.RefObject<google.maps.Map | null>;
    getLocation: () => void;
    bikeBusEnabled: boolean;
    setBikeBusEnabled: (value: boolean) => void;
    openTripsEnabled: boolean;
    setOpenTripsEnabled: (value: boolean) => void;
    bicyclingLayerEnabled: boolean;
    setBicyclingLayerEnabled: (value: boolean) => void;
    handleBicyclingLayerToggle: (enabled: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({
    mapRef,
    getLocation,
    bikeBusEnabled,
    setBikeBusEnabled,
    openTripsEnabled,
    setOpenTripsEnabled,
    bicyclingLayerEnabled,
    setBicyclingLayerEnabled,
    handleBicyclingLayerToggle
}) => {
    const [isOpen, setIsOpen] = useState(false);
    console.log('Sidebar render');

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
        console.log('toggleSidebar');
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
                    <IonText>Map Options</IonText>
                </div>
                <div>
                    <div className="zoom-controls">
                        <IonLabel>Zoom</IonLabel>
                        <IonButton onClick={handleZoomIn}>
                            <IonIcon icon={addOutline} />
                        </IonButton>
                        <IonButton onClick={handleZoomOut}>
                            <IonIcon icon={removeOutline} />
                        </IonButton>
                    </div>
                    <div className="map-type-controls">
                        <IonLabel>Map Type</IonLabel>
                        <IonButton onClick={() => handleSetMapType(google.maps.MapTypeId.ROADMAP)}>Roadmap</IonButton>
                        <IonButton onClick={() => handleSetMapType(google.maps.MapTypeId.SATELLITE)}>Satellite</IonButton>
                        <IonButton onClick={() => handleSetMapType(google.maps.MapTypeId.HYBRID)}>Hybrid</IonButton>
                        <IonButton onClick={() => handleSetMapType(google.maps.MapTypeId.TERRAIN)}>Terrain</IonButton>
                    </div>
                    <IonRow>
                        <IonCol>
                            <IonLabel>BikeBus</IonLabel>
                            <IonToggle checked={bikeBusEnabled} onIonChange={e => setBikeBusEnabled(e.detail.checked)} />
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
                </div>
            </div>
            </IonContent>
        </div>
    );
};

export default Sidebar;