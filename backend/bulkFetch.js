const axios = require("axios");
const fs = require("fs");
const csv = require("csv-parser");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const results = [];

// 🔥 RANDOM DELAY (ANTI-BLOCK)
const randomDelay = () => Math.floor(Math.random() * 4000) + 6000;

// 🔥 RETRY FUNCTION
const fetchWithRetry = async (roll, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/results/${roll}`, {
        timeout: 60000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Accept": "application/json",
          "Connection": "keep-alive"
        }
      });

      // handle empty results safely
      if (!res.data.semesters || res.data.semesters.length === 0) {
        console.log(`⚠️ No results: ${roll}`);
      }

      return true;

    } catch (err) {
      console.log(`⚠️ Retry ${i + 1} for ${roll} → ${err.message}`);

      if (i === retries - 1) {
        throw err;
      }

      await delay(4000);
    }
  }
};

// 🔥 MAIN RUN FUNCTION
const run = async () => {
  for (let i = 0; i < results.length; i++) {
    const roll = results[i];

    try {
      console.log(`🚀 [${i + 1}/${results.length}] Fetching ${roll}`);

      const startTime = Date.now();

      await fetchWithRetry(roll);

      console.log(
        `✅ Done: ${roll} (${((Date.now() - startTime) / 1000).toFixed(2)}s)`
      );

    } catch (err) {
      console.log(`❌ Failed: ${roll}`);
    }

    // 🔥 RANDOM HUMAN-LIKE DELAY
    await delay(randomDelay());
  }

  console.log("🔥 ALL DONE");
};

// 🔥 READ CSV
fs.createReadStream("4th year students users.csv")
  .pipe(csv())
  .on("data", (data) => {
    const cleanedData = {};

    for (const key in data) {
      cleanedData[key.trim()] = data[key];
    }

    const roll = cleanedData["roll_number"];

    if (roll && roll.trim() !== "") {
      results.push(roll.trim());
    }
  })
  .on("end", () => {
    console.log(`🔥 Total students: ${results.length}`);
    run();
  });