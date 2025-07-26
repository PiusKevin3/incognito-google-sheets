const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Define SSL configuration based on environment
let sslConfig;

  try {
    // First try the direct path approach like service-account.json
    let caCert;

    // This approach matches how service-account.json is loaded in financeRoutes.js
    if (fs.existsSync('/etc/secrets/ca-certificate.crt')) {
      caCert = fs.readFileSync('/etc/secrets/ca-certificate.crt').toString();
      sslConfig = {
        ca: caCert,
        rejectUnauthorized: true
      };
      console.log('Successfully loaded CA certificate from /etc/secrets/');
    } else {
      console.log('CA certificate not found, using fallback SSL config');
      sslConfig = { rejectUnauthorized: false };
    }
  } catch (error) {
    console.error('Error loading CA certificate:', error);
    sslConfig = { rejectUnauthorized: false };
  }


const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
  ssl: sslConfig
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
