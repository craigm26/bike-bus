import { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useAuth from '../useAuth';

const useBikeBusGroup = () => {
  const { user } = useAuth();
  const [fetchedGroups, setFetchedGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
          if (user && user.uid && user.accountType !== 'Anonymous') {
            const q = query(collection(db, 'bikebusgroups'), where('BikeBusMembers', 'array-contains', doc(db, 'users', `${user.uid}`)));
            console.log('q:', q);
            const querySnapshot = await getDocs(q);
            const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log('fetchedGroups:', groups);
            setFetchedGroups(groups);
          } else {
            setFetchedGroups([]);
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

  return { fetchedGroups, loading, error };
};

export default useBikeBusGroup;
