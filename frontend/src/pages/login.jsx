
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    if (email.trim() && password.trim()) {
      navigate("/message", { state: { email } }); // pass email to chat
    } else {
      alert("Please enter both email and password.");
    }
  };

  const handleGoogleLogin = () => {
    alert("Google login feature coming soon! 🌿");
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Wildlife Sighting Login</h1>
        <input
          type="email"
          placeholder="Enter your Gmail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>

        <div className="divider">or</div>

        <button className="google-btn" onClick={handleGoogleLogin}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google Logo"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Home;



