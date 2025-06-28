/**
 * Restituisce { page, limit, skip } estratti da req.query
 */
function buildPagination(req) {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Crea un filtro regex su più campi:
 *  { $or: [ { campo1: /q/i }, { campo2: /q/i }, … ] }
 */
function buildRegexFilter(q, fields) {
  const regex = new RegExp(q, "i");
  return { $or: fields.map((f) => ({ [f]: regex })) };
}

module.exports = { buildPagination, buildRegexFilter };
