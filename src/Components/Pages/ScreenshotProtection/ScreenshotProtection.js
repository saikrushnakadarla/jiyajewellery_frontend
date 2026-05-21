// src/Components/Pages/ScreenshotProtection/ScreenshotProtection.js
import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import baseURL from '../../Modules/ApiUrl/NodeBaseURL';

const ScreenshotProtection = ({ children }) => {
  const containerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Get logged in user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Check if user is blocked
        if (userData.account_status === 'inactive') {
          setIsBlocked(true);
        } else {
          // Check current screenshot status
          checkScreenshotStatus(userData.id);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const checkScreenshotStatus = async (userId) => {
    try {
      const response = await fetch(`${baseURL}/api/screenshot/status/${userId}`);
      const data = await response.json();
      
      if (data.success && data.is_blocked) {
        setIsBlocked(true);
        // Show warning if account is blocked
        Swal.fire({
          icon: "error",
          title: "Account Blocked!",
          text: "Your account has been blocked due to multiple screenshot attempts. Please contact administrator.",
          confirmButtonText: "OK",
          allowOutsideClick: false
        }).then(() => {
          // Redirect to login or show logout
          localStorage.removeItem('user');
          window.location.href = '/';
        });
      }
    } catch (error) {
      console.error('Error checking screenshot status:', error);
    }
  };

  const recordScreenshotAttempt = async () => {
    if (!user || user.role !== 'salesman') {
      return; // Only track for salesperson accounts
    }
    
    if (isBlocked) {
      return;
    }
    
    try {
      const response = await fetch(`${baseURL}/api/screenshot/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          device_info: navigator.userAgent,
          user_agent: navigator.userAgent,
          ip_address: '' // IP will be captured on server side
        })
      });
      
      const data = await response.json();
      
      if (data.account_blocked) {
        setIsBlocked(true);
        // Update local user data
        const updatedUser = { ...user, account_status: 'inactive' };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        Swal.fire({
          icon: "error",
          title: "Account Blocked!",
          text: data.message,
          confirmButtonText: "OK",
          allowOutsideClick: false
        }).then(() => {
          localStorage.removeItem('user');
          window.location.href = '/';
        });
      } else {
        // Show warning with remaining attempts
        Swal.fire({
          icon: "warning",
          title: "⚠️ Screenshot Detected!",
          html: `Screenshots are prohibited.<br/><br/>
                 <strong>Attempt: ${data.screenshot_count}/3</strong><br/>
                 ${data.remaining_attempts > 0 ? `Your account will be blocked after ${data.remaining_attempts} more attempt(s).` : ''}`,
          timer: 3000,
          showConfirmButton: false,
          background: '#000',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error('Error recording screenshot:', error);
    }
  };

  useEffect(() => {
    // Don't add protection for non-salesman users
    if (!user || user.role !== 'salesman') {
      return;
    }

    if (isBlocked) {
      return;
    }

    let blurTimeout;
    let resizeTimeout;
    let devtoolsOpen = false;

    // 1. Block all keyboard shortcuts that could lead to screenshots
    const blockShortcuts = (e) => {
      // Print Screen key
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
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
        recordScreenshotAttempt();
        return false;
      }

      // Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
        return false;
      }

      // Command+Shift+3/4 (Mac Screenshot)
      if ((e.metaKey) && e.shiftKey && (e.key === '3' || e.key === '4')) {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
        return false;
      }

      // Ctrl+Shift+S (Firefox Screenshot)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
        return false;
      }

      // Alt+PrintScreen (Active window screenshot)
      if (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
        return false;
      }

      // Windows + Shift + S (Snipping Tool)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
        return false;
      }
    };

    // 2. Block right-click context menu
    const blockContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // 3. Block copy, cut, paste for security
    const blockCopyCutPaste = (e) => {
      if (e.type === 'copy' || e.type === 'cut') {
        e.preventDefault();
        e.stopPropagation();
        recordScreenshotAttempt();
        return false;
      }
      // Allow paste for password fields only
      if (e.type === 'paste') {
        const target = e.target;
        if (target.tagName === 'INPUT' && (target.type === 'password' || target.classList.contains('allow-paste'))) {
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
    const handleVisibilityChange = () => {
      if (document.hidden) {
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

    // 9. Try to clear clipboard periodically (removes screenshot data)
    const clearClipboard = () => {
      try {
        navigator.clipboard.readText().then(() => {
          navigator.clipboard.writeText('');
        }).catch(() => {});
      } catch (e) {}
    };

    // 10. Detect if DevTools is open (common for screenshot tools)
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          if (document.body) {
            document.body.style.filter = 'blur(10px)';
            setTimeout(() => {
              if (document.body) {
                document.body.style.filter = 'blur(0px)';
              }
              devtoolsOpen = false;
            }, 500);
          }
        }
      } else {
        devtoolsOpen = false;
      }
    };

    // 11. Monitor for screenshot software (like Lightshot, Greenshot)
    const checkForScreenshotSoftware = () => {
      const checkHotkey = (e) => {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          recordScreenshotAttempt();
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
  }, [user, isBlocked]);

  // Don't render children if blocked (for salesman)
  if (user && user.role === 'salesman' && isBlocked) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ color: 'red' }}>Account Blocked</h1>
        <p>Your account has been blocked due to multiple screenshot attempts.</p>
        <p>Please contact the administrator to reactivate your account.</p>
        <button 
          onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/';
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="screenshot-protection-container" ref={containerRef}>
      {children}
    </div>
  );
};

export default ScreenshotProtection;