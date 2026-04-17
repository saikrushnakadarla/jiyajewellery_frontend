// screenshotProtection.js

// Import CSS - make sure the path is correct
import "./ScreenshotProtection.css";

class ScreenshotProtection {
  constructor() {
    this.isProtected = true;
    this.warningShown = false;
    this.overlay = null;
    this.watermark = null;
    this.sensitiveElements = [];
    this.originalStyles = new Map();
    this.protectionActive = false;
    this.blurTimer = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.createOverlay();
        this.createWatermark();
        this.setupListeners();
        this.identifySensitiveElements();
      });
    } else {
      this.createOverlay();
      this.createWatermark();
      this.setupListeners();
      this.identifySensitiveElements();
    }
  }

  createOverlay() {
    // Check if overlay already exists
    if (document.querySelector('.screenshot-protection-overlay')) {
      this.overlay = document.querySelector('.screenshot-protection-overlay');
      return;
    }
    
    this.overlay = document.createElement('div');
    this.overlay.className = 'screenshot-protection-overlay';
    this.overlay.innerHTML = `
      <div class="protection-content">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3>Screenshot Detected</h3>
        <p>Sensitive information has been hidden for security.</p>
        <p style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Screenshots of this page will contain blurred data</p>
      </div>
    `;
    document.body.appendChild(this.overlay);
  }

  createWatermark() {
    // Check if watermark already exists
    if (document.querySelector('.security-watermark')) {
      this.watermark = document.querySelector('.security-watermark');
      return;
    }
    
    const userData = localStorage.getItem("user");
    let watermarkText = "CONFIDENTIAL";
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        watermarkText = `${user.full_name || user.name || 'User'} - ${user.email_id || user.email || ''}`;
      } catch (e) {
        console.error("Error parsing user data for watermark");
      }
    }

    this.watermark = document.createElement('div');
    this.watermark.className = 'security-watermark';
    this.watermark.textContent = watermarkText;
    document.body.appendChild(this.watermark);
  }

  identifySensitiveElements() {
    // Clear existing elements
    this.sensitiveElements = [];
    
    // Identify elements that should be protected
    const selectors = [
      '.stat-value',
      '.breakdown-value',
      '.amount',
      '.customer-name',
      '.recent-table',
      '.chart-wrapper',
      '.custom-chart-wrapper',
      'canvas',
      '.stat-card',
      '.breakdown-card'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!this.sensitiveElements.includes(el)) {
          this.sensitiveElements.push(el);
        }
      });
    });
  }

  setupListeners() {
    // Remove existing listeners if any (to prevent duplicates)
    this.removeListeners();
    
    // Bind methods to this instance
    this.boundKeydownHandler = this.handleKeydown.bind(this);
    this.boundBlurHandler = this.handleBlur.bind(this);
    this.boundVisibilityHandler = this.handleVisibilityChange.bind(this);
    this.boundContextMenuHandler = this.handleContextMenu.bind(this);
    this.boundCopyCutHandler = this.handleCopyCut.bind(this);
    
    // Add listeners
    document.addEventListener('keydown', this.boundKeydownHandler);
    window.addEventListener('blur', this.boundBlurHandler);
    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    document.addEventListener('contextmenu', this.boundContextMenuHandler);
    
    ['copy', 'cut', 'dragstart'].forEach(event => {
      document.addEventListener(event, this.boundCopyCutHandler);
    });

    // Block screen capture API
    this.blockScreenCaptureAPI();

    // Use MutationObserver to protect newly added elements
    this.observeNewElements();

    // Periodic check for screenshot tools
    this.startPeriodicCheck();
  }

  handleKeydown(e) {
    // Print Screen key
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      this.activateProtection();
    }
    
    // Windows + PrintScreen
    if ((e.ctrlKey || e.metaKey) && (e.key === 'PrintScreen' || e.keyCode === 44)) {
      this.activateProtection();
    }
    
    // Alt + PrintScreen
    if (e.altKey && (e.key === 'PrintScreen' || e.keyCode === 44)) {
      this.activateProtection();
    }

    // Windows + Shift + S (Snipping Tool)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
      this.activateProtection();
    }

    // Command + Shift + 3/4 (Mac)
    if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4')) {
      this.activateProtection();
    }
  }

  handleBlur() {
    this.activateProtection();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.activateProtection();
    }
  }

  handleContextMenu(e) {
    e.preventDefault();
    this.showToast('Right-click disabled for security', 'warning');
    return false;
  }

  handleCopyCut(e) {
    e.preventDefault();
    return false;
  }

  removeListeners() {
    if (this.boundKeydownHandler) {
      document.removeEventListener('keydown', this.boundKeydownHandler);
    }
    if (this.boundBlurHandler) {
      window.removeEventListener('blur', this.boundBlurHandler);
    }
    if (this.boundVisibilityHandler) {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    if (this.boundContextMenuHandler) {
      document.removeEventListener('contextmenu', this.boundContextMenuHandler);
    }
    if (this.boundCopyCutHandler) {
      ['copy', 'cut', 'dragstart'].forEach(event => {
        document.removeEventListener(event, this.boundCopyCutHandler);
      });
    }
  }

  blockScreenCaptureAPI() {
    // Override getDisplayMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = () => {
        this.activateProtection();
        this.showToast('Screen capture is not allowed', 'error');
        return Promise.reject(new Error('Screen capture is not allowed on this page'));
      };
    }

    // Override getUserMedia for screen capture
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = (constraints) => {
        if (constraints.video && constraints.video.mediaSource === 'screen') {
          this.activateProtection();
          this.showToast('Screen capture is not allowed', 'error');
          return Promise.reject(new Error('Screen capture is not allowed'));
        }
        return originalGetUserMedia.call(navigator.mediaDevices, constraints);
      };
    }
  }

  observeNewElements() {
    if (this.observer) {
      this.observer.disconnect();
    }
    
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && this.isSensitiveElement(node)) {
            if (this.protectionActive) {
              this.blurElement(node);
            }
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  isSensitiveElement(element) {
    const sensitiveSelectors = [
      '.stat-value', '.breakdown-value', '.amount', 
      '.customer-name', '.recent-table', '.chart-wrapper',
      'canvas', '.stat-card', '.breakdown-card'
    ];
    
    return sensitiveSelectors.some(selector => 
      element.matches && element.matches(selector)
    );
  }

  startPeriodicCheck() {
    if (this.periodicInterval) {
      clearInterval(this.periodicInterval);
    }
    
    this.periodicInterval = setInterval(() => {
      // Check if browser is in fullscreen
      if (document.fullscreenElement) {
        this.activateProtection();
      }
      
      // Check for screenshot-related keys being held
      // Note: This is a fallback as we can't detect held keys directly
    }, 500);
  }

  activateProtection() {
    if (!this.isProtected || this.protectionActive) return;

    this.protectionActive = true;
    
    // Show overlay
    if (this.overlay) {
      this.overlay.classList.add('active');
    }
    
    // Blur sensitive content
    this.blurSensitiveContent();
    
    // Add blur class to main container
    const container = document.querySelector('.customer-dashboard-container');
    if (container) {
      container.classList.add('screenshot-protection-active');
    }

    // Show warning
    this.showToast('Screenshot detected! Sensitive data has been hidden.', 'warning');

    // Reset protection after delay
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    
    this.blurTimer = setTimeout(() => {
      this.deactivateProtection();
    }, 1000);
  }

  deactivateProtection() {
    this.protectionActive = false;
    
    // Hide overlay
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    
    // Remove blur
    this.restoreSensitiveContent();
    
    const container = document.querySelector('.customer-dashboard-container');
    if (container) {
      container.classList.remove('screenshot-protection-active');
    }
  }

  blurSensitiveContent() {
    // Re-identify elements in case new ones were added
    this.identifySensitiveElements();
    
    this.sensitiveElements.forEach(element => {
      if (element && element.style) {
        // Store original styles
        this.originalStyles.set(element, {
          filter: element.style.filter,
          transition: element.style.transition,
          position: element.style.position
        });
        
        // Apply blur
        element.style.transition = 'filter 0.1s ease';
        element.style.filter = 'blur(8px)';
        
        // Add attribute for extra protection
        if (!element.hasAttribute('data-protected')) {
          element.setAttribute('data-protected', 'true');
        }
      }
    });
  }

  restoreSensitiveContent() {
    this.sensitiveElements.forEach(element => {
      if (element && element.style) {
        const original = this.originalStyles.get(element);
        if (original) {
          element.style.filter = original.filter || '';
          element.style.transition = original.transition || '';
          this.originalStyles.delete(element);
        } else {
          element.style.filter = '';
        }
      }
    });
  }

  blurElement(element) {
    if (element && element.style) {
      this.originalStyles.set(element, {
        filter: element.style.filter
      });
      element.style.filter = 'blur(8px)';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };
    
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10001;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
    `;
    toast.textContent = `⚠️ ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.remove();
      }
    }, 2000);
  }

  disable() {
    this.isProtected = false;
    this.deactivateProtection();
  }

  enable() {
    this.isProtected = true;
  }

  destroy() {
    // Clear timers
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    if (this.periodicInterval) {
      clearInterval(this.periodicInterval);
    }
    
    // Remove listeners
    this.removeListeners();
    
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
    }
    
    // Remove DOM elements
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.remove();
    }
    if (this.watermark && this.watermark.parentNode) {
      this.watermark.remove();
    }
    
    // Restore content
    this.restoreSensitiveContent();
    
    // Remove class from container
    const container = document.querySelector('.customer-dashboard-container');
    if (container) {
      container.classList.remove('screenshot-protection-active');
    }
  }
}

export default ScreenshotProtection;