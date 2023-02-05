const express = require("express");
const { getUser } = require("../Controllers/user.controller");

const router = express.Router();

router.get("/user", getUser);

module.exports = router;
