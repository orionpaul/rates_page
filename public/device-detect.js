/**
 * Universal Device Detection Script
 * Detects device type and adds appropriate classes to HTML element
 * Works on all browsers including old Smart TVs
 */

(function() {
  'use strict';

  // Get HTML element
  var html = document.documentElement;
  var ua = navigator.userAgent || '';
  var platform = navigator.platform || '';

  // Device type detection
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  var isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(ua);
  var isTV = /TV|SmartTV|GoogleTV|AppleTV|NetCast|NETTV|Web0S|SmartHub/i.test(ua);
  var isDesktop = !isMobile && !isTablet && !isTV;

  // Screen size detection
  var width = window.innerWidth || document.documentElement.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight;

  // Add device type classes
  if (isTV) {
    html.className += ' device-tv';
  } else if (isTablet) {
    html.className += ' device-tablet';
  } else if (isMobile) {
    html.className += ' device-mobile';
  } else {
    html.className += ' device-desktop';
  }

  // Add screen size classes
  if (width < 360) {
    html.className += ' screen-xs';
  } else if (width < 640) {
    html.className += ' screen-sm';
  } else if (width < 768) {
    html.className += ' screen-md';
  } else if (width < 1024) {
    html.className += ' screen-lg';
  } else if (width < 1920) {
    html.className += ' screen-xl';
  } else if (width < 3840) {
    html.className += ' screen-2xl';
  } else {
    html.className += ' screen-4k';
  }

  // Add orientation class
  if (height > width) {
    html.className += ' orientation-portrait';
  } else {
    html.className += ' orientation-landscape';
  }

  // Touch support detection
  var hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (hasTouch) {
    html.className += ' has-touch';
  } else {
    html.className += ' no-touch';
  }

  // Pointer type detection (for TV remotes)
  var hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var hasNoHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
  if (hasCoarsePointer && hasNoHover) {
    html.className += ' input-remote';
  }

  // Resolution detection
  var pixelRatio = window.devicePixelRatio || 1;
  if (pixelRatio >= 3) {
    html.className += ' dpi-high';
  } else if (pixelRatio >= 2) {
    html.className += ' dpi-medium';
  } else {
    html.className += ' dpi-standard';
  }

  // Browser detection (for specific fixes)
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) {
    html.className += ' browser-chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    html.className += ' browser-safari';
  } else if (/Firefox/i.test(ua)) {
    html.className += ' browser-firefox';
  } else if (/Edge/i.test(ua)) {
    html.className += ' browser-edge';
  } else if (/MSIE|Trident/i.test(ua)) {
    html.className += ' browser-ie';
  }

  // Reduced motion preference
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    html.className += ' reduced-motion';
  }

  // Add resize handler to update orientation
  var resizeTimer;
  function handleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      var newWidth = window.innerWidth || document.documentElement.clientWidth;
      var newHeight = window.innerHeight || document.documentElement.clientHeight;

      // Update orientation class
      html.className = html.className.replace(/orientation-\w+/g, '');
      if (newHeight > newWidth) {
        html.className += ' orientation-portrait';
      } else {
        html.className += ' orientation-landscape';
      }
    }, 250);
  }

  // Add event listeners (with fallback for older browsers)
  if (window.addEventListener) {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  } else if (window.attachEvent) {
    window.attachEvent('onresize', handleResize);
  }

  // Log device info to console (helpful for debugging)
  if (console && console.log) {
    console.log('Device Info:', {
      type: isTV ? 'TV' : isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop',
      width: width,
      height: height,
      pixelRatio: pixelRatio,
      hasTouch: hasTouch,
      userAgent: ua
    });
  }
})();
