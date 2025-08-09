const crypto = require('crypto');
const xlsx = require('xlsx');
const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry } = require('../services/manifestService');
const { upsertBudgetEntry } = require('../services/dbService');


const REQUIRED_BUDGET_COLUMNS = [
  'Details_Code',
  'Details_Region',
  'Details_Division',
  'Details_Manifests',
  'Details_StageName',
  'Planned_People',
  'Planned_Taxis',
  'Planned_Coasters',
  'Planned_Buses',
  'Planned_TotalCost',
  'Planned_CostPerHead',
  'Planned_CoasterCampaign',
  'Planned_ManifestPledge',
  'Planned_Contribution',
  'Details_Department'
];

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
  
  // Get all headers (including empty columns)
  const headers = sheetData.length > 0 ? sheetData[0] : [];
  console.log('All Columns:', headers);

  // Validate required columns - now including Institution
  const requiredColumns = ['Residential', 'School', 'Institution'];
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  // Check if we have either Institution or Division/District column
  const hasInstitutionEquivalent = headers.some(h => h.includes('Division') || h.includes('District'));
  if (missingColumns.length > 0 && !hasInstitutionEquivalent) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
  }

  // Create data objects only for non-empty rows
  const dataObjects = [];
  for (let i = 1; i < sheetData.length; i++) {
    const row = sheetData[i];
    
    // Skip completely empty rows
    if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
      continue;
    }

    const obj = {};
    let hasData = false;
    
    // Include all columns, even if empty
    headers.forEach((header, index) => {
      obj[header] = row[index]; // Will be undefined if column doesn't exist in row
      if (row[index] !== undefined && row[index] !== null && row[index] !== '') {
        hasData = true;
      }
    });

    // Apply department mapping logic
    if (obj.Department) {
      const department = obj.Department.toString().toLowerCase();
      // Use Institution column if available, otherwise look for Division/District      
      if (['institution', 'institutions'].some(keyword => department.toLowerCase().includes(keyword)) && obj.Institution) {
        obj.Residential = obj.Institution;
      } else if (['school', 'schools'].some(keyword => department.toLowerCase().includes(keyword)) && obj.Schools) {
        obj.Residential = obj.Schools;
      }
    }

    if (hasData) {
      dataObjects.push(obj);
    }
  }

  await validateColumns(REQUIRED_BUDGET_COLUMNS, headers);

  const results = [];

  for (const row of dataObjects) {
    // Create flat object with all columns (empty values will be undefined)
    const flat = flattenXlsxObject(row, '', BUDGET_COLUMN_MAPPINGS);
    
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
          // Only proceed if we have required fields
          if (flat.stage_name && (flat.manifest || flat.institutions || flat.schools)) {
            // Filter out undefined/null/empty values before upsert
            const filteredFlat = Object.fromEntries(
              Object.entries(flat).filter(([_, v]) => v !== undefined && v !== null && v !== '')
            );
            result = await upsertBudgetEntry(filteredFlat, new Date().toISOString());
            console.log(result);
          } else {
            results.push({
              inserted: false,
              reason: 'Skipped - Missing required fields (stage_name or manifest)',
              rowData: {
                code: flat.code || 'N/A',
                stageName: flat.stage_name || 'N/A',
                department: flat.department || 'N/A'
              }
            });
            continue;
          }
          break;
        default:
          result = null;
          break;
      }

      if (result?.rows?.length > 0) {
        results.push({
          inserted: true,
          reason: 'Record upserted successfully',
          serviceResponse: result.rows[0]
        });
      } else {
        results.push({
          inserted: false,
          reason: 'No rows returned from database operation',
          serviceResponse: result
        });
      }
    } catch (serviceErr) {
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

      if (serviceErr.message) {
        const columnMatch = serviceErr.message.match(/column "([^"]+)"/i);
        if (columnMatch) {
          errorInfo.problematicColumn = columnMatch[1];
        }
        
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
      totalRows: sheetData.length - 1, // Subtract header row
      processed: dataObjects.length,
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
  flattenXlsxObject,
  validateApiKey,
  verifyCognitoSignature,
  processXlsxSyncUpload,
  validateColumns,
  BUDGET_COLUMN_MAPPINGS
};
