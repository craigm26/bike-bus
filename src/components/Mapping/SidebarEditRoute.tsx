import { IonButton, IonIcon, IonContent, IonLabel, IonToggle, IonGrid, IonRow, IonCol, IonText, IonPage } from '@ionic/react';
import { arrowForward, arrowBack, locateOutline, pulseOutline, addOutline, removeOutline } from 'ionicons/icons';
import { useState } from 'react';

type SidebarProps = {
    mapRef: React.RefObject<google.maps.Map | null>;
    bicyclingLayerEnabled: boolean;
    setBicyclingLayerEnabled: (value: boolean) => void;
    handleBicyclingLayerToggle: (enabled: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({
    mapRef,
    bicyclingLayerEnabled,
    setBicyclingLayerEnabled,
    handleBicyclingLayerToggle
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