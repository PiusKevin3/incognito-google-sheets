// routes/uploadCsvRoute.js
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry } = require('../services/manifestService');
const { flattenObject } = require('../utils/helpers');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-csv-sync/:type', upload.single('csv'), async (req, res) => {
    const type = req.query.type;

    if (!['finance', 'manifest'].includes(type)) {
        return res.status(400).json({
            success: false,
            message: "Invalid type. Please specify 'finance' or 'manifest' in the query (?type=finance|manifest)"
        });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });
    }

    const results = [];
    const filePath = path.join(__dirname, '..', req.file.path);

    try {
        const stream = fs.createReadStream(filePath)
            .pipe(csv());

        stream.on('data', (data) => results.push(data));

        stream.on('end', async () => {
            const summary = {
                total: results.length,
                success: 0,
                failed: [],
            };

            const upsertFn = type === 'finance' ? upsertFinanceEntry : upsertManifestEntry;

            for (const row of results) {
                try {
                    const transformedRow = flattenObject(row);
                    await upsertFn(transformedRow);
                    summary.success++;
                } catch (err) {
                    summary.failed.push({ row, error: err.message });
                }
            }

            fs.unlinkSync(filePath); // cleanup uploaded file

            res.json({ message: `${type} CSV sync complete ✅`, summary });
        });

    } catch (error) {
        console.error(`${type} CSV sync error:`, error);
        res.status(500).json({ success: false, message: `${type} CSV sync failed ❌` });
    }
});

module.exports = router;
