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

    const d = req.body;
    console.log(JSON.stringify(req.body, null, 2));

    // Map your data to the sheet columns
    const values = [[
  d['General.Event'] || '',
  d['General.Department'] || '',
  d['General.Manifests'] || '',
  d['General.StageName'] || '',
  d['General.Coordinator.Name'] || '',
  d['General.Coordinator.Contact'] || '',
  d['General.DriversDetails.Name'] || '',
  d['General.DriversDetails.Contact'] || '',
  d['General.DriversDetails.NINPermitNo'] || '',
  d['General.DriversDetails.VehicleType'] || '',
  d['General.VehicleDetails.CostOfVehicle2'] || '',
  d['General.VehicleDetails.CashContribution'] || '',
  d['General.VehicleDetails.BookingFee'] || '',
  d['General.VehicleDetails.Balance'] || '',
  d['General.VehicleDetails.CostPerHead'] || '',
  d['General.SoulsDetails.TotalNumber'] || '',
  d['General.SoulsDetails.Residents.NoOfPeople'] || '',
  d['General.SoulsDetails.Residents.FirstTimers'] || '',
  d['General.SoulsDetails.Institutions.NoOfPeople'] || '',
  d['General.SoulsDetails.Institutions.FirstTimers'] || '',
  d['General.SoulsDetails.Schools.NoOfPeople'] || '',
  d['General.SoulsDetails.Schools.FirstTimers'] || '',
  d['General.VehicleDetails.VerifierName'] || ''
]];


    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    res.json({ success: true, message: 'Data saved to Google Sheets!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to save data' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
