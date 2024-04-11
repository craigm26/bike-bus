// DetailedStatistics.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonList, IonItem, IonButton, IonTitle } from '@ionic/react';

interface BikeBusStatistics {
  totalHeadCount: number;
  averageHeadCount: number;
  pastTotalRSVPCount: number;
  futureTotalRSVPCount: number;
  pastAverageRSVPCount: number;
  futureAverageRSVPCount: number;
  // Additional statistics you might calculate
}

interface EventDetails {
  // Define the types of your event details based on the Firebase structure
  numberOfEvents: number;
  pastEventsCount: number;
  futureEventsCount: number;
  totalDuration: number;
  averageDuration: number;
  totalDistance: number;
  averageDistance: number;
}

interface Props {
  statistics: BikeBusStatistics;
  eventDetails: EventDetails;
  onClose: () => void;
}

const DetailedStatistics: React.FC<Props> = ({ statistics, eventDetails, onClose }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonTitle>BikeBus Detailed Statistics</IonTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          <IonItem>Total Head Counts: {statistics.totalHeadCount}</IonItem>
          <IonItem>Past Events RSVP Count: {statistics.pastTotalRSVPCount}</IonItem>
          <IonItem>Future Events RSVP Count: {statistics.futureTotalRSVPCount}</IonItem>
          <IonItem>Past Events Average RSVP: {statistics.pastAverageRSVPCount.toFixed(2)}</IonItem>
          <IonItem>Future Events Average RSVP: {statistics.futureAverageRSVPCount.toFixed(2)}</IonItem>
          <IonItem>Average Head Counts: {Number.isFinite(statistics.averageHeadCount) ? statistics.averageHeadCount.toFixed(2) : '0.00'}</IonItem>
          <IonItem>Past Events Average RSVP: {Number.isFinite(statistics.pastAverageRSVPCount) ? statistics.pastAverageRSVPCount.toFixed(2) : '0.00'}</IonItem>
          <IonItem>Future Events Average RSVP: {Number.isFinite(statistics.futureAverageRSVPCount) ? statistics.futureAverageRSVPCount.toFixed(2) : '0.00'}</IonItem>
          <IonItem>Number of Events: {eventDetails.numberOfEvents}</IonItem>
          <IonItem>Total Duration of All Events: {eventDetails.totalDuration}</IonItem>
          <IonItem>Average Event Duration: {eventDetails.averageDuration}</IonItem>
          <IonItem>Total Distance Covered: {eventDetails.totalDistance}</IonItem>
          <IonItem>Average Distance per Event: {eventDetails.averageDistance}</IonItem>
        </IonList>
        <IonButton expand="block" onClick={onClose}>Close</IonButton>
      </IonCardContent>
    </IonCard>
  );
};

export default DetailedStatistics;
