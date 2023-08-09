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
    IonModal,
    IonHeader,
} from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc, query, where, DocumentReference, Timestamp } from 'firebase/firestore';
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
    LastUpdatedBy: string;
    LastUpdatedOn: Timestamp;
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
        ContactName: selectedOrganization?.ContactName,
        LastUpdatedBy: user?.uid,
        LastUpdatedOn: Timestamp.now(),
    };
    const [showModal, setShowModal] = useState(false);
    const [bikeBusGroups, setBikeBusGroups] = useState<any[]>([]);
    const [selectedBikeBusGroup, setSelectedBikeBusGroup] = useState<string>('');


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

    useEffect(() => {
        const fetchBikeBusGroups = async () => {
            const q = query(collection(db, 'bikeBusGroups'), where('leader', '==', user?.uid));
            const querySnapshot = await getDocs(q);
            setBikeBusGroups(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        fetchBikeBusGroups();
    }, [user?.uid]);

    const handleAddBikeBusGroup = async () => {
        const bikeBusGroupRef = doc(db, 'bikeBusGroups', selectedBikeBusGroup);
        await updateDoc(bikeBusGroupRef, { Organization: doc(db, 'organizations', id) });
        alert('BikeBusGroup updated');
        setShowModal(false);
    };


    const handleSave = async () => {
        if (!selectedOrganization || !isCreator) {
            return;
        }

        const OrganizationRef = doc(db, 'organizations', selectedOrganization.id);
        const updatedOrganization: Partial<Organization> = {
            NameOfOrg: selectedOrganization.NameOfOrg,
            OrganizationType: selectedOrganization.OrganizationType,
            ContactName: selectedOrganization.ContactName,
            LastUpdatedBy: user?.uid,
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
                                    <IonButton>Add Staff</IonButton>
                                    <IonButton onClick={() => setShowModal(true)}>Add BikeBusGroup</IonButton>
                                    <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
                                        <IonHeader>
                                            <IonTitle>Select a BikeBusGroup</IonTitle>
                                        </IonHeader>
                                        <IonContent>
                                            <IonList>
                                                {bikeBusGroups.map(group => (
                                                    <IonItem key={group.id} button onClick={() => setSelectedBikeBusGroup(group.id)}>
                                                        {group.BikeBusName}
                                                    </IonItem>
                                                ))}
                                            </IonList>
                                            <IonButton onClick={handleAddBikeBusGroup}>Add Selected BikeBusGroup</IonButton>
                                            <IonButton onClick={() => setShowModal(false)}>Cancel</IonButton>
                                        </IonContent>
                                    </IonModal>

                                    <IonButton>Add Schools</IonButton>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    {isLoading ? <IonSpinner /> :
                                        <IonList>
                                            <IonCol>
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
                                            </IonCol>
                                        </IonList>
                                    }
                                    <IonCol>
                                        <IonLabel position="stacked">Organization Type:</IonLabel>
                                        <IonSelect value={orgType} onIonChange={e => setOrgType(e.detail.value)}>
                                            <IonSelectOption value="School">School</IonSelectOption>
                                            <IonSelectOption value="School District">School District</IonSelectOption>
                                            <IonSelectOption value="Work">Work</IonSelectOption>
                                            <IonSelectOption value="Social">Social</IonSelectOption>
                                            <IonSelectOption value="Club">Club</IonSelectOption>
                                        </IonSelect>
                                    </IonCol>
                                    <IonCol>
                                        <IonLabel position="stacked">Contact Name:</IonLabel>
                                        <IonInput
                                            key={selectedOrganization?.id}
                                            value={selectedOrganization?.ContactName || ''}
                                            onIonChange={e => {
                                                if (selectedOrganization) {
                                                    const updatedOrganization = {
                                                        ...selectedOrganization,
                                                        ContactName: e.detail.value!
                                                    };
                                                    setselectedOrganization(updatedOrganization);
                                                }
                                            }}
                                        />
                                    </IonCol>
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
