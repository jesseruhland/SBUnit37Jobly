const { sqlForPartialUpdate, createSqlFilterStrComp } = require("./sql");

/************************************** sqlForPartialUpdate */
// written by JR
describe("sqlForPartialUpdate", function () {
  test("works: when provided the correct arguments", function () {
    const output = sqlForPartialUpdate(
      { firstName: "newUser" },
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      }
    );
    expect(output).toEqual({
      setCols: '"first_name"=$1',
      values: ["newUser"],
    });
  });

  test("throws: when not provided object with keys as first argument", function () {
    expect(() => {
      sqlForPartialUpdate(
        {},
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        }
      );
    }).toThrow();
  });
});

/************************************** createSqlFilterStrComp */
// written by JR
describe("createSqlFilterStrComp", function () {
  test("works: when provided correct arguments", function () {
    const output = createSqlFilterStrComp({
      nameLike: "c",
      minEmployees: 2,
      maxEmployees: 2,
    });
    expect(output).toEqual(
      "name ILIKE '%c%' AND num_employees >= 2 AND num_employees <= 2"
    );
  });

  test("throws: when provided min larger than max", function () {
    expect(() => {
      createSqlFilterStrComp({
        nameLike: "c",
        minEmployees: 3,
        maxEmployees: 2,
      });
    }).toThrow;
  });

  test("throws: when min is not an integer", function () {
    expect(() => {
      createSqlFilterStrComp({
        nameLike: "c",
        minEmployees: few,
        maxEmployees: 2,
      });
    }).toThrow;
  });

  test("throws: when max is not an integer", function () {
    expect(() => {
      createSqlFilterStrComp({
        nameLike: "c",
        minEmployees: 2,
        maxEmployees: three,
      });
    }).toThrow;
  });
});
