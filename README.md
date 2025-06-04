# Google Sheets Webhook API

This Node.js application exposes a `/submit-manifest` POST endpoint that accepts JSON payloads and appends structured data into a specified Google Sheet.

## 🚀 Features

- Accepts manifest data via a RESTful API.
- Flattens nested JSON objects.
- Appends rows into a Google Sheet using a service account.
- Ideal for structured event or coordinator data intake.

---

## 🧰 Prerequisites

- Node.js v14 or higher
- A Google Cloud Platform (GCP) project with Google Sheets API enabled
- A service account JSON key with edit access to the target Google Sheet

---

## 📦 Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-repo/google-sheets-webhook.git
cd google-sheets-webhook
```
2. **Install Dependencies:**

```bash
npm install
```
3. **Create Environment File:**

Create a .env file in the project root with the following content:
```bash
.env

GOOGLE_SHEET_ID=your_google_sheet_id
PORT=4000

```
4. **Add Service Account Credentials:**

Download your service account JSON file from Google Cloud and save it as:

```bash
service-account.json
```


## ▶️ Running the Webhook

 **Start the server using:**

```bash
node index.js
```
**Expected output::**

```bash
Server running on port 4000
```

## 📡 API Endpoint

 **POST /submit-manifest**

 Accepts a JSON payload and appends the data to the Google Sheet.

Headers
```bash
Content-Type: application/json
```
**Example Payload:**

```bash
{
  "General": {
    "Event": "MGP",
    "Department": "Residential",
    "Manifests": "Ntinda Manifest",
    "StageName": "Kamwokya",
    "CoordinatorName": "Sam Okello",
    "CoordinatorContact": "0780000000",
    "DriverName": "Peter",
    "DriverContact": "0771234567",
    "NINPermitNo": "CM12345678",
    "VehicleType": "Hiace",
    "NumberPlate": "UBA123A",
    "CostOfVehicle": 1200000,
    "CashContribution": 200000,
    "BookingFee": 20000,
    "Balance": 980000,
    "CostPerHead": 10000,
    "TotalSouls": 30,
    "ResidentsNo": 15,
    "ResidentsFirstTimers": 3,
    "InstitutionsNo": 10,
    "InstitutionsFirstTimers": 2,
    "SchoolsNo": 5,
    "SchoolsFirstTimers": 1,
    "VerifierName": "Jane Doe"
  }
}
```

**Sample cURL Request:**

```bash
curl -X POST http://localhost:4000/submit-manifest \
  -H "Content-Type: application/json" \
  -d @payload.json
```


## 📋 Google Sheet Requirements

Ensure your Google Sheet has the following headers in row 1, in this exact order:

```bash
Event | Department | Manifests | Stage Name | Coordinator Name | Coordinator Contact | Driver Name | Driver Contact | NIN/Permit no. | Vehicle Type | Number Plate | Cost Of Vehicle | Cash Contribution | Booking Fee | Balance | Cost Per Head | Total Souls | Residents No. | Residents First Timers | Institutions No. | Institutions First Timers | Schools No. | Schools First Timers | Verifier Name
```
These must match the flattened keys from the JSON input.

## 🔐 How to Configure Google Sheets Access

1. **Create a Google Cloud Project**

- Visit https://console.cloud.google.com

- Create a new project

---

2. **Enable Sheets API**

- Go to APIs & Services > Library

- Search for Google Sheets API

- Click Enable


3. **Create a Service Account**

- Go to IAM & Admin > Service Accounts

- Click Create Service Account

- Set name, and proceed

- Assign the role: Editor

---

4. **Generate and Download the Credentials File**

- In the service account's Keys tab

- Click Add Key > Create new key > JSON

- Save it as service-account.json in your project root


5. **Share Your Google Sheet with the Service Account**

- Open your Google Sheet

- Click Share

- Add the client_email from the JSON file

- Grant Editor permission



## 🛠 Customizing the Webhook for Your Own Google Sheet

If others want to reuse this webhook:

    1. Clone the repository.
    2. Replace the value of GOOGLE_SHEET_ID in .env with their own Sheet ID.
    3. Download their own Google service account JSON file and replace service-account.json.
    4. Ensure the Google Sheet has matching headers
    5. Share the sheet with the service account email.
    6. Start the server: node index.js

## 🧪 Troubleshooting

| Issue                 | Fix                                                                  |
|-----------------------|----------------------------------------------------------------------|
| 403 Permission Denied | Ensure the Sheet is shared with the service account as Editor        |
| Blank or incorrect rows | Check that JSON keys match sheet headers exactly                   |
| Server not starting   | Ensure `.env` and `service-account.json` are present and correct     |
| API request failing   | Confirm payload is valid JSON and correct headers used               |

---

## 📬 Contributing

Feel free to fork this repository and make your own enhancements — such as supporting multiple sheets, additional validation, or even authentication middleware.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

