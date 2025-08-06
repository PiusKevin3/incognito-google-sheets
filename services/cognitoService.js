const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const axios = require('axios')

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

  getFormEntriesData: async (formId, viewId, formAccessToken, filter = null) => {
   var url = `https://www.cognitoforms.com/api/odata/Forms(675)/Views(1)/Entries?access_token=${formAccessToken}`;

    if (filter) {
      url += `&$filter=${filter}`;
    }

    console.log(formId, viewId, formAccessToken, url);
   
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PostmanRuntime/7.45.0',
        'Accept': 'application/json;odata.metadata=minimal',
        'Postman-Token': '29ed4d31-8179-4329-812c-5ab3291c2de9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });

   if (!response.ok) {
     throw new Error(`Failed to fetch entries: ${response.statusText}`);
   }

   return response.json();
 },

  updateCognitoEntry: async (formId, entryId, updatedFields) => {
    try {
      const response = await fetch(`https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`, {
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
    const response = await fetch(`https://www.cognitoforms.com/api/forms/${formId}/entries/${entryId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.COGNITO_SECRET_TOKEN}`
        }
    });

    return response.json();
  }
};
