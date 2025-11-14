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
        await dbService.updateBudgetEntry(mapCognitoToBudgetEntry(flatGeneral), updatedAt);

        return res.status(200).send('Budget updated');
    } catch (error) {
        console.error(`Error updating budget: ${error.message}`);
        res.status(500).send('Error updating budget');
    }
})

router.post('/upsert-budget', validateApiKey, async (req, res) => {
    try {
        const budgetData = req.body;
        
        // Validate required fields for conflict resolution
        if (!budgetData.stage_name || !budgetData.manifest) {
            return res.status(400).json({ 
                success: false, 
                message: 'stage_name and manifest are required fields' 
            });
        }

        // Use provided updated_at or current timestamp
        const updatedAt = budgetData.updated_at || new Date().toISOString();

        // Call upsertBudgetEntry
        const result = await dbService.upsertBudgetEntry(budgetData, updatedAt);

        return res.status(200).json({ 
            success: true, 
            message: 'Budget entry upserted successfully',
            data: result.rows[0] || result
        });
    } catch (error) {
        console.error(`Error upserting budget entry: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            message: 'Error upserting budget entry',
            error: error.message 
        });
    }
})

router.post('/create-budget', validateApiKey, async (req, res) => {
    try {
        const budgetData = req.body;
        
        // Validate required fields (code and stage_name are NOT NULL in schema)
        if (!budgetData.code) {
            return res.status(400).json({ 
                success: false, 
                message: 'code is a required field' 
            });
        }

        if (!budgetData.stage_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'stage_name is a required field' 
            });
        }

        // Check if code already exists (since code is UNIQUE)
        const existingByCode = await dbService.checkBudgetByCode(budgetData.code);
        if (existingByCode) {
            return res.status(409).json({ 
                success: false, 
                message: `Budget entry with code '${budgetData.code}' already exists` 
            });
        }

        // Call createBudgetEntry
        const result = await dbService.createBudgetEntry(budgetData);

        return res.status(201).json({ 
            success: true, 
            message: 'Budget entry created successfully',
            data: result.rows[0] || result
        });
    } catch (error) {
        console.error(`Error creating budget entry: ${error.message}`);
        
        // Handle unique constraint violations
        // 23505 = unique_violation in PostgreSQL
        if (error.code === '23505') {
            let message = 'Budget entry with this combination already exists';
            
            // Provide more specific error message based on constraint
            if (error.constraint === 'gic_budget_entries_code_key') {
                message = `Budget entry with code '${budgetData.code}' already exists`;
            } else if (error.constraint === 'unique_stage_manifest') {
                message = `Budget entry with stage_name '${budgetData.stage_name}' and manifest '${budgetData.manifest}' already exists`;
            }
            
            return res.status(409).json({ 
                success: false, 
                message: message,
                error: error.message 
            });
        }

        // Handle not null constraint violations
        if (error.code === '23502') {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required field',
                error: error.message 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Error creating budget entry',
            error: error.message 
        });
    }
})

function mapCognitoToBudgetEntry(cognitoData) {
    return {
        region: cognitoData.Details_Region,
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
