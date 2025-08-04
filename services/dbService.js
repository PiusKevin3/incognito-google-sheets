// dbService.js
const db = require('../config/db');
const { parseNumeric } = require('../utils/numericUtils');

module.exports = {
  upsertManifestEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO manifest_entries (
        budget_entry_id,
        form_id,
        event,
        department,
        manifests,
        institutions,
        hospitals,
        masterclass,
        schools,
        up_country,
        stage_name,
        coordinator_name,
        coordinator_contact,
        driver_name,
        driver_contact,
        driver_nin_permit,
        driver_vehicle_type,
        driver_number_plate,
        vehicle_cost,
        vehicle_contribution,
        vehicle_booking_fee,
        vehicle_balance,
        cost_per_head,
        souls_total,
        souls_residents,
        souls_residents_firsttimers,
        souls_institutions,
        souls_institutions_firsttimers,
        souls_schools, souls_schools_firsttimers, verifier_name, updated_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17,
        $18,
        $19,
        $20,
        $21,
        $22,
        $23,
        $24,
        $25,
        $26,
        $27,
        $28,
        $29,
        $30,
        $31,
        $32
      )
      ON CONFLICT (form_id)
      DO UPDATE SET
        event = EXCLUDED.event,
        department = EXCLUDED.department,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat["BudgetID"],
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
  insertManifestEntry: async (formId, entry, updatedAt = new Date()) => {
    // console.log("insert manifest : " + entry);

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
    ON CONFLICT (form_id) DO UPDATE SET
      event = COALESCE(EXCLUDED.event, manifest_entries.event),
      department = COALESCE(EXCLUDED.department, manifest_entries.department),
      manifests = COALESCE(EXCLUDED.manifests, manifest_entries.manifests),
      institutions = COALESCE(EXCLUDED.institutions, manifest_entries.institutions),
      hospitals = COALESCE(EXCLUDED.hospitals, manifest_entries.hospitals),
      masterclass = COALESCE(EXCLUDED.masterclass, manifest_entries.masterclass),
      schools = COALESCE(EXCLUDED.schools, manifest_entries.schools),
      up_country = COALESCE(EXCLUDED.up_country, manifest_entries.up_country),
      stage_name = COALESCE(EXCLUDED.stage_name, manifest_entries.stage_name),
      coordinator_name = COALESCE(EXCLUDED.coordinator_name, manifest_entries.coordinator_name),
      coordinator_contact = COALESCE(EXCLUDED.coordinator_contact, manifest_entries.coordinator_contact),
      driver_name = COALESCE(EXCLUDED.driver_name, manifest_entries.driver_name),
      driver_contact = COALESCE(EXCLUDED.driver_contact, manifest_entries.driver_contact),
      driver_nin_permit = COALESCE(EXCLUDED.driver_nin_permit, manifest_entries.driver_nin_permit),
      driver_vehicle_type = COALESCE(EXCLUDED.driver_vehicle_type, manifest_entries.driver_vehicle_type),
      driver_number_plate = COALESCE(EXCLUDED.driver_number_plate, manifest_entries.driver_number_plate),
      vehicle_cost = COALESCE(EXCLUDED.vehicle_cost, manifest_entries.vehicle_cost),
      vehicle_contribution = COALESCE(EXCLUDED.vehicle_contribution, manifest_entries.vehicle_contribution),
      vehicle_booking_fee = COALESCE(EXCLUDED.vehicle_booking_fee, manifest_entries.vehicle_booking_fee),
      vehicle_balance = COALESCE(EXCLUDED.vehicle_balance, manifest_entries.vehicle_balance),
      cost_per_head = COALESCE(EXCLUDED.cost_per_head, manifest_entries.cost_per_head),
      souls_total = COALESCE(EXCLUDED.souls_total, manifest_entries.souls_total),
      souls_residents = COALESCE(EXCLUDED.souls_residents, manifest_entries.souls_residents),
      souls_residents_firsttimers = COALESCE(EXCLUDED.souls_residents_firsttimers, manifest_entries.souls_residents_firsttimers),
      souls_institutions = COALESCE(EXCLUDED.souls_institutions, manifest_entries.souls_institutions),
      souls_institutions_firsttimers = COALESCE(EXCLUDED.souls_institutions_firsttimers, manifest_entries.souls_institutions_firsttimers),
      souls_schools = COALESCE(EXCLUDED.souls_schools, manifest_entries.souls_schools),
      souls_schools_firsttimers = COALESCE(EXCLUDED.souls_schools_firsttimers, manifest_entries.souls_schools_firsttimers),
      verifier_name = COALESCE(EXCLUDED.verifier_name, manifest_entries.verifier_name),
      updated_at = NOW()
    WHERE
      manifest_entries.* IS DISTINCT FROM EXCLUDED.*;
  `;

    const values = [
      formId,
      entry.General_Event,
      entry.General_Department,
      entry.General_Manifests,
      entry.General_Institutions,
      entry.General_Hospitals,
      entry.General_Masterclass,
      entry.General_Schools,
      entry.General_UpCountry,
      entry.General_StageName2,
      entry.General_Coordinator_Name,
      entry.General_Coordinator_Contact,
      entry.General_Coordinator_DriversDetails_Name,
      entry.General_Coordinator_DriversDetails_Contact,
      entry.General_Coordinator_DriversDetails_NINPermitNo,
      entry.General_Coordinator_DriversDetails_VehicleType,
      entry.General_Coordinator_DriversDetails_NumberPlate,
      entry.General_Coordinator_VehicleDetails_CostOfVehicle2,
      entry.General_Coordinator_VehicleDetails_CashContribution,
      entry.General_Coordinator_VehicleDetails_BookingFee,
      entry.General_Coordinator_VehicleDetails_Balance,
      entry.General_Coordinator_VehicleDetails_CostPerHead,
      entry.General_Coordinator_SoulsDetails_TOTAL,
      entry.General_Coordinator_SoulsDetails_Residents_NoOfPeople,
      entry.General_Coordinator_SoulsDetails_Residents_FirstTimers,
      entry.General_Coordinator_SoulsDetails_Institutions_NoOfPeople,
      entry.General_Coordinator_SoulsDetails_Institutions_FirstTimers,
      entry.General_Coordinator_SoulsDetails_Schools_NoOfPeople,
      entry.General_Coordinator_SoulsDetails_Schools_FirstTimers,
      entry.General_Coordinator_VehicleDetails_VerifierName,
      updatedAt,
    ];

    const result = await db.query(query, values);
    console.log(`✅ Inserted new manifest entry: ${formId}`);
    return result;
  },


  upsertFinanceEntryDeprecated: async (flat, updatedAt) => {
    const query = `
      INSERT INTO finance_entries (
        manifest_entry_id, budget_entry_id, label, funding_party, amount, issued_by, received_by,
        form_id, final_balance, manifest_name, institution_name,
        school_name, department, cost_of_vehicle, balance, stage_name,
        contribution, booking_fee, event, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20
      )
      ON CONFLICT (stage_name, manifest_name)
      DO UPDATE SET
        manifest_entry_id = EXCLUDED.manifest_entry_id,
        budget_entry_id = EXCLUDED.budget_entry_id,
        label = EXCLUDED.label,
        funding_party = EXCLUDED.funding_party,
        issued_by = EXCLUDED.issued_by,
        received_by = EXCLUDED.received_by,
        amount = EXCLUDED.amount,
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat["FormID"],
      flat["BudgetID"],
      flat["AccountabilityEntry_Label"],
      flat["FundingParty"],
      parseNumeric(flat["Amount"]),
      flat["IssuedBy"],
      flat["ReceivedBy"],
      flat["FormID"],
      parseNumeric(flat["FinalBalance"]),
      flat["ManifestName"],
      flat["InstitutionName"],
      flat["SchoolName"],
      flat["Department"],
      flat["CostOfVehicle"],
      parseNumeric(flat["Balance"]),
      flat["StageName"],
      parseNumeric(flat["Contribution"]),
      parseNumeric(flat["BookingFee"]),
      flat["Event"],
      updatedAt
    ];

    return db.query(query, values);
  },

  upsertFinanceEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO finance_entries (
        entry_id, manifest_entry_id, budget_entry_id, label, funding_party, amount, issued_by, received_by,
        form_id, final_balance, manifest_name, institution_name,
        school_name, department, cost_of_vehicle, balance, stage_name,
        contribution, booking_fee, event, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      ON CONFLICT (entry_id)
      DO UPDATE SET
        manifest_entry_id = COALESCE(EXCLUDED.manifest_entry_id, finance_entries.manifest_entry_id),
        budget_entry_id = COALESCE(EXCLUDED.budget_entry_id, finance_entries.budget_entry_id),
        label = COALESCE(EXCLUDED.label, finance_entries.label),
        funding_party = COALESCE(EXCLUDED.funding_party, finance_entries.funding_party),
        amount = COALESCE(EXCLUDED.amount, finance_entries.amount),
        issued_by = COALESCE(EXCLUDED.issued_by, finance_entries.issued_by),
        received_by = COALESCE(EXCLUDED.received_by, finance_entries.received_by),
        final_balance = COALESCE(EXCLUDED.final_balance, finance_entries.final_balance),
        manifest_name = COALESCE(EXCLUDED.manifest_name, finance_entries.manifest_name),
        institution_name = COALESCE(EXCLUDED.institution_name, finance_entries.institution_name),
        school_name = COALESCE(EXCLUDED.school_name, finance_entries.school_name),
        department = COALESCE(EXCLUDED.department, finance_entries.department),
        cost_of_vehicle = COALESCE(EXCLUDED.cost_of_vehicle, finance_entries.cost_of_vehicle),
        balance = COALESCE(EXCLUDED.balance, finance_entries.balance),
        stage_name = COALESCE(EXCLUDED.stage_name, finance_entries.stage_name),
        contribution = COALESCE(EXCLUDED.contribution, finance_entries.contribution),
        booking_fee = COALESCE(EXCLUDED.booking_fee, finance_entries.booking_fee),
        event = COALESCE(EXCLUDED.event, finance_entries.event),
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat["ID"],                    // entry_id
      flat["FormID"],                // manifest_entry_id (formID corresponds to manifest_entry_id)
      flat["BudgetID"],              // budget_entry_id
      flat["AccountabilityEntry_Label"], // label
      flat["FundingParty"],          // funding_party
      parseNumeric(flat["Amount"]),  // amount
      flat["IssuedBy"],              // issued_by
      flat["ReceivedBy"],            // received_by
      flat["FormID"],                // form_id
      parseNumeric(flat["FinalBalance"]), // final_balance
      flat["ManifestName"],          // manifest_name
      flat["InstitutionName"],       // institution_name
      flat["SchoolName"],            // school_name
      flat["Department"],            // department
      flat["CostOfVehicle"],         // cost_of_vehicle
      parseNumeric(flat["Balance"]), // balance
      flat["StageName"],             // stage_name
      parseNumeric(flat["Contribution"]), // contribution
      parseNumeric(flat["BookingFee"]), // booking_fee
      flat["Event"],                 // event
      updatedAt                      // updated_at
    ];

    console.log('Upserting finance entry with entry_id:', flat["ID"]);
    console.log('Values:', values);

    return db.query(query, values);
  },

  updateFinanceEntry: async (flat, updatedAt) => {
    const query = `
      UPDATE finance_entries
      SET
        contribution = $1,
        updated_at = $2
      WHERE stage_name = $3 AND manifest_name = $4
      RETURNING *;
    `;
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

  upsertBudgetEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO budget_entries (
        code,
        division,
        manifest,
        stage_name,
        planned_people,
        planned_coasters,
        planned_buses,
        planned_taxis,
        cost_per_head,
        contribution,
        total_cost,
        coaster_campaign,
        manifest_pledge,
        updated_at
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15
      )
      ON CONFLICT (stage_name, manifest)
      DO UPDATE SET
        code = COALESCE(EXCLUDED.code, budget_entries.code),
        division = COALESCE(EXCLUDED.division, budget_entries.division),
        manifest = COALESCE(EXCLUDED.manifest, budget_entries.manifest),
        stage_name = COALESCE(EXCLUDED.stage_name, budget_entries.stage_name),
        planned_people = COALESCE(EXCLUDED.planned_people, budget_entries.planned_people),
        planned_coasters = COALESCE(EXCLUDED.planned_coasters, budget_entries.planned_coasters),
        planned_buses = COALESCE(EXCLUDED.planned_buses, budget_entries.planned_buses),
        planned_taxis = COALESCE(EXCLUDED.planned_taxis, budget_entries.planned_taxis),
        cost_per_head = COALESCE(EXCLUDED.cost_per_head, budget_entries.cost_per_head),
        total_cost = COALESCE(EXCLUDED.total_cost, budget_entries.total_cost),
        contribution = COALESCE(EXCLUDED.contribution, budget_entries.contribution),
        coaster_campaign = COALESCE(EXCLUDED.coaster_campaign, budget_entries.coaster_campaign),
        manifest_pledge = COALESCE(EXCLUDED.manifest_pledge, budget_entries.manifest_pledge),
        updated_at = EXCLUDED.updated_at
      RETURNING *;
    `;

    const values = [
      flat.code,
      flat.division,
      flat.manifest,
      flat.stage_name,
      parseInt(flat.planned_people),
      parseInt(flat.planned_coasters),
      parseInt(flat.planned_buses),
      parseInt(flat.planned_taxis),
      parseInt(flat.cost_per_head),
      parseInt(flat.total_cost),
      parseInt(flat.contribution),
      parseInt(flat.coaster_campaign),
      parseInt(flat.manifest_pledge),
      updatedAt
    ];

    return db.query(query, values);
  },

updateActualBudgetData: async (budget, updatedAt) => {
  const query = `
    UPDATE budget_entries
    SET
      actual_people = COALESCE($1, actual_people),
      actual_coasters = COALESCE($2, actual_coasters),
      actual_buses = COALESCE($3, actual_buses),
      actual_taxis = COALESCE($4, actual_taxis),
      actual_cost = COALESCE($5, actual_cost),
      actual_expenditure = COALESCE($6, actual_expenditure),
      updated_at = $7
    WHERE stage_name = $8;
  `;

  const values = [
    budget.actual_people,
    budget.actual_coasters,
    budget.actual_buses,
    budget.actual_taxis,
    budget.actual_cost,
    budget.actual_expenditure,
    updatedAt,
    budget.stage_name
  ];

  return db.query(query, values);
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
    // console.log(result);

    return result.rows[0] || null;
  },
  findBudgetByFormID: async (formId) => {
    const query = `SELECT * FROM budget_entries WHERE form_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);
    // console.log(result);

    return result.rows[0] || null;
  },
  findManifestByFormID: async (formId) => {
    const query = `SELECT * FROM manifest_entries WHERE entry_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);  //  ensure it's a string
    // console.log(result);

    return result.rows[0] || null;
  },

};

