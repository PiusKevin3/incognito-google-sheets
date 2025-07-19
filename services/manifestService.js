const dbService = require('./dbService'); // Make sure this has a working db.query method

const upsertManifestEntry = async (entry, updatedAt = new Date()) => {
    const formId = entry?.General_ID1;


    if (!formId) {
        console.warn("⚠️ Skipped: Missing ID1 (form_id)");
        return;
    }

    // Check if FormID already exists
    const existing = await dbService.findManifestByFormID(formId);


    if (existing) {
        console.log(`⏭️ Entry with form_id ${formId} already exists. Skipping insert.`);
        return {
            inserted: false,
            reason: "Already exists",
            form_id: formId,
        }; // Skip insertion
    }

    try {
        console.log(entry.rows);

        const result = await dbService.insertManifestEntry(formId, entry, updatedAt);
        console.log(`✅ Inserted new manifest entry: ${formId}`);
        return {
            inserted: true,
            form_id: formId,
            data: result.rows[0],
        };

    } catch (err) {
        console.log(err);

        console.error(`❌ Failed to insert manifest entry for form_id ${formId}`, err.message || err);
        return {
            inserted: false,
            reason: "Service error",
            error: err.message || err,
        };
    }

};

module.exports = {
    upsertManifestEntry,
};