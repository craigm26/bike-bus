import { IonContent, IonText, IonSpinner, IonImg, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';

type WeatherForecastProps = {
    lat: number;
    lng: number;
    weatherForecastType: 'current' | 'hourly' | 'daily';
    startTimestamp: Timestamp;
};

const WeatherForecast: React.FC<WeatherForecastProps> = ({
    lat,
    lng,
    weatherForecastType,
    startTimestamp,
}) => {
    const [forecasts, setForecasts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchForecastUrls = async () => {
        const baseUrl = `https://api.weather.gov/points/${lat},${lng}`;
        try {
            const response = await fetch(baseUrl, {
                headers: { 'User-Agent': 'BikeBusApp/1.0 (craigm26@gmail.com)' }
            });
            if (!response.ok) throw new Error('Failed to fetch forecast URLs');
            const data = await response.json();
            return {
                currentForecastUrl: data.properties.forecastcurrent,
                hourlyForecastUrl: data.properties.forecastHourly,
                dailyForecastUrl: data.properties.forecast
            };
        } catch (error) {
            setError("Error fetching forecast URLs");
            setLoading(false);
            console.error("Error fetching forecast URLs: ", error);
            return null;
        }
    };

    const fetchForecastData = async (forecastUrl: string) => {
        try {
            const response = await fetch(forecastUrl, {
                headers: { 'User-Agent': 'BikeBusApp/1.0 (craigm26@gmail.com)' }
            });
            if (!response.ok) throw new Error(`Failed to fetch ${weatherForecastType} forecast data`);
            const forecastData = await response.json();
            console.log(forecastData);
            return forecastData.properties.periods;
        } catch (error) {
            setError(`Error fetching ${weatherForecastType} forecast`);
            setLoading(false);
            console.error(`Error fetching ${weatherForecastType} forecast: `, error);
            return [];
        }
    };
    useEffect(() => {
        const fetchForecasts = async () => {
            setLoading(true);
            setError(null);

            try {
                const forecastUrls = await fetchForecastUrls();
                if (forecastUrls) {
                    let forecastUrl = '';
                    switch (weatherForecastType) {
                        case 'current':
                            forecastUrl = forecastUrls.currentForecastUrl;
                            break;
                        case 'hourly':
                            forecastUrl = forecastUrls.hourlyForecastUrl;
                            break;
                        case 'daily':
                            forecastUrl = forecastUrls.dailyForecastUrl;
                            break;
                        default:
                            throw new Error(`Invalid forecast type: ${weatherForecastType}`);
                    }

                    const fetchedForecasts = await fetchForecastData(forecastUrl);
                    console.log(`Fetched forecasts for ${weatherForecastType}:`, fetchedForecasts);

                    if (fetchedForecasts.length === 0) {
                        throw new Error('No forecast data available');
                    }

                    const relevantForecasts = fetchedForecasts.filter((forecast: { startTime: string | number | Date; }) => {
                        const forecastTime = new Date(forecast.startTime).getTime();
                        const startTime = startTimestamp.toDate().getTime();
                        return forecastTime >= startTime && forecastTime < startTime + (weatherForecastType === 'daily' ? 54 * 3600 * 1000 : 1 * 3600 * 1000);
                    });

                    console.log(`Relevant forecasts for ${weatherForecastType}:`, relevantForecasts);
                    setForecasts(relevantForecasts);
                }
            } catch (error) {
                console.error(`Error fetching forecasts: ${error}`);
                setError(`Error fetching ${weatherForecastType} forecast`);
            } finally {
                setLoading(false);
            }
        };

        fetchForecasts();
    }, [lat, lng, startTimestamp, weatherForecastType]);

    const formatStartDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    const formatEndDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', hour: 'numeric', minute: 'numeric', timeZoneName: 'short' };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    useEffect(() => {
        console.log('Forecasts state updated:', forecasts);
    }, [forecasts]);


    if (loading) {
        return <IonSpinner />;
    }

    if (error || forecasts.length === 0) {
        return <IonText>{error || 'No forecast data available.'}</IonText>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
            {forecasts.map((forecast, index) => (
                <IonCard key={index} style={{ marginBottom: '10px' }}> {/* Add margin bottom to separate cards */}
                    <IonCardHeader>
                        <IonCardSubtitle>{formatStartDate(forecast.startTime)} - {formatEndDate(forecast.endTime)}</IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonText style={{ whiteSpace: 'normal' }}>{forecast.shortForecast}</IonText>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                            <IonImg src={forecast.icon} style={{ width: '50px', height: '50px' }} alt="Weather icon" />
                            <div style={{ marginLeft: '15px' }}>
                                <IonText>{forecast.temperature}&deg;{forecast.temperatureUnit}</IonText>
                                <IonText><br />Wind: {forecast.windSpeed} from {forecast.windDirection}</IonText>
                            </div>
                        </div>
                    </IonCardContent>

                </IonCard>
            ))}
        </div>
    );

};

export default WeatherForecast;
