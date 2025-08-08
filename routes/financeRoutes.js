const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dbService = require('../services/dbService');
const { flattenObject, validateApiKey } = require('../utils/helpers');
const keys = require('/etc/secrets/service-account.json'); // Use on render
const { updateCognitoEntry, fetchEntry } = require('../services/cognitoService');
// const keys = require('../service-account.json');

const MANIFEST_FORM_ID = process.env.MANIFEST_FORM_ID;
const BUDGET_FORM_ID = process.env.BUDGET_FORM_ID;

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

router.post('/submit-finance', validateApiKey, async (req, res) => {
    try {
        const client = await auth.getClient();
        // const sheets = google.sheets({ version: 'v4', auth: client });

        const section = req.body.Section || {};
        const entry = req.body.Entry || {};
        const operation = req.query.operation || 'submit'; // New parameter: 'update' or 'submit'
        console.log('Operation:', operation);

        // Validate operation type
        if (!['update', 'submit'].includes(operation)) {
            return res.status(400).json({
                success: false,
                message: "Invalid operation type. Must be 'update' or 'submit'"
            });
        }

        // Flatten the nested objects
        const flatSection = flattenObject(section);
        const flatEntry = flattenObject(entry);
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
            (!flatSection["ManifestName"] && !flatSection["InstitutionName"] && !flatSection["SchoolName"]) ||
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

        var newFinanceContribution;
        var newBudgetContribution;
        const budget = await fetchEntry(BUDGET_FORM_ID, flatSection["BudgetID"]);

        switch (operation) {
            case 'submit':
                newFinanceContribution = flatSection["FinanceContribution"] + flatSection["Amount"];
                newBudgetContribution = parseInt(budget.Actual?.FinanceContribution || 0) + parseInt(flatSection["Amount"]);
                break;
            case 'update':
                const existingFinanceEntry = await dbService.findFinanceByFormID(flatSection["FormID"]);
                // const existingBudgetEntry = await dbService.findBudgetByFormID(flatSection["BudgetID"]);

                if (existingFinanceEntry) {
                    const oldFinanceAmount = parseInt(existingFinanceEntry.amount) || 0;
                    const newAmount = parseInt(flatSection["Amount"]) || 0;
                    const currentFinanceContribution = parseInt(flatSection["FinanceContribution"]) || 0;
                    const currentBudgetContribution = parseInt(budget.Actual?.FinanceContribution || 0);

                    // Calculate: current_budget_contribution - old_amount + new_amount
                    newBudgetContribution = (currentBudgetContribution - oldFinanceAmount) + newAmount;
                    newFinanceContribution = (currentFinanceContribution - oldFinanceAmount) + newAmount;

                    console.log('Update operation - Amount adjustment:', {
                        currentFinanceContribution,
                        currentBudgetContribution,
                        oldFinanceAmount,
                        newAmount,
                        newFinanceContribution,
                        newBudgetContribution
                    });
                } else {
                    newFinanceContribution = flatSection["FinanceContribution"] + flatSection["Amount"];
                    newBudgetContribution = parseInt(budget.Actual?.FinanceContribution || 0) + parseInt(flatSection["Amount"]);
                    console.log('Update operation - No existing entry found, treating as new submission');
                }
                break;

            default:
                // Default to submit behavior
                newFinanceContribution = flatSection["FinanceContribution"] + flatSection["Amount"];
                newBudgetContribution = parseInt(budget.Actual?.FinanceContribution || 0) + parseInt(flatSection["Amount"]);
                console.log('Default operation - Adding amount to contributions');
        }

        console.log('Here are the finance records', flatSection);

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

        // const newContribution = parseInt(budget.Actual?.FinanceContribution || 0) + parseInt(flatSection["Amount"]);

        await updateCognitoEntry(BUDGET_FORM_ID, flatSection["BudgetID"], {
            Actual : {
                FinanceContribution: newBudgetContribution
            },
            updatedAt: Date.now()
        });

        // Update budget_entries in the database
        await dbService.updateActualBudgetData({
            stage_name: flatSection["StageName"],
            actual_expenditure: newBudgetContribution,
        }, new Date().toISOString());

        await dbService.upsertFinanceEntry({...flatSection, ID: flatEntry["Number"]}, new Date().toISOString());

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
