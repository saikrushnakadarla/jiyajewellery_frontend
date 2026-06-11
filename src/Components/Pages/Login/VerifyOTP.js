import React, { useState, useEffect,useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InputField from "../TableLayout/InputField";
import "./ForgotPassword.css";
import baseURL from "../../Modules/ApiUrl/NodeBaseURL";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 600 seconds = 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState("");
  const timerInterval = useRef(null);

  useEffect(() => {
    // Get email from localStorage
    const resetEmail = localStorage.getItem("resetEmail");
    if (!resetEmail) {
      Swal.fire({
        icon: "warning",
        title: "No Email Found",
        text: "Please start the password reset process again.",
        background: '#000',
        color: '#fff'
      }).then(() => {
        navigate("/forgot-password");
      });
      return;
    }
    setEmail(resetEmail);

    // Start countdown timer
    timerInterval.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerInterval.current);
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp) {
      Swal.fire({
        icon: "warning",
        title: "Missing Field",
        text: "Please enter the verification code.",
        background: '#000',
        color: '#fff'
      });
      return;
    }

    if (otp.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Code",
        text: "Please enter a valid 6-digit verification code.",
        background: '#000',
        color: '#fff'
      });
      return;
    }

    setIsLoading(true);

      console.log("===== OTP VERIFY REQUEST =====");
  console.log("Email Sent:", email.trim());
  console.log("OTP Sent:", otp.trim());
  console.log("API URL:", `${baseURL}/api/users/verify-otp`);

    try {
      const response = await fetch(`${baseURL}/api/users/verify-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim()
        }),
      });

      const data = await response.json();

      console.log("===== OTP VERIFY RESPONSE =====");
console.log("Status:", response.status);
console.log("Response Data:", data);

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Verified!",
          text: "OTP verified successfully. Please set your new password.",
          timer: 1500,
          showConfirmButton: false,
          background: '#000',
          color: '#fff'
        });

        // Store OTP verification status
        localStorage.setItem("otpVerified", "true");

        // Navigate to reset password page
        setTimeout(() => {
          navigate("/reset-password");
        }, 1500);
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: data.message || "Invalid verification code. Please try again.",
          background: '#000',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
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

  const handleResendCode = async () => {
    if (!canResend) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${baseURL}/api/users/resend-reset-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Code Sent!",
          text: "New verification code has been sent to your email.",
          timer: 2000,
          showConfirmButton: false,
          background: '#000',
          color: '#fff'
        });

        // Reset timer to 10 minutes
        setTimeLeft(600);
        setCanResend(false);
        
        // Clear existing interval
        if (timerInterval.current) clearInterval(timerInterval.current);
        
        // Start new countdown
        timerInterval.current = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(timerInterval.current);
              setCanResend(true);
              return 0;
            }
            return prevTime - 1;
          });
        }, 1000);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to resend code. Please try again.",
          background: '#000',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
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
    <div className="verify-otp-container">
      <div className="verify-wrapper">
        <div className="card verify-card shadow-lg border-0 rounded-4">
          <div className="card-body verify-card-body">
            <h2 className="mb-2">Verify Email Address</h2>
            <p className="text-muted mb-4">
              Verification code sent to: <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyOTP}>
              <div className="mb-4">
                <InputField
                  label="Verification Code"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="verify-input"
                />
              </div>

              <div className="verify-timer-wrapper mb-3">
                {!canResend ? (
                  <p className="verify-timer">
                    <span className="timer-text">Code expires in: </span>
                    <span className="timer-count">{formatTime(timeLeft)}</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    className="verify-resend-btn"
                    onClick={handleResendCode}
                    disabled={isLoading}
                  >
                    Resend Confirmation Code
                  </button>
                )}
              </div>

              <div className="verify-btn-wrapper">
                <button
                  type="submit"
                  className="verify-btn"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Confirm Code"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <a href="/forgot-password" className="verify-back-link">
                  Back to Email
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;