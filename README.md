# BikeBus

# MVP goals

- prove there's people willing to pay for premium services
- prove there's network effects with this app
- focus on providing value to bikebus members and leaders while giving a glimpse of what other roles could do to help make streets safer (data for policy makers)
- basic features: 
--create a route, make it a scheduled route and call that a bikebus group. invite other or new users to join. 
--map search then allow options to get directions, llok for routes
--parents can check in a kid when the group starts
--org admins can claim a destination and make multiple routes and assign/invite leaders to them. 
--group page has group messages
--account page allows users to see their details

## Safety in Numbers

## What

BikeBus is a term to describe a group of cyclists that is usually guided by a leader. In the US, this has become a growing activity to help children get to school. This app will help BikeBus leaders create a route, invite new members and allow parents to monitor the BikeBus as it makes it way to school.

No ads or selling of user data with PII. Anonymous users and anonymized data wherever possible.  

## Why

We think technology could help make this a smoother, more fun experience while promoting cycling and safer streets by enhanced awareness and data for pooicy makers on street design.

## Domain bikebus.app

## To develop

npm 18.20.0
firebase 9+

npm install
ionic develop

## To deploy to Firebase preview channel

ionic build
npx cap sync
npx sync ios
npx sync android
firebase hosting:channel:deploy preview

### will have to figure out how to deploy preview builds to ios and android

## to deploy to Firebase production channel

ionic build --prod
npx cap sync
npx sync ios
npx sync android
firebase deploy --only hosting:production

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


