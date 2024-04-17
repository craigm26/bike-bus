import { IonButton, IonIcon, IonContent, IonLabel, IonToggle, IonRow, IonCol, IonGrid, IonCardSubtitle, IonSegment, IonSegmentButton, IonCheckbox, IonImg } from '@ionic/react';
import { arrowForward, arrowBack, sunny } from 'ionicons/icons';
import { useState } from 'react';

type SidebarProps = {
    mapRef: React.RefObject<google.maps.Map | null>;
    bicyclingLayerEnabled: boolean;
    setBicyclingLayerEnabled: (value: boolean) => void;
    handleBicyclingLayerToggle: (enabled: boolean) => void;
    setRouteLegsEnabled: (value: boolean) => void;
    routeLegsEnabled: boolean;
    timingSidebarEnabled: boolean;
    setTimingSidebarEnabled: (value: boolean) => void;
    weatherForecastEnabled: boolean;
    setWeatherForecastEnabled: (value: boolean) => void;
};

const SidebarEvent: React.FC<SidebarProps> = ({
    mapRef,
    bicyclingLayerEnabled,
    setBicyclingLayerEnabled,
    handleBicyclingLayerToggle,
    setRouteLegsEnabled,
    routeLegsEnabled,
    timingSidebarEnabled,
    setTimingSidebarEnabled,
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
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Route Legs</IonLabel>
                        </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={routeLegsEnabled}
                                onIonChange={e => setRouteLegsEnabled(e.detail.checked)}
                            />
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol>
                            <IonLabel>Timing Sidebar</IonLabel>
                        </IonCol>
                        <IonCol>
                            <IonCheckbox
                                checked={timingSidebarEnabled}
                                onIonChange={e => setTimingSidebarEnabled(e.detail.checked)}
                            />
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
                    </IonRow>
                </IonGrid>
            </IonContent>
        </div>
    );
}


export default SidebarEvent;
