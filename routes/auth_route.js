const express = require("express");
const router = express.Router();
const { register, authUser, verify } = require("../controllers/auth_controller");
// const { Auth } = require("../middlewares/jwt");

router.post("/register", register);

router.post("/login", authUser);

router.get("/verify", verify);

module.exports = router;
