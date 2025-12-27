import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InputField from "../TableLayout/InputField";
import logo from "../../Pages/images/JIYAA JEWELS logo_page-0001.jpg";
import "./Login.css";
// Import eye icons (you may need to install react-icons or use your own)
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [email_id, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email_id || !password) {
      Swal.fire({ 
        icon: "warning", 
        title: "Missing Fields",
        text: "Please enter both email and password."
      });
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email_id)) {
      Swal.fire({ 
        icon: "warning", 
        title: "Invalid Email",
        text: "Please enter a valid email address."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_id: email_id.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage or context as needed
        localStorage.setItem("user", JSON.stringify(data.user));
        
        Swal.fire({ 
          icon: "success", 
          title: "Login Successful!",
          timer: 1500,
          showConfirmButton: true // Keep the OK button visible
        }).then(() => navigate("/dashboard"));
      } else {
        Swal.fire({ 
          icon: "error", 
          title: "Login Failed",
          text: data.message || data.error || "Invalid email or password!"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({ 
        icon: "error", 
        title: "Network Error",
        text: "Unable to connect to the server. Please try again later."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="saleslogin-container container-fluid">
      <div className="row vh-100 d-flex align-items-center justify-content-center">
        {/* Left Logo */}
        <div className="col-12 col-md-6 d-flex justify-content-center align-items-center saleslogin-left">
          <img src={logo} alt="Logo" className="saleslogin-logo" />
        </div>

        {/* Right Login Form */}
        <div className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center saleslogin-right">
          <div className="card saleslogin-card shadow-lg border-0 rounded-4">
            <div className="card-body saleslogin-card-body">
              <h2 className=" mb-4">Welcome Back</h2>

              <form onSubmit={handleSubmit}>
                {/* Email Field */}
                <div className="mb-3">
                  <InputField
                    label="Email Address"
                    type="email"
                    value={email_id}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="Enter your email"
                    className="saleslogin-input"
                    required
                  />
                </div>

                {/* Password */}
                <div className="saleslogin-password-container position-relative">
                  <InputField
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="saleslogin-input mb-3"
                    required
                  />
                  <span
                    className="saleslogin-eye-toggle position-absolute"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ right: "10px", top: "38px", cursor: "pointer" }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                {/* Buttons */}
                <div className="saleslogin-btn-wrapper">
                  <button 
                    type="submit" 
                    className="saleslogin-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </button>
                </div>
                
                <div className="saleslogin-guest-btn-wrapper mt-3">
                  <button
                    type="button"
                    className="saleslogin-guest-btn"
                    onClick={() => navigate("/")}
                  >
                    Guest
                  </button>
                </div>

                {/* Registration Link */}
                <div className=" mt-3">
                  <p className="saleslogin-register-text">
                    Don't have an account?{" "}
                    <span 
                      className="saleslogin-register-link"
                      onClick={() => navigate("/customerregistration")}
                    >
                      Please register
                    </span>
                  </p>
                </div>

                {/* Forgot Password */}
                <div className=" mt-3">
                  <a href="/forgot-password" className="saleslogin-forgot">
                    Forgot Password?
                  </a>
                </div>

                {/* Footer */}
                <div className="saleslogin-footer mt-4">
                  <a href="/terms" className="saleslogin-footer-link">
                    Terms & Conditions
                  </a>
                  <a href="/privacy" className="saleslogin-footer-link">
                    Privacy Policy
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;