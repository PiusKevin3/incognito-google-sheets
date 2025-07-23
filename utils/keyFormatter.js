function toCamelCaseKey(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const newKey = toCamelCaseKey(key);
      acc[newKey] = convertKeysToCamelCase(value);
      return acc;
    }, {});
  }

  return obj;
}

module.exports = { convertKeysToCamelCase };
