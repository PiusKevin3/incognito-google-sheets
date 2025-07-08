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

router.post('/submit-manifest', validateApiKey, async (req, res) => {
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

        res.json({ success: true, message: 'Data saved!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

module.exports = router;