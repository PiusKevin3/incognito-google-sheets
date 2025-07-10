const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dbService = require('../services/dbService');
const { flattenObject, validateApiKey, verifyCognitoSignature } = require('../utils/helpers');
// const keys = require('/etc/secrets/service-account.json'); //use on render
const keys = require('../service-account.json');


const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

router.post('/cognito-manifest-webhook', async (req, res) => {
  try {
    if (!verifyCognitoSignature(req)) {
      return res.status(401).send('Invalid signature');
    }

    const { formId, entryId, event } = req.body;

    if (event !== 'entry.created' && event !== 'entry.updated') {
      return res.status(200).send('Ignored event');
    }

    const entryData = req.body;
    const general = entryData?.General || {};
    const flatGeneral = flattenObject(general);

    const updatedAt = new Date(entryData.updated_at || entryData.created_at || Date.now());

    await dbService.upsertManifestEntry(flatGeneral, updatedAt);

    // Optional: Save to Google Sheets
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
