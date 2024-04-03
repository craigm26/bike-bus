// DetailedStatistics.tsx
import React from 'react';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonList, IonItem } from '@ionic/react';

interface BikeBusStatistics {
  totalHandCount: number;
  totalRSVPCount: number;
  averageHandCount: number;
  averageRSVPCount: number;
  // Additional statistics you might calculate
}

interface EventDetails {
  // Define the types of your event details based on the Firebase structure
    numberOfEvents: number;
    totalDuration: number;
    averageDuration: number;
    totalDistance: number;
    averageDistance: number;
}

interface Props {
    statistics: BikeBusStatistics;
    eventDetails: EventDetails; // Make sure this interface is defined
  }

const DetailedStatistics: React.FC<Props> = ({ statistics, eventDetails }) => {
    return (
    <IonCard>
      <IonCardHeader>
        <IonCardSubtitle>Event Detail Statistics</IonCardSubtitle>
        <IonCardTitle>Detailed Overview</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          <IonItem>Total Hand Counts: {statistics.totalHandCount}</IonItem>
          <IonItem>Total RSVP Counts: {statistics.totalRSVPCount}</IonItem>
          <IonItem>Average Hand Counts: {statistics.averageHandCount.toFixed(2)}</IonItem>
          <IonItem>Average RSVP Counts: {statistics.averageRSVPCount.toFixed(2)}</IonItem>
          <IonItem>Number of Events: {eventDetails.numberOfEvents}</IonItem>
          <IonItem>Total Duration of All Events: {eventDetails.totalDuration}</IonItem>
          <IonItem>Average Event Duration: {eventDetails.averageDuration}</IonItem>
          <IonItem>Total Distance Covered: {eventDetails.totalDistance}</IonItem>
          <IonItem>Average Distance per Event: {eventDetails.averageDistance}</IonItem>
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};

export default DetailedStatistics;
