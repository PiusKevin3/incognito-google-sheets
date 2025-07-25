const crypto = require('crypto');
const xlsx = require('xlsx');
const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry } = require('../services/manifestService');
const { upsertBudgetEntry } = require('../services/dbService');


const REQUIRED_BUDGET_COLUMNS = [
  'District Name|Division Name',
  'Residential',
  'Stage Name',
  'TargetPeople',
  'Number of Taxis',
  'Number of Coasters',
  'Number of Buses',
  'Total Cost',
];

const BUDGET_COLUMN_MAPPINGS = {
  'District Name|Division Name': 'district_division',
  'Residential': 'residential',
  'Stage Name': 'stage_name',
  'TargetPeople': 'target_people',
  'Number of Taxis': 'num_taxis',
  'Number of Coasters': 'num_coasters',
  'Number of Buses': 'num_buses',
  'Total Cost': 'total_cost'
};

function flattenObject(obj, prefix = '', keyMapping = null) {
  let result = {};
  for (let key in obj) {
    // Check if this key should be mapped to something else
    const mappedKey = keyMapping && keyMapping[key] ? keyMapping[key] : key;

    if (typeof obj[key] === 'object' && obj[key] !== null) {
      // For nested objects, recursively flatten with the mapped key as prefix
      Object.assign(result, flattenObject(obj[key], `${prefix}${mappedKey}_`, keyMapping));
    } else {
      // For non-objects, use the mapped key in the result
      result[`${prefix}${mappedKey}`] = obj[key];
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

function flattenXlsxObject(obj, prefix = '', keyMapping = null) {
    let result = {};
    for (let key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            Object.assign(result, flattenObject(obj[key], `${prefix}${key}_`, keyMapping));
        } else {
            result[`${prefix}${key}`] = obj[key];
        }
    }

    return result;
}

async function processXlsxSyncUpload(file, type) {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  const actualColumns = sheetData.length > 0 ? sheetData[0]: [];

  await validateColumns(REQUIRED_BUDGET_COLUMNS, actualColumns);

  const results = [];

  const headers = sheetData[0];
  const dataRows = sheetData.slice(1);
  const dataObjects = dataRows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  console.log(dataObjects);

  for (const row of dataObjects) {
    const flat = flattenXlsxObject(row, '', BUDGET_COLUMN_MAPPINGS);
    console.log("Flattened row:", flat);

    try {
      let result;

      switch (type) {
        case 'finance':
          console.log('finance');
          // result = await upsertFinanceEntry(flat);
          break;
        case 'manifest':
          console.log('manifest');
          // result = await upsertManifestEntry(flat);
          break;
        case 'budget':
          console.log('budget');
          // result = await upsertBudgetEntry(flat);
          break;
        default:
          result = null;
          break;
      }

      if (result && typeof result === 'object' && 'inserted' in result) {
        results.push(result);
        continue;
      }

      results.push({
        inserted: false,
        reason: 'Unexpected response from service',
        serviceResponse: result
      });
    } catch (serviceErr) {
      results.push({
        inserted: false,
        reason: 'Service error',
        error: serviceErr.message
      });
    }
  }

  return {
    message: `Sync complete for ${type}`,
    summary: {
      total: results.length,
      inserted: results.filter(r => r.inserted).length,
      skipped: results.filter(r => !r.inserted).length,
    },
    details: results,
  };
}

async function validateColumns(requiredColumns, actualColumns) {
  // Normalize: trim and uppercase for comparison
  const normalize = str => str.trim().toUpperCase();

  const normalizedActual = actualColumns.map(normalize);
  const missingColumns = requiredColumns.filter(
    col => !normalizedActual.includes(normalize(col))
  );

  if (missingColumns.length > 0) {
    throw new Error(`Missing columns: ${missingColumns.join(', ')}`);
  }
}


module.exports = {
  flattenObject,
  validateApiKey,
  verifyCognitoSignature,
  processXlsxSyncUpload
};
