/**
 * TV Loader - Optimized for Hisense, TCL, and Chinese Budget TVs
 * These TVs often have:
 * - Old Chromium browsers (v30-50)
 * - Limited JavaScript support
 * - Very slow processors
 * - Limited memory (512MB-1GB)
 */

(function() {
  'use strict';

  var html = document.documentElement;

  // Detect if this is a low-end TV browser
  var ua = navigator.userAgent || '';
  var isLowEndTV = false;

  // Detect Hisense TVs
  if (/Hisense/i.test(ua)) {
    isLowEndTV = true;
    html.className += ' tv-hisense';
  }

  // Detect TCL TVs
  if (/TCL/i.test(ua)) {
    isLowEndTV = true;
    html.className += ' tv-tcl';
  }

  // Detect generic Chinese TVs (often identified by Android version and specific patterns)
  if (/Android [2-5]\./i.test(ua) && /TV/i.test(ua)) {
    isLowEndTV = true;
    html.className += ' tv-generic-android';
  }

  // Detect very old Chromium versions
  var chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && parseInt(chromeMatch[1]) < 60) {
    isLowEndTV = true;
    html.className += ' browser-old-chrome';
  }

  // Detect Opera TV browsers (common on Chinese TVs)
  if (/Opera.*TV/i.test(ua) || /OPR/i.test(ua)) {
    isLowEndTV = true;
    html.className += ' tv-opera';
  }

  // If it's a low-end TV, apply optimizations
  if (isLowEndTV) {
    html.className += ' tv-low-end';

    // Disable heavy animations
    var style = document.createElement('style');
    style.textContent = `
      /* Disable heavy animations on low-end TVs */
      .tv-low-end * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }

      /* Simplify gradients */
      .tv-low-end [class*="gradient"],
      .tv-low-end [class*="blur"],
      .tv-low-end [class*="shadow"] {
        background: #003A70 !important;
        box-shadow: none !important;
        filter: none !important;
      }

      /* Disable complex transforms */
      .tv-low-end .animate-pulse,
      .tv-low-end .animate-spin,
      .tv-low-end .animate-bounce {
        animation: none !important;
      }

      /* Simplify layout for performance */
      .tv-low-end {
        font-smoothing: none !important;
        -webkit-font-smoothing: none !important;
      }
    `;
    document.head.appendChild(style);

    // Log for debugging
    if (console && console.log) {
      console.log('🎯 Low-end TV detected - Performance optimizations applied');
      console.log('Browser:', ua);
    }
  }

  // Force hardware acceleration for video
  var forceVideoAcceleration = function() {
    var videos = document.getElementsByTagName('video');
    for (var i = 0; i < videos.length; i++) {
      videos[i].style.transform = 'translateZ(0)';
      videos[i].style.backfaceVisibility = 'hidden';
    }

    var iframes = document.getElementsByTagName('iframe');
    for (var j = 0; j < iframes.length; j++) {
      iframes[j].style.transform = 'translateZ(0)';
      iframes[j].style.backfaceVisibility = 'hidden';
    }
  };

  // Apply video acceleration after DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceVideoAcceleration);
  } else {
    forceVideoAcceleration();
  }

  // Reapply periodically for dynamically loaded videos
  setInterval(forceVideoAcceleration, 2000);

  // Memory cleanup for low-end TVs
  if (isLowEndTV) {
    // Clear console to free memory
    if (console && console.clear) {
      setInterval(function() {
        console.clear();
      }, 30000); // Every 30 seconds
    }

    // Force garbage collection hints (some browsers support this)
    setInterval(function() {
      if (window.gc) {
        window.gc();
      }
    }, 60000); // Every minute
  }

  // Fix for TVs that don't auto-load external scripts
  window.addEventListener('load', function() {
    // Ensure YouTube iframe API is loaded
    if (!window.YT && typeof fetch !== 'undefined') {
      var script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });

  // Error handler for TVs with strict CSP
  window.addEventListener('error', function(e) {
    if (console && console.error) {
      console.error('TV Compatibility Error:', e.message);
    }
    // Don't break the app on errors
    return true;
  }, true);

  // Unhandled promise rejection handler (for old browsers)
  window.addEventListener('unhandledrejection', function(e) {
    if (console && console.warn) {
      console.warn('Promise rejection (TV compatibility):', e.reason);
    }
    e.preventDefault();
  });

})();
