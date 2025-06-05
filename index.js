require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
// const keys = require('./service-account.json'); //Google service account json credentials path for local host
const keys = require('/etc/secrets/service-account.json'); //Google service account json credentials path for render


const app = express();
app.use(express.json());

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

        // Extract all values from the General object
        const values = [[
            flatGeneral["Event"] ?? '',
            flatGeneral["Department"] ?? '',
            flatGeneral["Manifests"] ?? '',
            flatGeneral["StageName"] ?? '',
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
            flatGeneral["Coordinator_SoulsDetails_TotalNumber"] ?? '',
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

app.post('/submit-finance', async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const section = req.body.Section || {};

        // console.log(section);
        

        // Flatten the nested objects
        const flatSection = flattenObject(section);
        // console.log('🧾 Data to be sent to Google Sheets:', flatSection);


        // Validate that required Section fields exist
        if (
            !flatSection["AccountabilityEntry_Label"] ||
            !flatSection["FundingParty"] ||
            !flatSection["Amount"] ||
            !flatSection["IssuedBy"] ||
            !flatSection["ReceivedBy"] ||
            !flatSection["FormID"]
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
            flatSection["FormID"] ?? ''
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId: FINACE_SHEET_ID,
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
