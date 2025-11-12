const crypto = require('crypto');
const xlsx = require('xlsx');
const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry, plateExistsInDB } = require('../services/manifestService');
const { upsertBudgetEntry, checkBudgetByCode,checkBudgetByCodeAndStage } = require('../services/dbService');
// const infisicalService = require('../services/infisicalService');

// ----------------------
// Column Mappings
// ----------------------
const BUDGET_COLUMN_MAPPINGS = {
  'Details_Code': 'code',
  'Details_Region': 'region',
  'Details_Division': 'division',
  'Details_Manifests': 'manifest',
  'Details_Institution': 'institutions',
  'Details_Schools': 'schools',
  'Details_StageName': 'stage_name',
  'Planned_People': 'planned_people',
  'Planned_Taxis': 'planned_taxis',
  'Planned_Coasters': 'planned_coasters',
  'Planned_Buses': 'planned_buses',
  'Planned_TotalCost': 'total_cost',
  'Planned_CostPerHead': 'cost_per_head',
  'Planned_CoasterCampaign': 'coaster_campaign',
  'Planned_ManifestPledge': 'manifest_pledge',
  'Planned_Contribution': 'contribution',
  'Details_Department': 'department'
};


const MANIFEST_COLUMN_MAPPINGS = {
  'ID': 'form_id',
  'Event': 'event',
  'Department': 'department',
  'Manifests': 'manifest',
  'Institutions': 'institutions',
  'Schools': 'schools',
  'UpCountry': 'up_country',
  'Stage Name': 'stage_name',
  'Name': 'coordinator_name',
  'Contact': 'coordinator_contact',
  'NIN/Permit no.': 'driver_nin_permit_no',
  'Vehicle Type': 'driver_vehicle_type',
  'Number Plate': 'driver_number_plate',
  'Cost Of Vehicle': 'cost_of_vehicle',
  'Cash Contribution': 'cash_contribution',
  'Booking Fee': 'driver_booking_fee',
  'Balance': 'balance',
  'Cost Per Head': 'cost_per_head',
  'TOTAL': 'total',
  'No. of people': 'people',
  'First Timers': 'first_timers',
  'Verifier name': 'verifier_name'
};

const FINANCE_COLUMN_MAPPINGS = {
  'Funding Party': 'funding_party',
  'Amount': 'amount',
  'Issued By': 'issued_by',
  'Received By': 'received_by',
  'Form ID': 'form_id',
  'Final Balance': 'final_balance',
  'ManifestName': 'manifest_name',
  'InstitutionName': 'institution_name',
  'SchoolName': 'school_name',
  'Department': 'department',
  'CostOfVehicle': 'cost_of_vehicle',
  'Balance': 'balance',
  'StageName': 'stage_name',
  'Contribution': 'contribution',
  'BookingFee': 'booking_fee',
  'Event': 'event'
};

// ----------------------
// Dynamic Required columns
// ----------------------
const REQUIRED_COLUMNS = {
  budget: Object.keys(BUDGET_COLUMN_MAPPINGS),
  manifest: Object.keys(MANIFEST_COLUMN_MAPPINGS),
  finance: Object.keys(FINANCE_COLUMN_MAPPINGS)
};

// ----------------------
// Helpers
// ----------------------
function flattenObject(obj, prefix = '') {
  let result = {};
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenObject(obj[key], `${prefix}${key}_`));
    } else {
      result[`${prefix}${key}`] = obj[key];
    }
  }
  return result;
}

function flattenXlsxObject(obj, prefix = '', keyMapping = null) {
  let result = {};
  for (let key in obj) {
    if (keyMapping && keyMapping[key]) {
      const mappedKey = keyMapping[key];
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(result, flattenObject(obj[key], `${prefix}${mappedKey}_`, keyMapping));
      } else {
        result[`${prefix}${mappedKey}`] = obj[key];
      }
    }
  }
  return result;
}

function validateApiKey(req, res, next) {
  const providedApiKey = req.query.apiKey;
  if (providedApiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      message: "Invalid or missing API key"
    });
  }
  next();
}

