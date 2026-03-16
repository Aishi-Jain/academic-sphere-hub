import { useState } from "react";

const LoginPage = () => {

  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");

  const handleLogin = async () => {

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

    localStorage.setItem("role", data.role);
    localStorage.setItem("user_id", data.user_id);

    window.location.href = "/";

    if(data.role === "faculty"){
      window.location.href="/faculty";
    }

    if(data.role === "student"){
      window.location.href="/student";
    }

  };

  return (
    <div style={{padding:"40px"}}>

      <h2>Academic Sphere Login</h2>

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