import { useEffect, useState } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonSegment, IonSegmentButton, IonSpinner, IonText } from '@ionic/react';
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
    const startTime = startTimestamp.toDate().getTime();

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
        setLoading(true);
        setError(null);
    
        const excludeData = ['current', 'minutely', 'hourly', 'daily', 'alerts'].filter(x => x !== forecastType).join(',');
    
        const baseUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=${excludeData}&appid=${API_KEY}&units=metric`;
        console.log('baseUrl:', baseUrl);
    
        try {
            const response = await fetch(baseUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
    
            // Filter data if necessary based on startTime for hourly and daily forecasts
            let relevantForecasts = [];
            if (forecastType === 'hourly') {
                relevantForecasts = data.hourly.filter((forecast: { dt: number; }) => {
                    const forecastTime = new Date(forecast.dt * 1000).getTime();
                    return forecastTime >= startTime && forecastTime <= startTime + 3 * 3600 * 1000; // 3 hours range
                });
            } else if (forecastType === 'daily') {
                relevantForecasts = data.daily.filter((forecast: { dt: number; }) => {
                    const forecastTime = new Date(forecast.dt * 1000).getTime();
                    return forecastTime >= startTime && forecastTime <= startTime + 24 * 3600 * 1000; // 24 hours range
                });
            } else {
                relevantForecasts = [data.current];
            }
    
            setForecasts(relevantForecasts);
        } catch (error) {
            console.error('Error fetching forecast data:', error);
        } finally {
            setLoading(false);
        }
    };
    

    useEffect(() => {
        fetchForecastData();
    }, [lat, lng, forecastType, startTimestamp]);

    if (loading) {
        return <IonSpinner />;
    }

    if (error || forecasts.length === 0) {
        return <IonText>{error || 'No forecast data available.'}</IonText>;
    }

    return (
        <div style={{ padding: '10px', maxWidth: '800px', margin: 'auto' }}>
            <IonCard>
            <IonSegment value={forecastType} onIonChange={(e) => setForecastType(e.detail.value as 'current' | 'hourly' | 'daily')}>
                <IonSegmentButton value="current">Current</IonSegmentButton>
                <IonSegmentButton value="hourly">Hourly</IonSegmentButton>
                <IonSegmentButton value="daily">Daily</IonSegmentButton>
            </IonSegment>
            {forecasts.map((forecast, index) => (
                <IonCardContent key={index} style={{ marginBottom: '20px', padding: '10px' }}>
                    <IonCardHeader style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonCardSubtitle>{forecast.dt_txt || new Date(forecast.dt * 1000).toLocaleString()}</IonCardSubtitle>
                        <img src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png`} alt="weather icon" style={{ width: '50px' }} />
                        <IonCardSubtitle>{forecast.weather[0].main}</IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                            <IonButton fill="outline" shape="round" size="small" onClick={toggleUnits}>Toggle Units</IonButton>
                        </div>
                    </IonCardContent>
                </IonCardContent>
            ))}
            </IonCard>
        </div>
    );
}

export default WeatherForecast;
