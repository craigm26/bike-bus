# BikeBus

## What

BikeBus is a term to describe a group of cyclists that is usually guided by a leader. In the US, this has become a growing activity to help children get to school. This app will help BikeBus leaders create a route, invite new members and allow parents to monitor the BikeBus as it makes it way to school.

No ads or selling of user data with PII. Anonymous users and anonymized data wherever possible might be made available to future API. 

## Why

We think technology could help make this a smoother, more fun experience while promoting cycling and safer streets with data for policy makers on street design.


### Features

-create a route, make it a scheduled route and call that a BikeBus group. Invite other or new users to join.
-Map search then allow options to get directions, look for routes or BikeBus groups
-"Bulletin Boards" allow users in a BikeBus or Organization to send messages
-Account page allows users to see their details and change them

## Here's how the initial builds of BikeBus are being developed and pushed out:

- We're using Ionic Framework to build the app:
- Ionic Serve to see it locally
- Then push to Firebase Hosting for production builds by doing "firebase deploy"

## To develop

-npm 18.20.0
-firebase 9+

-npm install
-ionic develop

## To push to Firebase Hosting (this is Web production)

-firebase deploy

## To deploy for Android:

-ionic build
-npx cap sync
-npx sync Android
-clean build in Android Studio
-perform a build in Android Studio - .aab file
-upload to Google Play Store as a new release (production for now)
## To deploy for iOS: 

-ionic build
-npx cap sync
-npx sync ios
-manually modify the config.xml file to add the following lines:

```
<?xml version='1.0' encoding='utf-8'?>
<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
  <access origin="*" />
  <platform name="ios">
      <resource-file src="GoogleService-Info.plist" />
  </platform>
</widget>

```

- commit to github

# future build commands that will be needed for a cleaner dev / prod build process

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

- Enhanced safety features and alerts for car drivers when a BikeBus is nearby
- In-app messaging between BikeBus members and leaders (when a parent allows it)
- Deeper Integration with third-party services such as Google Maps for advanced navigation features

We will use Stripe to help manage payments and subscriptions. They also have some "preview" pages that we can use to help with the UI.
