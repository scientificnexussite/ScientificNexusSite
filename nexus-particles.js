/**
 * nexus-particles.js
 * Two responsibilities:
 *   1) Spawns CSS floating particle dots on ALL screen sizes.
 *   2) On mobile (< 768px), runs a lightweight 2D canvas particle
 *      network because Three.js is skipped for performance there.
 */
(function () {
    'use strict';

    /* ─────────────────────────────────────────
       PART 1 — CSS floating particle dots
       Fewer on mobile to keep it smooth.
    ───────────────────────────────────────── */
    var field = document.getElementById('particle-field');
    if (field) {
        var isMobile = window.innerWidth < 768;
        var COUNT    = isMobile ? 10 : 18;
        var COLORS   = ['#00f2ff', '#bc13fe', '#ffffff'];

        for (var i = 0; i < COUNT; i++) {
            var dot      = document.createElement('div');
            dot.className = 'p-dot';
            var size     = Math.random() * 3 + 1;
            var color    = COLORS[Math.floor(Math.random() * COLORS.length)];
            var duration = Math.random() * 15 + 8;
            var delay    = Math.random() * 10;
            var left     = Math.random() * 100;

            dot.style.cssText = [
                'width:'             + size  + 'px',
                'height:'            + size  + 'px',
                'background:'        + color,
                'left:'              + left  + '%',
                'bottom:-10px',
                'animation-duration:'+ duration + 's',
                'animation-delay:'   + delay    + 's',
                'box-shadow:0 0 '    + (size * 3) + 'px ' + color
            ].join(';');

            field.appendChild(dot);
        }
    }

    /* ─────────────────────────────────────────
       PART 2 — Mobile 2D canvas particle network
       Only runs when Three.js is not active
       (i.e. screen width < 768px).
    ───────────────────────────────────────── */
    if (window.innerWidth >= 768) return;

    var canvas = document.getElementById('nexus-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();

    /* Build nodes */
    var NODE_COUNT_2D = 40;
    var nodes2d       = [];
    for (var n = 0; n < NODE_COUNT_2D; n++) {
        nodes2d.push({
            x:     Math.random() * canvas.width,
            y:     Math.random() * canvas.height,
            vx:    (Math.random() - 0.5) * 0.35,
            vy:    (Math.random() - 0.5) * 0.35,
            r:     Math.random() * 1.8 + 0.8,
            cyan:  Math.random() > 0.3   /* true = cyan, false = purple */
        });
    }

    var MAX_DIST_2D = 110;

    function draw2d() {
        requestAnimationFrame(draw2d);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        /* Draw connection lines */
        for (var a = 0; a < nodes2d.length; a++) {
            for (var b = a + 1; b < nodes2d.length; b++) {
                var dx   = nodes2d[a].x - nodes2d[b].x;
                var dy   = nodes2d[a].y - nodes2d[b].y;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MAX_DIST_2D) {
                    var alpha = 0.18 * (1 - dist / MAX_DIST_2D);
                    ctx.beginPath();
                    ctx.moveTo(nodes2d[a].x, nodes2d[a].y);
                    ctx.lineTo(nodes2d[b].x, nodes2d[b].y);
                    /* Mix cyan and purple based on the two node types */
                    var isCyan = nodes2d[a].cyan && nodes2d[b].cyan;
                    ctx.strokeStyle = isCyan
                        ? 'rgba(0,242,255,'   + alpha + ')'
                        : 'rgba(188,19,254,'  + alpha + ')';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        /* Draw nodes and update positions */
        nodes2d.forEach(function (nd) {
            /* Dot */
            ctx.beginPath();
            ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
            ctx.fillStyle = nd.cyan ? '#00f2ff' : '#bc13fe';
            ctx.shadowBlur  = 6;
            ctx.shadowColor = nd.cyan ? '#00f2ff' : '#bc13fe';
            ctx.fill();
            ctx.shadowBlur  = 0;

            /* Move */
            nd.x += nd.vx;
            nd.y += nd.vy;

            /* Bounce off edges */
            if (nd.x < 0 || nd.x > canvas.width)  nd.vx *= -1;
            if (nd.y < 0 || nd.y > canvas.height)  nd.vy *= -1;
        });
    }

    draw2d();

    window.addEventListener('resize', function () {
        resize();
        /* Redistribute nodes across new canvas size */
        nodes2d.forEach(function (nd) {
            nd.x = Math.min(nd.x, canvas.width);
            nd.y = Math.min(nd.y, canvas.height);
        });
    });
})();
