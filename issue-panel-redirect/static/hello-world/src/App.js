import React, { useEffect, useState } from 'react';
import { events, invoke } from '@forge/bridge';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to create a polyline between two points
function RouteLine({ start, end }) {
  const map = useMap();
  
  useEffect(() => {
    if (start && end) {
      // Create a polyline between start and end points
      const polyline = L.polyline([start, end], { color: 'blue' }).addTo(map);
      
      // Fit the map to show the entire route
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }
  }, [map, start, end]);
  
  return null;
}

function App() {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const GOOGLE_MAPS_URL = "https://www.google.com/maps/dir/?api=1";

  const handleFetchSuccess = (data) => {
    if (!data || !data.start || !data.end) {
      setError('Invalid location data received');
      setLoading(false);
      return;
    }
    
    // Convert string coordinates to arrays of numbers
    const startCoords = data.start.split(',').map(coord => parseFloat(coord.trim()));
    const endCoords = data.end.split(',').map(coord => parseFloat(coord.trim()));
    
    if (startCoords.length !== 2 || endCoords.length !== 2 || 
        isNaN(startCoords[0]) || isNaN(startCoords[1]) || 
        isNaN(endCoords[0]) || isNaN(endCoords[1])) {
      setError('Invalid coordinates format');
      setLoading(false);
      return;
    }
    
    setRouteData({
      start: startCoords,
      end: endCoords,
      startString: data.start,
      endString: data.end
    });
    setLoading(false);
  };

  const handleFetchError = (err) => {
    console.error('Failed to get route data:', err);
    setError('Failed to load route data');
    setLoading(false);
  };

  useEffect(() => {
    const fetchIssueDetails = async () => invoke('fetchIssueDetails');
    fetchIssueDetails().then(handleFetchSuccess).catch(handleFetchError);
    
    const subscribeForIssueChangedEvent = () =>
      events.on('JIRA_ISSUE_CHANGED', () => {
        setLoading(true);
        fetchIssueDetails().then(handleFetchSuccess).catch(handleFetchError);
      });
    
    const subscription = subscribeForIssueChangedEvent();

    return () => {
      subscription.then((subscription) => subscription.unsubscribe());
    };
  }, []);

  const openGoogleMaps = () => {
    if (routeData) {
      const url = `${GOOGLE_MAPS_URL}&origin=${routeData.startString}&destination=${routeData.endString}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return <div>Loading route data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '10px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Route is ready!</h3>
        <button 
          onClick={openGoogleMaps}
          style={{
            backgroundColor: '#0052CC',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Open in Google Maps
        </button>
      </div>
      
      <div style={{ flexGrow: 1, minHeight: '300px' }}>
        <MapContainer 
          center={routeData.start} 
          zoom={13} 
          style={{ height: '100%', width: '100%', minHeight: '300px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={routeData.start}>
            <Popup>Start Location</Popup>
          </Marker>
          <Marker position={routeData.end}>
            <Popup>Destination</Popup>
          </Marker>
          <RouteLine start={routeData.start} end={routeData.end} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
