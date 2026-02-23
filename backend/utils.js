// utils.js
function normalizeSecurityForTable(security) {
  return security.replace(/[^A-Z0-9]/gi, '_');
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { normalizeSecurityForTable, asyncHandler };
