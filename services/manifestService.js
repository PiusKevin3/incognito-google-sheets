// services/manifestService.js
const dbService = require('./dbService');

async function upsertManifestEntry(entry, updatedAt = new Date()) {
  try {
    const formId = entry?.TestAccountabilityForm_Id;

    if (!formId) {
      console.warn('⚠️ Skipped manifest entry: Missing ID1');
      return;
    }

    // Check if ID1 already exists
    const existing = await dbService.findManifestByFormID(formId);

    if (existing) {
      console.log(`⏭️ Manifest entry with ID1 ${formId} already exists. Skipping insert.`);
      return;
    }

    // Insert new entry
    const result = await dbService.upsertManifestEntry(entry, updatedAt);

    console.log(`✅ Inserted new manifest entry: ${formId}`);
    return result;
  } catch (err) {
    console.error(`❌ Error in upsertManifestEntry:`, err.message);
    throw err;
  }
}

module.exports = {
  upsertManifestEntry,
};
