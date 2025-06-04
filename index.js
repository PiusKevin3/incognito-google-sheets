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



        // Extract the General object where all manifest data lives
        const general = req.body.General || {};

        if (!req.body?.General) {
            return res.status(400).json({ success: false, message: "Missing 'General' in request body." });
        }


        // Log the General structure for debugging
        console.log("General structure:", JSON.stringify(general, null, 2));

        // Extract all values from the General object
        const values = [[
            general.Event ?? '',
            general.Department ?? '',
            general.Manifests ?? '',
            general.StageName ?? '',
            general.Coordinator?.Name ?? '',
            general.Coordinator?.Contact ?? '',
            general.DriversDetails?.Name ?? '',
            general.DriversDetails?.Contact ?? '',
            general.DriversDetails?.NINPermitNo ?? '',
            general.DriversDetails?.VehicleType ?? '',
            general.DriversDetails?.NumberPlate ?? '',
            general.VehicleDetails?.CostOfVehicle2 ?? '',
            general.VehicleDetails?.CashContribution ?? '',
            general.VehicleDetails?.BookingFee ?? '',
            general.VehicleDetails?.Balance ?? '',
            general.VehicleDetails?.CostPerHead ?? '',
            general.SoulsDetails?.TotalNumber ?? '',
            general.SoulsDetails?.Residents?.NoOfPeople ?? '',
            general.SoulsDetails?.Residents?.FirstTimers ?? '',
            general.SoulsDetails?.Institutions?.NoOfPeople ?? '',
            general.SoulsDetails?.Institutions?.FirstTimers ?? '',
            general.SoulsDetails?.Schools?.NoOfPeople ?? '',
            general.SoulsDetails?.Schools?.FirstTimers ?? '',
            general.VehicleDetails?.VerifierName ?? ''
        ]];

        console.log("Processed values:", JSON.stringify(values[0], null, 2));

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
