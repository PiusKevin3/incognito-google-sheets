// utils/numericUtils.js
function parseNumeric(value) {
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}

/**
 * Parse integer IDs by removing commas and non-numeric characters
 * Handles cases like "2,592" -> 2592
 * @param {string|number} value - The ID to parse
 * @returns {number|null} - Parsed integer or null
 */
function parseIntId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  // Remove commas and parse as integer
  const cleaned = String(value).replace(/,/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse integer values, handling decimals by rounding
 * Handles cases like "1,956.52" -> 1957, "1956.52173913043" -> 1957
 * @param {string|number} value - The value to parse
 * @returns {number|null} - Parsed and rounded integer or null
 */
function parseInteger(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  // Remove commas and parse as float first, then round
  const cleaned = String(value).replace(/,/g, '');
  const floatValue = parseFloat(cleaned);
  
  if (isNaN(floatValue)) {
    return null;
  }
  
  // Round to nearest integer
  return Math.round(floatValue);
}

module.exports = {
  parseNumeric,
  parseIntId,
  parseInteger
};