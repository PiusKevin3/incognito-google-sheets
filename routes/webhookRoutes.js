const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const dbService = require('../services/dbService');
const { verifyCognitoSignature } = require('../utils/helpers');

router.post('/cognito-webhook', async (req, res) => {
  try {
    // Verify HMAC signature
    if (!verifyCognitoSignature(req)) {
      return res.status(401).send('Invalid signature');
    }

    const { formId, entryId, event } = req.body;
    
    if (event !== 'entry.created') {
      return res.status(200).send('Ignored event');
    }

    await dbService.saveCognitoEntry(formId, entryId, req.body);
    res.status(200).send('Entry saved');
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    res.status(500).send('Error processing webhook');
  }
});

module.exports = router;