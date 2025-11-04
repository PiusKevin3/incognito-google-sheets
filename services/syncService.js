const cron = require('node-cron');
const cognitoService = require('./cognitoService');
const dbService = require('./dbService');

const MANIFEST_FORM_ID = process.env.MANIFEST_FORM_ID;
const FINANCE_FORM_ID = process.env.FINANCE_FORM_ID;

const MANIFEST_FORM_VIEW_ID = process.env.MANIFEST_FORM_VIEW_ID;
const FINANCE_FORM_VIEW_ID = process.env.FINANCE_FORM_VIEW_ID;

const MANIFEST_FORM_ACCESS_TOKEN = process.env.MANIFEST_FORM_ACCESS_TOKEN;
const FINANCE_FORM_ACCESS_TOKEN = process.env.FINANCE_FORM_ACCESS_TOKEN;

const formConfigs = [
  {
    id: MANIFEST_FORM_ID,
    viewId: MANIFEST_FORM_VIEW_ID,
    accessToken: MANIFEST_FORM_ACCESS_TOKEN,
    upsertFn: dbService.upsertManifestEntry,
    label: 'Manifest'
  },
  {
    id: FINANCE_FORM_ID,
    viewId: FINANCE_FORM_VIEW_ID,
    accessToken: FINANCE_FORM_ACCESS_TOKEN,
    upsertFn: dbService.upsertFinanceEntry,
    label: 'Finance'
  }
];

async function syncCognitoEntries() {
  try {
    console.log('🔄 Starting Cognito entries sync');

    const forms = await cognitoService.getForms();

    for (const config of formConfigs) {
      const formExists = forms.find(f => f.id === config.id);
      if (!formExists) {
        console.warn(`⚠️ Form ID ${config.id} not found in Cognito account`);
        continue;
      }

      // Get latest synced record timestamp from DB
      const latestResult = await dbService.getLatestCognitoEntry(config.id);
      const lastSyncedAt = latestResult.rows[0]
        ? new Date(latestResult.rows[0].updated_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24h

      const allEntries = await cognitoService.getFormEntriesData(
        config.id,
        config.viewId,
        config.accessToken
      );

      const filteredEntries = allEntries.filter(entry => {
        const createdAt = new Date(entry.CreatedAt || 0);
        const updatedAt = new Date(entry.UpdatedAt || 0);
        return createdAt > lastSyncedAt || updatedAt > lastSyncedAt;
      });

      for (const entry of filteredEntries) {
        const updatedAt = new Date(entry.UpdatedAt || entry.CreatedAt || Date.now());
        await config.upsertFn(entry, updatedAt);
        console.log(`${config.label} entry upserted: ${entry.Id}`);
      }

      console.log(`${config.label} form synced with ${filteredEntries.length} new entries`);
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
    cron.schedule('*/15 * * * *', syncCognitoEntries); // Every 15 minutes
    syncCognitoEntries(); // Run immediately at start
  },
  syncNow: syncCognitoEntries
};
