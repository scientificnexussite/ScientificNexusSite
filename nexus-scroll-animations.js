// nexus-scroll-animations.js
// Smooth scroll-triggered animations with Intersection Observer
(function() {
    'use strict';

    const animationConfig = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animations = {
        'fade-up': {
            initial: { opacity: 0, transform: 'translateY(40px)' },
            final: { opacity: 1, transform: 'translateY(0)' }
        },
        'fade-down': {
            initial: { opacity: 0, transform: 'translateY(-40px)' },
            final: { opacity: 1, transform: 'translateY(0)' }
        },
        'fade-left': {
            initial: { opacity: 0, transform: 'translateX(-40px)' },
            final: { opacity: 1, transform: 'translateX(0)' }
        },
        'fade-right': {
            initial: { opacity: 0, transform: 'translateX(40px)' },
            final: { opacity: 1, transform: 'translateX(0)' }
        },
        'scale-in': {
            initial: { opacity: 0, transform: 'scale(0.9)' },
            final: { opacity: 1, transform: 'scale(1)' }
        },
        'rotate-in': {
            initial: { opacity: 0, transform: 'rotateX(-15deg) translateY(30px)' },
            final: { opacity: 1, transform: 'rotateX(0) translateY(0)' }
        },
        'glitch-reveal': {
            initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
            final: { opacity: 1, clipPath: 'inset(0 0% 0 0)' }
        }
    };

    function initAnimations() {
        // Add base styles
        const style = document.createElement('style');
        style.textContent = `
            [data-animate] {
                transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1),
                            transform 0.8s cubic-bezier(0.25, 1, 0.5, 1),
                            clip-path 0.8s cubic-bezier(0.25, 1, 0.5, 1);
                will-change: opacity, transform, clip-path;
            }
            
            [data-animate="fade-up"] { opacity: 0; transform: translateY(40px); }
            [data-animate="fade-down"] { opacity: 0; transform: translateY(-40px); }
            [data-animate="fade-left"] { opacity: 0; transform: translateX(-40px); }
            [data-animate="fade-right"] { opacity: 0; transform: translateX(40px); }
            [data-animate="scale-in"] { opacity: 0; transform: scale(0.9); }
            [data-animate="rotate-in"] { opacity: 0; transform: rotateX(-15deg) translateY(30px); }
            [data-animate="glitch-reveal"] { opacity: 0; clip-path: inset(0 100% 0 0); }
            
            [data-animate].animated {
                opacity: 1 !important;
                transform: none !important;
                clip-path: inset(0 0% 0 0) !important;
            }
            
            /* Stagger delays */
            [data-stagger="1"].animated { transition-delay: 0.1s; }
            [data-stagger="2"].animated { transition-delay: 0.2s; }
            [data-stagger="3"].animated { transition-delay: 0.3s; }
            [data-stagger="4"].animated { transition-delay: 0.4s; }
            [data-stagger="5"].animated { transition-delay: 0.5s; }
        `;
        document.head.appendChild(style);

        // Setup observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    
                    // Add animated class with optional delay
                    const delay = parseInt(el.dataset.delay) || 0;
                    
                    if (delay > 0) {
                        setTimeout(() => {
                            el.classList.add('animated');
                        }, delay);
                    } else {
                        el.classList.add('animated');
                    }
                    
                    // Unobserve after animation
                    observer.unobserve(el);
                }
            });
        }, animationConfig);

        // Observe all animated elements
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });

        // Fallback: show all after 3 seconds
        setTimeout(() => {
            document.querySelectorAll('[data-animate]:not(.animated)').forEach(el => {
                el.classList.add('animated');
            });
        }, 3000);
    }

    // Parallax scroll effect
    function initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    
                    parallaxElements.forEach(el => {
                        const speed = parseFloat(el.dataset.parallax) || 0.5;
                        const yPos = scrollY * speed;
                        el.style.transform = `translate3d(0, ${yPos}px, 0)`;
                    });
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // Magnetic button effect
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.magnetic-btn, .auth-btn, .cat-btn, .card');
        
        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                
                btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // Initialize
    function init() {
        initAnimations();
        initParallax();
        initMagneticButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-init for dynamically added content
    window.NexusAnimations = {
        refresh: () => {
            initAnimations();
            initMagneticButtons();
        }
    };
})();
