"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const { RowDescriptionMessage } = require("pg-protocol/dist/messages");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: login
 * THIS ROUTE IS ONLY AVAILABLE TO ADMIN USERS -JR
 **/

router.post("/", ensureIsAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: login
 * THIS ROUTE IS ONLY AVAILABLE TO ADMIN USERS -JR
 **/

router.get("/", ensureIsAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: login by this user or Admin -JR
 **/

router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // check if this user is the logged-in user.  If not, ensure logged-in user is an admin.
    if (
      res.locals.user.username != req.params.username &&
      !res.locals.user.isAdmin
    ) {
      throw new UnauthorizedError();
    }
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: login by this user or Admin -JR
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // check if this user is the logged-in user.  If not, ensure logged-in user is an admin.
    if (
      res.locals.user.username != req.params.username &&
      !res.locals.user.isAdmin
    ) {
      throw new UnauthorizedError();
    }
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: login by this user or Admin -JR
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // check if this user is the logged-in user.  If not, ensure logged-in user is an admin.
    if (
      res.locals.user.username != req.params.username &&
      !res.locals.user.isAdmin
    ) {
      throw new UnauthorizedError();
    }
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

/** POST /[username]/jobs/[id] => { user }
 *
 * Returns { applied: jobId }
 *
 * Authorization required: login by this user or Admin
 **/
router.post(
  "/:username/jobs/:id",
  ensureLoggedIn,
  async function (req, res, next) {
    try {
      // check if this user is the logged-in user.  If not, ensure logged-in user is an admin.
      if (
        res.locals.user.username != req.params.username &&
        !res.locals.user.isAdmin
      ) {
        throw new UnauthorizedError();
      }
      const result = await User.apply(req.params.username, req.params.id);
      return res.status(201).json({ applied: result });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
