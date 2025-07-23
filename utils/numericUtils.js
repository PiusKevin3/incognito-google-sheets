// utils/numericUtils.js
function parseNumeric(value) {
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, ''));
  }
  return Number(value);
}

module.exports = {
  parseNumeric
};