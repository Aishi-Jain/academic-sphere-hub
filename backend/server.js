const uploadStudents = require("./routes/uploadStudents");
const express = require("express");
const cors = require("cors");
const db = require("./config/db");

const studentsRoutes = require("./routes/studentsRoutes");
const facultyRoutes = require("./routes/facultyRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const uploadSubjects = require("./routes/uploadSubjects");
const examRoutes = require("./routes/examRoutes");
const uploadSeating = require("./routes/uploadSeating");
const seatingRoutes = require("./routes/seatingRoutes");
const resultsRoutes = require("./routes/resultsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const circularRoutes = require("./routes/circularRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const profileUpload = require("./routes/profileUpload");
const deptStats = require("./routes/departmentsStats");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/students", studentsRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api", uploadStudents);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/upload-subjects", uploadSubjects);
app.use("/api/exams", examRoutes);
app.use("/api/upload-seating", uploadSeating.router);
app.use("/api/seating", seatingRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/circulars", circularRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", profileUpload);
app.use("/api/departments-stats", deptStats);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

const uploadFaculty=require("./routes/uploadFaculty");
app.use("/api",uploadFaculty);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post("/login", (req, res) => {

  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username=? AND password=?";

  db.query(sql, [username, password], (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result[0];

    res.json({
      role: user.role,
      user_id: user.user_id
    });

  });

});

app.post("/login", (req, res) => {

  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, result) => {

    if (err) {
      return res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const user = result[0];

    res.json({
      role: user.role,
      user_id: user.user_id
    });

  });

});