function verifyCognitoSignature(req) {
  if (!process.env.COGNITO_WEBHOOK_SECRET) return true;
  const computedSignature = crypto
    .createHmac('sha256', process.env.COGNITO_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  const providedSignature = req.headers['x-cognito-signature'];
  return computedSignature === providedSignature;
}

// ----------------------
// Column Validation
// ----------------------
async function validateColumns(type, actualColumns) {
  const required = REQUIRED_COLUMNS[type] || [];
  const normalize = str => str.trim().toUpperCase();
  const normalizedActual = actualColumns.map(normalize);
  const missingColumns = required.filter(
    col => !normalizedActual.includes(normalize(col))
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing columns for ${type}: ${missingColumns.join(', ')}`);
  }
}

// ----------------------
// Main Excel Processor
// ----------------------
async function processXlsxSyncUpload(file, type) {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  if (!sheetData.length) throw new Error("Empty Excel file");

  const headers = sheetData[0];
  console.log("All Columns:", headers);
  await validateColumns(type, headers);

  const dataObjects = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (!row || row.every(cell => !cell)) continue;
    const obj = {};
    headers.forEach((header, index) => (obj[header] = row[index]));
    dataObjects.push(obj);
  }

  const results = [];
  const seenPlates = new Set();

  for (const row of dataObjects) {
    try {
      let flat, result;

      switch (type) {
        case 'budget':
          flat = flattenXlsxObject(row, '', BUDGET_COLUMN_MAPPINGS);

          if (flat.stage_name && (flat.manifest || flat.institutions || flat.schools)) {
            const filteredFlat = Object.fromEntries(
              Object.entries(flat).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );

            try {
              // Check if a budget entry already exists for the same code and stage_name
              const existing = await checkBudgetByCodeAndStage(filteredFlat.code, filteredFlat.stage_name);

              if (existing) {
                console.warn(`⚠️ Budget entry already exists for stage: ${filteredFlat.stage_name}, code: ${filteredFlat.code}`);
                throw new Error(`Budget entry for stage ${filteredFlat.stage_name} and code ${filteredFlat.code} already exists.`);
              }

              // Insert new entry
              result = await upsertBudgetEntry(filteredFlat, new Date().toISOString());
              console.log(`✅ Inserted budget entry for stage: ${filteredFlat.stage_name}`);
            } catch (err) {
              console.error(`❌ Failed budget entry for stage: ${flat.stage_name}`, err.message || err);
              result = { inserted: false, reason: err.message || "Unknown error" };
            }
          }
          break;

        case 'manifest':
          flat = flattenXlsxObject(row, '', MANIFEST_COLUMN_MAPPINGS);

          if (flat.driver_number_plate) {
            const plate = flat.driver_number_plate.trim().toUpperCase();

            if (seenPlates.has(plate))
              throw new Error(`Duplicate number plate in file: ${plate}`);

            if (await plateExistsInDB(plate))
              throw new Error(`Number plate already exists in DB: ${plate}`);

            seenPlates.add(plate);
          }

          result = await upsertManifestEntry(flat, new Date().toISOString());
          console.log(`✅ Inserted manifest entry for plate: ${flat.driver_number_plate}`);
          break;

        case 'finance':
          flat = flattenXlsxObject(row, '', FINANCE_COLUMN_MAPPINGS);
          result = await upsertFinanceEntry(flat, new Date().toISOString());
          console.log(`✅ Inserted finance entry for stage: ${flat.stage_name}`);
          break;

        default:
          throw new Error(`Unknown type: ${type}`);
      }

      // ✅ Always push result (even if empty)
      if (result?.rows?.length > 0) {
        results.push({ inserted: true, serviceResponse: result.rows[0] });
      } else if (result?.inserted === false) {
        results.push({ inserted: false, reason: result.reason, rowData: flat });
      } else {
        results.push({ inserted: false, reason: 'No rows returned from DB', rowData: flat });
      }
    } catch (err) {
      console.error(`❌ General error while processing row:`, err.message);
      results.push({
        inserted: false,
        reason: err.message,
        rowData: row
      });
    }
  }


  return {
    message: `Sync complete for ${type}`,
    summary: {
      totalRows: sheetData.length - 1,
      processed: dataObjects.length,
      inserted: results.filter(r => r.inserted).length,
      skipped: results.filter(r => !r.inserted).length
    },
    details: results
  };
}

// ----------------------
// Infisical Integration (Optional)
// ----------------------
async function getDatabaseConnectionSecrets(attachToEnv = false) {
  try {
    if (!infisicalService.isInitialized) {
      await infisicalService.initialize();
    }
    const dbSecrets = await infisicalService.getIncognitoDatabaseConnectionSecrets();
    if (attachToEnv) {
      Object.entries(dbSecrets).forEach(([key, value]) => {
        if (value !== null && value !== undefined) process.env[key] = value;
      });
    }
    return dbSecrets;
  } catch (error) {
    console.error('❌ Error getting database connection secrets:', error.message);
    return {};
  }
}

async function getDatabaseSecret(secretKey) {
  try {
    const dbSecrets = await getDatabaseConnectionSecrets();
    return dbSecrets[secretKey] || null;
  } catch (error) {
    console.error(`❌ Error getting database secret '${secretKey}':`, error.message);
    return null;
  }
}

// ----------------------
// Exports
// ----------------------
module.exports = {
  flattenObject,
  flattenXlsxObject,
  validateApiKey,
  verifyCognitoSignature,
  processXlsxSyncUpload,
  validateColumns,
  BUDGET_COLUMN_MAPPINGS,
  MANIFEST_COLUMN_MAPPINGS,
  FINANCE_COLUMN_MAPPINGS,
  getDatabaseConnectionSecrets,
  getDatabaseSecret
};
