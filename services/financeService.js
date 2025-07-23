// services/financeService.js
const dbService = require('./dbService');
const { parseNumeric } = require('../utils/numericUtils');

async function upsertFinanceEntry(entry, updatedAt = new Date()) {
  try {
    const formId = entry.Section_AccountabilityEntry;

    if (!formId) {
      console.warn('⚠️ Skipped finance entry: Missing FormID');

      return;
    }

    // Check if FormID already exists
    const existing = await dbService.findFinanceByFormID(formId);

    if (existing) {
      console.log(`⏭️ Finance entry with FormID ${formId} already exists. Skipping insert.`);
       return {
            inserted: false,
            reason: "Already exists",
            form_id: formId,
        };
    }

    // Parse numeric fields
    entry.Section_Amount = parseNumeric(entry.Section_Amount);
    entry.Section_Balance = parseNumeric(entry.Section_Balance);
    entry.Section_FinalBalance = parseNumeric(entry.Section_FinalBalance);
    entry.Section_CostOfVehicle = parseNumeric(entry.Section_CostOfVehicle);
    entry.Section_Contribution = parseNumeric(entry.Section_Contribution);
    entry.Section_BookingFee = parseNumeric(entry.Section_BookingFee);

    // Insert new entry
    const result = await dbService.insertFinanceEntry(entry, updatedAt);

    console.log(`✅ Inserted new finance entry: ${formId}`);

       return {
            inserted: true,
            form_id: formId,
            data: result.rows[0],
        };
  } catch (err) {
    console.error(`❌ Error in insertFinanceEntry:`, err.message);

      return {
            inserted: false,
            reason: "Service error",
            error: err.message || err,
        };
  }
}

module.exports = {
  upsertFinanceEntry,
};
