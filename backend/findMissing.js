const fs = require("fs");
const csv = require("csv-parser");
const db = require("./config/db");

const csvRolls = [];
const dbRolls = new Set();

// 🔥 STEP 1 — READ CSV
fs.createReadStream("4th year students users.csv")
  .pipe(csv())
  .on("data", (data) => {
    const cleanedData = {};

    for (const key in data) {
      cleanedData[key.trim()] = data[key];
    }

    const roll = cleanedData["roll_number"];

    if (roll && roll.trim() !== "") {
      csvRolls.push(roll.trim());
    }
  })
  .on("end", async () => {
    console.log(`📄 CSV students: ${csvRolls.length}`);

    try {
      // 🔥 STEP 2 — GET DB ROLLS
      const [rows] = await db.promise().query(
        "SELECT DISTINCT roll_number FROM results"
      );

      rows.forEach((r) => dbRolls.add(r.roll_number));

      console.log(`🗄️ DB students: ${dbRolls.size}`);

      // 🔥 STEP 3 — FIND MISSING
      const missing = csvRolls.filter((roll) => !dbRolls.has(roll));

      console.log(`❌ Missing students: ${missing.length}`);

      // 🔥 STEP 4 — SAVE FILE
      fs.writeFileSync(
        "missing_rolls.json",
        JSON.stringify(missing, null, 2)
      );

      console.log("📁 Saved to missing_rolls.json");

    } catch (err) {
      console.error("Error:", err);
    }
  });