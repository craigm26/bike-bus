import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButton,
  IonActionSheet,
  IonFab,
  IonIcon,
  IonText,
  IonCard,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { useEffect, useCallback, useContext } from "react";
import "./Map.css";
import useAuth from "../useAuth";
import { ref, set } from "firebase/database";
import { db, rtdb } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useHistory } from 'react-router-dom';
import LoadMap from "../components/Mapping/LoadMap";
import { HeaderContext } from "../components/HeaderContext";
import { useCurrentLocation } from "../components/CurrentLocationContext";
import { playOutline } from "ionicons/icons";
import useBikeBusGroup from "../components/useBikeBusGroup";
import { LatLng } from "use-places-autocomplete";
import { MapContext } from "../components/Mapping/MapContext";


const DEFAULT_ACCOUNT_MODES = ['Member'];

const Map: React.FC = () => {
  const { user, isAnonymous } = useAuth();
  const { fetchedGroups, loading: loadingGroups, error } = useBikeBusGroup();
  const headerContext = useContext(HeaderContext);
  const { setStartPoint } = useCurrentLocation();
  const { state, dispatch } = useContext(MapContext);
  const mapContext = useContext(MapContext);

  if (!mapContext) {
    throw new Error("MapContext is not provided");
  }

  const { setSelectedLocation, setMapCenter } = mapContext;


  useEffect(() => {
    if (headerContext) {
      headerContext.setShowHeader(true); // show header
    }
  }, [headerContext]);

  const getLocation = () => {
    dispatch({ type: 'SET_GET_LOCATION_CLICKED', payload: true });
    dispatch({ type: 'SET_SHOW_MAP', payload: true });
  };

  const history = useHistory();
  const navigate = (path: string) => {
    history.push(path);
  };

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          dispatch({ type: 'SET_ACCOUNT_DATA', payload: userData || DEFAULT_ACCOUNT_MODES });
        }
      });
    }
  }, [dispatch, user]);

  const watchLocation = useCallback(() => {
    // (code omitted for brevity)
  }, [user]);

  useEffect(() => {
    if (user !== undefined && !loadingGroups) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, loadingGroups, error, dispatch]);

  useEffect(() => {
    if (user && state.getLocationClicked) {
      watchLocation();
    }
  }, [user, state.getLocationClicked, watchLocation]);

  let label = user?.username ? user.username : "anonymous";

  if (!user) {
    label = "anonymous";
  }

  useEffect(() => {
    if (user !== undefined && !loadingGroups) {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, loadingGroups, error, dispatch]);

  if (state.loading) {
    return <p>Loading...</p>; // Replace with a loading spinner if available
  }

  console.log('Loading fetchedGroups app.tsx', fetchedGroups);

  // rest of your component render logic
};

export default Map;
