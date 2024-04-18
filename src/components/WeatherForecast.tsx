import { useEffect, useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonItem, IonModal, IonSegment, IonSegmentButton, IonSpinner, IonText } from '@ionic/react';
import { Timestamp } from 'firebase/firestore';

const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;

type WeatherForecastProps = {
    lat: number;
    lng: number;
    startTimestamp: Timestamp;
    weatherForecastType: 'current' | 'hourly' | 'daily';
};

const WeatherForecast: React.FC<WeatherForecastProps> = ({ lat, lng, startTimestamp, weatherForecastType }) => {
    const [forecasts, setForecasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [forecastType, setForecastType] = useState<'current' | 'hourly' | 'daily'>(weatherForecastType);
    const [useImperial, setUseImperial] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [detailedForecast, setDetailedForecast] = useState<any>(null);

    const handleForecastSelect = (forecast: any) => {
        setDetailedForecast(forecast);
        setShowModal(true);
    };

    const toggleUnits = () => {
        setUseImperial(!useImperial);
    };

    const convertTemperature = (kelvin: number) => {
        return useImperial ? `${((kelvin - 273.15) * 9 / 5 + 32).toFixed(2)}°F` : `${(kelvin - 273.15).toFixed(2)}°C`;
    };

    const convertSpeed = (metersPerSecond: number) => {
        return useImperial ? `${(metersPerSecond * 2.23694).toFixed(2)} mph` : `${metersPerSecond.toFixed(2)} m/s`;
    };

    const convertVisibility = (meters: number) => {
        return useImperial ? `${(meters * 3.28084).toFixed(2)} feet` : `${meters.toFixed(2)} meters`;
    };

    const getCardinalDirection = (angle: number) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
        return directions[index];
    };

    const convertWindDirection = (degrees: any) => {
        return getCardinalDirection(degrees);
    };

    const fetchForecastData = async () => {
        if (!startTimestamp) {
            console.error('startTimestamp is undefined.');
            setLoading(false);
            setError('startTimestamp is undefined.');
            return;
        }
    
        setLoading(true);
        setError(null);
    
        // No need to call toDate().getTime(), toMillis() will give you the timestamp in milliseconds.
        const startTime = startTimestamp.toMillis();
        console.log('Fetching forecast data:', lat, lng, forecastType, startTime);
        const endpointMap = {
            'current': 'weather',
            'hourly': 'forecast',
            'daily': 'forecast/daily'
        };
        const baseUrl = `https://api.openweathermap.org/data/2.5/${endpointMap[forecastType]}?lat=${lat}&lon=${lng}&appid=${API_KEY}`;

        const eventStartHour = startTimestamp.toDate().getHours();
        const eventStartMinutes = startTimestamp.toDate().getMinutes();

        try {
            const response = await fetch(baseUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            let relevantForecasts = data.list || [data]; // Handle different data structure for different endpoints

            if (forecastType === 'hourly') {
                relevantForecasts = relevantForecasts.filter((forecast: any) => {
                    const forecastDate = new Date(forecast.dt * 1000);
                    console.log(`Forecast time: ${forecastDate.toLocaleTimeString()}, for date: ${forecastDate.toLocaleDateString()}`);
                    return forecastDate.getHours() >= eventStartHour;
                });

                relevantForecasts = relevantForecasts.length > 0 ? [relevantForecasts[0]] : [];

            } 

            if (forecastType === 'daily') {
                relevantForecasts = relevantForecasts.filter((forecast: any) => {
                    const forecastDate = new Date(forecast.dt * 1000);
                    console.log(`Forecast time: ${forecastDate.toLocaleTimeString()}, for date: ${forecastDate.toLocaleDateString()}`);
                    return forecastDate.getHours() >= eventStartHour;
                });
            }


            setForecasts(relevantForecasts);
            console.log('Forecast data:', relevantForecasts);
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check if startTimestamp is defined before calling fetchForecastData
        if (startTimestamp) {
            fetchForecastData();
        } else {
            console.error('startTimestamp is undefined. Cannot fetch forecast data.');
            setLoading(false);
            setError('startTimestamp is undefined.');
        }
    }, [lat, lng, forecastType, startTimestamp]);

    if (loading) {
        return <IonSpinner />;
    }

    if (error || forecasts.length === 0) {
        return <IonText>{error || 'No forecast data available.'}</IonText>;
    }

    return (
        <div style={{ padding: '5px', maxWidth: '800px', margin: 'auto' }}>
            <IonCard style={{ marginBottom: '10px' }}>
                {forecasts.map((forecast, index) => (
                    <IonCardContent key={index} style={{ marginBottom: '20px', padding: '10px' }}>
                        <IonCardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <IonCardSubtitle>
                                {new Intl.DateTimeFormat('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }).format(new Date(forecast.dt * 1000))}
                            </IonCardSubtitle>
                            <img src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`} alt="weather icon" style={{ width: '50px' }} />
                            <IonCardSubtitle>{forecast.weather[0].main}</IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <IonText>
                                    <strong>Temp:</strong> {convertTemperature(forecast.main.temp)} <br />
                                </IonText>
                                <IonText>
                                    <strong>Wind:</strong> {convertSpeed(forecast.wind.speed)} from {convertWindDirection(forecast.wind.deg)}
                                </IonText>
                                {forecast.rain && (
                                    <IonText>
                                        <strong>Rain:</strong> {forecast.rain['3h']} mm in last 3 hours
                                    </IonText>
                                )}
                                <IonItem>
                                    <IonButton fill="outline" shape="round" size="small" onClick={toggleUnits}>Toggle Units</IonButton>
                                    <IonButton fill="outline" shape="round" size="small" onClick={() => handleForecastSelect(forecast)}>Details</IonButton>
                                </IonItem>
                            </div>
                        </IonCardContent>
                    </IonCardContent>

                ))}
            </IonCard>
            <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                <IonSegment value={forecastType} onIonChange={(e) => setForecastType(e.detail.value as 'current' | 'hourly')}>
                    <IonSegmentButton value="current">Current</IonSegmentButton>
                    <IonSegmentButton value="hourly">3-hour</IonSegmentButton>
                </IonSegment>
                {forecasts.map((forecast, index) => (
                    <IonCardContent key={index} style={{ marginBottom: '20px', padding: '10px' }}>
                        <IonCardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <IonCardSubtitle>
                                {new Intl.DateTimeFormat('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                }).format(new Date(forecast.dt * 1000))}
                            </IonCardSubtitle>
                            <img src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`} alt="weather icon" style={{ width: '50px' }} />
                            <IonCardSubtitle>{forecast.weather[0].main}</IonCardSubtitle>
                        </IonCardHeader>
                        <IonCardContent style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <IonText>
                                    <strong>Temp:</strong> {convertTemperature(forecast.main.temp)} <br />
                                    <strong>Feels like:</strong> {convertTemperature(forecast.main.feels_like)}
                                </IonText>
                                <IonText>
                                    <strong>Humidity:</strong> {forecast.main.humidity}% <br />
                                    <strong>Pressure:</strong> {forecast.main.pressure} hPa
                                </IonText>
                                <IonText>
                                    <strong>Wind:</strong> {convertSpeed(forecast.wind.speed)} from {convertWindDirection(forecast.wind.deg)}
                                </IonText>
                                {forecast.rain && (
                                    <IonText>
                                        <strong>Rain:</strong> {forecast.rain['3h']} mm in last 3 hours
                                    </IonText>
                                )}
                                <IonText>
                                    <strong>Visibility:</strong> {convertVisibility(forecast.visibility)}
                                </IonText>
                                <IonText>
                                    <strong>Cloudiness:</strong> {forecast.clouds.all}% <br />
                                </IonText>
                                <IonButton fill="outline" shape="round" size="small" onClick={toggleUnits}>Toggle Units</IonButton>
                            </div>
                        </IonCardContent>
                    </IonCardContent>
                ))}
                <IonButton onClick={() => setShowModal(false)}>Close</IonButton>
            </IonModal>
        </div>
    );
}

export default WeatherForecast;
