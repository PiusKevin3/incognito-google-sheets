const dbService = require('./dbService'); // Make sure this has a working db.query method

const upsertManifestEntry = async (entry, updatedAt = new Date()) => {
    const formId = entry?.General_ID1 ||entry?.form_id;

    console.log(entry);


    try {
        if (!formId) {
            console.warn("⚠️ Skipped: Missing ID1 (form_id)");
            return;
        }
        // Check if FormID already exists
        const existing = await dbService.findManifestByFormID(formId);
        console.log(existing);
        console.log("Tocheck if id form exists");




        if (existing) {
            console.log(`⏭️ Entry with form_id ${formId} already exists. Skipping insert.`);
            return {
                inserted: false,
                reason: "Already exists",
                form_id: formId,
            }; // Skip insertion
        }
        console.log(entry);
        console.log("After checking if id doesnt exists");


        const result = await dbService.insertManifestEntry(formId, entry, updatedAt);
        console.log(`✅ Inserted new manifest entry: ${formId}`);
        console.log(result);
        
        return {
            inserted: true,
            form_id: formId,
            data: result.rows?.[0] || null,
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

const plateExistsInDB = async (numberPlate) => {
    const existing = await dbService.findManifestByNumberPlate(numberPlate);
    console.log(existing);
    
    return !!existing;
};


module.exports = {
    upsertManifestEntry,
    plateExistsInDB
};