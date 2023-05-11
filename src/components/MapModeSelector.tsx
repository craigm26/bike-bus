import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';

interface MapModeSelectorProps {
  enabledModes: string[];
  value: string[];
  onMapModeChange: (value: string[]) => void;
}

const MapModeSelector: React.FC<MapModeSelectorProps> = ({
  enabledModes,
  value,
  onMapModeChange,
}) => {
  return (
    <IonSelect
      slot="end"
      value={value}
      placeholder="Select Map Mode"
      onIonChange={(e) => onMapModeChange(e.detail.value as string[])}
      interface="popover"
      multiple={false}
    >
      {enabledModes.map((mode) => (
        <IonSelectOption key={mode} value={mode}>
          {mode}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default MapModeSelector;
