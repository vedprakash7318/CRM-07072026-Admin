import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'; 
import "./CSS/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate();
  const APi_Url = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("All fields are required.");
      toast.error("All fields are required."); 
    } else {
      try {
        setLoading(true);
        
        const response = await axios.post(`${APi_Url}/digicoder/crm/api/v1/admin/login`, {
          email: email,
          password: password
        });

        if (response.status === 200) {
          setError("");
          toast.success("Logged in successfully!");
          const token = response.data.token;
          const adminId = response.data.existUser._id;
          const name=response.data.existUser
          sessionStorage.setItem("Name",JSON.stringify(name))
          sessionStorage.setItem("Token", token);
          sessionStorage.setItem("AdminId", adminId);
            setEmail("");
            setPassword("");
            setLoading(false); 
            navigate('/dashboard');  
          
        }
      } catch (error) {
        setLoading(false); // Stop loading state if there's an error
        if (error.response) {
          // If the error response is from the server
          setError(error.response.data.message || "Invalid email or password.");
          toast.error(error.response.data.message || "Invalid email or password.");
        } else {
          // If it's a network or unknown error
          setError("An error occurred while processing your request.");
          toast.error("An error occurred while processing your request.");
        }
      }
    }
  };

  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleFocus = (field) => {
    setFocusedField(field);
  };

  const handleBlur = () => {
    setFocusedField("");
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>!!Welcome Back!!</h1>
        <p>Access Your Account</p>

        <form onSubmit={handleSubmit}>
            <legend>Email</legend>
          <fieldset className={focusedField === "email" ? "focused" : ""}>
            <div className="input-group">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => handleFocus("email")}
                onBlur={handleBlur}
                required
              />
            </div>
          </fieldset>
            <legend>Password</legend>
          <fieldset className={focusedField === "password" ? "focused" : ""}>
            <div className="input-group">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => handleFocus("password")}
                onBlur={handleBlur}
                required
              />
            </div>
          </fieldset>
          <div className="remember-forgot">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMe}
              />
              Remember Me
            </label>
            <a href="/forget-password" className="forgot-password-link">
              Forgot Password?
            </a>
          </div>
          <br />
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading} // Disable button during loading
          >
            {loading ? (
              <div className="spinner"></div> // Loader Spinner
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>

      <ToastContainer /> {/* Toast container for displaying toasts */}
    </div>
  );
};

export default Login;
