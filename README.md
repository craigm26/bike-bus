# BikeBus

## Safety in Numbers

## MVP goals

   -Set up a school page w/ custom URL (e.g. bikebus.app/<school-name>) and QR code
   -Design your route map, set the days/dates
   -Create a “WhatsApp” Group for your Bike Bus
   -Be able to submit a form with the count of kids

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

## Here's how the initial builds of BikeBus are being developed and pushed out:

- We're using Ionic Framework to build the app:
- Ionic Serve to see it locally
- Then push to Firebase Hosting for production builds by doing "firebase deploy"
- There's also a TON of potential warnings for iOS/Android builds with me ignoring some linting rules. Should be src\eslint.rc.js to see what's being ignored.

## To develop

-npm 18.20.0
-firebase 9+

-npm install
-ionic develop

## To push to Firebase Hosting

-firebase deploy

### future build commands that will be needed for a cleaner dev / prod build process

### will have to figure out how to deploy preview builds to ios and android

### To deploy to Firebase preview channel

-ionic build
-npx cap sync
-npx sync ios
-npx sync android
-firebase hosting:channel:deploy preview

### to deploy to Firebase production channel

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

Premium features (ideas) (Monthly, cost TBD):

- Advanced route planning and customization for BikeBus leaders
- Real-time ETA predictions and notifications for BikeBus parents
- Enhanced safety features and alerts for car drivers when a BikeBus is nearby
- In-app messaging between BikeBus members and leaders (when a parent allows it)
- Deeper Integration with third-party services such as Google Maps for advanced navigation features

We will use Stripe to help manage payments and subscriptions. They also have some "preview" pages that we can use to help with the UI.