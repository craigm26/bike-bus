import { useState, useEffect, SetStateAction } from 'react';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';

const useRoutes = () => {
  const { user } = useAuth();
  const [fetchedRoutes, setFetchedRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user && user.uid && user.accountType !== 'Anonymous') {
          const roles = user.enabledAccountModes; // use enabledAccountModes instead of accountType
          let groups: SetStateAction<any[]> = [];
    
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
            const newGroups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            groups = [...groups, ...newGroups];
          }
    
          // remove duplicates
          groups = groups.filter((group, index, self) =>
            index === self.findIndex((g) => (
              g.id === group.id
            ))
          );
    
          setFetchedRoutes(groups);
        } else {
          setFetchedRoutes([]);
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

  return { fetchedRoutes, loading, error };
};

export default useRoutes;
