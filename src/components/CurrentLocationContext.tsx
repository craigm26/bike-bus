import React, { createContext, useContext, useState } from 'react';

type LocationContextProps = {
  startPoint: {
    lat: number;
    lng: number;
  };
  setStartPoint: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
};

export const CurrentLocationContext = createContext<LocationContextProps | undefined>(undefined);

export const CurrentLocationProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [startPoint, setStartPoint] = useState<{ lat: number; lng: number }>({
    lat: 0,
    lng: 0,
  });

  return (
    <CurrentLocationContext.Provider value={{ startPoint, setStartPoint }}>
      {children}
    </CurrentLocationContext.Provider>
  );
};

export const useCurrentLocation = () => {
  const context = useContext(CurrentLocationContext);
  if (context === undefined) {
    throw new Error('useCurrentLocation must be used within a CurrentLocationProvider');
  }
  return context;
};
