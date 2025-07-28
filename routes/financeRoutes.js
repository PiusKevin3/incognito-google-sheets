const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const dbService = require('../services/dbService');
const { flattenObject, validateApiKey } = require('../utils/helpers');
const {parseNumeric}  = require('../utils/numericUtils');
const keys = require('/etc/secrets/service-account.json'); // Use on render
const { updateCognitoEntry } = require('../services/cognitoService');
// const keys = require('../service-account.json');

const SHEET_ID = process.env.FINANCE_GOOGLE_SHEET_ID
const MANIFEST_FORM_ID = process.env.MANIFEST_FORM_ID;
const BUDGET_FORM_ID = process.env.BUDGET_FORM_ID;

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

router.post('/submit-finance', validateApiKey, async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const section = req.body.Section || {};

        // Flatten the nested objects
        const flatSection = flattenObject(section);
        // console.log('🧾 Data to be sent to the Google Sheets:', flatSection);

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
            !flatSection["Contribution"]
        ) {
            console.log('Missing one or more required fields in request body:', flatSection);
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

        const newFinanceContribution = flatSection["FinanceContribution"] + flatSection["Amount"];
        console.log(flatSection["FinanceContribution"], flatSection["Amount"]);

        console.log('New Finance Contribution:', newFinanceContribution);

        await updateCognitoEntry(MANIFEST_FORM_ID, flatSection["FormID"], {
            General : {
                Coordinator : {
                    VehicleDetails : {
                        FinanceContribution: parseInt(newFinanceContribution)
                    }
                }
            }
        });

        const budget = await fetchEntry(BUDGET_FORM_ID, flatGeneral["BudgetID"]);
        const newContribution = parseInt(budget.Actual.FinanceContribution) + flatSection["Amount"];

        await updateCognitoEntry(BUDGET_FORM_ID, flatGeneral["BudgetID"], {
            Actual : {
                FinanceContribution: newContribution
            },
            updatedAt: Date.now()
        });

        // Update budget_entries in the database
        await dbService.updateActualBudgetData({
            stage_name: flatSection["StageName"],
            actual_expenditure: newContribution,
        }, Date.now());

        // await sheets.spreadsheets.values.append({
        //     spreadsheetId: SHEET_ID,
        //     // range: 'Sheet1!A1',
        //     range: 'Finance!A1',
        //     valueInputOption: 'USER_ENTERED',
        //     requestBody: { values },
        // });

        res.json({ success: true, message: 'Data saved to Google Sheets!' });
    } catch (error) {
        console.error('Google Sheets API Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

module.exports = router;
