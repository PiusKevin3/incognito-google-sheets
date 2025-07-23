const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { processXlsxSyncUpload } = require('../utils/helpers')

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



router.post('/upload-xlsx-sync', upload.single('file'), async (req, res) => {
    const { file } = req;
    const type = req.body.type;

    if (!file || !type) {
        return res.status(400).json({ error: 'File or type missing' });
    }

    if (type !== 'finance' && type !== 'manifest') {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: 'Invalid type' });
    }

    try {
        const result = await processXlsxSyncUpload(file, type);
        fs.unlinkSync(file.path); // Clean up file
        return res.status(200).json(result);
    } catch (err) {
        console.error('Upload error:', err);
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
