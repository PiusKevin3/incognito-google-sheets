require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
// const keys = require('./service-account.json'); //local host
const keys = require('/etc/secrets/service-account.json'); //render


const app = express();
app.use(express.json());

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

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

app.post('/submit-manifest', async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        if (!req.body?.General) {
            return res.status(400).json({ success: false, message: "Missing 'General' in request body." });
        }

        // Extract the General object where all manifest data lives
        const general = req.body.General || {};
        const flatGeneral = flattenObject(general);
        console.log("Flattened General structure:", JSON.stringify(flatGeneral, null, 2));

        // Extract all values from the General object
        const values = [[
            flatGeneral["Event"] ?? '',
            flatGeneral["Department"] ?? '',
            flatGeneral["Manifests"] ?? '',
            flatGeneral["StageName"] ?? '',
            flatGeneral["Coordinator_Name"] ?? '',
            flatGeneral["Coordinator_Contact"] ?? '',
            flatGeneral["Drivers_Name"] ?? '',
            flatGeneral["DriversDetails_Contact"] ?? '',
            flatGeneral["DriversDetails_NINPermitNo"] ?? '',
            flatGeneral["DriversDetails_VehicleType"] ?? '',
            flatGeneral["DriversDetails_NumberPlate"] ?? '',
            flatGeneral["VehicleDetails_CostOfVehicle2"] ?? '',
            flatGeneral["VehicleDetails_CashContribution"] ?? '',
            flatGeneral["VehicleDetails_BookingFee"] ?? '',
            flatGeneral["VehicleDetails_Balance"] ?? '',
            flatGeneral["VehicleDetails_CostPerHead"] ?? '',
            flatGeneral["SoulsDetails_TotalNumber"] ?? '',
            flatGeneral["SoulsDetails_Residents_NoOfPeople"] ?? '',
            flatGeneral["SoulsDetails_Residents_FirstTimers"] ?? '',
            flatGeneral["SoulsDetails_Institutions_NoOfPeople"] ?? '',
            flatGeneral["SoulsDetails_Institutions_FirstTimers"] ?? '',
            flatGeneral["SoulsDetails_Schools_NoOfPeople"] ?? '',
            flatGeneral["SoulsDetails_Schools_FirstTimers"] ?? '',
            flatGeneral["VehicleDetails_VerifierName"] ?? ''
        ]];



        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        res.json({ success: true, message: 'Data saved to Google Sheets!' });
    } catch (error) {
        console.error('Google Sheets API Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
