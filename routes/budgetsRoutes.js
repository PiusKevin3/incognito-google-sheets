const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../utils/helpers');
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

        await dbService.upsertBudgetEntry(flatGeneral, updatedAt);

        return res.status(200).send('Budget updated');
    } catch (error) {
        console.error(`Error updating budget: ${error.message}`);
        res.status(500).send('Error updating budget');
    }
})

module.exports = router;
