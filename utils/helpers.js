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
  
  // Get headers and filter out empty columns
  const headers = sheetData.length > 0 ? 
    sheetData[0].filter((header, index) => {
      // Check if any row has data in this column
      return sheetData.some((row, rowIndex) => rowIndex > 0 && row[index] !== undefined && row[index] !== null && row[index] !== '');
    }) : [];
  
  console.log('Active Columns:', headers);

  // Validate required columns
  if (!headers.includes('Residential') || !headers.includes('Institution') || !headers.includes('School')) {
    throw new Error('Missing Residential, Institution, or School columns');
  }

  // Process department mapping logic
  const departmentIndex = headers.indexOf('Department');
  const institutionIndex = headers.indexOf('Institution');
  const residentialIndex = headers.indexOf('Residential');
  const schoolIndex = headers.indexOf('School');

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
    
    headers.forEach((header, headerIndex) => {
      const originalIndex = sheetData[0].indexOf(header);
      const value = row[originalIndex];
      
      // Only include non-empty values
      if (value !== undefined && value !== null && value !== '') {
        obj[header] = value;
        hasData = true;
      }
    });

    // Apply department mapping logic
    if (obj.Department) {
      const department = obj.Department.toString().toLowerCase();
      if (department.includes('institution') && obj.Institution) {
        obj.Residential = obj.Institution;
      } else if (department.includes('school') && obj.School) {
        obj.Residential = obj.School;
      }
    }

    if (hasData) {
      dataObjects.push(obj);
    }
  }

  await validateColumns(REQUIRED_BUDGET_COLUMNS, headers);

  const results = [];

  for (const row of dataObjects) {
    // Create a filtered flat object with only non-empty values
    const filteredRow = {};
    for (const key in row) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        filteredRow[key] = row[key];
      }
    }

    const flat = flattenXlsxObject(filteredRow, '', BUDGET_COLUMN_MAPPINGS);
    
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
          if (flat.stage_name && flat.manifest) {
            result = await upsertBudgetEntry(flat, new Date().toISOString());
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

      if (result && result.rows && result.rows.length > 0) {
        results.push({
          inserted: true,
          reason: 'Record upserted successfully',
          serviceResponse: result.rows[0]
        });
        continue;
      }

      results.push({
        inserted: false,
        reason: 'No rows returned from database operation',
        serviceResponse: result
      });
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
      total: dataObjects.length,
      processed: results.length,
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
