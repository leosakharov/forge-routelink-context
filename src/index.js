import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
const resolver = new Resolver();

resolver.define('fetchIssueDetails', async (req) => {
  try {
    console.log('Fetching issue details...');
    const key = req.context.extension.issue.key;
    console.log(`Issue key: ${key}`);
    
    /*
    // Check if we're on the specific site
    const siteUrl = req.context.extension.site?.url || '';
    console.log(`Site URL: ${siteUrl}`);
    const isTargetSite = siteUrl.includes('haulier-semanticbiz.atlassian.net');
    
    if (!isTargetSite) {
      console.log('Not on target site, panel will not be shown');
      return null;
    }
    */

    const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}`);
    
    if (!res.ok) {
      console.error(`Failed to fetch issue data: ${res.status} ${res.statusText}`);
      return null;
    }
    
    const data = await res.json();
    console.log('Issue data fetched successfully');

    // Get the issue status
    const status = data.fields.status?.name?.toLowerCase() || '';
    console.log(`Issue status: ${status}`);
    const isRelevantStatus = status === 'planned' || status === 'ready for pick up';
    
    if (!isRelevantStatus) {
      console.log('Issue status is not relevant, skipping panel');
      return null;
    }

    // Get the pickup and delivery addresses from the custom fields
    console.log('Checking for custom fields...');
    console.log(`Custom fields available: ${Object.keys(data.fields).filter(key => key.startsWith('customfield_')).join(', ')}`);
    
    const pickupAddress = data.fields.customfield_10062 || '';
    const deliveryAddress = data.fields.customfield_10063 || '';
    
    console.log(`Pickup address: ${pickupAddress}`);
    console.log(`Delivery address: ${deliveryAddress}`);

    // If addresses are missing, return null
    if (!pickupAddress || !deliveryAddress) {
      console.log('Missing address information, skipping panel');
      return null;
    }

    // Validate addresses (basic validation)
    if (pickupAddress.trim() === '' || deliveryAddress.trim() === '') {
      console.log('Empty address strings found, skipping panel');
      return null;
    }

    // Return the data with addresses
    console.log('Returning address data for panel');
    return {
      start: pickupAddress,
      end: deliveryAddress,
      isRelevantStatus: true
    };
  } catch (error) {
    console.error('Error in fetchIssueDetails:', error);
    return null;
  }
});

export const handler = resolver.getDefinitions();
