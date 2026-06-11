import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InputField from "../TableLayout/InputField";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./ForgotPassword.css";
import baseURL from "../../Modules/ApiUrl/NodeBaseURL";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Check if OTP was verified
    const otpVerified = localStorage.getItem("otpVerified");
    const resetEmail = localStorage.getItem("resetEmail");

    if (!otpVerified || otpVerified !== "true") {
      Swal.fire({
        icon: "warning",
        title: "Access Denied",
        text: "Please verify your OTP first.",
        background: '#000',
        color: '#fff'
      }).then(() => {
        navigate("/forgot-password");
      });
      return;
    }

    if (!resetEmail) {
      navigate("/forgot-password");
      return;
    }

    setEmail(resetEmail);
  }, [navigate]);

  const validatePassword = (password) => {
    // Password must be at least 6 characters
    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    return null;
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter both password and confirm password.",
        background: '#000',
        color: '#fff'
      });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Password",
        text: passwordError,
        background: '#000',
        color: '#fff'
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "Password Mismatch",
        text: "Password and confirm password do not match.",
        background: '#000',
        color: '#fff'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${baseURL}/api/users/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          new_password: password,
          confirm_password: confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear stored data
        localStorage.removeItem("resetEmail");
        localStorage.removeItem("otpVerified");

        Swal.fire({
          icon: "success",
          title: "Password Reset Successful!",
          text: "Your password has been changed. Please login with your new password.",
          confirmButtonText: "Go to Login",
          background: '#000',
          color: '#fff'
        }).then(() => {
          navigate("/login");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: data.message || "Failed to reset password. Please try again.",
          background: '#000',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
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
    <div className="reset-password-container">
      <div className="reset-wrapper">
        <div className="card reset-card shadow-lg border-0 rounded-4">
          <div className="card-body reset-card-body">
            <h2 className="mb-2">New Password</h2>
            <p className="text-muted mb-4">
              Please write your new password.
            </p>

            <form onSubmit={handleResetPassword}>
              <div className="mb-3 reset-password-field-container position-relative">
                <InputField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="reset-input"
                />
                <span
                  className="reset-eye-toggle position-absolute"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ right: "10px", top: "38px", cursor: "pointer" }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="mb-4 reset-confirm-password-field-container position-relative">
                <InputField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="reset-input"
                />
                <span
                  className="reset-eye-toggle position-absolute"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ right: "10px", top: "38px", cursor: "pointer" }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>

              <div className="reset-btn-wrapper">
                <button
                  type="submit"
                  className="reset-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <a href="/login" className="reset-back-link">
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

export default ResetPassword;