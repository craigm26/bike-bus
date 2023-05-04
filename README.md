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

## User Stories

As a bikebus leader, I should be able to create a route on a map and allows users to view it
As a parent, i want to find a route where a bikebus leader has marked as a stop along a route and a known destination. Also give me the eta for when the user should leave
As a car driver, i want use google maps within the app and be notified of any bikebus that are within 1000 feet and tell me from what direction
As a bikebus member, i want to save destinations as a listcand make it easy to search for known bikebus with upcoming dates and times

What pages and other coding woukd you do first- based on all the requirements above?

Additionally, consider implementing the following:

User state management: Create a service or use a state management library (e.g., NgRx or Akita) to handle the user's state changes (e.g., signed in, signed out) and adapt the UI accordingly.

Location tracking: Use the Geolocation plugin from Ionic Native to track the location of bikebus members and car drivers. You can use this data to show nearby bikebuses to car drivers and calculate ETAs for bikebus members.

Notifications: Implement notifications for car drivers when a bikebus is within 1000 feet. You can use the Local Notifications plugin from Ionic Native for this purpose.

Route drawing and sharing: Implement the functionality for bikebus leaders to draw routes on a map and share them with other users. Use the Google Maps JavaScript API for this purpose, and store the route data in Firebase.

To customize the app's tabs based on the user's role (bikebus leader, member, or car driver), you'll need to create separate pages for each role and dynamically display the appropriate tabs based on the user's role. Here's how to do that:

Each role tab should start with starting point lookup and destination lookup and then expected time to reach the destination. Then suggest routes and then upcoming bikebusses and the option to rsvp for those

Parents will be sending their kids as bikebus members, allow the app view anonymous data from the bikebus yo deliver location
To allow parents to view anonymous location data for the bikebus without revealing any sensitive information about the individual bikebus members, you can implement the following features:

When a user (parent) selects a bikebus to view, you can fetch the anonymized location data for that bikebus from Firebase. Store the anonymized location data separately, without any personally identifiable information (PII) attached to it.

To update the bikebus location in real-time, use the Firebase Realtime Database or Firestore with real-time updates enabled. This will allow the app to receive live location updates for the bikebus as it moves along the route.

In the parent's view, create a map using the Google Maps JavaScript API to display the bikebus's current location. Display the bikebus as a custom icon or marker on the map, without revealing any individual members' locations.
