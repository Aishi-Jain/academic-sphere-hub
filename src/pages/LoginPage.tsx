import { useState } from "react";
import { motion } from "framer-motion";

const LoginPage = () => {

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [showPassword,setShowPassword] = useState(false);

  const handleLogin = async () => {

    try {
      const res = await fetch("http://localhost:5000/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await res.json();

      if(!res.ok){
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("user", JSON.stringify({
        id: data.user_id,
        role: data.role,
        username: data.username,
        reference_id: data.reference_id
      }));

      if(data.role === "admin"){
        window.location.href = "/";
      } 
      else if(data.role === "faculty"){
        window.location.href = "/";
      } 
      else if(data.role === "student"){
        window.location.href = "/";
      }

    } catch (err) {
      setError("Server error. Try again.");
    }
  };

  return (
    <div style={styles.container}>

      {/* LEFT SIDE */}
      <motion.div 
        style={styles.left}
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 style={styles.title}>Academic Sphere</h1>
        <p style={styles.subtitle}>
          Smart Academic Management System designed to streamline exams, 
          seating allocation, results, and institutional workflows.
        </p>

        <div style={styles.hintBox}>
          <p style={styles.hintTitle}>Login Roles</p>
          <ul style={styles.hintList}>
            <li><b>Admin</b> → Full system control</li>
            <li><b>Faculty</b> → Manage students & exams</li>
            <li><b>Student</b> → View results & details</li>
          </ul>
        </div>
      </motion.div>

      {/* RIGHT SIDE */}
      <motion.div 
        style={styles.card}
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >

        <h2 style={styles.heading}>Welcome Back 👋</h2>
        <p style={styles.description}>
          Login to access your dashboard and manage your academic operations seamlessly.
        </p>

        {error && <p style={styles.error}>{error}</p>}

        <input
          style={styles.input}
          placeholder="Enter Username"
          onChange={(e)=>setUsername(e.target.value)}
        />

        {/* PASSWORD FIELD WITH TOGGLE */}
        <div style={styles.passwordWrapper}>
          <input
            style={{...styles.input, marginBottom: 0, width: "100%"}}
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            onChange={(e)=>setPassword(e.target.value)}
          />

          <span 
            style={styles.toggle}
            onClick={()=>setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁"}
          </span>
        </div>

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>

      </motion.div>

    </div>
  );
};

export default LoginPage;


/* 🔥 STYLES */
const styles: any = {

  container: {
    display: "flex",
    height: "100vh",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
    fontFamily: "sans-serif"
  },

  left: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px"
  },

  title: {
    fontSize: "42px",
    fontWeight: "bold",
    marginBottom: "20px"
  },

  subtitle: {
    fontSize: "16px",
    color: "#cbd5f5",
    maxWidth: "400px",
    lineHeight: "1.6",
    marginBottom: "30px"
  },

  hintBox: {
    background: "rgba(255,255,255,0.05)",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "320px"
  },

  hintTitle: {
    fontWeight: "600",
    marginBottom: "10px"
  },

  hintList: {
    fontSize: "14px",
    lineHeight: "1.8",
    color: "#cbd5f5"
  },

  card: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "white",
    color: "#111",
    padding: "40px",
    borderTopLeftRadius: "40px",
    borderBottomLeftRadius: "40px"
  },

  heading: {
    fontSize: "26px",
    fontWeight: "600",
    marginBottom: "10px"
  },

  description: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "20px",
    textAlign: "center",
    maxWidth: "280px"
  },

  input: {
    width: "260px",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    outline: "none",
    fontSize: "14px"
  },

  passwordWrapper: {
    position: "relative",
    width: "260px",
    marginBottom: "15px"
  },

  toggle: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "16px"
  },

  button: {
    width: "260px",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s"
  },

  error: {
    color: "red",
    marginBottom: "10px",
    fontSize: "13px"
  }

};