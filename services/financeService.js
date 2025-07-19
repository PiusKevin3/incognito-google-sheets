// services/financeService.js
const dbService = require('./dbService');
const { parseNumeric } = require('../utils/helpers');

async function upsertFinanceEntry(entry, updatedAt = new Date()) {
  try {
    const formId = entry;
            console.log(formId);


    if (!formId) {
      console.warn('⚠️ Skipped finance entry: Missing FormID');
      return;
    }

    // Check if FormID already exists
    const existing = await dbService.findFinanceByFormID(formId);

    if (existing) {
      console.log(`⏭️ Finance entry with FormID ${formId} already exists. Skipping insert.`);
      return;
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
    return result;
  } catch (err) {
    console.error(`❌ Error in upsertFinanceEntry:`, err.message);
    throw err;
  }
}

module.exports = {
  upsertFinanceEntry,
};
