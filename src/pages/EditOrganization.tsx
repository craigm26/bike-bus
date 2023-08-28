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
    IonSearchbar,
    IonRadio,
    IonRadioGroup,
    IonItemDivider,
} from '@ionic/react';
import { SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useAvatar } from '../components/useAvatar';
import { db } from '../firebaseConfig';
import { collection, getDoc, getDocs, updateDoc, query, doc, where, DocumentReference, Timestamp, arrayUnion, setDoc, addDoc } from 'firebase/firestore';
// State variables remain the same

import useAuth from "../useAuth";
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import usePlacesAutocomplete from '../hooks/usePlacesAutocomplete';
import { set } from 'date-fns';
import { checkmark, peopleOutline, schoolOutline } from 'ionicons/icons';
import './EditOrganization.css';
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader, StandaloneSearchBox } from "@react-google-maps/api";
import LocationInput from '../components/LocationInput';
import { get } from 'http';

type School = {
    id: string;
    SchoolName: string;
    Location: string;
    Organization?: DocumentReference;
}

type UserType = {
    id: string;
    email: string;
    accountType: string;
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    organization?: DocumentReference;
    orgRole?: string;
}

interface Organization {
    NameOfOrg: any;
    OrganizationType: any;
    Location: any;
    OrganizationCreator: DocumentReference;
    id: string;
    ContactName: string;
    Email: string;
    LastUpdatedBy: string;
    LastUpdatedOn: Timestamp;
    BikeBusGroups?: DocumentReference[];
    Schools?: DocumentReference[];
}

