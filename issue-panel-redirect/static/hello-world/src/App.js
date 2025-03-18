import React, { useEffect, useState } from 'react';
import { events, invoke } from '@forge/bridge';

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
      // Format: https://www.google.com/maps/dir/?api=1&origin=ADDRESS1&destination=ADDRESS2&travelmode=driving
      const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeData.startString)}&destination=${encodeURIComponent(routeData.endString)}&travelmode=driving`;
      console.log('Generated URL:', url);
      return url;
    }
    return '';
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div style={{ margin: '20px 0' }}>Loading route data...</div>
      </div>
    );
  }

  if (notApplicable) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ color: '#6B778C', fontSize: '14px' }}>
          This panel is only available for issues with status "Planned" or "Ready for pick up" 
          and requires both pickup and delivery addresses.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ color: '#DE350B', marginBottom: '8px', fontWeight: 'bold' }}>Error</div>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Delivery Route</h3>
      <p>View the route from pickup to delivery location:</p>
      
      <a 
        href={getGoogleMapsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          backgroundColor: '#0052CC',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '3px',
          textDecoration: 'none',
          fontWeight: 'bold',
          marginTop: '8px'
        }}
      >
        Open in Google Maps
      </a>
      
      <div style={{ marginTop: '16px', fontSize: '13px', color: '#6B778C' }}>
        <p><strong>Pickup address:</strong> {routeData.startString}</p>
        <p><strong>Delivery address:</strong> {routeData.endString}</p>
      </div>
    </div>
  );
}

export default App;
