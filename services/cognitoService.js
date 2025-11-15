const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { parseIntId } = require('../utils/numericUtils');

module.exports = {
  getForms: async () => {
    const response = await fetch('https://api.cognitoforms.com/v1/forms', {
      headers: {
        'Authorization': `Bearer ${process.env.COGNITO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  getEntriesSince: async (formId, sinceDate) => {
    const url = `https://api.cognitoforms.com/v1/forms/${formId}/entries?since=${sinceDate.toISOString()}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.COGNITO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  
  getFormEntriesData: async (formId, viewId,formAccessToken) => {

  const url = `https://www.cognitoforms.com/f/api/odata/Forms(${formId})/Views(${viewId})/Entries?access_token=${formAccessToken}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch entries: ${response.statusText}`);
  }

  return response.json();
},


  updateCognitoEntry: async (formId, entryId, updatedFields) => {
    try {
      const formattedEntryId = parseIntId(entryId);
      const response = await fetch(`https://www.cognitoforms.com/api/forms/${formId}/entries/${formattedEntryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COGNITO_SECRET_TOKEN}`
        },
        body: JSON.stringify({
            Entry: {
                Action: 'Update',
                Role: 'Public'
            },
            ...updatedFields
        })
    });

    if (!response.ok) {
        throw new Error('Failed to update Cognito form');
    }

    } catch (error) {
        console.error('Error updating Cognito form:', error);
        throw error;
    }
  },

  fetchEntry: async (formId, entryId) => {
    const formattedEntryId = parseIntId(entryId);
    const response = await fetch(`https://www.cognitoforms.com/api/forms/${formId}/entries/${formattedEntryId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.COGNITO_SECRET_TOKEN}`
        }
    });

    return response.json();
  }
};
