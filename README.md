# BikeBus

## Safety in Numbers

## What

BikeBus is a term to describe a group of cyclists that is usually guided by a leader. In the US, this has become a growing activity to help children get to school. This app will help BikeBus leaders create a route, invite new members and allow parents to monitor the BikeBus as it makes it way to school.

No ads or selling of user data. Anonymous users and anonymized data wherever possible.  

## Why

We think technology could help make this a smoother, more fun experience while promoting cycling and safer streets

## Domain bikebus.app

## To develop

npm install
ionic build
firebase deploy

## How does this app make money?

Freemium model. Free features to help establish a base of users to help grow the app and then premium features to keep it running

Free features:

- BikeBus Leaders can create a route, schedule it and invite users.
- BikeBus Members and Parents can search for a scheduled route.
- BikeBus Members and Parents can become a leader by creating a new route.
- Car Drivers can see BikeBus and be alerted when one is near.

Premium features (Monthly, cost TBD):

- Advanced route planning and customization for BikeBus leaders
- Real-time ETA predictions and notifications for BikeBus parents
- Enhanced safety features and alerts for car drivers when a BikeBus is nearby
- In-app messaging between BikeBus members and leaders (when a parent allows it)
- Deeper Integration with third-party services such as Google Maps for advanced navigation features

Make a plan to create different user roles (free and premium) and ensure that only premium users have access to the premium features.

Make it clear which features are part of the free and premium plans. This will help users understand the benefits of upgrading to a paid subscription. Use a dedicated pricing or subscription page within the app to showcase the benefits of upgrading.

Continuously monitor and improve the app based on user feedback and analytics. Iterate on the premium features to ensure they provide significant value to your users and encourage upgrades.

Promote app through marketing channels such as social media, content marketing, app store optimization, and advertising to attract more users to your app.

## Tech Stack

Use Ionic as the framework and Firebase (Authentication, Hosting, Payments) as much as possible. Allow for Google Play Store and Apple Store to manage subscriptions as well.

Google Maps JavaScript API: This API allows you to display maps, draw routes, and add markers on the map. You can use the DirectionsService to draw a cycling route between the starting point and the school. You can customize the route by adding waypoints and dragging the route.

Google Places API: You can use this API to search for and display the locations of schools or other points of interest. The Places API also provides autocomplete suggestions when users are searching for a destination.

Firebase Realtime Database or Firestore: To invite riders and track the ride, you can use Firebase Realtime Database or Firestore to store and sync data in real-time. This enables you to store users' information, send invites, and track their location updates.

Geolocation: To track the riders' locations, you can use the Geolocation API provided by the browser or the Ionic Native Geolocation plugin. This allows you to get the users' current position and update their location on the map in real-time.

To build the app, you'll need to follow these steps:

Set up a new Ionic project and install the required dependencies, such as the Google Maps JavaScript API and the appropriate Ionic Native plugins.

Implement the Google Maps and Places APIs in your app to display the map, search for schools, and create the route.

Set up Firebase Realtime Database or Firestore to store and manage users, invites, and real-time location updates.

Implement the Geolocation functionality to track the riders' locations.

Build the user interface for the group leader and riders, allowing them to create a bikebus, invite other riders, and track the ride in real-time.

Remember to follow Google's API usage policies and obtain the necessary API keys for your app.

## Feature ideas

Subscription model: Offer a subscription-based model with a free tier and paid tiers that provide additional features or benefits. This way, you can generate revenue without relying on ads or sharing user data. The paid tiers could include features like enhanced route planning, priority support, or extended historical ride data.

In-app purchases: Offer additional features, customization options, or premium content as in-app purchases. Users can purchase these items without compromising their privacy.

Partnerships and sponsorships: Partner with local businesses, cycling clubs, or schools to offer sponsored content, promotions, or discounts within the app. Ensure that any partner content or offers do not infringe on users' privacy.

Donations: If your app is focused on promoting sustainable transportation and community engagement, you might consider accepting donations from users who wish to support your cause. This can help cover the costs of maintaining the app and its infrastructure.

