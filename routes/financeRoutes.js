const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dbService = require('../services/dbService');
const { flattenObject, validateApiKey } = require('../utils/helpers');
//const keys = require('/etc/secrets/service-account.json'); //Google service account json credentials path for render
const keys = require('../service-account.json'); //Google service account json credentials path for local host

const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

router.post('/submit-finance', validateApiKey, async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        if (!req.body?.General) {
            return res.status(400).json({ success: false, message: "Missing 'General' in request body." });
        }

        const general = req.body.General || {};
        const flatGeneral = flattenObject(general);

        // Save to PostgreSQL
        await dbService.saveManifestEntry(flatGeneral);

        // Google Sheets integration
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

        res.json({ success: true, message: 'Data saved!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

module.exports = router;