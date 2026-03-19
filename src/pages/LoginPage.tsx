import { useState } from "react";

const LoginPage = () => {

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");

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

      // ❗ Check if login failed
      if(!res.ok){
        setError(data.message || "Login failed");
        return;
      }

      // ✅ Store full user object
      localStorage.setItem("user", JSON.stringify({
        id: data.user_id,
        role: data.role,
        username: data.username,
        reference_id: data.reference_id
      }));

      // ✅ Role-based redirect (ONLY ONE)
      if(data.role === "admin"){
        window.location.href = "/";
      } 
      else if(data.role === "faculty"){
        window.location.href = "/dashboard";
      } 
      else if(data.role === "student"){
        window.location.href = "/dashboard";
      }

    } catch (err) {
      setError("Server error. Try again.");
    }
  };

  return (
    <div style={{padding:"40px"}}>

      <h2>Academic Sphere Login</h2>

      {error && <p style={{color:"red"}}>{error}</p>}

      <input
        placeholder="Username"
        onChange={(e)=>setUsername(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="Password"
        onChange={(e)=>setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleLogin}>Login</button>

    </div>
  );
};

export default LoginPage;