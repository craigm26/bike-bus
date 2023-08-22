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
    IonIcon,
    IonButtons,
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
import { checkmark, peopleOutline } from 'ionicons/icons';
import './EditOrganization.css';


interface Organization {
    NameOfOrg: any;
    OrganizationType: any;
    OrganizationCreator: DocumentReference;
    id: string;
    ContactName: string;
    Email: string;
    LastUpdatedBy: string;
    LastUpdatedOn: Timestamp;
    BikeBusGroup: DocumentReference;
}

type BikeBusGroup = {
    id: string;
    BikeBusName: string;
    BikeBusLeader: DocumentReference;
    Organization: DocumentReference;
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
    const [showBikeBusModal, setShowBikeBusModal] = useState(false);
    const [bikeBusGroups, setBikeBusGroups] = useState<any[]>([]);
    const [selectedBikeBusGroup, setSelectedBikeBusGroup] = useState<BikeBusGroup | null>(null);


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

    const handleAddBikeBusGroup = async () => {

        if (!selectedBikeBusGroup) {
            return;
        }
        console.log(selectedBikeBusGroup.id)
        console.log("Organization ID: ", id);

        const bikeBusGroupRef = doc(db, 'bikebusgroups', selectedBikeBusGroup.id);
        console.log(bikeBusGroupRef);
        const docSnapshot = await getDoc(bikeBusGroupRef);
        console.log(docSnapshot);



        if (docSnapshot.exists()) {
            console.log("Organization ID: ", id);
            await updateDoc(bikeBusGroupRef, { Organization: doc(db, 'organizations', id) });
        }

        // now let's update the organization with the bikebusgroup
        const OrganizationRef = doc(db, 'organizations', id);
        console.log(OrganizationRef);
        const docSnapshot2 = await getDoc(OrganizationRef);
        console.log(docSnapshot2);

        if (docSnapshot2.exists()) {
            console.log("Organization ID: ", id);
            await updateDoc(OrganizationRef, { BikeBusGroups: doc(db, 'bikebusgroups', selectedBikeBusGroup.id) });
            alert('Organization updated with BikeBusGroup');
        } else {
            alert('The Organization document does not exist');
        }


        setShowModal(false);
    };

    const fetchBikeBusGroups = useCallback(async () => {
        try {
            if (!user || !user.uid) {
                console.error("User or user's UID is undefined");
                return; // Exit the function if user or user's UID is undefined
            }
            console.log(user.uid);

            // userRef should be a document reference to the user's document
            const userRef = doc(db, 'users', user.uid);
            console.log(userRef);
            const q = query(collection(db, 'bikebusgroups'), where('BikeBusLeader', '==', userRef));
            console.log(q);
            const querySnapshot = await getDocs(q);
            querySnapshot.docs.forEach(doc => {
                console.log(`Document ID: ${doc.id}`);
            });

            setBikeBusGroups(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            console.log(bikeBusGroups);
        } catch (error) {
            console.error(error);
        }
    }, [user]);


    useEffect(() => {
        fetchBikeBusGroups();
    }, [fetchBikeBusGroups]);


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
            <IonContent>
                {
                    isLoading ?
                        <IonSpinner /> :
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
                                    <IonButton onClick={() => setShowBikeBusModal(true)}>Add BikeBusGroup</IonButton>
                                    <IonModal isOpen={showBikeBusModal} onDidDismiss={() => setShowBikeBusModal(false)}>
                                        <IonHeader>
                                            <IonTitle>Select a BikeBusGroup</IonTitle>
                                        </IonHeader>
                                        <IonContent>
                                            <IonList>
                                                {bikeBusGroups.map(group => (
                                                    <IonItem
                                                        key={group.id}
                                                        button
                                                        onClick={() => setSelectedBikeBusGroup(group)}
                                                        className={group.id === selectedBikeBusGroup?.id ? 'selected-group' : ''}
                                                    >
                                                        {group.id === selectedBikeBusGroup?.id && <IonIcon icon={checkmark} />} {/* Optional icon */}
                                                        {group.BikeBusName}
                                                    </IonItem>
                                                ))}
                                            </IonList>

                                            <IonButton onClick={handleAddBikeBusGroup}>Add Selected BikeBusGroup</IonButton>
                                            <IonButton onClick={() => setShowBikeBusModal(false)}>Cancel</IonButton>
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
                                        <IonLabel position="stacked">BikeBus Groups: </IonLabel>
                                        <IonList>
                                                {bikeBusGroups.map(group => (
                                                    <IonItem
                                                        key={group.id}
                                                        className={group.id === selectedBikeBusGroup?.id ? 'selected-group' : ''}
                                                    >
                                                        {group.id === selectedBikeBusGroup?.id && <IonIcon icon={peopleOutline} />}
                                                        {group.BikeBusName}
                                                    </IonItem>
                                                ))}
                                            </IonList>
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
                }
            </IonContent>
        </IonPage >
    );

};

export default EditOrganization;
