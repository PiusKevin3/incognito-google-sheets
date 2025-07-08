module.exports = {
  flattenObject: (obj, prefix = '') => {
    let result = {};
    for (let key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(result, this.flattenObject(obj[key], `${prefix}${key}_`));
      } else {
        result[`${prefix}${key}`] = obj[key];
      }
    }
    return result;
  },
  
  validateApiKey: (req, res, next) => {
    const providedApiKey = req.query.apiKey;
    if (providedApiKey !== process.env.API_KEY) {
      return res.status(401).json({
        success: false,
        message: "Invalid or missing API key"
      });
    }
    next();
  }
};