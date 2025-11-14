-- Database Schema for PMI Transport Department Cognito Google Sheets Integration
-- PostgreSQL Database Schema

-- ============================================
-- Table: gic_cognito_entries
-- Stores raw Cognito Forms entry data
-- ============================================
CREATE TABLE IF NOT EXISTS gic_cognito_entries (
    id SERIAL PRIMARY KEY,
    cognito_form_id VARCHAR(255) NOT NULL,
    cognito_entry_id VARCHAR(255) NOT NULL UNIQUE,
    entry_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cognito_entries_form_id ON gic_cognito_entries(cognito_form_id);
CREATE INDEX IF NOT EXISTS idx_cognito_entries_entry_id ON gic_cognito_entries(cognito_entry_id);

-- ============================================
-- Table: gic_budget_entries
-- Stores budget planning and actual data
-- ============================================
CREATE TABLE IF NOT EXISTS gic_budget_entries (
    id SERIAL PRIMARY KEY,
    region VARCHAR(255),
    department VARCHAR(255),
    code VARCHAR(255) NOT NULL UNIQUE,
    division VARCHAR(255),
    manifest VARCHAR(255),
    stage_name VARCHAR(255) NOT NULL,
    planned_people INTEGER,
    planned_coasters INTEGER,
    planned_buses INTEGER,
    planned_taxis INTEGER,
    cost_per_head INTEGER,
    contribution INTEGER,
    total_cost INTEGER,
    coaster_campaign INTEGER,
    manifest_pledge INTEGER,
    actual_people INTEGER,
    actual_coasters INTEGER,
    actual_buses INTEGER,
    actual_taxis INTEGER,
    actual_cost INTEGER,
    actual_expenditure INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_stage_manifest UNIQUE (stage_name, manifest)
);

CREATE INDEX IF NOT EXISTS idx_gic_budget_entries_code ON gic_budget_entries(code);
CREATE INDEX IF NOT EXISTS idx_gic_budget_entries_stage_name ON gic_budget_entries(stage_name);
CREATE INDEX IF NOT EXISTS idx_gic_budget_entries_manifest ON gic_budget_entries(manifest);

-- ============================================
-- Table: gic_manifest_entries
-- Stores manifest/transport coordination data
-- ============================================
CREATE TABLE IF NOT EXISTS gic_manifest_entries (
    id SERIAL PRIMARY KEY,
    gic_budget_entry_id INTEGER REFERENCES gic_budget_entries(id) ON DELETE SET NULL,
    form_id VARCHAR(255) NOT NULL UNIQUE,
    event VARCHAR(255),
    department VARCHAR(255),
    manifests VARCHAR(255),
    institutions VARCHAR(255),
    hospitals VARCHAR(255),
    masterclass VARCHAR(255),
    schools VARCHAR(255),
    up_country VARCHAR(255),
    stage_name VARCHAR(255),
    coordinator_name VARCHAR(255),
    coordinator_contact VARCHAR(255),
    driver_name VARCHAR(255),
    driver_contact VARCHAR(255),
    driver_nin_permit VARCHAR(255),
    driver_vehicle_type VARCHAR(255),
    driver_number_plate VARCHAR(255),
    vehicle_cost INTEGER,
    vehicle_contribution INTEGER,
    vehicle_booking_fee INTEGER,
    vehicle_balance INTEGER,
    cost_per_head INTEGER,
    souls_total INTEGER,
    souls_residents INTEGER,
    souls_residents_firsttimers INTEGER,
    souls_institutions INTEGER,
    souls_institutions_firsttimers INTEGER,
    souls_schools INTEGER,
    souls_schools_firsttimers INTEGER,
    verifier_name VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gic_manifest_entries_form_id ON gic_manifest_entries(form_id);
CREATE INDEX IF NOT EXISTS idx_gic_manifest_entries_stage_name ON gic_manifest_entries(stage_name);
CREATE INDEX IF NOT EXISTS idx_gic_manifest_entries_number_plate ON gic_manifest_entries(driver_number_plate);
CREATE INDEX IF NOT EXISTS idx_gic_manifest_entries_budget_entry_id ON gic_manifest_entries(gic_budget_entry_id);

-- ============================================
-- Table: gic_finance_entries
-- Stores financial accountability entries
-- ============================================
CREATE TABLE IF NOT EXISTS gic_finance_entries (
    id SERIAL PRIMARY KEY,
    gic_manifest_entry_id INTEGER REFERENCES gic_manifest_entries(id) ON DELETE SET NULL,
    gic_budget_entry_id INTEGER REFERENCES gic_budget_entries(id) ON DELETE SET NULL,
    label VARCHAR(255),
    funding_party VARCHAR(255),
    amount DECIMAL(15, 2),
    issued_by VARCHAR(255),
    received_by VARCHAR(255),
    form_id VARCHAR(255),
    final_balance DECIMAL(15, 2),
    manifest_name VARCHAR(255),
    institution_name VARCHAR(255),
    school_name VARCHAR(255),
    department VARCHAR(255),
    cost_of_vehicle DECIMAL(15, 2),
    balance DECIMAL(15, 2),
    stage_name VARCHAR(255),
    contribution DECIMAL(15, 2),
    booking_fee DECIMAL(15, 2),
    event VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_stage_manifest_name UNIQUE (stage_name, manifest_name)
);

CREATE INDEX IF NOT EXISTS idx_gic_finance_entries_form_id ON gic_finance_entries(form_id);
CREATE INDEX IF NOT EXISTS idx_gic_finance_entries_stage_name ON gic_finance_entries(stage_name);
CREATE INDEX IF NOT EXISTS idx_gic_finance_entries_manifest_name ON gic_finance_entries(manifest_name);
CREATE INDEX IF NOT EXISTS idx_gic_finance_entries_manifest_entry_id ON gic_finance_entries(gic_manifest_entry_id);
CREATE INDEX IF NOT EXISTS idx_gic_finance_entries_budget_entry_id ON gic_finance_entries(gic_budget_entry_id);

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE gic_cognito_entries IS 'Stores raw JSON data from Cognito Forms webhooks';
COMMENT ON TABLE gic_budget_entries IS 'Stores budget planning and actual expenditure data';
COMMENT ON TABLE gic_manifest_entries IS 'Stores transport manifest and coordinator information';
COMMENT ON TABLE gic_finance_entries IS 'Stores financial accountability and transaction records';

COMMENT ON COLUMN gic_budget_entries.code IS 'Unique budget code identifier';
COMMENT ON COLUMN gic_manifest_entries.form_id IS 'Unique form ID from Cognito Forms (primary key for duplicates)';
COMMENT ON COLUMN gic_finance_entries.amount IS 'Financial transaction amount';


