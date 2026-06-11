import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InputField from "../TableLayout/InputField";
import "./ForgotPassword.css";
import baseURL from "../../Modules/ApiUrl/NodeBaseURL";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter your email address.",
        background: '#000',
        color: '#fff'
      });
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        background: '#000',
        color: '#fff'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseURL}/api/users/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store email for later use
        localStorage.setItem("resetEmail", email.trim());
        
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: "Verification code has been sent to your email.",
          timer: 2000,
          showConfirmButton: false,
          background: '#000',
          color: '#fff'
        });

        // Navigate to OTP verification page
        setTimeout(() => {
          navigate("/verify-otp");
        }, 2000);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Email not found. Please try again.",
          background: '#000',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Unable to connect to the server. Please try again later.",
        background: '#000',
        color: '#fff'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-wrapper">
        <div className="card forgot-card shadow-lg border-0 rounded-4">
          <div className="card-body forgot-card-body">
            <h2 className="mb-2">Forgot Password?</h2>
            <p className="text-muted mb-4">
              Please write your email to receive a confirmation code to set a new password.
            </p>

            <form onSubmit={handleSendOTP}>
              <div className="mb-4">
                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="forgot-input"
                />
              </div>

              <div className="forgot-btn-wrapper">
                <button
                  type="submit"
                  className="forgot-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Confirm Mail"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <a href="/login" className="forgot-back-link">
                  Back to Login
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;