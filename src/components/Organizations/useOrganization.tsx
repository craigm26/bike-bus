import { useState, useEffect, SetStateAction, createContext, useContext } from 'react';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import useAuth from '../../useAuth';

type OrganizationContextType = {
    fetchedOrganizations: any[];
    loading: boolean;
    error: Error | null;
  };

  const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

  
  

const useOrganization = () => {
  const { user } = useAuth();
  const [fetchedOrganizations, setFetchedOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && user.uid && user.accountType !== 'Anonymous') {
          const roles = user.enabledAccountModes; // use enabledAccountModes instead of accountType
          let organizations: SetStateAction<any[]> = [];
    
          for (let role of roles) {
            let q;
    
            switch(role) {
              case 'Member':
                q = query(collection(db, 'bikebusgroups'), where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user.uid}`)));
                break;
              case 'Leader':
                q = query(collection(db, 'bikebusgroups'), where('BikeBusLeaders', 'array-contains', doc(db, 'users', `${user.uid}`)));
                break;
              case 'Parent':
                q = query(collection(db, 'bikebusgroups'), where('BikeBusParents', 'array-contains', doc(db, 'users', `${user.uid}`)));
                break;
              case 'Kid':
                q = query(collection(db, 'bikebusgroups'), where('BikeBusKids', 'array-contains', doc(db, 'users', `${user.uid}`)));
                break;
              case 'Org Admin':
                q = query(collection(db, 'bikebusgroups'), where('BikeBusOrgAdmins', 'array-contains', doc(db, 'users', `${user.uid}`)));
                break;
              case 'App Admin':
                q = query(collection(db, 'bikebusgroups'), where('BikeBusAppAdmins', 'array-contains', doc(db, 'users', `${user.uid}`)));
                break;
              default:
                continue;
            }
    
            const querySnapshot = await getDocs(q);
            const newOrganizations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            organizations = [...organizations, ...newOrganizations];
          }
    
          // remove duplicates
          organizations = organizations.filter((organization, index, self) =>
            index === self.findIndex((o) => (
              o.id === organization.id
            ))
          );
    
          setFetchedOrganizations(organizations);
        } else {
          setFetchedOrganizations([]);
        }
      } catch (error) {
        console.error("Error fetching data: ", error as Error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };       
      fetchData();
  }, [user]);

  return { fetchedOrganizations, loading, error };
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const Organization = useOrganization();
  
    return (
      <OrganizationContext.Provider value={Organization}>
        {children}
      </OrganizationContext.Provider>
    );
  };
  
  export const useOrganizationContext = () => {
    const context = useContext(OrganizationContext);
  
    if (context === undefined) {
      throw new Error('useOrganizationContext must be used within a OrganizationProvider');
    }
  
    return context;
  };