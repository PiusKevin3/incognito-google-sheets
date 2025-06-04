require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
// const keys = require('./service-account.json'); //local host
const keys = require('/etc/secrets/service-account.json'); //render


const app = express();
app.use(express.json());

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
    credentials: keys,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

app.post('/submit-manifest', async (req, res) => {
    try {
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Log the entire request body to understand its structure
        console.log("Full request body:", JSON.stringify(req.body, null, 2));

        //         console.log("Top-level keys in request body:", Object.keys(req.body));

        // // Log specific objects to see their structure
        // console.log("Event:", req.body.Event);
        // console.log("Coordinator:", req.body.Coordinator);
        // console.log("DriversDetails:", req.body.DriversDetails);
        // console.log("VehicleDetails:", req.body.VehicleDetails);
        // console.log("SoulsDetails:", req.body.SoulsDetails);

        // Extract data directly from the root level
        const values = [[
            req.body.Event ?? '',
            req.body.Department ?? '',
            req.body.Manifests ?? '',
            req.body.StageName ?? '',
            req.body.Coordinator?.Name ?? '',
            req.body.Coordinator?.Contact ?? '',
            req.body.DriversDetails?.Name ?? '',
            req.body.DriversDetails?.Contact ?? '',
            req.body.DriversDetails?.NINPermitNo ?? '',
            req.body.DriversDetails?.VehicleType ?? '',
            req.body.DriversDetails?.NumberPlate ?? '',
            req.body.VehicleDetails?.CostOfVehicle2 ?? '',
            req.body.VehicleDetails?.CashContribution ?? '',
            req.body.VehicleDetails?.BookingFee ?? '',
            req.body.VehicleDetails?.Balance ?? '',
            req.body.VehicleDetails?.CostPerHead ?? '',
            req.body.SoulsDetails?.TotalNumber ?? '',
            req.body.SoulsDetails?.Residents?.NoOfPeople ?? '',
            req.body.SoulsDetails?.Residents?.FirstTimers ?? '',
            req.body.SoulsDetails?.Institutions?.NoOfPeople ?? '',
            req.body.SoulsDetails?.Institutions?.FirstTimers ?? '',
            req.body.SoulsDetails?.Schools?.NoOfPeople ?? '',
            req.body.SoulsDetails?.Schools?.FirstTimers ?? '',
            req.body.VehicleDetails?.VerifierName ?? ''
        ]];

        console.log("Processed values:", values[0]);

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });

        res.json({ success: true, message: 'Data saved to Google Sheets!' });
    } catch (error) {
        console.error('Google Sheets API Error:', error);
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
