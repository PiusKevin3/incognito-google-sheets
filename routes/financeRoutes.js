const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const crypto = require('crypto');
const dbService = require('../services/dbService');
const { flattenObject, validateApiKey, verifyCognitoSignature } = require('../utils/helpers');
// const keys = require('/etc/secrets/service-account.json'); // Use on render
const keys = require('../service-account.json');

const SHEET_ID = process.env.FINANCE_GOOGLE_SHEET_ID || process.env.FINACE_GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

router.post('/submit-finance', async (req, res) => {
  try {
    const isWebhook = verifyCognitoSignature(req);
    const hasApiKey = req.query.apiKey === process.env.API_KEY;

    if (!isWebhook && !hasApiKey) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid API key/signature' });
    }

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    if (!req.body?.Section) {
      return res.status(400).json({ success: false, message: "Missing 'Section' in request body." });
    }

    const section = req.body.Section;
    const flatSection = flattenObject(section);

    if (!isWebhook && (
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
    )) {
      return res.status(400).json({ success: false, message: "Missing one or more required 'Section' fields." });
    }

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

    // Calculate new balance
    const currentBalance = Number(flatSection["Balance"]) || 0;
    const amount = Number(flatSection["Amount"]) || 0;
    const newBalance = currentBalance - amount;

    // Update Cognito form entry balance
    try {
      await fetch(`https://www.cognitoforms.com/api/forms/654/entries/${flatSection["FormID"]}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.COGNITO_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          Entry: {
            Action: 'Submit',
            Role: 'Public'
          },
          Balance: newBalance
        })
      });
    } catch (err) {
      console.error('Cognito balance update failed:', err);
    }

    // Update local balance before saving
    flatSection["Balance"] = newBalance;

    // Upsert the full finance entry with updated balance and timestamp
    const updatedAt = new Date();
    await dbService.upsertFinanceEntry(flatSection, updatedAt);

    // Append to Google Sheets if enabled
    if (process.env.ENABLE_GOOGLE_SHEETS === 'true') {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Finance!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    }

    res.json({ success: true, message: 'Data saved!' });
  } catch (error) {
    console.error('Finance route error:', error);
    res.status(500).json({ success: false, message: 'Failed to save data' });
  }
});

module.exports = router;
