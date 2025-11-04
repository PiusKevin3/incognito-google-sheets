const dbService = require('./dbService'); // Make sure this has a working db.query method

const upsertManifestEntry = async (entry, updatedAt = new Date()) => {
    const formId = entry?.General_ID1 ||entry?.form_id;

  try {
    if (!formId) {
      console.warn("⚠️ Skipped: Missing ID1 (form_id)");
      return {
        inserted: false,
        reason: "Missing form_id",
      };
    }

    let existing = null;

    try {
      existing = await dbService.findManifestByFormID(formId);
    } catch (checkErr) {
      console.warn(`⚠️ Could not check existing entries for form_id ${formId}. DB might be empty or uninitialized.`);
      existing = null; // Treat as not found
    }

    if (existing) {
      console.log(`⏭️ Entry with form_id ${formId} already exists. Skipping insert.`);
      return {
        inserted: false,
        reason: "Already exists",
        form_id: formId,
      };
    }

    // Proceed with insert
    const result = await dbService.insertManifestEntry(formId, entry, updatedAt);

    if (result?.rows?.length > 0) {
      console.log(`✅ Inserted new manifest entry: ${formId}`);
      return {
        inserted: true,
        form_id: formId,
        data: result.rows[0],
      };
    } else {
      console.log(`✅ Inserted new manifest entry (no row returned): ${formId}`);
      return {
        inserted: true,
        form_id: formId,
        data: null,
        note: "Insert succeeded but DB returned no row",
      };
    }

  } catch (err) {
    console.error(`❌ Failed to insert manifest entry for form_id ${formId}:`, err.message || err);
    return {
      inserted: false,
      reason: "Service error",
      error: err.message || err,
    };
  }
};


const plateExistsInDB = async (numberPlate) => {
    try {
        const existing = await dbService.findManifestByNumberPlate(numberPlate);
        if (existing) {
            console.log(`✅ Number plate exists in DB: ${numberPlate}`);
            return true;
        } else {
            console.log(`ℹ️ Number plate not found in DB: ${numberPlate}`);
            return false;
        }
    } catch (err) {
        console.error("❌ Error checking plate existence:", err);
        // Don't block processing even if DB check fails
        return false;
    }
};



module.exports = {
    upsertManifestEntry,
    plateExistsInDB
};