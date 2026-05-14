// EmailVerification.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import baseURL from "../../Modules/ApiUrl/NodeBaseURL";
import "./EmailVerification.css";

const EmailVerification = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const user = JSON.parse(userData);
    const needsVerification = localStorage.getItem("needsEmailVerification");

    if (!needsVerification || user.email_verified === "Verified") {
      navigate("/customer-dashboard");
      return;
    }

    setEmail(user.email_id);

    // Send initial OTP
    sendOTP();

    // Timer for OTP expiry
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    let cooldownTimer;
    if (resendCooldown > 0) {
      cooldownTimer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  const sendOTP = async () => {
    const userData = localStorage.getItem("user");
    if (!userData) return;

    const user = JSON.parse(userData);
    
    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/users/send-otp/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: `Verification code sent to ${data.email}`,
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeLeft(600);
        setCanResend(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Send OTP",
          text: data.message || "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Unable to send OTP. Please check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      Swal.fire({
        icon: "warning",
        title: "Please Wait",
        text: `Please wait ${resendCooldown} seconds before requesting another OTP.`,
      });
      return;
    }

    setResendCooldown(60); // 60 seconds cooldown
    await sendOTP();
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    
    if (otpCode.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "Invalid OTP",
        text: "Please enter the complete 6-digit verification code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${baseURL}/api/users/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otpCode,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update user data in localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          user.email_verified = "Verified";
          localStorage.setItem("user", JSON.stringify(user));
        }
        
        localStorage.removeItem("needsEmailVerification");

        Swal.fire({
          icon: "success",
          title: "Email Verified!",
          text: "Your email has been successfully verified.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          navigate("/customer-dashboard");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: data.message || "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Swal.fire({
        icon: "error",
        title: "Network Error",
        text: "Unable to verify OTP. Please check your connection.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="email-verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <h2>Email Verification</h2>
          <p>Please verify your email address to continue</p>
        </div>

        <div className="verification-content">
          <div className="email-info">
            <span className="email-icon">📧</span>
            <p>We've sent a verification code to</p>
            <strong>{email}</strong>
          </div>

          <div className="otp-input-container">
            <label>Enter Verification Code</label>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-input-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <div className="timer-section">
            {timeLeft > 0 ? (
              <>
                <span className="timer-icon">⏱️</span>
                <span>OTP expires in: </span>
                <span className="timer">{formatTime(timeLeft)}</span>
              </>
            ) : (
              <span className="expired-text">OTP has expired</span>
            )}
          </div>

          <button
            onClick={handleVerify}
            disabled={isLoading || timeLeft === 0}
            className="verify-btn"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>

          <div className="resend-section">
            <p>
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || timeLeft > 0}
                className="resend-btn"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : timeLeft === 0
                  ? "Resend OTP"
                  : "Request New Code"}
              </button>
            </p>
          </div>

          <div className="verification-footer">
            <button onClick={() => navigate("/login")} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;