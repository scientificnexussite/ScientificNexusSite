/**
 * nexus-tilt.js
 * Applies a smooth, RAF-throttled 3D perspective tilt to every panel
 * that carries the [data-tilt] attribute.
 *
 * The System Feedback Protocol (lore-sidebar) does NOT have [data-tilt],
 * so it is completely unaffected — no tilt on hover, mouse-move, or click.
 *
 * Skipped entirely on mobile (< 768px) for performance.
 */
(function () {
    'use strict';

    if (window.innerWidth < 768) return;

    var panels = document.querySelectorAll('[data-tilt]');

    panels.forEach(function (panel) {
        var glow       = panel.querySelector('.panel-glow');
        var rafPending = false;
        var lastE      = null;

        panel.addEventListener('mousemove', function (e) {
            lastE = e;
            if (rafPending) return;
            rafPending = true;

            requestAnimationFrame(function () {
                rafPending = false;
                if (!lastE) return;

                var rect = panel.getBoundingClientRect();
                var dx   = (lastE.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
                var dy   = (lastE.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);

                /* Max 4° — looks 3D without feeling unstable */
                var rotX = -dy * 4;
                var rotY =  dx * 4;

                panel.style.transform  = 'perspective(900px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale3d(1.015,1.015,1.015)';
                panel.style.boxShadow  = (-rotY * 2) + 'px ' + (rotX * 2) + 'px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,242,255,0.08)';

                /* Move the radial glow spotlight */
                if (glow) {
                    var mx = ((lastE.clientX - rect.left) / rect.width)  * 100;
                    var my = ((lastE.clientY - rect.top)  / rect.height) * 100;
                    glow.style.setProperty('--mx', mx + '%');
                    glow.style.setProperty('--my', my + '%');
                }
            });
        }, { passive: true });

        panel.addEventListener('mouseleave', function () {
            lastE = null;
            panel.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
            panel.style.boxShadow = '';
        });
    });
})();
