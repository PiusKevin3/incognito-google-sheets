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

        // const d = req.body.General || {};
        console.log("Request full details : "+req.body);
        
        const d = {
            ...req.body.General,
            Coordinator: req.body.General?.Coordinator || {},
            DriversDetails: req.body.General?.DriversDetails || {},
            VehicleDetails: req.body.General?.VehicleDetails || {},
            SoulsDetails: {
                ...req.body.General?.SoulsDetails,
                Residents: req.body.General?.SoulsDetails?.Residents || {},
                Institutions: req.body.General?.SoulsDetails?.Institutions || {},
                Schools: req.body.General?.SoulsDetails?.Schools || {},
            },
        };


        const values = [[
            d.Event || '',
            d.Department || '',
            d.Manifests || '',
            d.StageName || '',
            d.Coordinator?.Name || '',
            d.Coordinator?.Contact || '',
            d.DriversDetails?.Name || '',
            d.DriversDetails?.Contact || '',
            d.DriversDetails?.NINPermitNo || '',
            d.DriversDetails?.VehicleType || '',
            d.DriversDetails?.NumberPlate || '',
            d.VehicleDetails?.CostOfVehicle2 ?? '',
            d.VehicleDetails?.CashContribution ?? '',
            d.VehicleDetails?.BookingFee ?? '',
            d.VehicleDetails?.Balance ?? '',
            d.VehicleDetails?.CostPerHead ?? '',
            d.SoulsDetails?.TotalNumber ?? '',
            d.SoulsDetails?.Residents?.NoOfPeople ?? '',
            d.SoulsDetails?.Residents?.FirstTimers ?? '',
            d.SoulsDetails?.Institutions?.NoOfPeople ?? '',
            d.SoulsDetails?.Institutions?.FirstTimers ?? '',
            d.SoulsDetails?.Schools?.NoOfPeople ?? '',
            d.SoulsDetails?.Schools?.FirstTimers ?? '',
            d.VehicleDetails?.VerifierName || ''
        ]];

        console.log(values);



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
