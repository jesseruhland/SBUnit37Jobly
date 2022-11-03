const { sqlForPartialUpdate } = require("./sql");

describe("create object with SQL components to make updates to the database", function () {
  test("works when provided the correct arguments", function () {
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

  test("throws error when not provided object with keys as first argument", function () {
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
