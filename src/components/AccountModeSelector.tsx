import React from 'react';
import { IonSelect, IonSelectOption } from '@ionic/react';

interface AccountModeSelectorProps {
  value: string[];
  onAccountModeChange: (value: string[]) => void;
}

const AccountModeSelector: React.FC<AccountModeSelectorProps> = ({
  value,
  onAccountModeChange,
}) => {
  return (
    <IonSelect
      slot="end"
      value={value}
      placeholder="Select Modes"
      onIonChange={(e) => onAccountModeChange(e.detail.value)}
      interface="popover"
      multiple={true}
    >
      <IonSelectOption value="Member">Member</IonSelectOption>
      <IonSelectOption value="Leader">Leader</IonSelectOption>
      <IonSelectOption value="Kid">Kid</IonSelectOption>
      <IonSelectOption value="Parent">Parent</IonSelectOption>
      <IonSelectOption value="Car Driver">Car Driver</IonSelectOption>
      <IonSelectOption value="Admin">Admin</IonSelectOption>
    </IonSelect>
  );
};

export default AccountModeSelector;