Priority support: Provide faster customer support to premium users, answering their queries or addressing technical issues more quickly.

Extended historical ride data: Allow premium users to access their ride history for a longer period, including detailed statistics and analysis of their past rides.

Weather integration: Provide real-time weather information and alerts for the selected route, helping users plan their rides better.

Gamification and rewards: Offer a reward system or gamification features, like earning points, badges, or achievements for completing rides, inviting friends, or reaching specific milestones. Premium users could receive exclusive rewards or bonuses.

Personalized insights and recommendations: Provide personalized insights and suggestions for improving cycling performance, safety tips, or recommended routes based on users' preferences and ride history.

Offline maps: Allow premium users to download maps for offline use, enabling them to access route information without an internet connection.

Ad-free experience: Offer an ad-free version of the app for premium users, enhancing their user experience.

To notify car drivers when a bikebus is nearby, you can create a separate feature within the app or develop a complementary app specifically for drivers:

Real-time notifications: Develop a feature that allows drivers to receive real-time notifications when a bikebus is nearby. Drivers can opt-in to receive these alerts based on their location and route.

Integration with navigation apps: Collaborate with popular navigation apps, like Google Maps or Waze, to display bikebus locations and routes. This would allow car drivers using these navigation apps to be aware of nearby bikebuses and adjust their driving accordingly.

Driver-focused app: Create a standalone app or feature within your existing app specifically for drivers, providing them with real-time bikebus location data, notifications, and driving tips for sharing the road with cyclists.

Enhanced route planning: Offer advanced route customization options, such as the ability to avoid certain types of roads, find the most scenic routes, or automatically generate alternative routes based on user preferences.

## Protect users' privacy

Anonymize data: Use anonymization techniques to remove or obscure personally identifiable information (PII) from users' data. For example, instead of displaying a user's full name, show only their first name or initials on the map. Similarly, you can use generalized location markers to avoid showing exact locations.

Privacy settings: Provide users with options to control their privacy settings, allowing them to choose what information they share and with whom. For example, users could choose to share their location only with the group leader or specific group members.

Data encryption: Encrypt user data both at rest and in transit to protect it from unauthorized access.

Privacy policy and GDPR compliance: Develop a comprehensive privacy policy that clearly outlines how you collect, use, and share user data. Ensure your app complies with privacy regulations such as the General Data Protection Regulation (GDPR) and other applicable laws.

Limit data retention: Store users' data only for the necessary duration and establish policies for the timely deletion of outdated or unused data.

### craig merry

How do i add a page where a bikebus leader draws a route on a map and allows users to view it?
To add a page where a bikebus leader can draw a route on a map and allow users to view it, follow these steps:

- Generate a new page for the route creation (CreateRoute):
- Install the necessary packages for Google Maps:
- Enable the Google Maps JavaScript API and get an API key from the Google Cloud Platform. Add the API key to your index.html file:
- <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>

Replace YOUR_API_KEY with your actual API key.

- Import the GoogleMapsModule into your create-route.module.ts file
- In your create-route.page.html file, add the following code to display the Google Map
- In your create-route.page.ts file, add the following code to handle map initialization, route drawing, and user interactions:
- This code initializes the map with default options and listens for user clicks on the map to create a path.
- Update the app.component.ts and app-routing.module.ts files to include the new CreateRoute page, as shown in previous steps.

Now, you should have a new page where the bikebus leader can draw a route by clicking on the map. The route will be displayed as a series of connected points on the map.

To allow users to view the created route, you can store the route data in a database like Firebase Firestore, and then create another page where users can view the stored route. You can follow similar steps to create a new page, fetch the route data from the database, and display it on the map using the google.maps.Polyline class.

### craig merry

As a parent, i want to find a route where a bikebus leader has marked as a stop along a route and a known destination. Also give me the eta for when the user should leave

To achieve this functionality, you can follow these steps:

