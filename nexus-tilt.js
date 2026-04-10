// nexus-tilt.js (Enhanced with sensitivity control)
/**
 * nexus-tilt.js
 * Enhanced 3D perspective tilt with smooth animations and configurable sensitivity.
 */
(function () {
    'use strict';

    // Default sensitivity (50% = normal)
    var DEFAULT_SENSITIVITY = 50;

    // Get current sensitivity from global settings
    function getSensitivity() {
        if (typeof window.NEXUS_TILT_SENSITIVITY !== 'undefined') {
            return window.NEXUS_TILT_SENSITIVITY;
        }
        return DEFAULT_SENSITIVITY;
    }

    // Calculate tilt multiplier based on sensitivity (0-100)
    // 0% = no tilt, 50% = normal (8 degrees), 100% = double (16 degrees)
    function getTiltMultiplier() {
        var sensitivity = getSensitivity();
        // Map 0-100 to 0-2 multiplier
        return sensitivity / 50;
    }

    // Main tilt initialization function
    function initTilt() {
        // Skip on mobile
        if (window.innerWidth < 768) return;

        // Find all panels with data-tilt attribute
        var panels = document.querySelectorAll('[data-tilt]');

        panels.forEach(function (panel) {
            // Skip if already initialized
            if (panel._tiltInitialized) return;
            panel._tiltInitialized = true;

            var glow = panel.querySelector('.panel-glow');
            var rafPending = false;
            var lastE = null;
            var currentRotX = 0;
            var currentRotY = 0;
            var targetRotX = 0;
            var targetRotY = 0;
            var isHovering = false;

            panel.addEventListener('mouseenter', function() {
                panel.style.willChange = 'transform';
                isHovering = true;
            }, { passive: true });

            panel.addEventListener('mousemove', function (e) {
                lastE = e;
                if (rafPending) return;
                rafPending = true;

                requestAnimationFrame(function () {
                    rafPending = false;
                    if (!lastE || !isHovering) return;

                    var rect = panel.getBoundingClientRect();
                    var dx = (lastE.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
                    var dy = (lastE.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

                    // Apply sensitivity multiplier to tilt amount
                    var multiplier = getTiltMultiplier();
                    var maxTilt = 8 * multiplier;

                    targetRotY = dx * maxTilt;
                    targetRotX = -dy * maxTilt;

                    // Smooth interpolation
                    var smoothFactor = 0.1;
                    currentRotX += (targetRotX - currentRotX) * smoothFactor;
                    currentRotY += (targetRotY - currentRotY) * smoothFactor;

                    // Shadow calculation based on rotation
                    var shadowX = -currentRotY * 3;
                    var shadowY = currentRotX * 3;

                    // Apply transform with scale
                    var scale = 1 + (0.02 * multiplier);
                    panel.style.transform = 
                        'perspective(1000px) ' +
                        'rotateX(' + currentRotX.toFixed(2) + 'deg) ' +
                        'rotateY(' + currentRotY.toFixed(2) + 'deg) ' +
                        'scale3d(' + scale + ', ' + scale + ', ' + scale + ')';
                    
                    // Dynamic shadow
                    var shadowIntensity = 0.5 * multiplier;
                    var glowIntensity = 0.1 * multiplier;
                    panel.style.boxShadow = 
                        shadowX + 'px ' + shadowY + 'px 50px rgba(0,0,0,' + shadowIntensity + '), ' +
                        '0 0 40px rgba(0,242,255,' + glowIntensity + ')';

                    // Update glow position
                    if (glow) {
                        var mx = ((lastE.clientX - rect.left) / rect.width) * 100;
                        var my = ((lastE.clientY - rect.top) / rect.height) * 100;
                        glow.style.setProperty('--mx', mx + '%');
                        glow.style.setProperty('--my', my + '%');
                    }
                });
            }, { passive: true });

            panel.addEventListener('mouseleave', function () {
                lastE = null;
                isHovering = false;
                
                function resetTransform() {
                    if (lastE || isHovering) return;
                    
                    // Smooth return to neutral
                    currentRotX += (0 - currentRotX) * 0.15;
                    currentRotY += (0 - currentRotY) * 0.15;
                    
                    // Stop when close enough to zero
                    if (Math.abs(currentRotX) < 0.01 && Math.abs(currentRotY) < 0.01) {
                        panel.style.transform = '';
                        panel.style.boxShadow = '';
                        panel.style.willChange = 'auto';
                        return;
                    }
                    
                    panel.style.transform = 
                        'perspective(1000px) ' +
                        'rotateX(' + currentRotX.toFixed(2) + 'deg) ' +
                        'rotateY(' + currentRotY.toFixed(2) + 'deg) ' +
                        'scale3d(1, 1, 1)';
                    
                    requestAnimationFrame(resetTransform);
                }
                
                resetTransform();
            });
        });
    }

    // Reinitialize tilt (called when settings change)
    function reinitTilt() {
        // Clear initialization flags to allow re-init
        var panels = document.querySelectorAll('[data-tilt]');
        panels.forEach(function(panel) {
            panel._tiltInitialized = false;
        });
        // Re-initialize
        initTilt();
    }

    // Expose reinit function globally
    window.reinitTilt = reinitTilt;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTilt);
    } else {
        initTilt();
    }

    // Also initialize after a short delay to catch dynamically added elements
    setTimeout(initTilt, 100);
    setTimeout(initTilt, 500);

    // Re-init on window resize (in case mobile/desktop breakpoint changes)
    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(initTilt, 250);
    });
})();
