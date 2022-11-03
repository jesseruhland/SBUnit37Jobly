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

module.exports = { sqlForPartialUpdate };
