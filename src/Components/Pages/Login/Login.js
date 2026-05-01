import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import InputField from "../TableLayout/InputField";
import logo from "../../Pages/images/JIYAA JEWELS logo_page-0001.jpg";
import "./Login.css";
import { FaEye, FaEyeSlash, FaCamera } from "react-icons/fa";
import FaceCapture from "../../Modules/Admin/FaceCapture/FaceCapture";
import baseURL from "../../Modules/ApiUrl/NodeBaseURL";

const Login = () => {
  const navigate = useNavigate();
  const [email_id, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFaceLogin, setShowFaceLogin] = useState(false);
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Advanced Anti-Screenshot Protection
  useEffect(() => {
    // 1. Block all keyboard shortcuts that could lead to screenshots
    const blockShortcuts = (e) => {
      // Print Screen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }

      // F12 - DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }

      // Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }

      // Command+Shift+3/4 (Mac Screenshot)
      if ((e.metaKey) && e.shiftKey && (e.key === '3' || e.key === '4')) {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }

      // Ctrl+Shift+S (Firefox Screenshot)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }

      // Alt+PrintScreen (Active window screenshot)
      if (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }
    };

    // 2. Block right-click context menu
    const blockContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 3. Block copy, cut, paste
    const blockCopyCutPaste = (e) => {
      if (e.type === 'copy' || e.type === 'cut') {
        e.preventDefault();
        e.stopPropagation();
        showScreenshotWarning();
        return false;
      }
      // Allow paste for password fields only
      if (e.type === 'paste') {
        const target = e.target;
        if (target.tagName === 'INPUT' && target.type === 'password') {
          return true;
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 4. Block drag and drop
    const blockDragDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 5. Detect when page becomes invisible (screenshot tools)
    let blurTimeout;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - possible screenshot being taken
        if (containerRef.current) {
          containerRef.current.style.opacity = '0';
          containerRef.current.style.transition = 'opacity 0.01s';
        }
        if (blurTimeout) clearTimeout(blurTimeout);
        blurTimeout = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.opacity = '1';
          }
        }, 200);
      }
    };

    // 6. Detect window blur (screenshot tools often trigger this)
    const handleWindowBlur = () => {
      if (containerRef.current) {
        containerRef.current.style.opacity = '0';
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.opacity = '1';
          }
        }, 200);
      }
    };

    // 7. Detect window resize (some screenshot tools trigger this)
    let resizeTimeout;
    const handleWindowResize = () => {
      if (containerRef.current) {
        containerRef.current.style.filter = 'blur(5px)';
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.filter = 'blur(0px)';
          }
        }, 300);
      }
    };

    // 8. Add invisible overlay that disrupts screenshots
    const addScreenshotOverlay = () => {
      if (!document.getElementById('screenshot-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'screenshot-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 99999;
          pointer-events: none;
          display: none;
        `;
        document.body.appendChild(overlay);
      }
    };

    // 9. Show warning message
    const showScreenshotWarning = () => {
      Swal.fire({
        icon: "error",
        title: "⛔ Screenshot Blocked!",
        text: "Screenshots are disabled on this page for security reasons.",
        timer: 2000,
        showConfirmButton: false,
        background: '#000',
        color: '#fff'
      });
    };

    // 10. Try to clear clipboard periodically (removes screenshot data)
    const clearClipboard = () => {
      try {
        navigator.clipboard.readText().then(() => {
          navigator.clipboard.writeText('');
        }).catch(() => {});
      } catch (e) {}
    };

    // 11. Detect if DevTools is open (common for screenshot tools)
    let devtoolsOpen = false;
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          document.body.style.filter = 'blur(10px)';
          setTimeout(() => {
            document.body.style.filter = 'blur(0px)';
            devtoolsOpen = false;
          }, 500);
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // 12. Monitor for screenshot software (like Lightshot, Greenshot)
    const checkForScreenshotSoftware = () => {
      // Detect common screenshot software hotkeys
      const checkHotkey = (e) => {
        // Lightshot: PrtSc, Ctrl+PrtSc
        // Greenshot: Ctrl+PrtSc, Alt+PrtSc
        // ShareX: Ctrl+PrtSc, Ctrl+Shift+PrtSc
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          showScreenshotWarning();
          return false;
        }
      };
      window.addEventListener('keyup', checkHotkey);
      return () => window.removeEventListener('keyup', checkHotkey);
    };

    // Add all event listeners
    window.addEventListener('keydown', blockShortcuts);
    window.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('copy', blockCopyCutPaste);
    document.addEventListener('cut', blockCopyCutPaste);
    document.addEventListener('paste', blockCopyCutPaste);
    document.addEventListener('dragstart', blockDragDrop);
    document.addEventListener('drop', blockDragDrop);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('resize', handleWindowResize);
    
    addScreenshotOverlay();
    
    const interval = setInterval(() => {
      clearClipboard();
      checkDevTools();
    }, 1000);

    const cleanupHotkey = checkForScreenshotSoftware();

    // Cleanup
    return () => {
      window.removeEventListener('keydown', blockShortcuts);
      window.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('copy', blockCopyCutPaste);
      document.removeEventListener('cut', blockCopyCutPaste);
      document.removeEventListener('paste', blockCopyCutPaste);
      document.removeEventListener('dragstart', blockDragDrop);
      document.removeEventListener('drop', blockDragDrop);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleWindowResize);
      clearInterval(interval);
      cleanupHotkey();
      
      const overlay = document.getElementById('screenshot-overlay');
      if (overlay) overlay.remove();
    };
  }, []);

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
      const response = await fetch(`${baseURL}/api/users/login`, {
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
      const response = await fetch(`${baseURL}/api/users/face-login`, {
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
    <div >
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
    </div>
  );
};

export default Login;