import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './AuthContext';
import { BikeBusGroupProvider } from './components/BikeBusGroup/useBikeBusGroup';
import { EventProvider } from './components/BikeBusGroup/EventContext';

import './global.css'

import * as functions from "firebase-functions";

// put in a provider for OrganizationContext, EventContext and TripContext

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <BikeBusGroupProvider>
          <EventProvider>
          <App />
          </EventProvider>
        </BikeBusGroupProvider>
      </AuthProvider>
    </React.StrictMode>
  );
} else {
  console.error('Error: Could not find the root element to mount the app.');
}

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
