// dbService.js
const db = require('../config/db');

module.exports = {
  upsertManifestEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO manifest_entries (
        form_id, event, department, manifests, institutions, hospitals, masterclass,
        schools, up_country, stage_name, coordinator_name, coordinator_contact,
        driver_name, driver_contact, driver_nin_permit, driver_vehicle_type, driver_number_plate,
        vehicle_cost, vehicle_contribution, vehicle_booking_fee, vehicle_balance,
        cost_per_head, souls_total, souls_residents, souls_residents_firsttimers,
        souls_institutions, souls_institutions_firsttimers,
        souls_schools, souls_schools_firsttimers, verifier_name, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21,
        $22, $23, $24, $25,
        $26, $27, $28, $29, $30, $31
      )
      ON CONFLICT (form_id)
      DO UPDATE SET
        event = EXCLUDED.event,
        department = EXCLUDED.department,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat["ID1"],
      flat["Event"],
      flat["Department"],
      flat["Manifests"],
      flat["Institutions"],
      flat["Hospitals"],
      flat["Masterclass"],
      flat["Schools"],
      flat["UpCountry"],
      flat["StageName2"],
      flat["Coordinator_Name"],
      flat["Coordinator_Contact"],
      flat["Coordinator_DriversDetails_Name"],
      flat["Coordinator_DriversDetails_Contact"],
      flat["Coordinator_DriversDetails_NINPermitNo"],
      flat["Coordinator_DriversDetails_VehicleType"],
      flat["Coordinator_DriversDetails_NumberPlate"],
      flat["Coordinator_VehicleDetails_CostOfVehicle2"],
      flat["Coordinator_VehicleDetails_CashContribution"],
      flat["Coordinator_VehicleDetails_BookingFee"],
      flat["Coordinator_VehicleDetails_Balance"],
      flat["Coordinator_VehicleDetails_CostPerHead"],
      flat["Coordinator_SoulsDetails_TOTAL"],
      flat["Coordinator_SoulsDetails_Residents_NoOfPeople"],
      flat["Coordinator_SoulsDetails_Residents_FirstTimers"],
      flat["Coordinator_SoulsDetails_Institutions_NoOfPeople"],
      flat["Coordinator_SoulsDetails_Institutions_FirstTimers"],
      flat["Coordinator_SoulsDetails_Schools_NoOfPeople"],
      flat["Coordinator_SoulsDetails_Schools_FirstTimers"],
      flat["Coordinator_VehicleDetails_VerifierName"],
      updatedAt,
    ];

    return db.query(query, values);
  },

  // ✅ NEW FUNCTION: insertManifestEntry
  // This function performs a pure INSERT. It will throw an error if a record with the same form_id already exists
  // and form_id has a UNIQUE constraint.
  insertManifestEntry: async (formId, flat, updatedAt = new Date()) => {
    console.log(flat);
    
    if (!formId) {
      console.warn("⚠️ Skipped: Missing ID1 (form_id) for insertManifestEntry");
      return null; // Or throw an error, depending on desired behavior
    }

    const query = `
  INSERT INTO manifest_entries (
    form_id, event, department, manifests, institutions, hospitals, masterclass,
    schools, up_country, stage_name, coordinator_name, coordinator_contact,
    driver_name, driver_contact, driver_nin_permit, driver_vehicle_type,
    driver_number_plate, vehicle_cost, vehicle_contribution, vehicle_booking_fee,
    vehicle_balance, cost_per_head, souls_total, souls_residents, souls_residents_firsttimers,
    souls_institutions, souls_institutions_firsttimers, souls_schools,
    souls_schools_firsttimers, verifier_name, updated_at
  )
  VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11, $12,
    $13, $14, $15, $16,
    $17, $18, $19, $20,
    $21, $22, $23, $24, $25,
    $26, $27, $28,
    $29, $30, $31
  )
  ON CONFLICT (form_id) DO NOTHING;
`;


    const values = [
      formId, // Using the passed formId directly
      flat["General_Event"],
      flat["General_Department"],
      flat["General_Manifests"],
      flat["General_Institutions"],
      flat["General_Hospitals"],
      flat["General_Masterclass"],
      flat["General_Schools"],
      flat["General_UpCountry"],
      flat["General_StageName2"],
      flat["General_Coordinator_Name"],
      flat["General_Coordinator_Contact"],
      flat["General_Coordinator_DriversDetails_Name"],
      flat["General_Coordinator_DriversDetails_Contact"],
      flat["General_Coordinator_DriversDetails_NINPermitNo"],
      flat["General_Coordinator_DriversDetails_VehicleType"],
      flat["General_Coordinator_DriversDetails_NumberPlate"],
      flat["General_Coordinator_VehicleDetails_CostOfVehicle2"],
      flat["General_Coordinator_VehicleDetails_CashContribution"],
      flat["General_Coordinator_VehicleDetails_BookingFee"],
      flat["General_Coordinator_VehicleDetails_Balance"],
      flat["General_Coordinator_VehicleDetails_CostPerHead"],
      flat["General_Coordinator_SoulsDetails_TOTAL"],
      flat["General_Coordinator_SoulsDetails_Residents_NoOfPeople"],
      flat["General_Coordinator_SoulsDetails_Residents_FirstTimers"],
      flat["General_Coordinator_SoulsDetails_Institutions_NoOfPeople"],
      flat["General_Coordinator_SoulsDetails_Institutions_FirstTimers"],
      flat["General_Coordinator_SoulsDetails_Schools_NoOfPeople"],
      flat["General_Coordinator_SoulsDetails_Schools_FirstTimers"],
      flat["General_Coordinator_VehicleDetails_VerifierName"],
      updatedAt,
    ];

    const result = await db.query(query, values);
    console.log(`✅ Inserted new manifest entry: ${formId}`);
    return result.rows[0];
  },


  upsertFinanceEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO finance_entries (
        label, funding_party, amount, issued_by, received_by,
        form_id, final_balance, manifest_name, institution_name,
        school_name, department, cost_of_vehicle, balance, stage_name,
        contribution, booking_fee, event, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18
      )
      ON CONFLICT (form_id)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat["AccountabilityEntry_Label"],
      flat["FundingParty"],
      flat["Amount"],
      flat["IssuedBy"],
      flat["ReceivedBy"],
      flat["FormID"],
      flat["FinalBalance"],
      flat["ManifestName"],
      flat["InstitutionName"],
      flat["SchoolName"],
      flat["Department"],
      flat["CostOfVehicle"],
      flat["Balance"],
      flat["StageName"],
      flat["Contribution"],
      flat["BookingFee"],
      flat["Event"],
      updatedAt
    ];

    return db.query(query, values);
  },

  insertFinanceEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO finance_entries (
        label, funding_party, amount, issued_by, received_by,
        form_id, final_balance, manifest_name, institution_name,
        school_name, department, cost_of_vehicle, balance, stage_name,
        contribution, booking_fee, event, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18
      )
      ON CONFLICT (form_id)
      DO UPDATE SET
        amount = EXCLUDED.amount,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat["Section_AccountabilityEntry_Label"],
      flat["Section_FundingParty"],
      flat["Section_Amount"],
      flat["Section_IssuedBy"],
      flat["Section_ReceivedBy"],
      flat["Section_FormID"],
      flat["Section_FinalBalance"],
      flat["Section_ManifestName"],
      flat["Section_InstitutionName"],
      flat["Section_SchoolName"],
      flat["Section_Department"],
      flat["Section_CostOfVehicle"],
      flat["Section_Balance"],
      flat["Section_StageName"],
      flat["Section_Contribution"],
      flat["Section_BookingFee"],
      flat["Section_Event"],
      updatedAt
    ];

    return db.query(query, values);
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
  },
  // ✅ NEW: Get latest manifest entry
  getLatestManifestEntry: async () => {
    const query = `
      SELECT * 
      FROM manifest_entries 
      ORDER BY updated_at DESC 
      LIMIT 1`;

    return db.query(query);
  },

  // ✅ NEW: Get latest finance entry
  getLatestFinanceEntry: async () => {
    const query = `
      SELECT * 
      FROM finance_entries 
      ORDER BY updated_at DESC 
      LIMIT 1`;

    return db.query(query);
  },

  findFinanceByFormID: async (formId) => {
    const query = `SELECT * FROM finance_entries WHERE form_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);
    console.log(result);

    return result.rows[0] || null;
  },
  findManifestByFormID: async (formId) => {
    console.log(formId);

    const query = `SELECT * FROM manifest_entries WHERE form_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);
    console.log(result);

    return result.rows[0] || null;
  },

};

