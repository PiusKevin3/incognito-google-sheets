// dbService.js
const db = require('../config/db');
const { parseNumeric } = require('../utils/numericUtils');

// Track if database has been initialized
let dbInitialized = false;

// Initialize database when needed
async function initializeDatabase() {
  if (!dbInitialized) {
    console.log('Initializing database connection...');
    db.createPool();
    dbInitialized = true;
  }
}

module.exports = {
  initializeDatabase,
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
    console.log("insert manifest : " + entry);
    console.log(entry);

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
  manifest_entries.* IS DISTINCT FROM EXCLUDED.*
RETURNING *;  -- ✅ Add this line
`;


    const mapped = {
      form_id: formId,
      event: entry.event,
      department: entry.department,
      manifests: entry.manifest, // renamed
      institutions: entry.institutions,
      hospitals: entry.hospitals || null,
      masterclass: entry.masterclass || null,
      schools: entry.schools,
      up_country: entry.up_country,
      stage_name: entry.stage_name,
      coordinator_name: entry.coordinator_name,
      coordinator_contact: entry.coordinator_contact,
      driver_name: entry.driver_name || null,
      driver_contact: entry.driver_contact || null,
      driver_nin_permit: entry.driver_nin_permit_no, // renamed
      driver_vehicle_type: entry.driver_vehicle_type,
      driver_number_plate: entry.driver_number_plate,
      vehicle_cost: entry.cost_of_vehicle, // renamed
      vehicle_contribution: entry.cash_contribution, // renamed
      vehicle_booking_fee: entry.driver_booking_fee, // renamed
      vehicle_balance: entry.balance, // renamed
      cost_per_head: entry.cost_per_head,
      souls_total: entry.total, // renamed
      souls_residents: entry.people, // renamed
      souls_residents_firsttimers: entry.first_timers, // renamed
      souls_institutions: entry.souls_institutions || null,
      souls_institutions_firsttimers: entry.souls_institutions_firsttimers || null,
      souls_schools: entry.souls_schools || null,
      souls_schools_firsttimers: entry.souls_schools_firsttimers || null,
      verifier_name: entry.verifier_name,
      updated_at: updatedAt,
    };

    const values = Object.values(mapped);

    const result = await db.query(query, values);
    console.log(`✅ Inserted new manifest entry: ${formId}`);
    return result;
  },


  upsertFinanceEntry: async (flat, updatedAt) => {
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

  insertFinanceEntry: async (flat, updatedAt) => {
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
    RETURNING *;
  `;

    console.log(flat);


    const values = [
      flat["manifest_entry_id"] || null,
      flat["budget_entry_id"] || null,
      flat["label"] || null,
      flat["funding_party"] || null,
      parseFloat(flat["amount"]) || 0,
      flat["issued_by"] || null,
      flat["received_by"] || null,
      flat["form_id"] || null,
      parseFloat(flat["final_balance"]) || 0,
      flat["manifest_name"] || null,
      flat["institution_name"] || null,
      flat["school_name"] || null,
      flat["department"] || null,
      parseFloat(flat["cost_of_vehicle"]) || 0,
      parseFloat(flat["balance"]) || 0,
      flat["stage_name"] || null,
      parseFloat(flat["contribution"]) || 0,
      parseFloat(flat["booking_fee"]) || 0,
      flat["event"] || null,
      updatedAt
    ];

    console.log(values);
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

  upsertBudgetEntry: async (flat, updatedAt) => {
    const query = `
      INSERT INTO budget_entries (
        region,
        department,
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
        $15,
        $16
      )
      ON CONFLICT (stage_name, manifest)
      DO UPDATE SET
        region = COALESCE(EXCLUDED.region, budget_entries.region),
        department = COALESCE(EXCLUDED.department, budget_entries.department),
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
      flat.region,
      flat.department,
      flat.code,
      flat.division,
      flat.manifest,
      flat.stage_name,
      flat.planned_people ? parseInt(flat.planned_people) : null,
      flat.planned_coasters ? parseInt(flat.planned_coasters) : null,
      flat.planned_buses ? parseInt(flat.planned_buses) : null,
      flat.planned_taxis ? parseInt(flat.planned_taxis) : null,
      flat.cost_per_head ? parseInt(flat.cost_per_head) : null,
      flat.total_cost ? parseInt(flat.total_cost) : null,
      flat.contribution ? parseInt(flat.contribution) : null,
      flat.coaster_campaign ? parseInt(flat.coaster_campaign) : null,
      flat.manifest_pledge ? parseInt(flat.manifest_pledge) : null,
      updatedAt
    ];

    return db.query(query, values);
  },

  updateManifestEntry: async (flat, updatedAt) => {
    const query = `
      UPDATE manifest_entries SET
        budget_entry_id = $2,
        event = $3,
        department = $4,
        manifests = $5,
        institutions = $6,
        hospitals = $7,
        masterclass = $8,
        schools = $9,
        up_country = $10,
        stage_name = $11,
        coordinator_name = $12,
        coordinator_contact = $13,
        driver_name = $14,
        driver_contact = $15,
        driver_nin_permit = $16,
        driver_vehicle_type = $17,
        driver_number_plate = $18,
        vehicle_cost = $19,
        vehicle_contribution = $20,
        vehicle_booking_fee = $21,
        vehicle_balance = $22,
        cost_per_head = $23,
        souls_total = $24,
        souls_residents = $25,
        souls_residents_firsttimers = $26,
        souls_institutions = $27,
        souls_institutions_firsttimers = $28,
        souls_schools = $29,
        souls_schools_firsttimers = $30,
        verifier_name = $31,
        updated_at = $32
      WHERE form_id = $1
      RETURNING *;
    `;

    const values = [
      flat["ID1"], // $1 — used in WHERE
      flat["BudgetID"],
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
  findBudgetByFormID: async (stageName, manifest) => {
    const query = `SELECT * FROM budget_entries WHERE stage_name = $1 AND manifest = $2 LIMIT 1`;
    const result = await db.query(query, [stageName, manifest]);
    // console.log(result);

    return result.rows[0] || null;
  },
  checkBudgetByCode: async (code) => {
    const query = `SELECT * FROM budget_entries WHERE code = $1`;
    const result = await db.query(query, [code]);
    // console.log(result);

    return result.rows[0] || null;
  },
  findManifestByFormID: async (formId) => {
    const query = `SELECT * FROM manifest_entries WHERE form_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);  //  ensure it's a string
    // console.log(result);

    return result.rows[0] || null;
  },
  findManifestByNumberPlate: async (numberPlate) => {
    console.log("🔍 Checking number plate:", numberPlate);

    if (!numberPlate) {
      console.warn("⚠️ Skipped: Missing number plate for query");
      return null;
    }

    const normalizedPlate = numberPlate.trim().toUpperCase();
    const query = `
    SELECT * FROM manifest_entries 
    WHERE TRIM(UPPER(driver_number_plate)) = $1 
    LIMIT 1;
  `;

    console.log("🧩 Executing query:", query, "with:", normalizedPlate);

    try {
      const result = await db.query(query, [normalizedPlate]);
      console.log("🪶 Query result rows:", result.rows);

      return result.rows[0] || null;
    } catch (err) {
      console.error("❌ Error fetching manifest by number plate:", err);
      throw err;
    }
  },



  findBudgetByFormID: async (budgetId) => {
    const query = `SELECT * FROM budget_entries WHERE code = $1 LIMIT 1`;
    const result = await db.query(query, [budgetId]);
    // console.log(result);

    return result.rows[0] || null;
  },

  updateManifestEntry: async (flat, updatedAt) => {
    const query = `
      UPDATE manifest_entries
      SET
        event = COALESCE($1, event),
        department = COALESCE($2, department),
        updated_at = $3
      WHERE form_id = $4;
    `;

    const values = [
      flat["Event"],
      flat["Department"],
      updatedAt,
      flat["FormID"]
    ];

    return db.query(query, values);
  },

};

