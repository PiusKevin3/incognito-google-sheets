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

    // Map your data to the sheet columns
    const values = [[
      d.Event || '',
      d.Department || '',
      d.Manifests || '',
      d.StageName || '',
      d.CoordinatorName || '',
      d.CoordinatorContact || '',
      d.DriverName || '',
      d.DriverContact || '',
      d.DriverNINOrPermit || '',
      d.VehicleType || '',
      d.VehicleCost || '',
      d.CashContribution || '',
      d.BookingFee || '',
      d.Balance || '',
      d.CostPerHead || '',
      d.TotalSouls || '',
      d.ResidentCount || '',
      d.ResidentFirstTimers || '',
      d.InstitutionCount || '',
      d.InstitutionFirstTimers || '',
      d.SchoolCount || '',
      d.SchoolFirstTimers || '',
      d.VerifierName || ''
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
