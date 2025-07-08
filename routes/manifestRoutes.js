const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dbService = require('../services/dbService');
const { flattenObject, validateApiKey } = require('../utils/helpers');
const keys = require('/etc/secrets/service-account.json');
// const keys = require('../service-account.json'); //Google service account json credentials path for local host

const crypto = require('crypto');

const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Cognito Forms webhook handler
router.post('/cognito-manifest-webhook', async (req, res) => {
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

        // Extract and process manifest data
        const entryData = req.body;
        const general = entryData?.General || {};
        const flatGeneral = flattenObject(general);

        // Save to PostgreSQL
        await dbService.saveManifestEntry(flatGeneral);

        // Optional: Save to Google Sheets
        if (process.env.ENABLE_GOOGLE_SHEETS === 'true') {
            await saveToGoogleSheets(flatGeneral);
        }

        console.log(`Webhook: Saved manifest entry ${entryId} from form ${formId}`);
        res.status(200).send('Entry saved');
    } catch (error) {
        console.error(`Webhook Error: ${error.message}`);
        res.status(500).send('Error processing webhook');
    }
});

async function saveToGoogleSheets(flatGeneral) {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

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

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Accountability!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
        
        console.log('✅ Data saved to Google Sheets');
    } catch (error) {
        console.error('Google Sheets API Error:', error);
    }
}

router.post('/submit-manifest', validateApiKey, async (req, res) => {
    try {
        if (!req.body?.General) {
            return res.status(400).json({ success: false, message: "Missing 'General' in request body." });
        }

        const general = req.body.General || {};
        const flatGeneral = flattenObject(general);

        // Save to PostgreSQL
        await dbService.saveManifestEntry(flatGeneral);

        // Save to Google Sheets (optional)
        if (process.env.ENABLE_GOOGLE_SHEETS === 'true') {
            await saveToGoogleSheets(flatGeneral);
        }

        res.json({ success: true, message: 'Data saved!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

module.exports = router;