- First, make sure to store route data created by the bikebus leader in a database such as Firebase Firestore, including the stops along the route, known destinations, and estimated departure times.
- Create a new page called "FindRoute":
- In the find-route.page.html file, add a search input field and a button to trigger the search. Also, add a Google Map to display the found route and stops
- In the find-route.page.ts file, add the necessary imports, initialize the map, and create the searchRoute() function that will fetch the route data from the database and display it on the map
typescript
Copy code
import { Component, ViewChild } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { LatLngLiteral } from '@agm/core/services/google-maps-types';

// Add your database service import here, e.g. Firebase

  searchRoute(): void {
    // Search for the route in the database based on the searchQuery (destination)
    // Fetch the route data, including the stops along the route and the ETA

    // Display the fetched route on the map using google.maps.Polyline
    // Display the stops along the route using google.maps.Marker

    // Calculate the ETA for the user by subtracting the current time from the departure time
  }
}

- Update the app.component.ts and app-routing.module.ts files to include the new FindRoute page, as shown in previous steps.
- Now, you should have a new page where parents can search for a route based on the destination. The found route, stops, and ETA will be displayed on the map.
- Make sure to replace the placeholders for the database service (e.g., Firebase) with the actual implementation to fetch and display the route data. Additionally, you may need to adjust the logic within the searchRoute() function to fit your specific data model and requirements.

### craig merry

As a car driver, i want use google maps within the app and be notified of any bikebus that are within 1000 feet and tell me from what direction

To create a feature for car drivers to use Google Maps within the app and get notified of any nearby bikebus within 1000 feet, follow these steps:

- Create a new page called "CarDriver":
- In the car-driver.page.html file, add a Google Map and a notification area:
- In the car-driver.page.ts file, add the necessary imports, initialize the map, and create a function to periodically check for nearby bikebuses:

```typescript
import { Component, OnInit, ViewChild } from '@angular/core';
import { GoogleMap } from '@angular/google-maps';
import { Geolocation } from '@ionic-native/geolocation/ngx';

// Add your database service import here, e.g. Firebase

@Component({
  selector: 'app-car-driver',
  templateUrl: './car-driver.page.html',
  styleUrls: ['./car-driver.page.scss'],
})
export class CarDriverPage implements OnInit {
  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;

  mapOptions = {
    center: { lat: 40.730610, lng: -73.935242 },
    zoom: 14,
  };

  notification: { distance: number; direction: string } | null = null;

  constructor(
    private geolocation: Geolocation,
    // Inject your database service here, e.g. Firebase
  ) {}

  ngOnInit() {
    this.geolocation.getCurrentPosition().then((resp) => {
      this.mapOptions.center = { lat: resp.coords.latitude, lng: resp.coords.longitude };
    });

    // Periodically check for nearby bikebuses
    setInterval(() => {
      this.checkForNearbyBikebuses();
    }, 10000); // Set interval to your desired frequency (e.g., 10000 ms = 10 seconds)
  }

  async checkForNearbyBikebuses() {
    const position = await this.geolocation.getCurrentPosition();
    const currentPosition = { lat: position.coords.latitude, lng: position.coords.longitude };

    // Fetch bikebus locations from the database and calculate distances

    // Loop through bikebus locations, and for each bikebus, calculate the distance
    // If a bikebus is within 1000 feet, create a notification with the distance and direction

    // Replace the following with actual implementation
    const nearbyBikebus = null; // Replace with the nearby bikebus object, if found
    const distance = 0; // Replace with the actual distance calculation
    const direction = ''; // Replace with the actual direction calculation

    if (nearbyBikebus) {
      this.notification = { distance, direction };
    } else {
      this.notification = null;
    }
  }
}
```

- Update the app.component.ts and app-routing.module.ts files to include the new CarDriver page, as shown in previous steps.
- Now, you should have a new page for car drivers that displays a Google Map and periodically checks for nearby bikebuses. If a bikebus is within 1000 feet, a notification with the distance and direction will be displayed.

### craig merry

As a bikebus member, i want to save destinations as a listcand make it easy to search for known bikebus with upcoming dates and times




Is there a Google authentication option?
Yes, you can use Google authentication with Firebase in your Ionic app. To implement Google authentication, follow these steps:

