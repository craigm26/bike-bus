import {
    IonContent,
    IonPage,
    IonItem,
    IonList,
    IonInput,
    IonLabel,
    IonButton,
    IonTitle,
    IonGrid,
    IonCol,
    IonRow,
    IonSpinner,
    IonSelect,
    IonSelectOption,
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc, query, where, DocumentReference } from 'firebase/firestore';
import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete';
import { set } from 'date-fns';


interface Organization {
    NameOfOrg: any;
    OrganizationType: any;
    OrganizationCreator: DocumentReference;
    id: string;
    ContactName: string;
    Email: string;
}

const EditOrganization: React.FC = () => {
    const { user } = useAuth();
    const { avatarUrl } = useAvatar(user?.uid);
    const [accountType, setaccountType] = useState<string>('');
    const [selectedOrganization, setselectedOrganization] = useState<Organization | null>(null);
    const [Organization, setOrganization] = useState<Organization[]>([]);
    const [isCreator, setIsCreator] = useState(false);
    const { id } = useParams<{ id: string }>();
    const history = useHistory();
    const [isLoading, setIsLoading] = useState(true);
    const [orgType, setOrgType] = useState(selectedOrganization?.OrganizationType || '');
    const updatedOrganization: Partial<Organization> = {
        NameOfOrg: selectedOrganization?.NameOfOrg,
        OrganizationType: orgType,
    };


    useEffect(() => {
        if (selectedOrganization) {
            setOrgType(selectedOrganization.OrganizationType);
        }
    }, [selectedOrganization]);
    

    useEffect(() => {
        if (user) {
            const userRef = doc(db, 'users', user.uid);
            getDoc(userRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = docSnapshot.data();
                    if (userData && userData.accountType) {
                        setaccountType(userData.accountType);
                    }
                }
            });
        }
    }, [user]);


    const fetchSingleOrganization = async (id: string) => {
        setIsLoading(true);
        const docRef = doc(db, 'organizations', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const OrganizationData = {
                ...docSnap.data() as Organization,
                id: docSnap.id,
            };
            setselectedOrganization(OrganizationData);

            // Extract the uid from the OrganizationCreator reference
            const OrganizationCreatorUid = OrganizationData.OrganizationCreator.id;

            // Determine if the user is the OrganizationCreator
            setIsCreator(OrganizationCreatorUid === user?.uid);

        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (id) fetchSingleOrganization(id);
    }, [id, user, setIsCreator]);



    const handleSave = async () => {
        if (!selectedOrganization || !isCreator) {
            return;
        }

        const OrganizationRef = doc(db, 'organizations', selectedOrganization.id);
        const updatedOrganization: Partial<Organization> = {
            NameOfOrg: selectedOrganization.NameOfOrg,
            OrganizationType: selectedOrganization.OrganizationType,
        };
        await updateDoc(OrganizationRef, updatedOrganization);
        alert('Organization Updated');
        history.push(`/ViewOrganization/${selectedOrganization.id}`)
    };

    return (
        <IonPage className="ion-flex-offset-app">
            {
                isLoading ?
                    <IonSpinner /> :
                    <IonContent fullscreen>
                        <IonGrid>
                            <IonRow>
                                <IonCol>
                                    <IonTitle>
                                        Editing Organization
                                    </IonTitle>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    {
                                        isLoading ?
                                            <IonSpinner /> :
                                            <IonList>
                                                <IonItem>
                                                    <IonLabel position="stacked">Organization Name:</IonLabel>
                                                    <IonInput
                                                        key={selectedOrganization?.id}
                                                        value={selectedOrganization?.NameOfOrg || ''}
                                                        onIonChange={e => {
                                                            if (selectedOrganization) {
                                                                const updatedOrganization = {
                                                                    ...selectedOrganization,
                                                                    NameOfOrg: e.detail.value!
                                                                };
                                                                setselectedOrganization(updatedOrganization);
                                                            }
                                                        }}
                                                    />
                                                </IonItem>
                                                <IonItem>
                                                    <IonLabel position="stacked">Organization Type:</IonLabel>
                                                    <IonSelect value={orgType} onIonChange={e => setOrgType(e.detail.value)}>
                                                        <IonSelectOption value="School">School</IonSelectOption>
                                                        <IonSelectOption value="School District">School District</IonSelectOption>
                                                        <IonSelectOption value="Work">Work</IonSelectOption>
                                                        <IonSelectOption value="Social">Social</IonSelectOption>
                                                        <IonSelectOption value="Club">Club</IonSelectOption>
                                                    </IonSelect>
                                                </IonItem>
                                            </IonList>
                                    }
                                    <IonButton onClick={handleSave}>Save</IonButton>
                                    <IonButton routerLink={`/ViewOrganization/${id}`}>Cancel</IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>

                    </IonContent >
            }
        </IonPage >
    );

};

export default EditOrganization;
