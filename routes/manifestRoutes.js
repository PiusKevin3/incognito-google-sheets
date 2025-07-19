// routes/manifestWebhook.js
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dbService = require('../services/dbService');
const { flattenObject, verifyCognitoSignature } = require('../utils/helpers');
// const keys = require('/etc/secrets/service-account.json'); // For Render
const keys = require('../service-account.json'); // For local dev

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.ACC_GOOGLE_SHEET_ID;

async function saveToGoogleSheets(flatGeneral) {
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
}

router.post('/cognito-manifest-webhook', async (req, res) => {
  try {
    const hasApiKey = req.query.apiKey === process.env.API_KEY;

    if (!hasApiKey) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid API key' });
    }

    const { formId, entryId, event } = req.body;

    if (event !== 'entry.created' && event !== 'entry.updated') {
      return res.status(200).send('Ignored event');
    }

    const general = req.body?.General || {};
    const flatGeneral = flattenObject(general);
    const updatedAt = new Date(req.body.updated_at || req.body.created_at || Date.now());

    await dbService.upsertManifestEntry(flatGeneral, updatedAt);

    if (process.env.ENABLE_GOOGLE_SHEETS === 'true') {
      await saveToGoogleSheets(flatGeneral);
    }

    console.log(`Webhook: Upserted manifest entry ${entryId} from form ${formId}`);
    res.status(200).send('Entry saved');
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;
