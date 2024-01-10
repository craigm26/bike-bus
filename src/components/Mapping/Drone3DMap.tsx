import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../../firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader, StandaloneSearchBox, MarkerClusterer, KmlLayer } from "@react-google-maps/api";
import { IonButton } from '@ionic/react';
import { httpsCallable, getFunctions, HttpsCallable } from 'firebase/functions';

const functions = getFunctions();




const libraries: any = ["places", "drawing", "geometry", "localContext", "visualization"];

// Define a type for the video metadata
interface VideoMetadata {
  videoId: string;
  state: string;
  // Add other relevant properties
}

interface Drone3DMapProps {
  routeId: string;
  routeName: string;
  startPoint: { lat: number; lng: number };
  endPoint: { lat: number; lng: number } | null;
  pathCoordinates: { latitude: number; longitude: number }[];
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface RenderPayload {
  type: string;
  scene: {
    animation: {
      type: string;
      path: Coordinates[];
    };
  };
}


const Drone3DMap: React.FC<Drone3DMapProps> = ({ routeId, routeName, startPoint, endPoint, pathCoordinates }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoExists, setVideoExists] = useState(false);

  // Firebase Functions

  const renderVideoFunction = httpsCallable<{payload: RenderPayload}, {videoId: string}>(functions, 'renderVideo');
  const checkVideoStatusFunction = httpsCallable<{videoId: string}, {videoStatus: string}>(functions, 'checkVideoStatus');
  const saveVideoIdToFirestoreFunction = httpsCallable<{videoId: string, routeId: string}, void>(functions, 'saveVideoIdToFirestore');
  const fetchVideoUriFunction = httpsCallable<{videoId: string}, {videoUri: string}>(functions, 'fetchVideoUri');
  