Enable Google Sign-In in the Firebase console. Go to the Authentication section in your Firebase project, click on the "Sign-in method" tab, and enable the Google provider. Follow the instructions provided to set up a web client.
Import the necessary AngularFireAuth and GoogleAuthProvider classes in your auth.page.ts file:
Add a new method called signInWithGoogle() in the auth.page.ts file to handle Google authentication:
Add a new button to the auth.page.html file to trigger Google Sign-In:
Now, users can sign in with their Google accounts. When they click the "Sign In with Google" button, a popup window will appear, allowing users to choose their Google account and grant the necessary permissions.

Remember to handle errors and provide feedback to the user in a more user-friendly manner than simply logging to the console. Also, consider updating your app's logic to handle the user's state changes (e.g., signed in, signed out) and adapt the UI accordingly.

### craig merry

What pages and other coding woukd you do first- based on all the requirements above?



Additionally, consider implementing the following:

User state management: Create a service or use a state management library (e.g., NgRx or Akita) to handle the user's state changes (e.g., signed in, signed out) and adapt the UI accordingly.

Location tracking: Use the Geolocation plugin from Ionic Native to track the location of bikebus members and car drivers. You can use this data to show nearby bikebuses to car drivers and calculate ETAs for bikebus members.

Notifications: Implement notifications for car drivers when a bikebus is within 1000 feet. You can use the Local Notifications plugin from Ionic Native for this purpose.

Route drawing and sharing: Implement the functionality for bikebus leaders to draw routes on a map and share them with other users. Use the Google Maps JavaScript API for this purpose, and store the route data in Firebase.



To customize the app's tabs based on the user's role (bikebus leader, member, or car driver), you'll need to create separate pages for each role and dynamically display the appropriate tabs based on the user's role. Here's how to do that:

Create a service to store the user's role and manage role-related functionalities. Generate the service using the following command:
bash
Copy code
ionic generate service UserRole
In the user-role.service.ts file, create a BehaviorSubject to store the user's role and methods to get and set the role:
typescript
Copy code
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private userRoleSource = new BehaviorSubject<string>('member');
  userRole$ = this.userRoleSource.asObservable();

  constructor() {}

  setUserRole(role: string): void {
    this.userRoleSource.next(role);
  }
}
In your tabs.page.html, add *ngIf directives to each tab button, displaying the tab based on the user's role:
html
Copy code
<ion-tabs>
  <ion-tab-bar slot="bottom">
<ion-tab-button tab="bikebus-leader"*ngIf="(userRole$ | async) === 'leader'">
      <ion-icon name="create"></ion-icon>
      <ion-label>Bikebus Leader</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="bikebus-member" *ngIf="(userRole$ | async) === 'member'">
      <ion-icon name="search"></ion-icon>
      <ion-label>Bikebus Member</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="car-driver" *ngIf="(userRole$ | async) === 'driver'">
      <ion-icon name="car"></ion-icon>
      <ion-label>Car Driver</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</ion-tabs>
In your tabs.page.ts file, import the UserRoleService and subscribe to the userRole$ BehaviorSubject:
typescript
Copy code
import { Component } from '@angular/core';
import { UserRoleService } from '../services/user-role.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage {
  userRole$ = this.userRoleService.userRole$;

  constructor(private userRoleService: UserRoleService) {}
}
When a user logs in or selects their role, update their role using the setUserRole method from the UserRoleService. For example, in the auth.page.ts file:
typescript
Copy code
// Import UserRoleService at the top of the file
import { UserRoleService } from '../services/user-role.service';

// Inject UserRoleService in the constructor
constructor(private afAuth: AngularFireAuth, private userRoleService: UserRoleService) {}

// Set the user role after a successful login or signup
async signIn() {
  try {
    const result = await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
    // Set the user role based on the retrieved user data
    this.userRoleService.setUserRole(result.user.role); // Assuming the role is stored in the user object
    console.log('Sign in successful:', result);
  } catch (error) {
    console.error('Sign in failed:', error);
  }
}
Now, the app's tabs will dynamically change based on the user's role. When a user logs in, their role will be set, and the appropriate tabs for their role will be displayed. Make sure to update the

