const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION. => DONE JR

/*  This is a helper function to create the SQL components required for updating table rows.
 ********
 *  Example:
 *  input => sqlForPartialUpdate({firstName: "newUser"}, {firstName: "first_name",lastName: "last_name",isAdmin: "is_admin"})
 *  output => { setCols: '"first_name"=$1', values: [ 'newUser' ] }
 ********
 *  The first argument is an object containing column name as 'key' and new value as 'value'.
 *  The second argument is a lookup to assist with translating JS naming to SQL naming.
 ********
 *  To use for the User model:
 *  dataToUpdate can include:
 *   { firstName, lastName, password, email, isAdmin }
 *  and jsToSql should be:
 *   { firstName: "first_name", lastName: "last_name", isAdmin: "is_admin" }
 ********
 *  To user for the Company model:
 *  dataToUpdate can include:
 *   { name, description, numEmployees, logoUrl }
 *  and jsToSql should be:
 *   { numEmployees: "num_employees", logoUrl: "logo_url" }
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/*  This is a helper function create the SQL string for filtering company results.
 *  Expects 'filters' argument to be an object containing 'nameLike', 'minEmployees', and/or 'maxEmployees'
 ********
 *  Example:
 *  input => createSqlFilterStr({nameLike: "ne", minEmployees: "10", maxEmployees:"200"})
 *  output => "name ILIKE '%ne%' AND num_employees >= 10 AND num_employees <= 200"
 ********
 *  Checks input filters for bad input (min/maxEmployees must be passed a number, min cannot be larger than max)
 */
function createSqlFilterStr(filters) {
  const name = filters.nameLike;
  const minEmployees = parseInt(filters.minEmployees);
  const maxEmployees = parseInt(filters.maxEmployees);
  if (filters.minEmployees && !minEmployees) {
    throw new BadRequestError("minEmployees must be an integer", 400);
  }
  if (filters.maxEmployees && !maxEmployees) {
    throw new BadRequestError("maxEmployees must be an integer", 400);
  }
  if (minEmployees && maxEmployees) {
    if (minEmployees > maxEmployees) {
      throw new BadRequestError(
        "minEmployees cannot be larger than maxEmployees",
        400
      );
    }
  }
  const filterList = [];
  if (name) {
    filterList.push(`name ILIKE '%${name}%'`);
  }
  if (minEmployees) {
    filterList.push(`num_employees >= ${minEmployees}`);
  }
  if (maxEmployees) {
    filterList.push(`num_employees <= ${maxEmployees}`);
  }
  const filterStr = filterList.join(" AND ");
  return filterStr;
}

module.exports = { sqlForPartialUpdate, createSqlFilterStr };
