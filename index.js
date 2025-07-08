require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const crypto = require('crypto');
const cron = require('node-cron');

// const keys = require('./service-account.json'); //Google service account json credentials path for local host
const keys = require('/etc/secrets/service-account.json'); //Google service account json credentials path for render
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
const app = express();
app.use(express.json());

// API key validation middleware
const validateApiKey = (req, res, next) => {
    const providedApiKey = req.query.apiKey;
    const expectedApiKey = process.env.API_KEY;

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: "Invalid or missing API key"
        });
    }

    // If API key is valid, proceed to the next middleware/route handler
    next();
};

const SHEET_ID = process.env.GOOGLE_SHEET_ID; //Google Sheets file id
const FINACE_SHEET_ID = process.env.FINACE_GOOGLE_SHEET_ID; //Finance Google Sheets file id


const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

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

// Add these Cognito service functions
async function getCognitoForms() {
  const response = await fetch('https://api.cognitoforms.com/v1/forms', {
    headers: {
      'Authorization': `Bearer ${process.env.COGNITO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

async function getCognitoEntriesSince(formId, sinceDate) {
  const url = `https://api.cognitoforms.com/v1/forms/${formId}/entries?since=${sinceDate.toISOString()}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.COGNITO_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
}

// Add this function to sync entries
async function syncCognitoEntries() {
  try {
    console.log('Starting Cognito entries sync');
    
    // Get all forms (implement this function)
    const forms = await getCognitoForms(); 
    
    for (const form of forms) {
      // Get latest entry from PostgreSQL
      const { data: lastEntry, error } = await supabase
        .from('cognito_entries')
        .select('cognito_created_at')
        .eq('cognito_form_id', form.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const since = lastEntry?.length 
        ? new Date(lastEntry[0].created_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Fetch new entries from Cognito (implement this)
      const newEntries = await getCognitoEntriesSince(form.id, since);
      
      // Save to PostgreSQL
      for (const entry of newEntries) {
        const { error: upsertError } = await supabase
          .from('cognito_entries')
          .upsert({
            cognito_form_id: form.id,
            cognito_entry_id: entry.id,
            entry_data: entry
          }, { onConflict: 'cognito_entry_id' });
        
        if (!upsertError) {
          console.log(`Synced entry ${entry.id} for form ${form.id}`);
        }
      }
    }
  } catch (error) {
    console.error(`Sync failed: ${error.message}`);
  }
}

// Add this endpoint for Cognito webhooks
app.post('/cognito-webhook', async (req, res) => {
  try {
    // Verify HMAC signature
    if (process.env.COGNITO_WEBHOOK_SECRET) {
      const signature = crypto.createHmac('sha256', process.env.COGNITO_WEBHOOK_SECRET)
                             .update(JSON.stringify(req.body))
                             .digest('hex');
      
      if (signature !== req.headers['x-cognito-signature']) {
        return res.status(401).send('Invalid signature');
      }
    }

    const { formId, entryId, event } = req.body;
    
    if (event !== 'entry.created') {
      return res.status(200).send('Ignored event');
    }

    // Save to PostgreSQL
    const { error } = await supabase
      .from('cognito_entries')
      .insert({
        cognito_form_id: formId,
        cognito_entry_id: entryId,
        entry_data: req.body
      });

    if (error) {
      console.error('PostgreSQL save error:', error);
      return res.status(500).send('Database error');
    }

    console.log(`Webhook: Saved entry ${entryId} from form ${formId}`);
    res.status(200).send('Entry saved');
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    res.status(500).send('Error processing webhook');
  }
});

app.post('/submit-manifest', validateApiKey, async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        if (!req.body?.General) {
            return res.status(400).json({ success: false, message: "Missing 'General' in request body." });
        }

        // Extract the General object where all manifest data lives
        const general = req.body.General || {};
        const flatGeneral = flattenObject(general);

        console.log('🧾 Data to be sent to Google Sheets:', flatGeneral);


        // Extract all values from the General object
        const values = [[
            flatGeneral["ID1"] ?? '',
            flatGeneral["Event"] ?? '',
            flatGeneral["Department"] ?? '',
            flatGeneral["Manifests"] ?? '',
            flatGeneral["Institutions"] ?? '',
            flatGeneral["Hospitals"] ?? '',
            flatGeneral["Masterclass"] ?? '',
            flatGeneral["Schools"] ?? '',
            flatGeneral["UpCountry"] ?? '',
            flatGeneral["StageName2"] ?? '',
            flatGeneral["Coordinator_Name"] ?? '',
            flatGeneral["Coordinator_Contact"] ?? '',
            flatGeneral["Coordinator_DriversDetails_Name"] ?? '',
            flatGeneral["Coordinator_DriversDetails_Contact"] ?? '',
            flatGeneral["Coordinator_DriversDetails_NINPermitNo"] ?? '',
            flatGeneral["Coordinator_DriversDetails_VehicleType"] ?? '',
            flatGeneral["Coordinator_DriversDetails_NumberPlate"] ?? '',
            flatGeneral["Coordinator_VehicleDetails_CostOfVehicle2"] ?? '',
            flatGeneral["Coordinator_VehicleDetails_CashContribution"] ?? '',
            flatGeneral["Coordinator_VehicleDetails_BookingFee"] ?? '',
            flatGeneral["Coordinator_VehicleDetails_Balance"] ?? '',
            flatGeneral["Coordinator_VehicleDetails_CostPerHead"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_TOTAL"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_Residents_NoOfPeople"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_Residents_FirstTimers"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_Institutions_NoOfPeople"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_Institutions_FirstTimers"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_Schools_NoOfPeople"] ?? '',
            flatGeneral["Coordinator_SoulsDetails_Schools_FirstTimers"] ?? '',
            flatGeneral["Coordinator_VehicleDetails_VerifierName"] ?? ''
        ]];

        // Save to Supabase
        const { error } = await supabase.from('manifest_entries').insert([flatGeneral]);
        if (error) console.error('Supabase insert error:', error);



        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Accountability!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });



        res.json({ success: true, message: 'Data saved to Google Sheets!' });
    } catch (error) {
        console.error('Google Sheets API Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

app.post('/submit-finance', validateApiKey, async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const section = req.body.Section || {};

        // Flatten the nested objects
        const flatSection = flattenObject(section);
        console.log('🧾 Data to be sent to Google Sheets:', flatSection);

        // Validate that required Section fields exist
        if (
            !flatSection["AccountabilityEntry_Label"] ||
            !flatSection["FundingParty"] ||
            !flatSection["Amount"] ||
            !flatSection["IssuedBy"] ||
            !flatSection["ReceivedBy"] ||
            !flatSection["FormID"] ||
            !flatSection["FinalBalance"] ||
            !flatSection["ManifestName"] ||
            !flatSection["InstitutionName"] ||
            !flatSection["SchoolName"] ||
            !flatSection["Department"] ||
            !flatSection["CostOfVehicle"] ||
            !flatSection["Balance"] ||
            !flatSection["StageName"] ||
            !flatSection["Contribution"] ||
            !flatSection["BookingFee"]
        ) {
            return res.status(400).json({ success: false, message: "Missing one or more required 'Section' fields in request body." });
        }

        // Construct the values to append in the order you want
        const values = [[
            flatSection["AccountabilityEntry_Label"] ?? '',
            flatSection["FundingParty"] ?? '',
            flatSection["Amount"] ?? '',
            flatSection["IssuedBy"] ?? '',
            flatSection["ReceivedBy"] ?? '',
            flatSection["FormID"] ?? '',
            flatSection["FinalBalance"] ?? '',
            flatSection["ManifestName"] ?? '',
            flatSection["InstitutionName"] ?? '',
            flatSection["SchoolName"] ?? '',
            flatSection["Department"] ?? '',
            flatSection["CostOfVehicle"] ?? '',
            flatSection["Balance"] ?? '',
            flatSection["StageName"] ?? '',
            flatSection["Contribution"] ?? '',
            flatSection["BookingFee"] ?? '',
            flatSection["Event"] ?? ''

        ]];

        const { error } = await supabase.from('finance_entries').insert([flatSection]);
        if (error) console.error('Supabase insert error:', error);



        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            // range: 'Sheet1!A1',
            range: 'Finance!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        res.json({ success: true, message: 'Data saved to Google Sheets!' });
    } catch (error) {
        console.error('Google Sheets API Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});


// Start the cron job (add this at the end of your file)
cron.schedule('*/15 * * * *', syncCognitoEntries);
console.log('Scheduled sync enabled (runs every 15 minutes)');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
