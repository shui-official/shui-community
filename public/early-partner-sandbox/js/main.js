// ===================================
// SHUI Early Partner Program
// JavaScript Interactions & Animations
// ===================================

document.addEventListener('DOMContentLoaded', () => {
  // === Navigation Scroll Effect ===
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
  
  // === Mobile Menu Toggle ===
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
  });
  
  // Close mobile menu when clicking a link
  const navLinks = document.querySelectorAll('.nav__link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
  
  // === Smooth Scroll ===
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80; // Nav height
        const targetPosition = target.offsetTop - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // === Reveal on Scroll Animation ===
  const revealElements = document.querySelectorAll('[data-reveal]');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
  
  // === Particles Animation ===
  const particlesContainer = document.getElementById('particles');
  const particleCount = 50;
  
  function createParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = `${Math.random() * 3 + 1}px`;
    particle.style.height = particle.style.width;
    particle.style.background = `rgba(0, 229, 255, ${Math.random() * 0.5 + 0.2})`;
    particle.style.borderRadius = '50%';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.pointerEvents = 'none';
    particle.style.boxShadow = '0 0 10px rgba(0, 229, 255, 0.5)';
    
    const duration = Math.random() * 20 + 10;
    const delay = Math.random() * 5;
    
    particle.style.animation = `float ${duration}s ${delay}s infinite ease-in-out`;
    
    particlesContainer.appendChild(particle);
  }
  
  // Create particles
  for (let i = 0; i < particleCount; i++) {
    createParticle();
  }
  
  // Add CSS animation for particles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      0%, 100% {
        transform: translate(0, 0) scale(1);
        opacity: 0.2;
      }
      25% {
        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.2);
        opacity: 0.6;
      }
      50% {
        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0.8);
        opacity: 0.3;
      }
      75% {
        transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(1.1);
        opacity: 0.5;
      }
    }
  `;
  document.head.appendChild(style);
  
  // === Parallax Effect on Hero ===
  const heroBg = document.querySelector('.hero__bg');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    if (heroBg && scrolled < window.innerHeight) {
      heroBg.style.transform = `translateY(${scrolled * 0.5}px) scale(1.05)`;
    }
  }, { passive: true });
  
  // === 3D Tilt Effect on Cards (Desktop only) ===
  if (window.innerWidth > 768) {
    const tiltCards = document.querySelectorAll('.pillar, .reason, .advantage, .level, .mission, .example');
    
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });
      
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }
  
  // === Counter Animation for Large Numbers ===
  const counters = document.querySelectorAll('.supply-value, .wallet-amount');
  
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const text = target.textContent;
        const numbers = text.match(/[\d,]+/);
        
        if (numbers) {
          const finalNumber = parseInt(numbers[0].replace(/,/g, ''));
          animateCounter(target, 0, finalNumber, 2000, text);
          counterObserver.unobserve(target);
        }
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => {
    counterObserver.observe(counter);
  });
  
  function animateCounter(element, start, end, duration, originalText) {
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (end - start) * easeOutQuart);
      
      element.textContent = originalText.replace(/[\d,]+/, current.toLocaleString());
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }
  
  // === Allocation Bar Animation ===
  const allocationBars = document.querySelectorAll('.allocation__bar');
  
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const finalWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
          bar.style.width = finalWidth;
          bar.style.transition = 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }, 100);
        
        barObserver.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });
  
  allocationBars.forEach(bar => {
    barObserver.observe(bar);
  });
  
  // === Status Indicator Pulse ===
  const statusIndicators = document.querySelectorAll('.status-indicator');
  statusIndicators.forEach((indicator, index) => {
    indicator.style.animationDelay = `${index * 0.2}s`;
  });
  
  // === Bonus Tier Sequential Reveal ===
  const bonusTiers = document.querySelectorAll('.bonus-tier');
  
  const bonusObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const parent = entry.target.closest('.performance__category');
        const tiers = parent.querySelectorAll('.bonus-tier');
        
        tiers.forEach((tier, index) => {
          setTimeout(() => {
            tier.style.opacity = '0';
            tier.style.transform = 'translateX(-20px)';
            tier.style.transition = 'all 0.5s ease-out';
            
            setTimeout(() => {
              tier.style.opacity = '1';
              tier.style.transform = 'translateX(0)';
            }, 50);
          }, index * 150);
        });
        
        bonusObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  bonusTiers.forEach(tier => {
    if (tier === tier.parentElement.firstElementChild) {
      bonusObserver.observe(tier);
    }
  });
  
  // === Timeline Progressive Reveal ===
  const timelineItems = document.querySelectorAll('.timeline__item');
  
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const items = document.querySelectorAll('.timeline__item');
        items.forEach((item, index) => {
          setTimeout(() => {
            item.classList.add('revealed');
          }, index * 200);
        });
        timelineObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  
  if (timelineItems.length > 0) {
    timelineObserver.observe(timelineItems[0]);
  }
  
  // === Level Cards Sequential Reveal ===
  const levelCards = document.querySelectorAll('.level');
  
  const levelObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        levelCards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('revealed');
          }, index * 150);
        });
        levelObserver.disconnect();
      }
    });
  }, { threshold: 0.2 });
  
  if (levelCards.length > 0) {
    levelObserver.observe(levelCards[0]);
  }
  
  // === Button Ripple Effect ===
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out';
      ripple.style.pointerEvents = 'none';
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
  
  // Add ripple animation
  const rippleStyle = document.createElement('style');
  rippleStyle.textContent = `
    @keyframes ripple {
      to {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(rippleStyle);
  
  // === Performance Optimization: Debounce Scroll Events ===
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // === Console Welcome Message ===
  console.log('%c🌊 SHUI Early Partner Program', 'color: #00e5ff; font-size: 20px; font-weight: bold;');
  console.log('%cWe are drops. Together we form an ocean.', 'color: #8b9ab3; font-size: 14px; font-style: italic;');
  console.log('%cInterested in becoming a partner? Email: shui.officialtoken@gmail.com', 'color: #00d4d4; font-size: 12px;');
  
  // === Accessibility: Focus Visible ===
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-nav');
    }
  });
  
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-nav');
  });
  
  // Add keyboard navigation styles
  const a11yStyle = document.createElement('style');
  a11yStyle.textContent = `
    body:not(.keyboard-nav) *:focus {
      outline: none;
    }
    
    body.keyboard-nav *:focus {
      outline: 2px solid var(--color-cyan);
      outline-offset: 4px;
    }
  `;
  document.head.appendChild(a11yStyle);
  
  // === Analytics Tracking (placeholder for future implementation) ===
  function trackEvent(category, action, label) {
    // Placeholder for Google Analytics or other tracking
    console.log('Track Event:', category, action, label);
    
    // Example for future GA4 implementation:
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', action, {
    //     'event_category': category,
    //     'event_label': label
    //   });
    // }
  }
  
  // Track CTA clicks
  document.querySelectorAll('.btn--primary').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('CTA', 'click', 'Apply as Partner');
    });
  });
  
  document.querySelectorAll('.btn--ghost').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('CTA', 'click', 'Explore Program');
    });
  });
  
  document.querySelectorAll('.btn--solscan').forEach(btn => {
    btn.addEventListener('click', () => {
      trackEvent('External Link', 'click', 'Solscan');
    });
  });
  
  // Track social links
  document.querySelectorAll('.hero__link').forEach(link => {
    link.addEventListener('click', () => {
      const platform = link.textContent.trim();
      trackEvent('Social Link', 'click', platform);
    });
  });
  
  // === Loading Performance ===
  window.addEventListener('load', () => {
    console.log('%c✅ Page fully loaded', 'color: #14F195; font-weight: bold;');
    
    // Remove any loading indicators if present
    const loader = document.querySelector('.loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 300);
    }
  });
  
  // === Error Handling for Images ===
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      console.warn('Image failed to load:', this.src);
      // Optionally set a fallback
      if (this.classList.contains('hero__bg')) {
        this.style.background = 'radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.1), transparent)';
      }
    });
  });
});

// === Utility Functions ===

// Throttle function for performance
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Smooth scroll to top
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}