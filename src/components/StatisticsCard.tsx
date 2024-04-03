// StatisticsCard.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';

interface BikeBusStatistics {
  totalHandCount: number;
  totalRSVPCount: number;
  averageHandCount: number;
  averageRSVPCount: number;
  // Add more as needed
}

interface Props {
  statistics: BikeBusStatistics;
}

const StatisticsCard: React.FC<Props> = ({ statistics }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardSubtitle>Event Statistics</IonCardSubtitle>
        <IonCardTitle>Overview</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <p>Total Hand Counts: {statistics.totalHandCount}</p>
        <p>Total RSVP Counts: {statistics.totalRSVPCount}</p>
        <p>Average Hand Counts: {statistics.averageHandCount.toFixed(2)}</p>
        <p>Average RSVP Counts: {statistics.averageRSVPCount.toFixed(2)}</p>
        {/* Render more statistics as needed */}
      </IonCardContent>
    </IonCard>
  );
};

export default StatisticsCard;