  const handleGenerateNewVideo = useCallback(async () => {
    setLoading(true);
    try {
      const payload = constructPayload(pathCoordinates);
      const videoIdResult = await renderVideoFunction({ payload });
      const videoId: string = videoIdResult.data.videoId;
      
      let videoStatusResult;
      do {
        videoStatusResult = await checkVideoStatusFunction({ videoId });
      } while (videoStatusResult.data.videoStatus !== 'ACTIVE');
      
      const videoUriResult = await fetchVideoUriFunction({ videoId });
      const videoUri = videoUriResult.data.videoUri;
      setVideoUrl(videoUri);

      await saveVideoIdToFirestoreFunction({ videoId, routeId });
    } catch (error) {
      console.error('Error generating new video:', error);
    } finally {
      setLoading(false);
    }
  }, [pathCoordinates, routeId]);


  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });

  const saveVideoIdToFirestore = async (videoId: string) => {
    try {
      const videosRef = collection(db, "videos");
      const q = query(videosRef, where("routeId", "==", routeId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.size > 0) {
        console.log("Video ID already exists in Firestore");
        return;
      }
      await addDoc(collection(db, "videos"), {
        routeId,
        videoId,
        createdAt: new Date(),
      });
      console.log("Video ID saved to Firestore");
    } catch (error) {
      console.error('Error saving video ID to Firestore:', error);
    }
  };


  const fetchExistingVideo = useCallback(async () => {
    try {
      const videosRef = collection(db, "videos");
      const q = query(videosRef, where("routeId", "==", routeId));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const videoDoc = querySnapshot.docs[0].data();
        setVideoUrl(videoDoc.videoId);
        setVideoExists(true);
        console.log("Video ID already exists in Firestore");
      }
    } catch (error) {
      console.error('Error fetching existing video:', error);
    }
  }, [routeId]);

  const constructPayload = (pathCoordinates: Coordinates[]): RenderPayload => {
    const path = pathCoordinates.map((coord: Coordinates) => ({
      latitude: coord.latitude,
      longitude: coord.longitude,
    }));

    return {
      "type": "scene",
      "scene": {
        "animation": {
          "type": "flyover",
          "path": path,
        },
      },
    };
  };


  const checkVideoMetadata = async (location: { lat: number; lng: number }): Promise<VideoMetadata | null> => {
    // Implement lookupVideoMetadata logic
    // Return video metadata or null
    return null; // Placeholder
  };

  

  const renderVideo = async (payload: RenderPayload): Promise<string> => {
    try {
      const response = await fetch('https://aerialview.googleapis.com/v1:renderVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.videoId;
    } catch (error) {
      console.error('Error rendering video:', error);
      throw error; // Propagate the error for upstream handling
    }
  };

  const pollVideoState = async (videoId: string): Promise<VideoMetadata> => {
    let attempts = 0;
    const maxAttempts = 10;

    const checkStatus = async (): Promise<VideoMetadata> => { // Added return type Promise<VideoMetadata>
      const response = await fetch(`https://aerialview.googleapis.com/v1:lookupVideoMetadata?videoId=${videoId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}` // Use your env variable here
        }
      });

      const metadata: VideoMetadata = await response.json(); // Assumed return type from your API call
      if (metadata.state === 'ACTIVE' || attempts >= maxAttempts) {
        return metadata;
      }

      attempts++;
      const delay = Math.pow(2, attempts) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return await checkStatus(); // Await the recursive call
    };

    return await checkStatus(); // Await the initial call
  };

  const initiateVideoRendering = useCallback(async () => {
    setLoading(true);
    const payload = constructPayload(pathCoordinates);
    const videoId = await renderVideo(payload);
    const metadata = await pollVideoState(videoId);
    if (metadata.state === 'ACTIVE') {
      const videoUri = await fetchVideoUri(videoId);
      setVideoUrl(videoUri);
      await saveVideoIdToFirestore(videoId);
    }
    setLoading(false);
  }, [pathCoordinates]);

  const checkAndRenderVideo = useCallback(async () => {
    setLoading(true);
    let metadata = await checkVideoMetadata(startPoint);
    if (!metadata) {
      await initiateVideoRendering();
    } else if (metadata.state === 'ACTIVE') {
      const videoUri = await fetchVideoUri(metadata.videoId);
      setVideoUrl(videoUri);
    } else {
      // Handle case where metadata exists but state is not 'ACTIVE'
    }
    setLoading(false);
  }, [startPoint, initiateVideoRendering]);

  // Check for an existing video on component mount
  useEffect(() => {
    fetchExistingVideo();
  }, [fetchExistingVideo]);

  // Once it's confirmed that there is no existing video, check and render
  useEffect(() => {
    if (!videoExists) {
      checkAndRenderVideo();
    }
  }, [videoExists, checkAndRenderVideo]);

  const fetchVideoUri = async (videoId: string): Promise<string | null> => {
    try {
      const response = await fetch(`https://aerialview.googleapis.com/v1:lookupVideo?videoId=${videoId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const videoData = await response.json();
      return videoData.videoUri;
    } catch (error) {
      console.error('Error fetching video URI:', error);
      return null;
    }
  };
  

  useEffect(() => {
    const initFetchVideo = async () => {
      try {
        await fetchExistingVideo();
      } catch (error) {
        console.error('Error fetching existing video:', error);
      }
    };
    initFetchVideo();
  }, [fetchExistingVideo]);

  useEffect(() => {
    if (!videoExists) {
      // Proceed only if a video does not exist
      setLoading(true);
      try {
        // ...[existing code to generate and fetch video]
      } catch (error) {
        console.error('Error loading 3D drone video:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [startPoint, endPoint, pathCoordinates, videoExists]);

  useEffect(() => {
    const initVideo = async () => {
      setLoading(true);
      try {
        let metadata = await checkVideoMetadata(startPoint);

        if (!metadata) {
          const payload = constructPayload(pathCoordinates); // Construct payload from pathCoordinates
          const videoId = await renderVideo(payload); // Render the video using the payload
          await pollVideoState(videoId);
          metadata = await checkVideoMetadata(startPoint); // Re-check metadata after video rendering
        }

        if (metadata && metadata.state === 'ACTIVE') {
          await fetchVideoUri(metadata.videoId);
        }
      } catch (error) {
        console.error('Error loading 3D drone video:', error);
      } finally {
        setLoading(false);
      }
    };

    initVideo();
  }, [startPoint, endPoint, pathCoordinates]);


  return (
    <div>
      <h5>Aerial 3D Map - {routeName}</h5>
      {loading ? (
        <p>Loading Aerial 3D view...</p>
      ) : videoUrl ? (
        <video width="200" height="100" src={videoUrl} controls />
      ) : (
        <p>Aerial 3D map not available.</p>
      )}
      {videoUrl && (
        <IonButton size="small" onClick={handleGenerateNewVideo}>Generate New Video</IonButton>
      )}
    </div>
  );
};

export default Drone3DMap;