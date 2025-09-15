const express = require('express');
const router = express.Router();
const { validateApiKey, flattenObject, flattenXlsxObject, BUDGET_COLUMN_MAPPINGS } = require('../utils/helpers');
const { updateCognitoEntry } = require('../services/cognitoService');
const dbService = require('../services/dbService');

const BUDGET_FORM_ID = process.env.BUDGET_FORM_ID;

router.post('/update-budget', validateApiKey, async (req, res) => {
    try {
        console.log(req.body);

        await updateCognitoEntry(BUDGET_FORM_ID, req.body.Entry.Number, {
            Actual: {
                ActualPeople: req.body.Actual.ActualPeople,
                ActualCoasters: req.body.Actual.ActualCoasters,
                ActualBuses: req.body.Actual.ActualBuses,
                ActualTaxis: req.body.Actual.ActualTaxis,
                FinanceContribution: req.body.Actual.FinanceContribution
            }
        });

        res.status(200).send('Budget updated');
    } catch (error) {
        console.error(`Error updating budget: ${error.message}`);
        res.status(500).send('Error updating budget');
    }
})

router.post('/update-budget-manifest', validateApiKey, async (req, res) => {
    try {
        const flatGeneral = flattenObject(req.body);
        const updatedAt = new Date(req.body.updated_at || req.body.created_at || Date.now());
        console.log(mapCognitoToBudgetEntry(flatGeneral));
        await dbService.upsertBudgetEntry(mapCognitoToBudgetEntry(flatGeneral), updatedAt);

        return res.status(200).send('Budget updated');
    } catch (error) {
        console.error(`Error updating budget: ${error.message}`);
        res.status(500).send('Error updating budget');
    }
})

function mapCognitoToBudgetEntry(cognitoData) {
    return {
      department: cognitoData.Details_Department,
      code: cognitoData.Details_Code,
      division: cognitoData.Details_Division,
      manifest: cognitoData.Details_Manifests || cognitoData.Details_Institution || cognitoData.Details_Schools,
      stage_name: cognitoData.Details_StageName,
      planned_people: cognitoData.Planned_PlannedPeople,
      planned_coasters: cognitoData.Planned_PlannedCoasters,
      planned_buses: cognitoData.Planned_PlannedBuses,
      planned_taxis: cognitoData.Planned_PlannedTaxis,
      cost_per_head: cognitoData.Planned_CostPerHead,
      contribution: cognitoData.Planned_Contribution,
      total_cost: cognitoData.Planned_TotalCost1,
      coaster_campaign: cognitoData.Planned_CoasterCampaign,
      manifest_pledge: cognitoData.Planned_ManifestPledge,
      actual_people: cognitoData.Actual_ActualPeople,
      actual_coasters: cognitoData.Actual_ActualCoasters,
      actual_buses: cognitoData.Actual_ActualBuses,
      actual_taxis: cognitoData.Actual_ActualTaxis
    };
  }

module.exports = router;
