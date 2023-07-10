import React, { createContext, useContext, ReactNode } from "react";
import useEvent from './useEvent';

// Create an interface for your context state
interface EventState {
  fetchedEvents: any[];
  loading: boolean;
  error: Error | null;
}

// 1. Create Event Context with the default value
const EventContext = createContext<EventState | undefined>(undefined);

// 2. Create Event Provider that uses useEvent hook
interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const eventState = useEvent();

  return (
    <EventContext.Provider value={eventState}>
      {children}
    </EventContext.Provider>
  );
};

// 3. Create a custom hook to use this context
export const useEventContext = (): EventState => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEventContext must be used within an EventProvider");
  }
  return context;
};
