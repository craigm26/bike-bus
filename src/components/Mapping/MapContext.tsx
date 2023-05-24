// MapContext.tsx

import React, { useReducer, createContext } from 'react';

type MapCenterType = {
  lat: number;
  lng: number;
};

interface State {
  accountType: string;
  enabledAccountModes: string[];
  username: string;
  showActionSheet: boolean;
  showMap: boolean;
  mapCenter: MapCenterType;
  getLocationClicked: boolean;
  loading: boolean;
  selectedLocation: null | MapCenterType;
}

interface Payload {
  accountType?: string;
  enabledAccountModes?: string[];
  username?: string;
  showActionSheet?: boolean;
  showMap?: boolean;
  mapCenter?: MapCenterType;
  getLocationClicked?: boolean;
  loading?: boolean;
  selectedLocation?: null | MapCenterType;
}

interface Action {
  type: string;
  payload?: Payload;
}

interface MapContextProps {
  state: State;
  dispatch: React.Dispatch<Action>;
  setSelectedLocation: (location: MapCenterType) => void;
  setMapCenter: (center: MapCenterType) => void;
}

// Create your context here
export const MapContext = createContext<MapContextProps | undefined>(undefined);

const initialState: State = {
  accountType: '',
  enabledAccountModes: [],
  username: '',
  showActionSheet: false,
  showMap: false,
  mapCenter: {
    lat: 0,
    lng: 0,
  },
  getLocationClicked: false,
  loading: true,
  selectedLocation: null,
};

function mapReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setSelectedLocation':
      return {
        ...state,
        selectedLocation: action.payload?.selectedLocation || null,
      };
    case 'setMapCenter':
      return {
        ...state,
        mapCenter: action.payload?.mapCenter || state.mapCenter,
      };
    default:
      return state;
  }
}

export interface MapProviderProps {
  children: React.ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  const setSelectedLocation = (location: MapCenterType) => {
    dispatch({
      type: 'setSelectedLocation',
      payload: { selectedLocation: location },
    });
  };

  const setMapCenter = (center: MapCenterType) => {
    dispatch({
      type: 'setMapCenter',
      payload: { mapCenter: center },
    });
  };

  return (
    <MapContext.Provider value={{ state, dispatch, setSelectedLocation, setMapCenter }}>
      {children}
    </MapContext.Provider>
  );
};
