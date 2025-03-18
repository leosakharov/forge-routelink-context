import React, { useEffect, useState } from 'react';
import { events, invoke } from '@forge/bridge';

console.log("App.js loaded");

function App() {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notApplicable, setNotApplicable] = useState(false);

  const GOOGLE_MAPS_URL = "https://www.google.com/maps/dir/";

  const handleFetchSuccess = (data) => {
    console.log('Received data from backend:', data);
    
    // If data is null, the issue doesn't meet our criteria (wrong status or missing addresses)
    if (!data) {
      console.log('No data returned, panel not applicable');
      setNotApplicable(true);
      setLoading(false);
      return;
    }
    
    if (!data.start || !data.end) {
      console.log('Missing address information in data');
      setError('Missing address information');
      setLoading(false);
      return;
    }
    
    // No need to parse coordinates, just use the addresses directly
    console.log(`Setting route data - Start: ${data.start}, End: ${data.end}`);
    setRouteData({
      startString: data.start,
      endString: data.end
    });
    setLoading(false);
  };

  const handleFetchError = (err) => {
    console.error('Failed to get route data:', err);
    setError('Failed to load route data. Please check the console for details.');
    setLoading(false);
  };

  useEffect(() => {
    console.log('App mounted, fetching issue details...');
    const fetchIssueDetails = async () => {
      try {
        console.log('Invoking fetchIssueDetails resolver...');
        const result = await invoke('fetchIssueDetails');
        console.log('Resolver returned:', result);
        return result;
      } catch (error) {
        console.error('Error invoking resolver:', error);
        throw error;
      }
    };
    
    fetchIssueDetails().then(handleFetchSuccess).catch(handleFetchError);
    
    console.log('Setting up issue changed event listener...');
    const subscribeForIssueChangedEvent = () =>
      events.on('JIRA_ISSUE_CHANGED', () => {
        console.log('Issue changed, refreshing data...');
        setLoading(true);
        fetchIssueDetails().then(handleFetchSuccess).catch(handleFetchError);
      });
    
    const subscription = subscribeForIssueChangedEvent();

    return () => {
      console.log('App unmounting, cleaning up subscription...');
      subscription.then((subscription) => subscription.unsubscribe());
    };
  }, []);

  const getGoogleMapsUrl = () => {
    if (routeData) {
      console.log('Creating Google Maps URL with:', routeData);
      
      // Validate addresses
      if (!routeData.startString || !routeData.endString) {
        console.error('Invalid addresses:', routeData);
        setError('Invalid addresses format');
        return '';
      }
      
      try {
        // Format: https://www.google.com/maps/dir/?api=1&origin=ADDRESS1&destination=ADDRESS2&travelmode=driving
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeData.startString)}&destination=${encodeURIComponent(routeData.endString)}&travelmode=driving`;
        console.log('Generated URL:', url);
        return url;
      } catch (err) {
        console.error('Error generating Google Maps URL:', err);
        setError('Error generating route URL');
        return '';
      }
    }
    return '';
  };

  if (loading) {
    return (
      <div style={{ padding: '8px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px' }}>Loading...</div>
      </div>
    );
  }

  if (notApplicable) {
    return (
      <div style={{ padding: '8px' }}>
        <div style={{ color: '#6B778C', fontSize: '12px' }}>
          Requires "Planned" or "Ready for pick up" status and valid addresses.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '8px' }}>
        <div style={{ color: '#DE350B', fontSize: '12px' }}>Error loading route data</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '8px' }}>
      <a 
        href={getGoogleMapsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          backgroundColor: '#0052CC',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '3px',
          textDecoration: 'none',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '8px'
        }}
      >
        Open in Google Maps
      </a>
      
      <div style={{ fontSize: '12px', color: '#6B778C' }}>
        <p style={{ margin: '4px 0' }}><strong>Pickup:</strong> {routeData.startString}</p>
        <p style={{ margin: '4px 0' }}><strong>Delivery:</strong> {routeData.endString}</p>
      </div>
    </div>
  );
}

export default App;
