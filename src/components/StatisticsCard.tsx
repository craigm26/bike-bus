// StatisticsCard.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';

interface BikeBusStatistics {
  totalHeadCount: number;
  totalRSVPCount: number;
  averageHeadCount: number;
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
        <p>Total Head Counts: {statistics.totalHeadCount}</p>
        <p>Total RSVP Counts: {statistics.totalRSVPCount}</p>
        <p>Average Head Counts: {statistics.averageHeadCount.toFixed(2)}</p>
        <p>Average RSVP Counts: {statistics.averageRSVPCount.toFixed(2)}</p>
        {/* Render more statistics as needed */}
      </IonCardContent>
    </IonCard>
  );
};

export default StatisticsCard;
