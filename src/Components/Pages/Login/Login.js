import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InputField from "../TableLayout/InputField";
import logo from "../../Pages/images/JIYAA JEWELS logo_page-0001.jpg";
import "./Login.css";
import { FaEye, FaEyeSlash, FaCamera } from "react-icons/fa";
import FaceCapture from "../../Modules/Admin/FaceCapture/FaceCapture";

const Login = () => {
  const navigate = useNavigate();
  const [email_id, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email_id || !password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please enter both email/phone and password."
      });
      return;
    }

    const isEmail = email_id.includes('@');
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_id)) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Email",
          text: "Please enter a valid email address."
        });
        return;
      }
    } else {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(email_id.replace(/\D/g, ''))) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Phone Number",
          text: "Please enter a valid 10-digit phone number."
        });
        return;
      }
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
        localStorage.setItem("user", JSON.stringify(data.user));

        Swal.fire({
          icon: "success",
          title: "Login Successful!",
          timer: 1500,
          showConfirmButton: false
        });

        const userRole = data.user?.role?.toLowerCase();

        if (userRole === "admin") {
          navigate("/dashboard");
        } else if (userRole === "customer") {
          if (data.user.status === "approved") {
            navigate("/customer-dashboard");
          } else {
            Swal.fire({
              icon: "info",
              title: "Account Pending Approval",
              text: "Your account is awaiting approval from the administrator.",
              confirmButtonText: "OK"
            }).then(() => {
              navigate("/customer-dashboard");
            });
          }
        } else if (userRole === "salesman") {
          const today = new Date().toDateString();
          const lastCheckInDate = sessionStorage.getItem('lastCheckInDate');

          if (lastCheckInDate !== today) {
            sessionStorage.removeItem('attendanceChecked');
            sessionStorage.removeItem('visitLogCompleted');
            sessionStorage.removeItem('visitLogSkipped');
            sessionStorage.removeItem('lastCheckInDate');
          }

          Swal.fire({
            icon: 'success',
            title: 'Welcome!',
            text: 'Login successful',
            timer: 1500,
            showConfirmButton: false
          }).then(() => {
            navigate("/salesperson-dashboard");
          });
        } else {
          navigate("/dashboard");
        }

      } else {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: data.message || data.error || "Invalid email/phone or password!"
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

  const handleFaceLogin = async (faceData) => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/users/face-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          face_descriptor: JSON.stringify(faceData.descriptor)
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));

        Swal.fire({
          icon: "success",
          title: "Face Login Successful!",
          text: `Welcome back, ${data.user.full_name}!`,
          timer: 1500,
          showConfirmButton: false
        });

        const userRole = data.user?.role?.toLowerCase();

        if (userRole === "admin") {
          navigate("/dashboard");
        } else if (userRole === "customer") {
          if (data.user.status === "approved") {
            navigate("/customer-dashboard");
          } else {
            navigate("/customer-dashboard");
          }
        } else if (userRole === "salesman") {
          const today = new Date().toDateString();
          const lastCheckInDate = sessionStorage.getItem('lastCheckInDate');

          if (lastCheckInDate !== today) {
            sessionStorage.removeItem('attendanceChecked');
            sessionStorage.removeItem('visitLogCompleted');
            sessionStorage.removeItem('visitLogSkipped');
            sessionStorage.removeItem('lastCheckInDate');
          }

          navigate("/salesperson-dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Face Login Failed",
          text: data.message || "Face not recognized. Please try again or use password login.",
        });
      }
    } catch (error) {
      console.error("Face login error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to process face login. Please try again."
      });
    } finally {
      setIsLoading(false);
      setShowFaceLogin(false);
    }
  };

  return (
    <div className="saleslogin-container container-fluid">
      <div className="row vh-100 d-flex align-items-center justify-content-center">
        <div className="col-12 col-md-6 d-flex justify-content-center align-items-center saleslogin-left">
          <img src={logo} alt="Logo" className="saleslogin-logo" />
        </div>

        <div className="col-12 col-md-6 d-flex flex-column justify-content-center align-items-center saleslogin-right">
          <div className="card saleslogin-card shadow-lg border-0 rounded-4">
            <div className="card-body saleslogin-card-body">
              <h2 className="mb-4">Welcome Back</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <InputField
                    label="Email or Phone Number"
                    type="text"
                    value={email_id}
                    onChange={(e) => setEmailId(e.target.value)}
                    placeholder="Enter your email or phone number"
                    className="saleslogin-input"
                    required
                  />
                </div>

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

                <div className="saleslogin-btn-wrapper">
                  <button
                    type="submit"
                    className="saleslogin-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </button>
                </div>

                <div className="saleslogin-face-btn-wrapper mt-3">
                  <button
                    type="button"
                    className="saleslogin-face-btn"
                    onClick={() => setShowFaceLogin(true)}
                    disabled={isLoading}
                  >
                    <FaCamera /> Login with Face
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
                <div className="mt-3">
                  <p className="saleslogin-register-text">
                    Don't have an account?{" "}
                    <span
                      className="saleslogin-register-link"
                      onClick={() => navigate("/customerregistration")}
                      style={{
                        color: 'blue',
                        cursor: 'pointer'
                      }}
                    >
                      Please Click here
                    </span>
                  </p>
                </div>

                <div className="mt-3">
                  <a href="/forgot-password" className="saleslogin-forgot">
                    Forgot Password?
                  </a>
                </div>

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

      {showFaceLogin && (
        <FaceCapture
          onFaceCaptured={handleFaceLogin}
          onClose={() => setShowFaceLogin(false)}
          mode="login"
        />
      )}
    </div>
  );
};

export default Login;