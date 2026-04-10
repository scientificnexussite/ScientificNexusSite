// nexus-holographic.js
// Holographic scanline and glitch effects for scientific theme
(function() {
    'use strict';

    // Holographic scanlines overlay
    function createScanlines() {
        const scanlines = document.createElement('div');
        scanlines.id = 'holographic-scanlines';
        scanlines.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
            background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0) 0px,
                rgba(0, 0, 0, 0) 1px,
                rgba(0, 242, 255, 0.03) 1px,
                rgba(0, 242, 255, 0.03) 2px
            );
            opacity: 0.6;
        `;
        document.body.appendChild(scanlines);
    }

    // Glitch effect for text elements
    function initGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch-text, .logo, .hero h1, .section-header');
        
        glitchElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.style.animation = 'glitch-anim 0.3s ease';
                setTimeout(() => {
                    el.style.animation = '';
                }, 300);
            });
        });
    }

    // Add CSS animations
    function addGlitchCSS() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes glitch-anim {
                0% { transform: translate(0); filter: hue-rotate(0deg); }
                10% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
                20% { transform: translate(2px, -2px); filter: hue-rotate(180deg); }
                30% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); }
                40% { transform: translate(2px, 2px); filter: hue-rotate(360deg); }
                50% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
                60% { transform: translate(2px, -2px); filter: hue-rotate(180deg); }
                70% { transform: translate(-2px, -2px); filter: hue-rotate(270deg); }
                80% { transform: translate(2px, 2px); filter: hue-rotate(360deg); }
                90% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
                100% { transform: translate(0); filter: hue-rotate(0deg); }
            }
            
            @keyframes holographic-shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            
            .holographic-border {
                position: relative;
            }
            
            .holographic-border::before {
                content: '';
                position: absolute;
                top: -2px; left: -2px; right: -2px; bottom: -2px;
                background: linear-gradient(90deg, var(--cyan), var(--purple), var(--cyan));
                background-size: 200% 100%;
                animation: holographic-shimmer 3s linear infinite;
                z-index: -1;
                border-radius: inherit;
                opacity: 0.5;
            }
            
            @keyframes data-stream {
                0% { transform: translateY(-100%); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateY(100vh); opacity: 0; }
            }
            
            .data-particle {
                position: fixed;
                width: 2px;
                height: 20px;
                background: linear-gradient(to bottom, transparent, var(--cyan), transparent);
                pointer-events: none;
                z-index: 1;
                animation: data-stream 3s linear infinite;
            }
        `;
        document.head.appendChild(style);
    }

    // Create falling data particles
    function createDataParticles() {
        const container = document.createElement('div');
        container.id = 'data-particles-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
            overflow: hidden;
        `;
        document.body.appendChild(container);

        function spawnParticle() {
            if (document.hidden) return;
            
            const particle = document.createElement('div');
            particle.className = 'data-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
            particle.style.animationDelay = Math.random() * 2 + 's';
            container.appendChild(particle);
            
            setTimeout(() => particle.remove(), 5000);
        }

        setInterval(spawnParticle, 800);
    }

    // Initialize
    function init() {
        createScanlines();
        addGlitchCSS();
        createDataParticles();
        
        // Delay glitch effects until elements exist
        setTimeout(initGlitchEffects, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.NexusHolographic = {
        triggerGlitch: (selector) => {
            const el = document.querySelector(selector);
            if (el) {
                el.style.animation = 'glitch-anim 0.3s ease';
                setTimeout(() => el.style.animation = '', 300);
            }
        }
    };
})();
