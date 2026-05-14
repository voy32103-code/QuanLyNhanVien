const express = require("express");
const { query } = require("../db/pool");
const { asyncHandler } = require("../middleware/async-handler");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  await query("SELECT 1");
  res.json({
    ok: true,
    service: "quan-ly-nhan-vien-api"
  });
}));

module.exports = router;
