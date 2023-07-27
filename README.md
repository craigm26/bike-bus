# BikeBus

## MVP goals

- Providing value to bikebus members and leaders by allowing them to create a route, schedule it and invite users. Organizations can host multiple BikeBus groups and assign leaders to them. Organizations can also track time and distance traveled by BikeBus group as well as employee timesheets.
  
## Safety in Numbers

## What

BikeBus is a term to describe a group of cyclists that is usually guided by a leader. In the US, this has become a growing activity to help children get to school. This app will help BikeBus leaders create a route, invite new members and allow parents to monitor the BikeBus as it makes it way to school.

No ads or selling of user data with PII. Anonymous users and anonymized data wherever possible.  

## Why

We think technology could help make this a smoother, more fun experience while promoting cycling and safer streets with data for policy makers on street design.

## Domain bikebus.app

### Features

-create a route, make it a scheduled route and call that a BikeBus group. Invite other or new users to join.
-Map search then allow options to get directions, look for routes or BikeBus groups
-Parents can check in a kid when the BikeBus starts
-Org admins can claim a destination and make multiple routes and assign/invite leaders to them.
-"Bulletin Boards" allow users in a BikeBus or Organization to send messages
-Account page allows users to see their details and change them

## To develop

-npm 18.20.0
-firebase 9+

-npm install
-ionic develop

## To deploy to Firebase preview channel

-ionic build
-npx cap sync
-npx sync ios
-npx sync android
-firebase hosting:channel:deploy preview

### will have to figure out how to deploy preview builds to ios and android

## to deploy to Firebase production channel

-ionic build --prod
-npx cap sync
-npx sync ios
-npx sync android
-firebase deploy --only hosting:production

## How does this app make money?

Freemium model. Free features to help establish a base of users to help grow the app and then premium features to keep it running

Free features:

- BikeBus Leaders can create a route, schedule it and invite users.
- BikeBus Members and Parents can search for a scheduled route.
- BikeBus Members and Parents can become a leader by creating a new route.

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
