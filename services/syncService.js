const cron = require('node-cron');
const cognitoService = require('./cognitoService');
const dbService = require('./dbService');

const MANIFEST_FORM_ID = process.env.MANIFEST_FORM_ID;
const FINANCE_FORM_ID = process.env.FINANCE_FORM_ID;

async function syncCognitoEntries() {
  try {
    console.log('🔄 Starting Cognito entries sync');

    const forms = await cognitoService.getForms();

    for (const form of forms) {
      if (![MANIFEST_FORM_ID, FINANCE_FORM_ID].includes(form.id)) continue;

      const result = await dbService.getLatestCognitoEntry(form.id);
      const since = result.rows[0]
        ? new Date(result.rows[0].updated_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

      const newEntries = await cognitoService.getEntriesSince(form.id, since);

      for (const entry of newEntries) {
        const updatedAt = new Date(entry.updated_at || entry.created_at || Date.now());

        if (form.id === MANIFEST_FORM_ID) {
          await dbService.upsertManifestEntry(entry, updatedAt);
          console.log(`📄 Manifest entry upserted: ${entry.id}`);
        } else if (form.id === FINANCE_FORM_ID) {
          await dbService.upsertFinanceEntry(entry, updatedAt);
          console.log(`💰 Finance entry upserted: ${entry.id}`);
        }
      }
    }

    console.log('✅ Cognito sync complete');
    return { success: true };
  } catch (error) {
    console.error(`❌ Sync failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  start: () => {
    cron.schedule('*/15 * * * *', syncCognitoEntries);
    syncCognitoEntries();
  },
  syncNow: syncCognitoEntries,
};