### craig merry

Each role tab should start with starting point lookup and destination lookup and then expected time to reach the destination. Then suggest routes and then upcoming bikebusses and the option to rsvp for those
To implement the features you mentioned for each role tab, you can follow these steps:

Create separate pages for each role (BikebusLeaderPage, BikebusMemberPage, and CarDriverPage) if you haven't already.

For each role page, add input fields for the starting point, destination, and expected arrival time in the corresponding HTML template file. Use Ionic components, such as ion-input, ion-datetime, and ion-button, to create the UI:

html
Copy code
<ion-header>
  <ion-toolbar>
    <ion-title>Bikebus Leader</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-item>
    <ion-label>Starting Point</ion-label>
    <ion-input [(ngModel)]="startingPoint"></ion-input>
  </ion-item>

  <ion-item>
    <ion-label>Destination</ion-label>
    <ion-input [(ngModel)]="destination"></ion-input>
  </ion-item>

  <ion-item>
    <ion-label>Expected Arrival Time</ion-label>
    <ion-datetime [(ngModel)]="expectedArrivalTime"></ion-datetime>
  </ion-item>

  <ion-button expand="full" (click)="getRoutes()">Get Routes</ion-button>
  <!-- Add the remaining components for each role page -->
</ion-content>
Repeat this for each role page, making adjustments as needed.

Implement the getRoutes() method in the corresponding TypeScript file for each role page. This method should use the Google Maps JavaScript API and the Directions Service to fetch and display suggested routes between the starting point and destination. Refer to a previous response for details on how to use the Directions Service.

Once the routes are displayed, add a section to show upcoming bikebusses based on the selected route and destination. You can fetch this data from Firebase, filtering it by destination and date. Display the bikebusses in an ion-list:

html
Copy code
<ion-list>
  <ion-list-header>
    <ion-label>Upcoming Bikebusses</ion-label>
  </ion-list-header>
  <ion-item *ngFor="let bikebus of bikebusses">
    <ion-label>{{ bikebus.name }}</ion-label>
    <ion-button slot="end" (click)="rsvpBikebus(bikebus)">RSVP</ion-button>
  </ion-item>
</ion-list>
Implement the rsvpBikebus() method in the corresponding TypeScript file for each role page. This method should allow users to RSVP for the selected bikebus. You can store RSVP data in Firebase, linking the user's ID to the bikebus ID.
By following these steps, you can create a consistent starting experience for each role tab, providing users with the ability to search for starting points and destinations, get route suggestions, and view and RSVP for upcoming bikebusses. Adapt the UI and functionality for each role as needed.

### craig merry

Parents will be sending their kids as bikebus members, allow the app view anonymous data from the bikebus yo deliver location
To allow parents to view anonymous location data for the bikebus without revealing any sensitive information about the individual bikebus members, you can implement the following features:

When a user (parent) selects a bikebus to view, you can fetch the anonymized location data for that bikebus from Firebase. Store the anonymized location data separately, without any personally identifiable information (PII) attached to it.

To update the bikebus location in real-time, use the Firebase Realtime Database or Firestore with real-time updates enabled. This will allow the app to receive live location updates for the bikebus as it moves along the route.

In the parent's view, create a map using the Google Maps JavaScript API to display the bikebus's current location. Display the bikebus as a custom icon or marker on the map, without revealing any individual members' locations.

Here's a simplified example of how to implement real-time location updates using Firestore and the Google Maps JavaScript API:

a. In your Firestore database, create a collection for bikebusses and store the anonymized location data for each bikebus, including its latitude, longitude, and a unique identifier.
b. In the TypeScript file for the parent's view, import the necessary dependencies and set up Firestore:
c. In the subscribeToBikebusLocation() method, set up a subscription to the bikebus's location data in Firestore:
d. In the updateBikebusMarker() method, update the bikebus marker's position on the map:

With these changes, the parent's view will display a map with a marker indicating the bikebus's current location in real-time. The individual members' locations will remain private, ensuring that sensitive information is not disclosed.
