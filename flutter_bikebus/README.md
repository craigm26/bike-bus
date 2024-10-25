# flutter_bikebus

Migration of the Ionic React bikebus app to flutter

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

### to test locally

     - IF you have a firebase projec, make a backup of the firebase firestore 
     - create a backup of the firebase firestore by running the following command in the firebase console: firebase firestore:export gs://bikebus-71dd5.appspot.com/2024-10-17T17:17:35_8714 --project bikebus-71dd5
     - import new backup file gsutil -D -m cp -r gs://bikebus-71dd5.appspot.com/2024-10-17T17:17:35_8714/* "C:\Users\CraigM\source\repos\bike-bus\firebasebackup\"
     - then in one terminal run:  firebase emulators:start --import=C:\Users\CraigM\source\repos\bike-bus\firebasebackup\
     - in another terminal run: flutter run -d chrome --web-port 60478
     - 

#### to deploy web to dev firebase hosting

- flutter build web
- firebase hosting:channel:deploy devFlutter --expires 30d
