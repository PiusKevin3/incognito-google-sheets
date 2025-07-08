const db = require('../config/db');

module.exports = {
  saveManifestEntry: async (data) => {
    const query = `
      INSERT INTO manifest_entries (data) 
      VALUES ($1) 
      RETURNING *`;
    return db.query(query, [data]);
  },
  
  saveFinanceEntry: async (data) => {
    const query = `
      INSERT INTO finance_entries (data) 
      VALUES ($1) 
      RETURNING *`;
    return db.query(query, [data]);
  },
  
  saveCognitoEntry: async (formId, entryId, entryData) => {
    const query = `
      INSERT INTO cognito_entries (
        cognito_form_id, 
        cognito_entry_id, 
        entry_data
      ) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (cognito_entry_id) DO NOTHING
      RETURNING *`;
    return db.query(query, [formId, entryId, entryData]);
  },
  
  getLatestCognitoEntry: async (formId) => {
    const query = `
      SELECT * 
      FROM cognito_entries 
      WHERE cognito_form_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1`;
    return db.query(query, [formId]);
  }
};