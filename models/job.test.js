"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 90000,
    equity: 0,
    companyHandle: "c3",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job.id).toEqual(expect.any(Number));
    expect(job.title).toEqual(newJob.title);
    expect(job.salary).toEqual(newJob.salary);
    expect(job.equity).toEqual("0");
    expect(job.companyHandle).toEqual(newJob.companyHandle);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [job.id]
    );
    expect(result.rows).toEqual([
      {
        title: "new",
        salary: 90000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "CEO",
        salary: 500000,
        equity: "0.27",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "CFO",
        salary: 400000,
        equity: "0.10",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Receptionist",
        salary: 50000,
        equity: "0",
        companyHandle: "c1",
      },
    ]);
  });
});

/************************************** findFiltered */

describe("findFiltered", function () {
  test("works: with appropriate filters", async function () {
    let jobs = await Job.findFiltered({
      title: "ceo",
      minSalary: 450000,
      hasEquity: true,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "CEO",
        salary: 500000,
        equity: "0.27",
        companyHandle: "c1",
      },
    ]);
  });
  test("works: with appropriate filters (2)", async function () {
    let jobs = await Job.findFiltered({
      title: "c",
      minSalary: 400000,
    });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "CEO",
        salary: 500000,
        equity: "0.27",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "CFO",
        salary: 400000,
        equity: "0.10",
        companyHandle: "c2",
      },
    ]);
  });

  test("throws: when no matches are found", async function () {
    await expect(async () => {
      let jobs = await Job.findFiltered({
        title: "sailor",
      });
    }).rejects.toThrow();
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    let job = await Job.get(sampleJob.id);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "CEO",
      salary: 500000,
      equity: "0.27",
      companyHandle: "c1",
    });
  });

  test("not found if no such job id", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New Title",
    salary: 450000,
    equity: 0.2,
  };

  test("works", async function () {
    let result1 =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result1.rows[0];

    let job = await Job.update(sampleJob.id, updateData);
    expect(job).toEqual({
      id: sampleJob.id,
      title: "New Title",
      salary: 450000,
      equity: "0.2",
      companyHandle: "c1",
    });

    const result2 = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
      [sampleJob.id]
    );
    expect(result2.rows).toEqual([
      {
        id: sampleJob.id,
        title: "New Title",
        salary: 450000,
        equity: "0.2",
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    let result1 =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result1.rows[0];
    try {
      await Job.update(sampleJob.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    let result1 =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result1.rows[0];
    await Job.remove(sampleJob.id);
    const res = await db.query(`SELECT title FROM jobs WHERE id=$1`, [
      sampleJob.id,
    ]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
