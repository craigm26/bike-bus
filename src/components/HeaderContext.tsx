import React from 'react';


export type HeaderContextType = {
    showHeader: boolean;
    setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
};

export const HeaderContext = React.createContext<HeaderContextType | undefined>(undefined);
