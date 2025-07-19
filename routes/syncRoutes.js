// server.js or routes.js or wherever your Express app is defined
const express = require('express');
const router = express.Router();
const syncJob = require('../services/syncService');

// Manual sync trigger
router.post('/sync-cognito', async (req, res) => {
    try {
        const hasApiKey = req.query.apiKey === process.env.API_KEY;

        if (!hasApiKey) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid API key' });
        }
        
        await syncJob.syncNow();
        res.status(200).json({ message: 'Cognito sync triggered manually ✅' });
    } catch (err) {
        console.error('Manual sync failed:', err.message);
        res.status(500).json({ error: 'Cognito sync failed ❌' });
    }
});

module.exports = router;
