require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
// const keys = require('./service-account.json'); //Google service account json credentials path for local host
const keys = require('/etc/secrets/service-account.json'); //Google service account json credentials path for render

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

        const newBalance = flatSection["Balance"] - flatSection["Amount"];

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
        } catch (error) {
            console.error('Error updating Cognito form:', error);
        }

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



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
