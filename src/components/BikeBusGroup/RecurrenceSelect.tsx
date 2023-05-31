import React from 'react';
import { IonLabel, IonItem, IonCheckbox, IonList } from '@ionic/react';

interface RecurrenceSelectProps {
    selectedDays: { [key: string]: boolean };
    setSelectedDays: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

const RecurrenceSelect: React.FC<RecurrenceSelectProps> = ({ selectedDays, setSelectedDays }) => {
    const handleChange = (day: string) => {
        setSelectedDays(prevState => ({
            ...prevState,
            [day]: !prevState[day]
        }));
    }

    return (
        <IonList>
            {Object.keys(selectedDays).map((day) => (
                <IonItem key={day}>
                    <IonLabel>{day}</IonLabel>
                    <IonCheckbox slot="start" value={day} checked={selectedDays[day]} onIonChange={() => handleChange(day)} />
                </IonItem>
            ))}
        </IonList>
    );
};

export default RecurrenceSelect;
