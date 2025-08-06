const crypto = require('crypto');
const xlsx = require('xlsx');
const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry } = require('../services/manifestService');
const { upsertBudgetEntry } = require('../services/dbService');


const REQUIRED_BUDGET_COLUMNS = [
  'Code',
  'District Name|Division Name',
  'Residential',
  'Stage Name',
  'TargetPeople',
  'Number of Taxis',
  'Number of Coasters',
  'Number of Buses',
  'Total Cost',
  'Cost Per Head',
  'Coaster Campaign',
  'Manifest Pledge',
  'Manifest Contribution',
  'Department'
];

const BUDGET_COLUMN_MAPPINGS = {
  'Code': 'code',
  'District Name|Division Name': 'division',
  'Residential': 'manifest',
  'Institution': 'institutions',
  'School': 'schools',
  'Stage Name': 'stage_name',
  'TargetPeople': 'planned_people',
  'Number of Taxis': 'planned_taxis',
  'Number of Coasters': 'planned_coasters',
  'Number of Buses': 'planned_buses',
  'Total Cost': 'total_cost',
  'Cost Per Head': 'cost_per_head',
  'Coaster Campaign': 'coaster_campaign',
  'Manifest Pledge': 'manifest_pledge',
  'Manifest Contribution': 'contribution',
  'Department': 'department'
};

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

function validateApiKey(req, res, next) {
  const providedApiKey = req.query.apiKey;
  console.log(providedApiKey, process.env.API_KEY)
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
        // Only process keys that exist in the mapping
        if (keyMapping && keyMapping[key]) {
            const mappedKey = keyMapping[key];

            if (typeof obj[key] === 'object' && obj[key] !== null) {
                Object.assign(result, flattenObject(obj[key], `${prefix}${mappedKey}_`, keyMapping));
            } else {
                result[`${prefix}${mappedKey}`] = obj[key];
            }
        }
        // Skip keys that don't have a mapping
    }

    return result;
}

async function processXlsxSyncUpload(file, type) {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  const actualColumns = sheetData.length > 0 ? sheetData[0]: [];
  console.log(actualColumns);
  if (!actualColumns.includes('Residential') || !actualColumns.includes('Institution') || !actualColumns.includes('School')) {
    throw new Error('Missing Residential, Institution, or School columns');
  }

  const department = actualColumns['Department'];
  const institution = actualColumns['Institution'];
  const residential = actualColumns['Residential'];
  const school = actualColumns['School'];

  if (department && department.toString().toLowerCase().includes('institution')) {
    // Use Institution value for Residential
    actualColumns['Residential'] = institution;
  } else if (department && department.toString().toLowerCase().includes('school')) {
    // Use School value for Residential
    actualColumns['Residential'] = school;
  } else {
    // Default: use Residential
    actualColumns['Residential'] = residential
  }

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

  // console.log(dataObjects);

  for (const row of dataObjects) {
    const flat = flattenXlsxObject(row, '', BUDGET_COLUMN_MAPPINGS);
    // console.log("Flattened row:", flat);

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
          result = await upsertBudgetEntry(flat, new Date().toISOString());
          console.log(result);
          break;
        default:
          result = null;
          break;
      }

      // Handle database query result properly
      if (result && result.rows && result.rows.length > 0) {
        // For upsert operations, we can't easily distinguish between insert and update
        // from the PostgreSQL result alone, so we'll mark all successful operations as "inserted"
        // This is a common pattern for upsert operations
        results.push({
          inserted: true,
          reason: 'Record upserted successfully',
          serviceResponse: result.rows[0]
        });
        continue;
      }

      // If we get here, the operation didn't return any rows
      results.push({
        inserted: false,
        reason: 'No rows returned from database operation',
        serviceResponse: result
      });
    } catch (serviceErr) {
      console.log(serviceErr);
      // Enhanced error handling with column and row information
      const errorInfo = {
        inserted: false,
        reason: 'Service error',
        error: serviceErr.message,
        rowData: {
          code: row['Code'] || 'N/A',
          stageName: row['Stage Name'] || 'N/A',
          department: row['Department'] || 'N/A'
        }
      };

      // Try to extract column information from the error message
      if (serviceErr.message) {
        // Look for common database error patterns
        const columnMatch = serviceErr.message.match(/column "([^"]+)"/i);
        if (columnMatch) {
          errorInfo.problematicColumn = columnMatch[1];
        }
        
        // Look for constraint violation patterns
        const constraintMatch = serviceErr.message.match(/constraint "([^"]+)"/i);
        if (constraintMatch) {
          errorInfo.constraintViolation = constraintMatch[1];
        }
      }

      results.push(errorInfo);
    }
  }

  return {
    message: `Sync complete for ${type}`,
    summary: {
      total: results.length,
      inserted: results.filter(r => r.inserted).length,
      updated: results.filter(r => r.updated).length,
      skipped: results.filter(r => !r.inserted && !r.updated).length,
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
  flattenXlsxObject,
  validateApiKey,
  verifyCognitoSignature,
  processXlsxSyncUpload,
  validateColumns
};
