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
  }
};