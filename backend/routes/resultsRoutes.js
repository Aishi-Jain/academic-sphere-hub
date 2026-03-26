const express = require("express");
const router = express.Router();
const { syncResultsForRoll } = require("../services/results/resultsSyncService");

router.get("/:roll", async (req, res) => {
  const roll = String(req.params.roll || "").trim().toUpperCase();

  if (!roll) {
    return res.status(400).json({ error: "Roll number is required" });
  }

  try {
    const response = await syncResultsForRoll(roll);
    return res.json(response);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
