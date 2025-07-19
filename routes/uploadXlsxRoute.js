const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const { upsertFinanceEntry } = require('../services/financeService');
const { upsertManifestEntry } = require('../services/manifestService');

const router = express.Router();

// Configure Multer with explicit field handling
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});



// const upload = multer({ dest: 'uploads/' });

function flattenObject(obj, prefix = '') {
    let result = {};
    for (let key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            Object.assign(result, flattenObject(obj[key], `${prefix}${key}_`));
        } else {
            result[`${prefix}${key}`] = obj[key];
        }
    }
    return result;
}

router.post('/upload-csv-sync', upload.single('file'), async (req, res) => {
    const type = req.body.type;
    const file = req.file;

    if (!file || !type) {
        return res.status(400).json({ error: 'File or type missing' });
    }

    try {
        // Validate type before processing
        if (type !== 'finance' && type !== 'manifest') {
            fs.unlinkSync(file.path);
            return res.status(400).json({ error: 'Invalid type' });
        }

        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const results = [];

        for (const row of sheetData) {
            
            const flat = flattenObject(row);

            // console.log(flat.Section_AccountabilityEntry);
            

            if (!flat.General_ID1&&!flat.Section_AccountabilityEntry) {
                results.push({ inserted: false, reason: 'Missing form_id', row: flat });
                continue;
            }

            try {
                let result;
                if (type === 'finance') {
                    
                    result = await upsertFinanceEntry(flat);
                } else {
                    
                    result = await upsertManifestEntry(flat);
                }

                // Ensure result has the expected structure
                if (result && typeof result === 'object' && 'inserted' in result) {
                    results.push(result);
                } else {
                    results.push({
                        inserted: false,
                        reason: 'Unexpected response from service',
                        serviceResponse: result
                    });
                }
            } catch (serviceErr) {
                results.push({
                    inserted: false,
                    reason: 'Service error',
                    error: serviceErr.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        return res.status(200).json({
            message: `Sync complete for ${type}`,
            summary: {
                total: results.length,
                inserted: results.filter(r => r.inserted).length,
                skipped: results.filter(r => !r.inserted).length,
            },
            details: results,
        });

    } catch (err) {
        console.error('Upload error:', err);
        // Clean up file even on error
        if (file && file.path) {
            try {
                fs.unlinkSync(file.path);
            } catch (cleanupErr) {
                console.error('File cleanup error:', cleanupErr);
            }
        }
        return res.status(500).json({ 
            error: 'Error processing file',
            details: err.message 
        });
    }
});

module.exports = router;
