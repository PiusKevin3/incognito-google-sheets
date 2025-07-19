const db = require('./dbService'); // Make sure this has a working db.query method

const upsertManifestEntry = async (flat, updatedAt = new Date()) => {
  const formId = flat["General_ID1"];

  if (!formId) {
    console.warn("⚠️ Skipped: Missing ID1 (form_id)");
    return;
  }

  // Step 1: Check if the form_id already exists
  const checkQuery = `SELECT id FROM manifest_entries WHERE form_id = $1`;
  const checkResult = await db.query(checkQuery, [formId]);

  if (checkResult.rows.length > 0) {
    console.log(`⏭️ Entry with form_id ${formId} already exists. Skipping insert.`);
    return; // Skip insertion
  }

  // Step 2: Proceed with insert if not exists
  const insertQuery = `
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
    RETURNING *;
  `;

  const values = [
    formId,
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

  const result = await db.query(insertQuery, values);
  console.log(`✅ Inserted new manifest entry: ${formId}`);
  return result.rows[0];
};

module.exports = {
  upsertManifestEntry,
};
