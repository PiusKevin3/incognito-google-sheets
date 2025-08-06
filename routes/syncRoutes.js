// routes/syncRoutes.js or similar
const express = require('express');
const router = express.Router();
const syncJob = require('../services/syncService');

// Manual sync trigger
router.post('/sync-cognito', async (req, res) => {
    try {
        const hasApiKey = req.query.apiKey === process.env.API_KEY;
        const type = req.body.type;
        var formId = null;


        if (!hasApiKey) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid API key' });
        }

        switch (type) {
            case 'manifest':
                formId = process.env.MANIFEST_FORM_ID;
                break;
            case 'finance':
                formId = process.env.FINANCE_FORM_ID;
                break;
            case 'budget':
                formId = process.env.BUDGET_FORM_ID;
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid type' });
        }

        await syncJob.syncNow(formId);

        // This will already use MANIFEST_FORM_ID and FINANCE_FORM_ID from .env
        res.status(200).json({ success: true, message: '✅ Cognito sync triggered manually' });
    } catch (err) {
        console.error('Manual sync failed:', err.message);
        res.status(500).json({ success: false, error: '❌ Cognito sync failed' });
    }
});

module.exports = router;
