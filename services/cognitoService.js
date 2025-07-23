const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
