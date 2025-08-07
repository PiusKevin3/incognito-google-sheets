// routes/manifestWebhook.js
const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const dbService = require('../services/dbService');
const { flattenObject } = require('../utils/helpers');
const keys = require('/etc/secrets/service-account.json'); // For Render
const { fetchEntry, updateCognitoEntry } = require('../services/cognitoService');
// const keys = require('../service-account.json'); // For local dev

const auth = new google.auth.GoogleAuth({
  credentials: keys,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.ACC_GOOGLE_SHEET_ID;
const BUDGET_FORM_ID = process.env.BUDGET_FORM_ID;

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

    console.log('Request body', req.body)
    // const { formId, entryId, event } = req.body;

    // if (event !== 'entry.created' && event !== 'entry.updated') {
    //   return res.status(200).send('Ignored event');
    // }

    const general = req.body?.General || {};
    const flatGeneral = flattenObject(general);
    const updatedAt = new Date(req.body.updated_at || req.body.created_at || Date.now());

    await dbService.upsertManifestEntry(flatGeneral, updatedAt);

    if (process.env.ENABLE_GOOGLE_SHEETS === 'true') {
      await saveToGoogleSheets(flatGeneral);
    }

    const budgetDetails = await fetchEntry(BUDGET_FORM_ID, flatGeneral["BudgetID"]);
    console.log('Budget Details:', budgetDetails);
    const budgetFormId = budgetDetails.Entry.Number;
    console.log('Budget Form ID:', budgetFormId);

    const updatedData = {
        Actual : {
            ActualPeople: budgetDetails.Actual.ActualPeople + parseInt(flatGeneral["Coordinator_SoulsDetails_TOTAL"]),
            FinanceContribution: (budgetDetails.Actual?.FinanceContribution || 0) + parseInt(flatGeneral["Coordinator_VehicleDetails_CashContribution"]),
            Taxis: (budgetDetails.Actual?.ActualTaxis || 0) + (flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Taxi" ? 1 : 0),
            Buses: (budgetDetails.Actual?.ActualBuses || 0) + (flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Bus" ? 1 : 0),
            Coasters: (budgetDetails.Actual?.ActualCoasters || 0) + (flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Coaster" ? 1 : 0),
        }
    };

    console.log('Updated Data:', updatedData);

    var result = await dbService.updateActualBudgetData({
      stage_name: budgetDetails.Details.StageName,
      actual_people: updatedData.Actual.ActualPeople,
      actual_coasters: updatedData.Actual.Coasters,
      actual_buses: updatedData.Actual.Buses,
      actual_taxis: updatedData.Actual.Taxis,
      actual_cost: updatedData.Actual.FinanceContribution,
    }, updatedAt);

    console.log('Update Result:', result);

    // Update Budget details
    await updateCognitoEntry(BUDGET_FORM_ID, budgetFormId, updatedData);

    return res.status(200).json({ success: true, message: 'Entry saved' });
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    res.status(500).send('Error processing webhook');
  }
});

router.post('/update', async (req, res) => {
  try {
    const hasApiKey = req.query.apiKey === process.env.API_KEY;

    if (!hasApiKey) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid API key' });
    }

    // ✅ Check if this is a webhook call or direct API call
    const isWebhookCall = req.headers['x-cognito-forms-webhook'] || req.body.event;
    const operation = req.query.operation || 'update'; // New parameter: 'update' or 'submit'
    
    console.log('Operation:', operation);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    // Validate operation type
    if (!['update', 'submit'].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Invalid operation type. Must be 'update' or 'submit'"
      });
    }

    // ✅ Only process specific events to avoid recursion
    if (isWebhookCall) {
      const event = req.body.event;
      console.log('🔍 Webhook event:', event);
      
      // Only process certain events, ignore others
      if (event !== 'entry.updated' && event !== 'entry.created') {
        console.log('⏭️ Skipping event:', event);
        return res.status(200).json({ success: true, message: 'Event ignored' });
      }
    }

    const general = req.body?.General || {};
    const flatGeneral = flattenObject(general);
    const updatedAt = new Date(req.body.updated_at || req.body.created_at || Date.now());

    const Id = flatGeneral["ID1"];
    console.log('Id:', Id);
    const budgetFormId = flatGeneral["BudgetID"];

    const existingManifestEntry = await dbService.findManifestByFormID(Id);

    if (!existingManifestEntry) {
      return res.status(404).json({ success: false, message: 'Manifest entry not found' });
    }

    // Updating budget details
    const budgetDetails = await fetchEntry(BUDGET_FORM_ID, flatGeneral["BudgetID"]);
    console.log('Budget Details:', budgetDetails);

    var newActualPeopleForBudget;
    var newTaxisForBudget;
    var newBusesForBudget;
    var newCoastersForBudget;

    switch (operation) {
      case 'submit':
        // Add the new values to existing budget totals
        const currentActualPeople = budgetDetails.Actual?.ActualPeople || 0;
        const newActualPeople = parseInt(flatGeneral["Coordinator_SoulsDetails_TOTAL"]) || 0;
        newActualPeopleForBudget = currentActualPeople + newActualPeople;

        const currentTaxis = budgetDetails.Actual?.Taxis || 0;
        const newTaxis = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Taxi" ? 1 : 0;
        newTaxisForBudget = currentTaxis + newTaxis;

        const currentBuses = budgetDetails.Actual?.Buses || 0;
        const newBuses = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Bus" ? 1 : 0;
        newBusesForBudget = currentBuses + newBuses;

        const currentCoasters = budgetDetails.Actual?.Coasters || 0;
        const newCoasters = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Coaster" ? 1 : 0;
        newCoastersForBudget = currentCoasters + newCoasters;

        console.log('Submit operation - Adding new values to budget totals');
        break;

      case 'update':
        // Calculate: current_budget_totals - old_manifest_values + new_manifest_values
        const oldActualPeople = existingManifestEntry.Actual?.ActualPeople || 0;
        const currentActualPeopleUpdate = budgetDetails.Actual?.ActualPeople || 0;
        const newActualPeopleUpdate = parseInt(flatGeneral["Coordinator_SoulsDetails_TOTAL"]) || 0;
        newActualPeopleForBudget = (currentActualPeopleUpdate - oldActualPeople) + newActualPeopleUpdate;

        const oldTaxis = existingManifestEntry.Actual?.Taxis || 0;
        const currentTaxisUpdate = budgetDetails.Actual?.Taxis || 0;
        const newTaxisUpdate = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Taxi" ? 1 : 0;
        newTaxisForBudget = (currentTaxisUpdate - oldTaxis) + newTaxisUpdate;

        const oldBuses = existingManifestEntry.Actual?.Buses || 0;
        const currentBusesUpdate = budgetDetails.Actual?.Buses || 0;
        const newBusesUpdate = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Bus" ? 1 : 0;
        newBusesForBudget = (currentBusesUpdate - oldBuses) + newBusesUpdate;

        const oldCoasters = existingManifestEntry.Actual?.Coasters || 0;
        const currentCoastersUpdate = budgetDetails.Actual?.Coasters || 0;
        const newCoastersUpdate = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Coaster" ? 1 : 0;
        newCoastersForBudget = (currentCoastersUpdate - oldCoasters) + newCoastersUpdate;

        console.log('Update operation - Budget adjustment:', {
          oldActualPeople,
          currentActualPeopleUpdate,
          newActualPeopleUpdate,
          newActualPeopleForBudget,
          oldTaxis,
          currentTaxisUpdate,
          newTaxisUpdate,
          newTaxisForBudget,
          oldBuses,
          currentBusesUpdate,
          newBusesUpdate,
          newBusesForBudget,
          oldCoasters,
          currentCoastersUpdate,
          newCoastersUpdate,
          newCoastersForBudget
        });
        break;

      default:
        // Default to update behavior
        const oldActualPeopleDefault = existingManifestEntry.Actual?.ActualPeople || 0;
        const currentActualPeopleDefault = budgetDetails.Actual?.ActualPeople || 0;
        const newActualPeopleDefault = parseInt(flatGeneral["Coordinator_SoulsDetails_TOTAL"]) || 0;
        newActualPeopleForBudget = (currentActualPeopleDefault - oldActualPeopleDefault) + newActualPeopleDefault;

        const oldTaxisDefault = existingManifestEntry.Actual?.Taxis || 0;
        const currentTaxisDefault = budgetDetails.Actual?.Taxis || 0;
        const newTaxisDefault = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Taxi" ? 1 : 0;
        newTaxisForBudget = (currentTaxisDefault - oldTaxisDefault) + newTaxisDefault;

        const oldBusesDefault = existingManifestEntry.Actual?.Buses || 0;
        const currentBusesDefault = budgetDetails.Actual?.Buses || 0;
        const newBusesDefault = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Bus" ? 1 : 0;
        newBusesForBudget = (currentBusesDefault - oldBusesDefault) + newBusesDefault;

        const oldCoastersDefault = existingManifestEntry.Actual?.Coasters || 0;
        const currentCoastersDefault = budgetDetails.Actual?.Coasters || 0;
        const newCoastersDefault = flatGeneral["Coordinator_DriversDetails_VehicleType"] === "Coaster" ? 1 : 0;
        newCoastersForBudget = (currentCoastersDefault - oldCoastersDefault) + newCoastersDefault;

        console.log('Default operation - Using update behavior');
    }

    console.log('Final calculated values:', {
      newActualPeopleForBudget,
      newTaxisForBudget,
      newBusesForBudget,
      newCoastersForBudget
    });

    const updatedData = {
      Actual: {
        ActualPeople: newActualPeopleForBudget,
        Taxis: newTaxisForBudget,
        Buses: newBusesForBudget,
        Coasters: newCoastersForBudget,
      }
    };

    console.log('Updated Data:', updatedData);

    // Updating budget database
    var result = await dbService.updateActualBudgetData({
      stage_name: budgetDetails.Details.StageName,
      actual_people: updatedData.Actual.ActualPeople,
      actual_coasters: updatedData.Actual.Coasters,
      actual_buses: updatedData.Actual.Buses,
      actual_taxis: updatedData.Actual.Taxis,
    }, new Date().toISOString());

    // ✅ Only update Cognito if this is NOT a webhook call
    if (!isWebhookCall) {
      // Updating budget cognito entry
      await updateCognitoEntry(BUDGET_FORM_ID, budgetFormId, updatedData);
    } else {
      console.log('⏭️ Skipping Cognito update to prevent recursion');
    }

    console.log('FLAT GENERAL:', flatGeneral);
    
    // Update manifest entry
    await dbService.updateManifestEntry(flatGeneral, updatedAt);

    console.log('Update Result:', result);
    
    // ✅ Send proper response
    return res.status(200).json({ 
      success: true, 
      message: `Manifest ${operation} completed successfully`,
      result,
      operation,
      calculatedValues: {
        newActualPeopleForBudget,
        newTaxisForBudget,
        newBusesForBudget,
        newCoastersForBudget
      }
    });

  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    return res.status(500).json({ 
      success: false, 
      message: 'Error processing webhook',
      error: error.message 
    });
  }
});

module.exports = router;
