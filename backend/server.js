const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const studentsRoutes = require("./routes/studentsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/students", studentsRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});