// dbService.js
const db = require('../config/db');
const { parseNumeric, parseIntId, parseInteger } = require('../utils/numericUtils');

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
      INSERT INTO gic_manifest_entries (
        gic_budget_entry_id,
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
      parseIntId(flat["BudgetID"]),
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
INSERT INTO gic_manifest_entries (
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
  event = COALESCE(EXCLUDED.event, gic_manifest_entries.event),
  department = COALESCE(EXCLUDED.department, gic_manifest_entries.department),
  manifests = COALESCE(EXCLUDED.manifests, gic_manifest_entries.manifests),
  institutions = COALESCE(EXCLUDED.institutions, gic_manifest_entries.institutions),
  hospitals = COALESCE(EXCLUDED.hospitals, gic_manifest_entries.hospitals),
  masterclass = COALESCE(EXCLUDED.masterclass, gic_manifest_entries.masterclass),
  schools = COALESCE(EXCLUDED.schools, gic_manifest_entries.schools),
  up_country = COALESCE(EXCLUDED.up_country, gic_manifest_entries.up_country),
  stage_name = COALESCE(EXCLUDED.stage_name, gic_manifest_entries.stage_name),
  coordinator_name = COALESCE(EXCLUDED.coordinator_name, gic_manifest_entries.coordinator_name),
  coordinator_contact = COALESCE(EXCLUDED.coordinator_contact, gic_manifest_entries.coordinator_contact),
  driver_name = COALESCE(EXCLUDED.driver_name, gic_manifest_entries.driver_name),
  driver_contact = COALESCE(EXCLUDED.driver_contact, gic_manifest_entries.driver_contact),
  driver_nin_permit = COALESCE(EXCLUDED.driver_nin_permit, gic_manifest_entries.driver_nin_permit),
  driver_vehicle_type = COALESCE(EXCLUDED.driver_vehicle_type, gic_manifest_entries.driver_vehicle_type),
  driver_number_plate = COALESCE(EXCLUDED.driver_number_plate, gic_manifest_entries.driver_number_plate),
  vehicle_cost = COALESCE(EXCLUDED.vehicle_cost, gic_manifest_entries.vehicle_cost),
  vehicle_contribution = COALESCE(EXCLUDED.vehicle_contribution, gic_manifest_entries.vehicle_contribution),
  vehicle_booking_fee = COALESCE(EXCLUDED.vehicle_booking_fee, gic_manifest_entries.vehicle_booking_fee),
  vehicle_balance = COALESCE(EXCLUDED.vehicle_balance, gic_manifest_entries.vehicle_balance),
  cost_per_head = COALESCE(EXCLUDED.cost_per_head, gic_manifest_entries.cost_per_head),
  souls_total = COALESCE(EXCLUDED.souls_total, gic_manifest_entries.souls_total),
  souls_residents = COALESCE(EXCLUDED.souls_residents, gic_manifest_entries.souls_residents),
  souls_residents_firsttimers = COALESCE(EXCLUDED.souls_residents_firsttimers, gic_manifest_entries.souls_residents_firsttimers),
  souls_institutions = COALESCE(EXCLUDED.souls_institutions, gic_manifest_entries.souls_institutions),
  souls_institutions_firsttimers = COALESCE(EXCLUDED.souls_institutions_firsttimers, gic_manifest_entries.souls_institutions_firsttimers),
  souls_schools = COALESCE(EXCLUDED.souls_schools, gic_manifest_entries.souls_schools),
  souls_schools_firsttimers = COALESCE(EXCLUDED.souls_schools_firsttimers, gic_manifest_entries.souls_schools_firsttimers),
  verifier_name = COALESCE(EXCLUDED.verifier_name, gic_manifest_entries.verifier_name),
  updated_at = NOW()
WHERE
  gic_manifest_entries.* IS DISTINCT FROM EXCLUDED.*
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
    // const query = `
    //   INSERT INTO finance_entries (
    //     manifest_entry_id, budget_entry_id, label, funding_party, amount, issued_by, received_by,
    //     form_id, final_balance, manifest_name, institution_name,
    //     school_name, department, cost_of_vehicle, balance, stage_name,
    //     contribution, booking_fee, event, updated_at
    //   ) VALUES (
    //     $1, $2, $3, $4, $5,
    //     $6, $7, $8, $9,
    //     $10, $11, $12, $13,
    //     $14, $15, $16, $17, $18, $19, $20
    //   )
    //   ON CONFLICT (stage_name, manifest_name)
    //   DO UPDATE SET
    //     manifest_entry_id = EXCLUDED.manifest_entry_id,
    //     budget_entry_id = EXCLUDED.budget_entry_id,
    //     label = EXCLUDED.label,
    //     funding_party = EXCLUDED.funding_party,
    //     issued_by = EXCLUDED.issued_by,
    //     received_by = EXCLUDED.received_by,
    //     amount = EXCLUDED.amount,
    //     updated_at = EXCLUDED.updated_at
    //   RETURNING *;
    // `;
    const query = `
      INSERT INTO gic_finance_entries (
        gic_manifest_entry_id, gic_budget_entry_id, label, funding_party, amount, issued_by, received_by,
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
        gic_manifest_entry_id = EXCLUDED.gic_manifest_entry_id,
        gic_budget_entry_id = EXCLUDED.gic_budget_entry_id,
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
      parseIntId(flat["BudgetID"]),
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
  // Normalize keys to lowercase to handle both camelCase and PascalCase keys
  const normalized = Object.fromEntries(
    Object.entries(flat).map(([key, value]) => [key.toLowerCase(), value])
  );

   //const query = `
  //   INSERT INTO gic_finance_entries (
  //     gic_manifest_entry_id, gic_budget_entry_id, label, funding_party, amount, issued_by, received_by,
  //     form_id, final_balance, manifest_name, institution_name,
  //     school_name, department, cost_of_vehicle, balance, stage_name,
  //     contribution, booking_fee, event, updated_at
  //   ) VALUES (
  //     $1, $2, $3, $4, $5,
  //     $6, $7, $8, $9,
  //     $10, $11, $12, $13,
  //     $14, $15, $16, $17, $18, $19, $20
  //   )
  //   RETURNING *;
  // `;

  const query = `
    INSERT INTO gic_finance_entries (
      gic_manifest_entry_id, gic_budget_entry_id, label, funding_party, amount, issued_by, received_by,
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

  // Helper to parse numbers safely (handles strings like "15,000")
  const parseNumber = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    const cleaned = String(val).replace(/,/g, '');
    return isNaN(cleaned) ? 0 : parseFloat(cleaned);
  };

  //  const values = [
  //   normalized["manifest_entry_id"] || normalized["accountabilityentry_id"] || null,
  //   parseIntId(normalized["budget_entry_id"] || normalized["budgetid"] || normalized["budget_id"]),
  //   normalized["label"] || normalized["accountabilityentry_label"] || null,
  //   normalized["funding_party"] || normalized["fundingparty"] || null,
  //   parseNumber(normalized["amount"]),
  //   normalized["issued_by"] || normalized["issuedby"] || null,
  //   normalized["received_by"] || normalized["receivedby"] || null,
  //   normalized["form_id"] || normalized["formid"] || null,
  //   parseNumber(normalized["final_balance"]),
  //   normalized["manifest_name"] || normalized["manifestname"] || null,
  //   normalized["institution_name"] || normalized["institutionname"] || null,
  //   normalized["school_name"] || normalized["schoolname"] || null,
  //   normalized["department"] || null,
  //   parseNumber(normalized["cost_of_vehicle"]),
  //   parseNumber(normalized["balance"]),
  //   normalized["stage_name"] || normalized["stagename"] || null,
  //   parseNumber(normalized["contribution"]),
  //   parseNumber(normalized["booking_fee"]),
  //   normalized["event"] || null,
  //   updatedAt
  // ];

  const values = [
    normalized["gic_manifest_entry_id"] || normalized["accountabilityentry_id"] || null,
    parseIntId(normalized["gic_budget_entry_id"] || normalized["budgetid"] || normalized["budget_id"]),
    normalized["label"] || normalized["budgetamount_label"] || null,
    normalized["funding_party"] || normalized["fundingparty"] || null,
    parseNumber(normalized["amount"]),
    normalized["issued_by"] || normalized["issuedby"] || null,
    normalized["received_by"] || normalized["receivedby"] || null,
    normalized["form_id"] || normalized["formid"] || null,
    parseNumber(normalized["final_balance"]),
    normalized["manifest_name"] || normalized["manifestname"] || null,
    normalized["institution_name"] || normalized["institutionname"] || null,
    normalized["school_name"] || normalized["schoolname"] || null,
    normalized["department"] || null,
    parseNumber(normalized["cost_of_vehicle"]),
    parseNumber(normalized["balance"]),
    normalized["stage_name"] || normalized["stagename"] || null,
    parseNumber(normalized["contribution"]),
    parseNumber(normalized["booking_fee"]),
    normalized["event"] || null,
    updatedAt
  ];

  console.log('🧾 Normalized Input:', normalized);
  console.log('📥 Insert Values:', values);

  return db.query(query, values);
},



  upsertCognitoEntry: async (formId, entryId, entryData, updatedAt) => {
    const query = `
      INSERT INTO gic_cognito_entries (
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
      INSERT INTO gic_budget_entries (
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
        region = COALESCE(EXCLUDED.region, gic_budget_entries.region),
        department = COALESCE(EXCLUDED.department, gic_budget_entries.department),
        code = COALESCE(EXCLUDED.code, gic_budget_entries.code),
        division = COALESCE(EXCLUDED.division, gic_budget_entries.division),
        manifest = COALESCE(EXCLUDED.manifest, gic_budget_entries.manifest),
        stage_name = COALESCE(EXCLUDED.stage_name, gic_budget_entries.stage_name),
        planned_people = COALESCE(EXCLUDED.planned_people, gic_budget_entries.planned_people),
        planned_coasters = COALESCE(EXCLUDED.planned_coasters, gic_budget_entries.planned_coasters),
        planned_buses = COALESCE(EXCLUDED.planned_buses, gic_budget_entries.planned_buses),
        planned_taxis = COALESCE(EXCLUDED.planned_taxis, gic_budget_entries.planned_taxis),
        cost_per_head = COALESCE(EXCLUDED.cost_per_head, gic_budget_entries.cost_per_head),
        total_cost = COALESCE(EXCLUDED.total_cost, gic_budget_entries.total_cost),
        contribution = COALESCE(EXCLUDED.contribution, gic_budget_entries.contribution),
        coaster_campaign = COALESCE(EXCLUDED.coaster_campaign, gic_budget_entries.coaster_campaign),
        manifest_pledge = COALESCE(EXCLUDED.manifest_pledge, gic_budget_entries.manifest_pledge),
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
      parseInteger(flat.planned_people),
      parseInteger(flat.planned_coasters),
      parseInteger(flat.planned_buses),
      parseInteger(flat.planned_taxis),
      parseInteger(flat.cost_per_head),
      parseInteger(flat.total_cost),
      parseInteger(flat.contribution),
      parseInteger(flat.coaster_campaign),
      parseInteger(flat.manifest_pledge),
      updatedAt
    ];

    return db.query(query, values);
  },

  createBudgetEntry: async (budgetData) => {
    const query = `
      INSERT INTO gic_budget_entries (
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
        actual_people,
        actual_coasters,
        actual_buses,
        actual_taxis,
        actual_cost,
        actual_expenditure,
        updated_at,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      )
      RETURNING *;
    `;

    const now = new Date().toISOString();
    const values = [
      budgetData.region || null,
      budgetData.department || null,
      budgetData.code,
      budgetData.division || null,
      budgetData.manifest || null,
      budgetData.stage_name,
      parseInteger(budgetData.planned_people),
      parseInteger(budgetData.planned_coasters),
      parseInteger(budgetData.planned_buses),
      parseInteger(budgetData.planned_taxis),
      parseInteger(budgetData.cost_per_head),
      parseInteger(budgetData.contribution),
      parseInteger(budgetData.total_cost),
      parseInteger(budgetData.coaster_campaign),
      parseInteger(budgetData.manifest_pledge),
      parseInteger(budgetData.actual_people),
      parseInteger(budgetData.actual_coasters),
      parseInteger(budgetData.actual_buses),
      parseInteger(budgetData.actual_taxis),
      parseInteger(budgetData.actual_cost),
      parseInteger(budgetData.actual_expenditure),
      budgetData.updated_at || now,
      budgetData.created_at || now
    ];

    return db.query(query, values);
  },

  updateBudgetEntry: async (flat, updatedAt) => {
  console.log("updateBudgetEntry", flat);

    const code = flat["code"] || flat["Code"];


  const query = `
    UPDATE gic_budget_entries
    SET
      region = COALESCE($1, region),
      department = COALESCE($2, department),
      division = COALESCE($3, division),
      manifest = COALESCE($4, manifest),
      stage_name = COALESCE($5, stage_name),
      planned_people = COALESCE($6, planned_people),
      planned_coasters = COALESCE($7, planned_coasters),
      planned_buses = COALESCE($8, planned_buses),
      planned_taxis = COALESCE($9, planned_taxis),
      cost_per_head = COALESCE($10, cost_per_head),
      contribution = COALESCE($11, contribution),
      total_cost = COALESCE($12, total_cost),
      coaster_campaign = COALESCE($13, coaster_campaign),
      manifest_pledge = COALESCE($14, manifest_pledge),
      updated_at = $15
    WHERE code = $16
    RETURNING *;
  `;

  const values = [
  flat.region,
  flat.department,
  flat.division,
  flat.manifest,
  flat.stage_name,
  parseInteger(flat.planned_people),
  parseInteger(flat.planned_coasters),
  parseInteger(flat.planned_buses),
  parseInteger(flat.planned_taxis),
  parseInteger(flat.cost_per_head),
  parseInteger(flat.contribution),
  parseInteger(flat.total_cost),
  parseInteger(flat.coaster_campaign),
  parseInteger(flat.manifest_pledge),
  updatedAt,
  code
];



  const result = await db.query(query, values);
  console.log(`✅ Updated budget entry: Code ${code}`);
  return result.rows[0] || null;
},



  updateManifestEntry: async (flat, updatedAt) => {
    const query = `
      UPDATE gic_manifest_entries SET
        gic_budget_entry_id = $2,
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
      parseIntId(flat["BudgetID"]),
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
    UPDATE gic_budget_entries
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
      FROM gic_cognito_entries
      WHERE cognito_form_id = $1
      ORDER BY updated_at DESC
      LIMIT 1`;

    return db.query(query, [formId]);
  },
  // ✅ NEW: Get latest manifest entry
  getLatestManifestEntry: async () => {
    const query = `
      SELECT *
      FROM gic_manifest_entries
      ORDER BY updated_at DESC
      LIMIT 1`;

    return db.query(query);
  },

  // ✅ NEW: Get latest finance entry
  getLatestFinanceEntry: async () => {
    const query = `
      SELECT *
      FROM gic_finance_entries
      ORDER BY updated_at DESC
      LIMIT 1`;

    return db.query(query);
  },

  findFinanceByFormID: async (formId) => {
    const query = `SELECT * FROM gic_finance_entries WHERE form_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);
    // console.log(result);

    return result.rows[0] || null;
  },
  findBudgetByFormID: async (stageName, manifest) => {
    const query = `SELECT * FROM gic_budget_entries WHERE stage_name = $1 AND manifest = $2 LIMIT 1`;
    const result = await db.query(query, [stageName, manifest]);
    // console.log(result);

    return result.rows[0] || null;
  },
  checkBudgetByCode: async (code) => {
    const query = `SELECT * FROM gic_budget_entries WHERE code = $1`;
    const result = await db.query(query, [code]);
    // console.log(result);

    return result.rows[0] || null;
  },

  checkBudgetByCodeAndStage: async (code, stage_name) => {
  const query = `SELECT * FROM gic_budget_entries WHERE code = $1 AND stage_name = $2`;
  const result = await db.query(query, [code, stage_name]);
  return result.rows[0] || null;
},

  findManifestByFormID: async (formId) => {
    const query = `SELECT * FROM gic_manifest_entries WHERE form_id = $1 LIMIT 1`;
    const result = await db.query(query, [formId]);  //  ensure it's a string
    // console.log(result);
        console.log("findManifestByFormID:", result);


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
    SELECT * FROM gic_manifest_entries 
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
    const query = `SELECT * FROM gic_budget_entries WHERE code = $1 LIMIT 1`;
    const result = await db.query(query, [budgetId]);
    // console.log(result);

    return result.rows[0] || null;
  },

  findBudgetByStageName: async (stageName, manifestName) => {
  const query = `
    SELECT *
    FROM gic_budget_entries
    WHERE stage_name = $1 AND manifest = $2
    LIMIT 1
  `;
  
  const result = await db.query(query, [stageName, manifestName]);
  return result.rows[0] || null;
},


  // updateManifestEntry: async (flat, updatedAt) => {
  //   const query = `
  //     UPDATE gic_manifest_entries
  //     SET
  //       event = COALESCE($1, event),
  //       department = COALESCE($2, department),
  //       updated_at = $3
  //     WHERE form_id = $4;
  //   `;

  //   const values = [
  //     flat["Event"],
  //     flat["Department"],
  //     updatedAt,
  //     flat["FormID"]
  //   ];

  //   return db.query(query, values);
  // },

  updateManifestEntry: async (flat, updatedAt) => {
    console.log("updateManifestEntry",flat);

    const formId = flat["FormID"] || flat["ID1"];

    
  const query = `
    UPDATE gic_manifest_entries
    SET
      event = COALESCE($1, event),
      department = COALESCE($2, department),
      manifests = COALESCE($3, manifests),
      institutions = COALESCE($4, institutions),
      hospitals = COALESCE($5, hospitals),
      masterclass = COALESCE($6, masterclass),
      schools = COALESCE($7, schools),
      up_country = COALESCE($8, up_country),
      stage_name = COALESCE($9, stage_name),
      coordinator_name = COALESCE($10, coordinator_name),
      coordinator_contact = COALESCE($11, coordinator_contact),
      driver_name = COALESCE($12, driver_name),
      driver_contact = COALESCE($13, driver_contact),
      driver_nin_permit = COALESCE($14, driver_nin_permit),
      driver_vehicle_type = COALESCE($15, driver_vehicle_type),
      driver_number_plate = COALESCE($16, driver_number_plate),
      vehicle_cost = COALESCE($17, vehicle_cost),
      vehicle_contribution = COALESCE($18, vehicle_contribution),
      vehicle_booking_fee = COALESCE($19, vehicle_booking_fee),
      vehicle_balance = COALESCE($20, vehicle_balance),
      cost_per_head = COALESCE($21, cost_per_head),
      souls_total = COALESCE($22, souls_total),
      souls_residents = COALESCE($23, souls_residents),
      souls_residents_firsttimers = COALESCE($24, souls_residents_firsttimers),
      souls_institutions = COALESCE($25, souls_institutions),
      souls_institutions_firsttimers = COALESCE($26, souls_institutions_firsttimers),
      souls_schools = COALESCE($27, souls_schools),
      souls_schools_firsttimers = COALESCE($28, souls_schools_firsttimers),
      verifier_name = COALESCE($29, verifier_name),
      updated_at = $30
    WHERE form_id = $31
    RETURNING *;
  `;

  const values = [
    flat["Event"],
    flat["Department"],
    flat["Manifests"],
    flat["Institutions"],
    flat["Hospitals"],
    flat["Masterclass"],
    flat["Schools"],
    flat["UpCountry"],
    flat["StageName"],
    flat["Coordinator_Name"],
    flat["Coordinator_Contact"],
    flat["Coordinator_DriversDetails_Name"],
    flat["Coordinator_DriversDetails_Contact"],
    flat["Coordinator_DriversDetails_NINPermit"],
    flat["Coordinator_DriversDetails_VehicleType"],
    flat["Coordinator_DriversDetails_NumberPlate"],
    flat["Coordinator_DriversDetails_CostOfVehicle"],
    flat["Coordinator_DriversDetails_CashContribution"],
    flat["Coordinator_DriversDetails_BookingFee"],
    flat["Coordinator_DriversDetails_Balance"],
    flat["Coordinator_SoulsDetails_CostPerHead"],
    flat["Coordinator_SoulsDetails_TOTAL"],
    flat["Coordinator_SoulsDetails_Residents"],
    flat["Coordinator_SoulsDetails_FirstTimers"],
    flat["Coordinator_SoulsDetails_Institutions"],
    flat["Coordinator_SoulsDetails_InstitutionsFirstTimers"],
    flat["Coordinator_SoulsDetails_Schools"],
    flat["Coordinator_SoulsDetails_SchoolsFirstTimers"],
    flat["VerifierName"],
    updatedAt,
    formId
  ];

  const result = await db.query(query, values);
  console.log(`✅ Updated manifest entry: ${formId}`);
  return result.rows[0] || null;
},

updateFinanceEntry: async (flat, updatedAt) => {
  console.log("updateFinanceEntry", flat);

  // Normalize keys for consistent access
  const normalized = Object.fromEntries(
    Object.entries(flat).map(([k, v]) => [k.toLowerCase(), v])
  );

  // Form ID (primary identifier)
  const formId =
    normalized["form_id"] ||
    normalized["formid"] ||
    normalized["id1"] ||
    normalized["formid"];

  const parseNumber = (val) => {
    if (val === null || val === undefined || val === "") return 0;
    const cleaned = String(val).replace(/,/g, "");
    return isNaN(cleaned) ? 0 : parseFloat(cleaned);
  };

  const parseIntId = (val) => {
    if (!val) return null;
    return parseInt(String(val).replace(/,/g, ""));
  };

  const query = `
    UPDATE finance_entries
    SET
      gic_manifest_entry_id = COALESCE($1, gic_manifest_entry_id),
      gic_budget_entry_id = COALESCE($2, gic_budget_entry_id),
      label = COALESCE($3, label),
      funding_party = COALESCE($4, funding_party),
      amount = COALESCE($5, amount),
      issued_by = COALESCE($6, issued_by),
      received_by = COALESCE($7, received_by),
      form_id = COALESCE($8, form_id),
      final_balance = COALESCE($9, final_balance),
      manifest_name = COALESCE($10, manifest_name),
      institution_name = COALESCE($11, institution_name),
      school_name = COALESCE($12, school_name),
      department = COALESCE($13, department),
      cost_of_vehicle = COALESCE($14, cost_of_vehicle),
      balance = COALESCE($15, balance),
      stage_name = COALESCE($16, stage_name),
      contribution = COALESCE($17, contribution),
      booking_fee = COALESCE($18, booking_fee),
      event = COALESCE($19, event),
      updated_at = $20
    WHERE form_id = $21
    RETURNING *;
  `;

  const values = [
    normalized["gic_manifest_entry_id"] || normalized["accountabilityentry_id"] || null,
    parseIntId(normalized["gic_budget_entry_id"] || normalized["budgetid"] || normalized["budget_id"]),
    normalized["label"] || normalized["accountabilityentry_label"] || null,
    normalized["funding_party"] || normalized["fundingparty"] || null,
    parseNumber(normalized["amount"]),
    normalized["issued_by"] || normalized["issuedby"] || null,
    normalized["received_by"] || normalized["receivedby"] || null,
    normalized["form_id"] || normalized["formid"] || null,
    parseNumber(normalized["final_balance"]),
    normalized["manifest_name"] || normalized["manifestname"] || null,
    normalized["institution_name"] || normalized["institutionname"] || null,
    normalized["school_name"] || normalized["schoolname"] || null,
    normalized["department"] || null,
    parseNumber(normalized["cost_of_vehicle"]),
    parseNumber(normalized["balance"]),
    normalized["stage_name"] || normalized["stagename"] || null,
    parseNumber(normalized["contribution"]),
    parseNumber(normalized["booking_fee"]),
    normalized["event"] || null,
    updatedAt,
    formId
  ];

  console.log("📥 Update Values:", values);
  console.log(`🔑 Updating finance entry with FormID: ${formId}`);

  const result = await db.query(query, values);

  console.log(`✅ Updated finance entry: ${formId}`);
  return result.rows[0] || null;
},



};

