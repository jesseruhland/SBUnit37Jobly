"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "NewJob",
    salary: 40000,
    equity: 0.01,
    companyHandle: "c2",
  };

  test("ok for admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: newJob.title,
        salary: newJob.salary,
        equity: "0.01",
        companyHandle: newJob.companyHandle,
      },
    });
  });

  test("does not work for non-admin users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        salary: "40000",
        equity: 0.01,
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        title: 90,
        salary: "40000",
        equity: 0.01,
        companyHandle: "c2",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
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
          equity: "0.1",
          companyHandle: "c2",
        },
        {
          id: expect.any(Number),
          title: "Receptionist",
          salary: 50000,
          equity: "0",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs with filters */

describe("GET /jobs with filters", function () {
  test("works with valid filter", async function () {
    const resp = await request(app).get("/jobs?title=ce");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "CEO",
          salary: 500000,
          equity: "0.27",
          companyHandle: "c1",
        },
        {
          id: expect.any(Number),
          title: "Receptionist",
          salary: 50000,
          equity: "0",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("works with multiple valid filters", async function () {
    const resp = await request(app).get("/jobs?title=ce&minSalary=100000");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "CEO",
          salary: 500000,
          equity: "0.27",
          companyHandle: "c1",
        },
      ],
    });
  });

  test("ignores invalid filters", async function () {
    const resp = await request(app).get(
      "/jobs?title=ce&minSalary=100000&otherFilter=7"
    );
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "CEO",
          salary: 500000,
          equity: "0.27",
          companyHandle: "c1",
        },
      ],
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];

    const resp = await request(app).get(`/jobs/${sampleJob.id}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "CEO",
        salary: 500000,
        equity: "0.27",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin users", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app)
      .patch(`/jobs/${sampleJob.id}`)
      .send({
        title: "NEWceo",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "NEWceo",
        salary: 500000,
        equity: "0.27",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app).patch(`/jobs/${sampleJob.id}`).send({
      title: "NEWceo",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin users", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app)
      .patch(`/jobs/${sampleJob.id}`)
      .send({
        title: "NEWceo",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "NEWceo",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on company change attempt", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app)
      .patch(`/jobs/${sampleJob.id}`)
      .send({
        companyHandle: "c1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app)
      .patch(`/jobs/${sampleJob.id}`)
      .send({
        title: 90,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin users", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app)
      .delete(`/jobs/${sampleJob.id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${sampleJob.id}` });
  });

  test("unauth for anon", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app).delete(`/jobs/${sampleJob.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin users", async function () {
    let result =
      await db.query(`SELECT id, title, salary, equity, company_handle AS "companyHandle"
                                     FROM jobs WHERE title='CEO'`);

    let sampleJob = result.rows[0];
    const resp = await request(app)
      .delete(`/jobs/${sampleJob.id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.status).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
