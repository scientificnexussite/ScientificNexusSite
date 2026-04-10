// nexus-particles-enhanced.js
// Advanced particle system with realistic physics and interactive effects
(function() {
    'use strict';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let particles = [];
    let mouseX = 0, mouseY = 0;
    let animationId = null;
    let isActive = true;

    // Configuration
    const config = {
        particleCount: window.innerWidth < 768 ? 25 : 60,
        connectionDistance: 120,
        mouseRepelDistance: 150,
        colors: ['#00f2ff', '#bc13fe', '#00ff88', '#ffd700'],
        speed: 0.5,
        size: { min: 1, max: 3 }
    };

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * config.speed;
            this.vy = (Math.random() - 0.5) * config.speed;
            this.size = Math.random() * (config.size.max - config.size.min) + config.size.min;
            this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
            this.alpha = Math.random() * 0.5 + 0.3;
            this.pulsePhase = Math.random() * Math.PI * 2;
        }

        update() {
            // Mouse repulsion
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < config.mouseRepelDistance) {
                const force = (config.mouseRepelDistance - dist) / config.mouseRepelDistance;
                this.vx += (dx / dist) * force * 0.5;
                this.vy += (dy / dist) * force * 0.5;
            }

            // Apply velocity with damping
            this.x += this.vx;
            this.y += this.vy;
            this.vx *= 0.99;
            this.vy *= 0.99;

            // Boundary wrap
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;

            // Pulse effect
            this.pulsePhase += 0.02;
        }

        draw() {
            const pulseAlpha = this.alpha + Math.sin(this.pulsePhase) * 0.2;
            const pulseSize = this.size + Math.sin(this.pulsePhase) * 0.5;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.5, pulseSize), 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, pulseAlpha));
            ctx.fill();
            
            // Glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
    }

    function init() {
        canvas.id = 'nexus-particles-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
        `;
        document.body.insertBefore(canvas, document.body.firstChild);
        
        resize();
        createParticles();
        
        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        
        // Visibility handling
        document.addEventListener('visibilitychange', () => {
            isActive = !document.hidden;
            if (isActive && !animationId) animate();
        });
        
        animate();
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < config.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function onMouseMove(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < config.connectionDistance) {
                    const alpha = (1 - dist / config.connectionDistance) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        if (!isActive) {
            animationId = null;
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        drawConnections();
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        animationId = requestAnimationFrame(animate);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose control API
    window.NexusParticles = {
        setCount: (count) => {
            config.particleCount = count;
            createParticles();
        },
        destroy: () => {
            if (animationId) cancelAnimationFrame(animationId);
            canvas.remove();
        }
    };
})();
