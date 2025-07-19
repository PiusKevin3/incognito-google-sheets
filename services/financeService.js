// services/financeService.js
const dbService = require('./dbService');
const { parseNumeric } = require('../utils/helpers');

async function upsertFinanceEntry(entry, updatedAt = new Date()) {
  try {
    const formId = entry.Section_AccountabilityEntry;
            console.log(formId);


    if (!formId) {
      console.warn('⚠️ Skipped finance entry: Missing FormID');
      return;
    }

    // Check if FormID already exists
    const existing = await dbService.findFinanceByFormID(formId);

    if (existing) {
      console.log(`⏭️ Finance entry with FormID ${formId} already exists. Skipping insert.`);
        return {
            inserted: true,
            form_id: formId,
            data: result.rows[0],
        };
    }

    // Parse numeric fields
    entry.Amount = parseNumeric(entry.Amount);
    entry.Balance = parseNumeric(entry.Balance);
    entry.FinalBalance = parseNumeric(entry.FinalBalance);
    entry.CostOfVehicle = parseNumeric(entry.CostOfVehicle);
    entry.Contribution = parseNumeric(entry.Contribution);
    entry.BookingFee = parseNumeric(entry.BookingFee);

    // Insert new entry
    const result = await dbService.upsertFinanceEntry(entry, updatedAt);

    console.log(`✅ Inserted new finance entry: ${formId}`);
       return {
            inserted: true,
            form_id: formId,
            data: result.rows[0],
        };
  } catch (err) {
    console.error(`❌ Error in upsertFinanceEntry:`, err.message);
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
