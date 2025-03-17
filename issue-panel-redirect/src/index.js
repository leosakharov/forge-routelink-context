import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
const resolver = new Resolver();

resolver.define('fetchIssueDetails', async (req) => {
  const key = req.context.extension.issue.key;

  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${key}`);
  const data = await res.json();

  // In a real app, you would use the actual custom field IDs for start and end locations
  // For this example, we'll use mock data if the custom fields don't exist
  const startLocation = data.fields.customfield_startLocation || "55.676098,12.568337"; // Copenhagen
  const endLocation = data.fields.customfield_endLocation || "55.673874,12.564581"; // Nearby location

  return {
    start: startLocation,
    end: endLocation
  };
});

export const handler = resolver.getDefinitions();
