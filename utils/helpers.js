const crypto = require('crypto');
const xlsx = require('xlsx');
const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry, plateExistsInDB } = require('../services/manifestService');
const { upsertBudgetEntry } = require('../services/dbService');


// ----------------------
// Column Mappings
// ----------------------
const BUDGET_COLUMN_MAPPINGS = {
  'Code': 'code',
  'Region': 'region',
  'Division': 'division',
  'Manifests': 'manifest',
  'Institution': 'institutions',
  'Schools': 'schools',
  'Stage Name': 'stage_name',
  'People': 'planned_people',
  'Taxis': 'planned_taxis',
  'Coasters': 'planned_coasters',
  'Buses': 'planned_buses',
  'Total Cost': 'total_cost',
  'Cost Per Head': 'cost_per_head',
  'Coaster Campaign': 'coaster_campaign',
  'Manifest Pledge': 'manifest_pledge',
  'Contribution': 'contribution',
  'Department': 'department'
};


const MANIFEST_COLUMN_MAPPINGS = {
  'Event': 'event',
  'Department': 'department',
  'Manifests': 'manifest',
  'Institutions': 'institutions',
  'Schools': 'schools',
  'Stage Name': 'stage_name',
  'Name': 'name',
  'Contact': 'contact',
  'NIN/Permit no.': 'nin_permit_no',
  'Vehicle Type': 'vehicle_type',
  'Number Plate': 'number_plate',
  'Cost Of Vehicle': 'cost_of_vehicle',
  'Cash Contribution': 'cash_contribution',
  'Booking Fee': 'booking_fee',
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
// Main Processor
// ----------------------
async function processXlsxSyncUpload(file, type) {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  if (!sheetData.length) throw new Error("Empty Excel file");

  const headers = sheetData[0];
  await validateColumns(type, headers);

  const dataObjects = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) continue;

    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
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

            result = await upsertBudgetEntry(filteredFlat, new Date().toISOString());
          }
          break;

        case 'manifest':
          flat = flattenXlsxObject(row, '', MANIFEST_COLUMN_MAPPINGS);

          if (flat.number_plate) {
            const plate = flat.number_plate.trim().toUpperCase();

            if (seenPlates.has(plate)) {
              throw new Error(`Duplicate number plate in file: ${plate}`);
            }
            if (await plateExistsInDB(plate)) {
              throw new Error(`Number plate already exists in DB: ${plate}`);
            }
            seenPlates.add(plate);
          }

          result = await upsertManifestEntry(flat, new Date().toISOString());

          break;

        case 'finance':
          flat = flattenXlsxObject(row, '', FINANCE_COLUMN_MAPPINGS);
          result = await upsertFinanceEntry(flat, new Date().toISOString());

          break;

        default:
          throw new Error(`Unknown type: ${type}`);
      }

      if (result?.rows?.length > 0) {
        results.push({ inserted: true, serviceResponse: result.rows[0] });
      } else {
        results.push({ inserted: false, reason: 'No rows returned from DB', rowData: flat });
      }
    } catch (err) {
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

module.exports = {
  flattenObject,
  flattenXlsxObject,
  validateApiKey,
  verifyCognitoSignature,
  processXlsxSyncUpload,
  validateColumns,
  BUDGET_COLUMN_MAPPINGS,
  MANIFEST_COLUMN_MAPPINGS,
  FINANCE_COLUMN_MAPPINGS
};