type BikeBusGroup = {
    id: string;
    BikeBusName: string;
    BikeBusLeader: DocumentReference;
    Organization: DocumentReference;
}

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];

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
    const [bikeBusGroupsLeader, setBikeBusGroupsLeader] = useState<any[]>([]);
    const [selectedBikeBusGroups, setSelectedBikeBusGroups] = useState<BikeBusGroup[]>([]);
    const selectedSchools: School[] = [];
    const [fetchedBikeBusGroups, setFetchedBikeBusGroups] = useState<BikeBusGroup[]>([]);
    const [fetchedStaff, setFetchedStaff] = useState([]);
    const [showRemoveConfimModal, setShowRemoveConfimModal] = useState(false);
    const [PlaceLocation, setPlaceLocation] = useState('');
    const [showSchoolModal, setShowSchoolModal] = useState(false);
    const [showRemoveSchoolConfimModal, setShowRemoveSchoolConfimModal] = useState(false);
    const [schoolLocation, setSchoolLocation] = useState<string | null>(null);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [schoolName, setSchoolName] = useState<string | null>(null);
    const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
    const [placeName, setPlaceName] = useState<string | null>(null);
    const [fetchedSchools, setFetchedSchools] = useState<School[]>([]);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<BikeBusGroup | null>(null);
    const [searchStaffQuery, setSearchStaffQuery] = useState('');
    const [selectedStaff, setSelectedStaff] = useState<UserType[]>([]);
    const [searchStaffResults, setSearchStaffResults] = useState<UserType[]>([]);
    const [showRemoveStaffConfimModal, setShowRemoveStaffConfimModal] = useState(false);

    const handleSearch = async (queryText: string) => {
        setSearchStaffQuery(queryText);
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('email', '==', queryText));
        console.log(q);
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => {
            return { id: doc.id, email: doc.data().email, accountType: doc.data().accountType } as UserType;
        });
        setSearchStaffResults(results);
        console.log(results);
    };


    const handleSelectStaff = (user: UserType) => {
        setSelectedStaff([...selectedStaff, user]);
    };

    const handleAddStaff = async () => {
        const OrganizationRef = doc(db, 'organizations/${Organization.id}/staff', id);
        console.log(OrganizationRef);

        selectedStaff.forEach(user => {
            const staffRef = doc(OrganizationRef, user.id); // Assuming user.id exists
            console.log(staffRef);
            updateDoc(staffRef, { Organization: OrganizationRef });
        });

        await updateDoc(OrganizationRef, { staff: arrayUnion(...selectedStaff) });
    };

    const [selectedEmail, setSelectedEmail] = useState<string>('');
    const [inviteEmail, setInviteEmail] = useState<string>('');

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic to send an invitation to inviteEmail
    };





    const toggleSelectedBikeBusGroup = (group: BikeBusGroup) => {
        if (selectedBikeBusGroups.some(selectedGroup => selectedGroup.id === group.id)) {
            // Remove the group if it's already selected
            setSelectedBikeBusGroups(selectedBikeBusGroups.filter(selectedGroup => selectedGroup.id !== group.id));
        } else {
            setSelectedBikeBusGroups([...selectedBikeBusGroups, group]);
            // Add the group if it's not selected
        }
    }

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
        libraries,
    });



    useEffect(() => {
        if (selectedOrganization) {
            setOrgType(selectedOrganization.OrganizationType);
        }
    }, [selectedOrganization]);

    useEffect(() => {
        fetchBikeBusGroups();
    }, []);

    useEffect(() => {
        const fetchPlaceLocation = async () => {
            const locationFromFirestore = await getPlaceLocation();
            setPlaceLocation(locationFromFirestore);
        };

        fetchPlaceLocation();
    }, []);



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

        fetchSchools();
    }, [user]);

    const getPlaceLocation = async () => {
        const OrganizationRef = doc(db, 'organizations', id);
        const orgSnapshot = await getDoc(OrganizationRef);
        const orgData = orgSnapshot.data() as Organization;
        return orgData.Location;
    };

    const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
        const schoolName = place.name;
        setSchoolName(schoolName || null);
    };

    const fetchBikeBusGroups = async () => {
        const OrganizationRef = doc(db, 'organizations', id);
        const orgSnapshot = await getDoc(OrganizationRef);

        // Get the BikeBusGroups array and handle possible undefined data
        const orgData = orgSnapshot.data() as Organization;
        const bikeBusGroupRefs = orgData?.BikeBusGroups || [];

        // Fetch each bike bus group document
        const groupPromises = bikeBusGroupRefs.map(ref => getDoc(ref));
        const groupSnapshots = await Promise.all(groupPromises);

        // Transform snapshots to bike bus groups
        const groups = groupSnapshots.map(snapshot => ({
            id: snapshot.id,
            ...snapshot.data()
        })) as BikeBusGroup[];

        setFetchedBikeBusGroups(groups);
    };

    const fetchSchools = async () => {
        const OrganizationRef = doc(db, 'organizations', id);
        const orgSnapshot = await getDoc(OrganizationRef);

        // Get the Schools array and handle possible undefined data
        const orgData = orgSnapshot.data() as Organization;
        const schoolRefs = orgData?.Schools || [];

        // Fetch each school document
        const schoolPromises = schoolRefs.map(ref => getDoc(ref));
        const schoolSnapshots = await Promise.all(schoolPromises);

        // Transform snapshots to schools
        const schools = schoolSnapshots.map(snapshot => ({
            id: snapshot.id,
            ...snapshot.data()
        })) as School[];

        setFetchedSchools(schools);
    };



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
        console.log("Organization ID: ", id);

        if (!selectedBikeBusGroups.length) {
            alert('Please select at least one BikeBusGroup.');
            return;
        }

        // Get reference to the organization document
        const OrganizationRef = doc(db, 'organizations', id);
        const orgSnapshot = await getDoc(OrganizationRef);

        if (!orgSnapshot.exists()) {
            alert('The Organization document does not exist');
            return;
        }

        // Iterate through the selected bike bus groups and update them
        for (const group of selectedBikeBusGroups) {
            const bikeBusGroupRef = doc(db, 'bikebusgroups', group.id);
            const docSnapshot = await getDoc(bikeBusGroupRef);

            if (docSnapshot.exists()) {
                console.log("Organization ID: ", id);
                await updateDoc(bikeBusGroupRef, { Organization: OrganizationRef });
            }
        }

        // Update the organization with the bike bus groups as an array of document references
        const bikeBusGroupRefs = selectedBikeBusGroups.map(group => doc(db, 'bikebusgroups', group.id));
        await updateDoc(OrganizationRef, { BikeBusGroups: arrayUnion(...bikeBusGroupRefs) });

        alert('Organization updated with BikeBusGroups');
        history.push(`/EditOrganization/${id}`);
        // close the select a bikebusgroup modal
        //                                             onClick={() => setShowBikeBusModal(false)}
        setShowBikeBusModal(false);



        setShowModal(false);
    };

    const handleAddSchool = async () => {
        console.log("Organization ID: ", id);
        console.log(placeName);
        console.log(schoolName);
        console.log(formattedAddress);
        console.log(schoolLocation);

        // Get reference to the organization document
        const OrganizationRef = doc(db, 'organizations', id);
        const orgSnapshot = await getDoc(OrganizationRef);

        if (!orgSnapshot.exists()) {
            alert('The Organization document does not exist');
            return;
        }

        // first, let's check if the school is listed in the schools collection already. look at the location field to see if any match the schoollocation
        getDocs(collection(db, 'schools')).then((snapshot) => {
            snapshot.docs.forEach(schoolDoc => {
                console.log(schoolDoc.data());
                if (schoolDoc.data().Location === schoolLocation) {
                    console.log("School already exists");
                    // if so, add the school to the organization and the organization to the school
                    // get the id of the school document
                    const schoolId = schoolDoc.id
                    // get the school document reference
                    const schoolRef = doc(db, 'schools', schoolId);
                    // add the school to the organization
                    updateDoc(OrganizationRef, { Schools: arrayUnion(schoolRef) });
                    // add the organization to the school
                    updateDoc(schoolRef, { Organization: OrganizationRef });
                } else {
                    // if not, create a new school and add it to the organization and the organization to the school
                    console.log("School does not exist, let's create the school document and in the organization and the organization to the school");
                    // create a new document in the schools document collection with the school name and location
                    addDoc(collection(db, 'schools'), {
                        SchoolName: schoolName,
                        Location: schoolLocation,
                    }).then((docRef) => {
                        // add the school to the organization
                        updateDoc(OrganizationRef, { Schools: arrayUnion(docRef) });
                        // add the organization to the school
                        updateDoc(docRef, { Organization: OrganizationRef });
                    }).catch((error) => {
                        console.error("Error adding document: ", error);
                    });


                }
            })
        })


        alert('Organization updated with Schools');
        history.push(`/EditOrganization/${id}`);

        setShowSchoolModal(false);
    }

    const fetchBikeBusGroupsLeader = useCallback(async () => {
        try {
            if (!user || !user.uid) {
                console.error("User or user's UID is undefined");
                return; // Exit the function if user or user's UID is undefined
            }
            console.log(user.uid);

            // userRef should be a document reference to the user's document
            const userRef = doc(db, 'users', user.uid);
            console.log(userRef);
            // somehow this returning as the set list - we want organizations
            const q = query(collection(db, 'bikebusgroups'), where('BikeBusLeader', '==', userRef));
            console.log(q);
            const querySnapshot = await getDocs(q);
            querySnapshot.docs.forEach(doc => {
                console.log(`Document ID: ${doc.id}`);
            });

            setBikeBusGroupsLeader(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            console.log(bikeBusGroups);
        } catch (error) {
            console.error(error);
        }
    }, [user]);


    useEffect(() => {
        fetchBikeBusGroupsLeader();
    }, [fetchBikeBusGroupsLeader]);


    const removeBikeBusGroup = async (group: BikeBusGroup) => {
        if (!selectedOrganization || !isCreator) {
            return;
        }



        const OrganizationRef = doc(db, 'organizations', selectedOrganization.id);

        // Remove the bike bus group (group.id) from the organization field bikebusgroups (which is an array of document references)
        const removeBikeBusGroupFromOrganization = async (group: BikeBusGroup) => {
            const bikeBusGroupRefs = selectedOrganization.BikeBusGroups || [];
            const updatedBikeBusGroupRefs = bikeBusGroupRefs.filter(ref => ref.id !== group.id);
            await updateDoc(OrganizationRef, { BikeBusGroups: updatedBikeBusGroupRefs });
        };

        await removeBikeBusGroupFromOrganization(group);


        // Remove the organization from the bike bus group
        await updateDoc(doc(db, 'bikebusgroups', group.id), { Organization: null });

        alert('Organization Updated');
        history.push(`/ViewOrganization/${selectedOrganization.id}`)
    };

    const removeSchoolGroup = async (school: any) => {
        if (!selectedOrganization || !isCreator) {
            return;
        }

        const OrganizationRef = doc(db, 'organizations', selectedOrganization.id);

        // Remove the bike bus group (group.id) from the organization field bikebusgroups (which is an array of document references)
        const removeSchoolFromOrganization = async (school: any) => {
            const schoolRefs = selectedOrganization.Schools || [];
            const updatedSchoolRefs = schoolRefs.filter((ref: DocumentReference) => ref.id !== school.id);
            await updateDoc(OrganizationRef, { Schools: updatedSchoolRefs });
        };

        await removeSchoolFromOrganization(school);


        // Remove the organization from the bike bus group
        await updateDoc(doc(db, 'schools', school.id), { Organization: null });

        alert('Organization Updated');

        history.push(`/ViewOrganization/${selectedOrganization.id}`)
    }

    const handlePhotos = (photos: string) => {
        // let's display the photos in a small ionic grid
        return (
            <IonGrid>
                <IonRow>
                    <IonCol>
                        <img src={photos} alt="school photo" />
                    </IonCol>
                </IonRow>
            </IonGrid>
        );
    }


    const handleSave = async () => {
        if (!selectedOrganization || !isCreator) {
            return;
        }

        const OrganizationRef = doc(db, 'organizations', selectedOrganization.id);
        const updatedOrganization: Partial<Organization> = {
            NameOfOrg: selectedOrganization.NameOfOrg,
            OrganizationType: selectedOrganization.OrganizationType,
            ContactName: selectedOrganization.ContactName,
            Location: PlaceLocation, // Update the location
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
                                    <IonButton onClick={() => setShowStaffModal(true)}>Add Staff</IonButton>
                                    <IonModal isOpen={showStaffModal} onDidDismiss={() => setShowStaffModal(false)}>
                                        <IonHeader>
                                            <IonTitle>Search for BikeBus Users to add as Staff</IonTitle>
                                        </IonHeader>
                                        <IonContent>
                                            <IonSearchbar onIonChange={(e) => handleSearch(e.detail.value || '')} value={searchStaffQuery} />
                                            <IonRadioGroup value={selectedEmail} onIonChange={(e) => setSelectedEmail(e.detail.value)}>
                                                {searchStaffResults.map((user) => (
                                                    <IonItem key={user.id}>
                                                        <IonLabel>
                                                            {user.email} - {user.firstName} {user.lastName}
                                                        </IonLabel>
                                                        <IonRadio slot="start" value={user.email} />
                                                    </IonItem>
                                                ))}
                                            </IonRadioGroup>
                                            <IonButton onClick={handleAddStaff}>Add Selected Staff</IonButton>
                                            <IonButton onClick={() => setShowStaffModal(false)}>Cancel</IonButton>
                                            <IonItemDivider>Or</IonItemDivider>
                                            {searchStaffResults.length === 0 && (
                                                <form onSubmit={handleInvite}>
                                                    <IonInput
                                                        type="email"
                                                        placeholder="Enter email to invite"
                                                        value={inviteEmail}
                                                        onIonChange={(e) => setInviteEmail(e.detail.value || '')}
                                                    />
                                                    <IonButton type="submit">Send Invite</IonButton>
                                                </form>
                                            )}
                                        </IonContent>
                                    </IonModal>
                                    <IonButton onClick={() => setShowBikeBusModal(true)}>Add BikeBusGroup</IonButton>
                                    <IonModal isOpen={showBikeBusModal} onDidDismiss={() => setShowBikeBusModal(false)}>
                                        <IonHeader>
                                            <IonTitle>Select a BikeBusGroup</IonTitle>
                                        </IonHeader>
                                        <IonContent>
                                            <IonList>
                                                {bikeBusGroupsLeader.map(group => (
                                                    <IonItem
                                                        key={group.id}
                                                        button
                                                        onClick={() => toggleSelectedBikeBusGroup(group)}
                                                        className={selectedBikeBusGroups.some(selectedGroup => selectedGroup.id === group.id) ? 'selected-group' : ''}
                                                    >
                                                        {selectedBikeBusGroups.some(selectedGroup => selectedGroup.id === group.id) && <IonIcon icon={checkmark} />}
                                                        {group.BikeBusName}
                                                    </IonItem>
                                                ))}
                                            </IonList>

                                            <IonButton onClick={handleAddBikeBusGroup}>Add Selected BikeBusGroup</IonButton>
                                            <IonButton onClick={() => setShowBikeBusModal(false)}>Cancel</IonButton>
                                        </IonContent>
                                    </IonModal>
                                    <IonButton onClick={() => setShowSchoolModal(true)}>Add School</IonButton>
                                    <IonModal isOpen={showSchoolModal} onDidDismiss={() => setShowSchoolModal(false)}>
                                        <IonHeader>
                                            <IonTitle>Search For a School</IonTitle>
                                        </IonHeader>
                                        <IonContent>
                                            <LocationInput onLocationChange={setSchoolLocation} onPlaceSelected={handlePlaceSelected} onPhotos={handlePhotos} setFormattedAddress={setFormattedAddress} setPlaceName={setPlaceName} />
                                            <IonItem>
                                                <IonLabel position="stacked">School Name: {schoolName}</IonLabel>
                                            </IonItem>
                                            <IonItem>
                                                <IonLabel position="stacked">School Location: {schoolLocation}</IonLabel>
                                            </IonItem>
                                            <IonItem>
                                                <IonGrid>
                                                    <IonRow>
                                                        <IonCol>
                                                            {schoolLocation && <img src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${schoolLocation}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`} alt="school photo" />}
                                                        </IonCol>
                                                    </IonRow>
                                                </IonGrid>
                                            </IonItem>
                                            <IonButton onClick={() => { setSchoolLocation(null); setSchoolName(null); setFormattedAddress(null); }}>Clear</IonButton>
                                            <IonButton onClick={handleAddSchool}>Add Selected School</IonButton>
                                            <IonButton onClick={() => setShowSchoolModal(false)}>Cancel</IonButton>
                                        </IonContent>
                                    </IonModal>
                                </IonCol>
                            </IonRow>
                            <IonRow>
                                <IonCol>
                                    {isLoading ? <IonSpinner /> :
                                        <IonList>
                                            <IonCol>
                                                <IonLabel position="stacked">Organization Name:
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
                                                </IonLabel>
                                                <IonLabel position="stacked"> Organization Location:
                                                    <LocationInput onLocationChange={setPlaceLocation} defaultLocation={PlaceLocation} onPlaceSelected={handlePlaceSelected} onPhotos={handlePhotos} setFormattedAddress={setFormattedAddress} setPlaceName={setPlaceName} />
                                                </IonLabel>
                                            </IonCol>
                                        </IonList>
                                    }
                                    <IonCol>
                                        <IonLabel position="stacked">Organization Type:
                                            <IonSelect value={orgType} onIonChange={e => setOrgType(e.detail.value)}>
                                                <IonSelectOption value="School">School</IonSelectOption>
                                                <IonSelectOption value="School District">School District</IonSelectOption>
                                                <IonSelectOption value="Work">Work</IonSelectOption>
                                                <IonSelectOption value="Social">Social</IonSelectOption>
                                                <IonSelectOption value="Club">Club</IonSelectOption>
                                            </IonSelect>
                                        </IonLabel>
                                    </IonCol>
                                    {orgType === "School District" &&
                                        <IonCol>
                                            <IonLabel position="stacked">Schools:</IonLabel>
                                            <IonList>
                                                {fetchedSchools.map(school => (
                                                    <IonItem key={school.id}>
                                                        <IonButton onClick={() => setShowRemoveSchoolConfimModal(true)}>
                                                            <IonIcon icon={schoolOutline} />
                                                            {school.SchoolName}
                                                        </IonButton>
                                                        <IonModal isOpen={showRemoveSchoolConfimModal} onDidDismiss={() => setShowRemoveSchoolConfimModal(false)}>
                                                            <IonHeader>
                                                                <IonTitle>Remove School</IonTitle>
                                                            </IonHeader>
                                                            <IonContent>
                                                                <IonItem>
                                                                    <IonLabel>Are you sure you want to remove {school.SchoolName}?</IonLabel>
                                                                </IonItem>
                                                                <IonButton onClick={() => setShowRemoveSchoolConfimModal(false)}>Cancel</IonButton>
                                                                <IonButton onClick={() => removeSchoolGroup(school)}>Remove</IonButton>
                                                            </IonContent>
                                                        </IonModal>
                                                    </IonItem>
                                                ))}
                                            </IonList>
                                        </IonCol>
                                    }
                                    <IonCol>
                                        <IonLabel position="stacked">BikeBus Groups: </IonLabel>
                                        <IonList>
                                            {fetchedBikeBusGroups.map(group => (
                                                <IonItem key={group.id}>
                                                    <IonButton onClick={() => {
                                                        setSelectedGroup(group);
                                                        setShowRemoveConfimModal(true);
                                                    }}>
                                                        <IonIcon icon={peopleOutline} />
                                                        {group.BikeBusName}
                                                    </IonButton>
                                                </IonItem>
                                            ))}

                                            <IonModal isOpen={showRemoveConfimModal} onDidDismiss={() => setShowRemoveConfimModal(false)}>
                                                <IonHeader>
                                                    <IonTitle>Remove BikeBusGroup</IonTitle>
                                                </IonHeader>
                                                <IonContent>
                                                    <IonItem>
                                                        <IonLabel>Are you sure you want to remove {selectedGroup ? selectedGroup.BikeBusName : ''}?</IonLabel>
                                                    </IonItem>
                                                    <IonButton onClick={() => setShowRemoveConfimModal(false)}>Cancel</IonButton>
                                                    <IonButton onClick={() => {
                                                        if (selectedGroup) {
                                                            removeBikeBusGroup(selectedGroup);
                                                        }
                                                    }}>Remove</IonButton>
                                                </IonContent>
                                            </IonModal>
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
                                    <IonCol>
                                        <IonLabel position="stacked">Contact Email:</IonLabel>
                                        <IonInput
                                            key={selectedOrganization?.id}
                                            value={selectedOrganization?.Email || ''}
                                            onIonChange={e => {
                                                if (selectedOrganization) {
                                                    const updatedOrganization = {
                                                        ...selectedOrganization,
                                                        Email: e.detail.value!
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
