const express = require("express");
const router = express.Router();
const {
  register,
  authUser,
  verify,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth_controller");

router.post("/register", register);

router.post("/login", authUser);

router.get("/verify", verify);

router.post("/forgotPassword", forgotPassword);

router.put("/resetPassword", resetPassword);

module.exports = router;
