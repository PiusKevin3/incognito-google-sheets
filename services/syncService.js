const cron = require('node-cron');
const cognitoService = require('./cognitoService');
const dbService = require('./dbService');

async function syncCognitoEntries() {
  try {
    console.log('Starting Cognito entries sync');
    const forms = await cognitoService.getForms();
    
    for (const form of forms) {
      const result = await dbService.getLatestCognitoEntry(form.id);
      const since = result.rows[0] 
        ? new Date(result.rows[0].created_at) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const newEntries = await cognitoService.getEntriesSince(form.id, since);
      
      for (const entry of newEntries) {
        await dbService.saveCognitoEntry(
          form.id, 
          entry.id, 
          entry
        );
      }
    }
  } catch (error) {
    console.error(`Sync failed: ${error.message}`);
  }
}

module.exports = {
  start: () => cron.schedule('*/15 * * * *', syncCognitoEntries)
};