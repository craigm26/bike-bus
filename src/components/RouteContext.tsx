import React, { ReactNode } from 'react';

export interface RouteContextProps {
    autoCompleteValue: string;
    setAutoCompleteValue: React.Dispatch<React.SetStateAction<string>>;
}

const defaultState: RouteContextProps = {
    autoCompleteValue: '',
    setAutoCompleteValue: () => {},
};

export const RouteContext = React.createContext<RouteContextProps>(defaultState);

interface RouteProviderProps {
  children: ReactNode;
}

export const RouteProvider: React.FC<RouteProviderProps> = ({ children }) => {
    const [autoCompleteValue, setAutoCompleteValue] = React.useState('');

    return (
        <RouteContext.Provider value={{ autoCompleteValue, setAutoCompleteValue }}>
            {children}
        </RouteContext.Provider>
    );
};
