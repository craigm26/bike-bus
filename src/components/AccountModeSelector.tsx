import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';

interface AccountModeSelectorProps {
  enabledModes: string[];
  value: string[];
  onAccountModeChange: (value: string[]) => void;
}

const AccountModeSelector: React.FC<AccountModeSelectorProps> = ({
  enabledModes,
  value,
  onAccountModeChange,
}) => {
  return (
    <IonSelect
      slot="end"
      value={value}
      placeholder="Select Mode"
      onIonChange={(e) => onAccountModeChange(e.detail.value as string[])}
      interface="popover"
      multiple={true}
    >
      {enabledModes.map((mode) => (
        <IonSelectOption key={mode} value={mode}>
          {mode}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

export default AccountModeSelector;
