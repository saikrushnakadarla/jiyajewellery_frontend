// hooks/useScreenshotPrevention.js

import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

const useScreenshotPrevention = (enabled = true) => {
  const overlayRef = useRef(null);
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const triggerProtection = (source = "Screenshot") => {
      const now = Date.now();

      // Reduce delay (500ms instead of 2000ms)
      if (now - lastAttemptRef.current < 500) return;
      lastAttemptRef.current = now;

      console.log("Screenshot detected:", source);

      blurScreen();
      showOverlay();
      showAlert();
    };

    // Blur screen instantly
    const blurScreen = () => {
      const el = document.querySelector(".customer-dashboard-container");

      if (el) {
        el.style.filter = "blur(20px)";
        el.style.pointerEvents = "none";

        setTimeout(() => {
          el.style.filter = "";
          el.style.pointerEvents = "";
        }, 1500);
      }
    };

    // Overlay
    const showOverlay = () => {
      removeOverlay();

      const overlay = document.createElement("div");
      overlay.className = "screenshot-overlay";

      overlay.innerHTML = `
        <div class="screenshot-box">
          <h2>⚠ Screenshot Detected</h2>
          <p>Screenshots are restricted</p>
        </div>
      `;

      document.body.appendChild(overlay);
      overlayRef.current = overlay;

      setTimeout(removeOverlay, 1500);
    };

    const removeOverlay = () => {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };

    // SweetAlert
    const showAlert = () => {
      Swal.fire({
        icon: "warning",
        title: "Screenshot Detected",
        text: "Screenshots are restricted",
        timer: 1500,
        showConfirmButton: false,
      });
    };

    // Key Detection
    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen") {
        triggerProtection("PrintScreen");
      }

      if (e.ctrlKey && e.shiftKey && e.key === "S") {
        triggerProtection("Snipping Tool");
      }

      if (e.key === "F12") e.preventDefault();

      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
      }

      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
      }
    };

    // FAST Visibility detection
    const handleVisibility = () => {
      triggerProtection("Visibility Change");
    };

    // FAST Window blur
    const handleWindowBlur = () => {
      triggerProtection("Window Blur");
    };

    // Clipboard detection (PrintScreen copies to clipboard)
    const handleClipboard = () => {
      triggerProtection("Clipboard Screenshot");
    };

    // Disable right click
    const disableRightClick = (e) => e.preventDefault();

    // Add CSS
    const style = document.createElement("style");

    style.innerHTML = `
    
    .screenshot-overlay{
      position:fixed;
      top:0;
      left:0;
      width:100%;
      height:100%;
      background:rgba(0,0,0,0.9);
      z-index:999999;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    .screenshot-box{
      background:white;
      padding:30px;
      border-radius:8px;
      text-align:center;
    }

    .dashboard-watermark{
      position:fixed;
      top:50%;
      left:50%;
      transform:translate(-50%,-50%) rotate(-30deg);
      font-size:40px;
      opacity:0.1;
      pointer-events:none;
      z-index:9999;
    }

    `;

    document.head.appendChild(style);

    // Watermark
    const watermark = document.createElement("div");
    watermark.className = "dashboard-watermark";
    watermark.innerText = "CONFIDENTIAL";
    document.body.appendChild(watermark);

    // Event listeners (FAST detection)
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("paste", handleClipboard);
    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("paste", handleClipboard);
      document.removeEventListener("contextmenu", disableRightClick);

      watermark.remove();
      removeOverlay();
    };
  }, [enabled]);
};

export default useScreenshotPrevention;