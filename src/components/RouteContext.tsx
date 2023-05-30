import React, { ReactNode } from 'react';


type RouteContextProps = {
    endPoint: {
      lat: number;
      lng: number;
    };
    setEndPoint: React.Dispatch<React.SetStateAction<{ lat: number, lng: number }>>;
    autoCompleteValue: string;
    setAutoCompleteValue: React.Dispatch<React.SetStateAction<string>>;
};



const defaultState: RouteContextProps = {
    endPoint: {
      lat: 0,
      lng: 0
    },
    setEndPoint: () => {},
    autoCompleteValue: '',
    setAutoCompleteValue: () => {},
};



export const RouteContext = React.createContext<RouteContextProps>(defaultState);

interface RouteProviderProps {
    children: ReactNode;
}

export const RouteProvider: React.FC<RouteProviderProps> = ({ children }) => {
    const [endPoint, setEndPoint] = React.useState({ lat: 0, lng: 0 });
    const [autoCompleteValue, setAutoCompleteValue] = React.useState('');
    
    return (
        <RouteContext.Provider value={{ endPoint, setEndPoint, autoCompleteValue, setAutoCompleteValue }}>
            {children}
        </RouteContext.Provider>
    );
    
};
