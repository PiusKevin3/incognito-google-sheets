const db = require('../config/db');

module.exports = {
  upsertManifestEntry: async (data, updatedAt) => {
    const query = `
      INSERT INTO manifest_entries (data, updated_at)
      VALUES ($1, $2)
      ON CONFLICT ((data->>'FormID'))
      DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      RETURNING *`;
      
    return db.query(query, [data, updatedAt]);
  },

  upsertFinanceEntry: async (data, updatedAt) => {
    const query = `
      INSERT INTO finance_entries (data, updated_at)
      VALUES ($1, $2)
      ON CONFLICT ((data->>'FormID'))
      DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
      RETURNING *`;

    return db.query(query, [data, updatedAt]);
  },

  upsertCognitoEntry: async (formId, entryId, entryData, updatedAt) => {
    const query = `
      INSERT INTO cognito_entries (
        cognito_form_id, 
        cognito_entry_id, 
        entry_data,
        updated_at
      ) 
      VALUES ($1, $2, $3, $4) 
      ON CONFLICT (cognito_entry_id) 
      DO UPDATE SET entry_data = EXCLUDED.entry_data, updated_at = EXCLUDED.updated_at
      RETURNING *`;

    return db.query(query, [formId, entryId, entryData, updatedAt]);
  },

  getLatestCognitoEntry: async (formId) => {
    const query = `
      SELECT * 
      FROM cognito_entries 
      WHERE cognito_form_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1`;

    return db.query(query, [formId]);
  }
};
