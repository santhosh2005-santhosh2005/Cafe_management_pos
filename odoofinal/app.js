/* ============================================================
   ODOOCAFE — ELITE JAVASCRIPT
   Matter.js Physics + Custom Cursor + Scroll Reveals
============================================================ */

'use strict';

/* ============================================================
   SMOOTH SCROLLING (Lenis)
============================================================ */
const initSmoothScroll = () => {
  if (typeof Lenis === 'undefined') return;
  
  const lenis = new Lenis({
    duration: 1.5, // slightly more duration for a longer, more elegant glide
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    smoothWheel: true,
    smoothTouch: false,
    lerp: 0.08, // smaller lerp for more fluid/liquid motion
    wheelMultiplier: 1,
    infinite: false,
  });

  // Connect Lenis to ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(1000, 16); // better handling of dropped frames
  
  // Handle internal anchor links with Lenis for smooth transitions
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        lenis.scrollTo(target, {
          offset: 0,
          duration: 1.5,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      }
    });
  });

  return lenis;
};

/* ---- CUSTOM CURSOR ---- */
(function initCursor() {
  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  if (!cursor || !follower) return;

  // Only hide cursor if custom cursor is active
  document.body.style.cursor = 'none';
  
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.transform = `translate(${mouseX - 7}px, ${mouseY - 7}px)`;
  });

  function animateFollower() {
    followerX += (mouseX - followerX) * 0.1;
    followerY += (mouseY - followerY) * 0.1;
    follower.style.transform = `translate(${followerX - 19}px, ${followerY - 19}px)`;
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  document.querySelectorAll('a, button, .menu-card, .process-step, .iced-order-btn, .iced-drink-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('active');
      follower.classList.add('active');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('active');
      follower.classList.remove('active');
    });
  });
})();

/* ---- SCROLL REVEAL ---- */
(function initReveal() {
  const els = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => observer.observe(el));
})();

/* ============================================================
   MATTER.JS PHYSICS PILL CLOUD
============================================================ */
(function initPhysics() {
  const { Engine, Render, Runner, Bodies, Body, World, Mouse, MouseConstraint, Events, Composite } = Matter;

  const container = document.getElementById('physics-canvas');
  if (!container) return;

  const W = container.offsetWidth;
  const H = container.offsetHeight;

  // Create engine
  const engine = Engine.create({ gravity: { x: 0, y: 0.35 } });
  const world = engine.world;

  // Create renderer
  const render = Render.create({
    element: container,
    engine,
    options: {
      width: W,
      height: H,
      wireframes: false,
      background: 'transparent',
      pixelRatio: 1, // Fix to 1 for performance
    }
  });

  Render.run(render);
  const runner = Runner.create();
  
  // Performance optimization: Only run physics when in view
  const physicsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        Runner.run(runner, engine);
      } else {
        Runner.stop(runner);
      }
    });
  }, { threshold: 0.1 });
  physicsObserver.observe(container);

  /* ---- PILL CATEGORIES DATA (EXPANDED TO FILL THE BOX) ---- */
  const categories = [
    // --- SIGNATURES ---
    { label: 'Filter Coffee',  color: '#0B241E', text: '#F5F0E8', sz: [130, 42] },
    { label: 'Masala Chai',    color: '#FFCC00', text: '#0B241E', sz: [120, 42] },
    { label: 'Rose Latte',     color: '#163D33', text: '#FFCC00', sz: [110, 40] },
    { label: 'Haldi Doodh',    color: '#0B241E', text: '#F5F0E8', sz: [120, 40] },
    { label: 'Jaggery Brew',   color: '#FFCC00', text: '#0B241E', sz: [130, 42] },
    { label: 'Kashmiri Kahwa', color: '#1E5446', text: '#FAF7F2', sz: [145, 44] },
    { label: 'Saffron Kaapi',  color: '#0B241E', text: '#FFCC00', sz: [135, 40] },
    { label: 'Monsoon Malabar',color: '#FFCC00', text: '#0B241E', sz: [155, 42] },
    { label: 'Thandai',        color: '#163D33', text: '#F5F0E8', sz: [100, 44] },
    
    // --- CHAIS & TEAS ---
    { label: 'Adrak Chai',     color: '#040404', text: '#FFCC00', sz: [115, 44] },
    { label: 'Elaichi Tea',    color: '#1E5446', text: '#FAF7F2', sz: [115, 40] },
    { label: 'Darjeeling',     color: '#163D33', text: '#FFCC00', sz: [115, 40] },
    { label: 'Assam Gold',     color: '#0B241E', text: '#F5F0E8', sz: [120, 40] },
    { label: 'Tulsi Green',    color: '#040404', text: '#FFCC00', sz: [125, 44] },
    { label: 'Lemon Chai',     color: '#1E5446', text: '#FAF7F2', sz: [115, 40] },
    { label: 'Cardamom Tea',   color: '#FFCC00', text: '#0B241E', sz: [140, 42] },
    { label: 'Sulaimani',      color: '#0B241E', text: '#FFCC00', sz: [110, 40] },
    { label: 'Irani Chai',     color: '#163D33', text: '#F5F0E8', sz: [100, 40] },
    { label: 'Ooty Tea',       color: '#1E5446', text: '#FAF7F2', sz: [105, 40] },
    { label: 'Butter Tea',     color: '#FFCC00', text: '#0B241E', sz: [110, 42] },
    
    // --- LASSIS & COLD ---
    { label: 'Mango Lassi',    color: '#FFCC00', text: '#0B241E', sz: [130, 42] },
    { label: 'Rose Lassi',     color: '#163D33', text: '#F5F0E8', sz: [110, 44] },
    { label: 'Kokum Soda',     color: '#FFCC00', text: '#0B241E', sz: [125, 42] },
    { label: 'Shikanji',       color: '#0B241E', text: '#F5F0E8', sz: [100, 42] },
    { label: 'Aam Panna',      color: '#1E5446', text: '#FAF7F2', sz: [115, 40] },
    { label: 'Jaljeera',       color: '#0B241E', text: '#FFCC00', sz: [105, 40] },
    { label: 'Buttermilk',     color: '#FFCC00', text: '#0B241E', sz: [120, 42] },
    { label: 'Badam Milk',     color: '#163D33', text: '#F5F0E8', sz: [120, 44] },
    { label: 'Cold Kaapi',     color: '#040404', text: '#FFCC00', sz: [125, 44] },
    { label: 'Litchi Cooler',  color: '#1E5446', text: '#FAF7F2', sz: [130, 40] },
    
    // --- REGIONAL SPECIALS ---
    { label: 'Mysore Blend',   color: '#1E5446', text: '#FAF7F2', sz: [140, 44] },
    { label: 'Nilgiri Brew',   color: '#FFCC00', text: '#0B241E', sz: [130, 42] },
    { label: 'Coorg Coffee',   color: '#0B241E', text: '#F5F0E8', sz: [125, 40] },
    { label: 'Wayanad Tea',    color: '#163D33', text: '#FFCC00', sz: [125, 40] },
    { label: 'Araku Valley',   color: '#040404', text: '#FFCC00', sz: [135, 44] },
    { label: 'Baba Budan',     color: '#1E5446', text: '#FAF7F2', sz: [130, 40] },
    { label: 'Shevaroy Hills', color: '#FFCC00', text: '#0B241E', sz: [145, 42] },
    { label: 'Anamalai',       color: '#0B241E', text: '#FFCC00', sz: [115, 40] },
    { label: 'Biligiri',       color: '#163D33', text: '#F5F0E8', sz: [110, 40] },
    
    // --- FLAVORS & SPICES ---
    { label: 'Ginger Kaapi',   color: '#0B241E', text: '#FFCC00', sz: [125, 40] },
    { label: 'Cinnamon Chai',  color: '#FFCC00', text: '#0B241E', sz: [140, 42] },
    { label: 'Star Anise',     color: '#163D33', text: '#F5F0E8', sz: [110, 44] },
    { label: 'Peppermint Tea', color: '#FFCC00', text: '#0B241E', sz: [145, 42] },
    { label: 'Vanilla Kaapi',  color: '#040404', text: '#FFCC00', sz: [130, 44] },
    { label: 'Honey Lemon',    color: '#1E5446', text: '#FAF7F2', sz: [125, 40] },
    { label: 'Fennel Brew',    color: '#0B241E', text: '#FFCC00', sz: [120, 40] },
    { label: 'Clove Spiced',   color: '#FFCC00', text: '#0B241E', sz: [130, 42] },
    { label: 'Nutmeg Latte',   color: '#163D33', text: '#F5F0E8', sz: [135, 44] },
    
    // --- MODERN TWISTS ---
    { label: 'Espresso Tonic', color: '#040404', text: '#FFCC00', sz: [140, 44] },
    { label: 'Nitro Kaapi',    color: '#1E5446', text: '#FAF7F2', sz: [125, 40] },
    { label: 'Affogato',       color: '#FFCC00', text: '#0B241E', sz: [115, 42] },
    { label: 'Cortado',        color: '#0B241E', text: '#F5F0E8', sz: [105, 40] },
    { label: 'Flat White',     color: '#163D33', text: '#FFCC00', sz: [120, 40] },
    { label: 'Iced Americano', color: '#040404', text: '#FFCC00', sz: [150, 44] },
    { label: 'Mocha',          color: '#1E5446', text: '#FAF7F2', sz: [100, 40] },
    { label: 'Macchiato',      color: '#FFCC00', text: '#0B241E', sz: [115, 42] },
    { label: 'Ristretto',      color: '#0B241E', text: '#FFCC00', sz: [110, 40] },
    { label: 'Cappuccino',     color: '#163D33', text: '#F5F0E8', sz: [125, 44] },
    
    // --- EXTRA FILLERS (REDUCED for performance) ---
    { label: 'South Kaapi',    color: '#040404', text: '#FFCC00', sz: [125, 44] },
    { label: 'North Chai',     color: '#1E5446', text: '#FAF7F2', sz: [115, 40] },
    { label: 'Urban Blend',    color: '#163D33', text: '#FFCC00', sz: [130, 40] },
    { label: 'Estate Select',  color: '#1E5446', text: '#FAF7F2', sz: [140, 40] },
    { label: 'Grand Reserve',  color: '#FFCC00', text: '#0B241E', sz: [150, 42] },
    { label: 'Daily Dose',     color: '#163D33', text: '#F5F0E8', sz: [115, 40] },
    { label: 'Zen Tea',        color: '#1E5446', text: '#FAF7F2', sz: [100, 40] },
    { label: 'Spirit of India',color: '#FFCC00', text: '#0B241E', sz: [160, 42] },
  ];

  const pills = [];
  const pilBodies = [];

  categories.forEach((cat, i) => {
    const [w, h] = cat.sz;
    // Spread pills randomly across full canvas width & height
    const x = 80 + Math.random() * (W - 160);
    const y = 40 + Math.random() * (H - 80);
    const angle = (Math.random() * 40 - 20) * Math.PI / 180;

    const body = Bodies.rectangle(x, y, w, h, {
      chamfer: { radius: h / 2 },
      restitution: 0.6,
      friction: 0.1,
      frictionAir: 0.025,
      density: 0.003,
      angle,
      render: {
        fillStyle: cat.color,
        strokeStyle: cat.color === '#FFCC00' ? '#0B241E' : 'transparent',
        lineWidth: cat.color === '#FFCC00' ? 1.5 : 0,
      },
      label: cat.label,
    });

    pilBodies.push(body);
    pills.push({ body, cat, w, h });
  });

  World.add(world, pilBodies);

  /* ---- WALLS ---- */
  const wallOpts = { isStatic: true, render: { fillStyle: 'transparent' } };
  const ground  = Bodies.rectangle(W / 2, H + 30, W, 60, wallOpts);
  const wallL   = Bodies.rectangle(-30, H / 2, 60, H, wallOpts);
  const wallR   = Bodies.rectangle(W + 30, H / 2, 60, H, wallOpts);
  const ceiling = Bodies.rectangle(W / 2, -30, W, 60, wallOpts);
  World.add(world, [ground, wallL, wallR, ceiling]);

  /* ---- MOUSE CONSTRAINT ---- */
  const mouse = Mouse.create(render.canvas);
  
  // FIX: Disable Matter.js scroll hijacking so user can scroll the page
  mouse.element.removeEventListener("mousewheel", mouse.mousewheel);
  mouse.element.removeEventListener("DOMMouseScroll", mouse.mousewheel);

  const mc = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
  });
  World.add(world, mc);
  render.mouse = mouse;

  /* ---- DRAW LABELS AFTER EACH RENDER ---- */
  Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    ctx.save();
    pills.forEach(({ body, cat, w, h }) => {
      const { x, y } = body.position;
      const angle = body.angle;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      ctx.font = `700 ${Math.min(13, h * 0.28)}px 'Archivo', sans-serif`;
      ctx.fillStyle = cat.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '0.08em';
      ctx.fillText(cat.label.toUpperCase(), 0, 0.5);

      ctx.restore();
    });
    ctx.restore();
  });

  /* ---- MOUSE ATTRACTION RIPPLE ---- */
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    pilBodies.forEach((body) => {
      const dx = body.position.x - mx;
      const dy = body.position.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150) {
        const force = 0.003 * (150 - dist) / 150;
        Body.applyForce(body, body.position, {
          x: (dx / dist) * force,
          y: (dy / dist) * force,
        });
      }
    });
  });

  /* ---- RESIZE HANDLER ---- */
  window.addEventListener('resize', () => {
    const newW = container.offsetWidth;
    render.canvas.width = newW;
    render.options.width = newW;
    Body.setPosition(ground, { x: newW / 2, y: H + 30 });
    Body.setPosition(wallR, { x: newW + 30, y: H / 2 });
  });

  /* ---- INITIAL BURST + recurring shake ---- */
  function shakePills() {
    pilBodies.forEach(body => {
      Body.applyForce(body, body.position, {
        x: (Math.random() - 0.5) * 0.018,
        y: (Math.random() - 0.7) * 0.014,
      });
    });
  }
  setTimeout(shakePills, 400);
  setTimeout(shakePills, 2500);
  setInterval(shakePills, 8000); // gentle shake every 8s to keep them alive
})();

/* ============================================================
   PARALLAX HERO CARD (Subtle)
============================================================ */
(function initParallax() {
  const card = document.getElementById('hero-card');
  const img = document.getElementById('coffee-overflow-video');
  if (!card) return;

  document.addEventListener('mousemove', (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;

    card.style.transform = `perspective(1000px) rotateY(${dx * 5}deg) rotateX(${-dy * 4}deg)`;
    if (img) {
      img.style.transform = `scale(1.08) rotate(-4deg) translate(${dx * 8}px, ${dy * 6}px)`;
    }
  });
})();

/* ============================================================
   SMOOTH NAVIGATION
============================================================ */
(function initNav() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* Sticky nav background opacity on scroll */
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY > 40;
    nav.style.boxShadow = scrolled ? '0 2px 40px rgba(11,36,30,0.08)' : 'none';
  });
})();

/* ============================================================
   MENU CARD TILT EFFECT
============================================================ */
(function initCardTilt() {
  document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = -(y - centerY) / 20;
      const rotateY = (x - centerX) / 20;
      card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ============================================================
   NUMBER COUNTER ANIMATION
============================================================ */
(function initCounters() {
  const stats = document.querySelectorAll('.stat-num');
  const targets = [18, 3, 99];
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !animated) {
      animated = true;
      stats.forEach((el, i) => {
        const target = targets[i];
        const sup = el.querySelector('sup');
        const supText = sup ? sup.textContent : '';
        if (sup) sup.remove();
        let current = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = Math.round(current);
          if (sup) el.appendChild(sup);
          if (current >= target) clearInterval(timer);
        }, 40);
      });
    }
  }, { threshold: 0.5 });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
})();

/* ============================================================
   CATEGORIES SECTION ANIMATIONS (Page 3)
============================================================ */
const initCategoriesAnimation = () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  const section = document.querySelector('.categories-section');
  const cards = document.querySelectorAll('.floating-photo-card');
  const centerPoster = document.querySelector('.center-main-poster');
  if (!section) return;

  // Parallax for center poster
  if (centerPoster) {
    gsap.fromTo(centerPoster, {
      y: 30
    }, {
      y: -30,
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5, // Faster scrub for smoother center poster
      }
    });
  }

  // Parallax floating effect for design photos (REDUCED range for better perf)
  cards.forEach((card, i) => {
    gsap.fromTo(card, {
      y: 60,
      rotate: (i % 2 === 0 ? -5 : 5)
    }, {
      y: -60,
      rotate: (i % 2 === 0 ? 5 : -5),
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 0.5,
      }
    });
  });

  // Scale animation for the physics canvas
  gsap.from("#physics-canvas", {
    scale: 0.95,
    opacity: 0,
    duration: 1.2,
    ease: "power2.out",
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
    }
  });
};

/* ============================================================
   CINEMATIC SCROLLYTELLING (GSAP)
============================================================ */
const initScrollytelling = () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const track = document.getElementById('horizontal-track');
    const trigger = document.getElementById('scrolly-experience');
    
    if (!track || !trigger) return;

    // Use a unified timeline for better performance and syncing
    let scrollAmount = () => track.scrollWidth - window.innerWidth;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: trigger,
            start: "top top",
            end: () => `+=${scrollAmount()}`, 
            pin: true,
            scrub: 1, 
            invalidateOnRefresh: true,
            anticipatePin: 1,
            fastScrollEnd: true, // Optimizes for fast scrolling
            preventOverlaps: true // Prevents animation overlaps
        }
    });

    // Main Track Horizontal Movement (with force3D for GPU acceleration)
    tl.to(track, {
        x: () => -scrollAmount(),
        ease: "none",
        force3D: true
    }, 0);

    // Parallax background words (moves slightly right to feel slower)
    tl.to("#parallax-bg-words", {
        x: () => scrollAmount() * 0.15,
        ease: "none",
        force3D: true
    }, 0);

    // Parallax mid-ground manifesto (moves slightly left to feel faster)
    tl.to("#parallax-mid-text", {
      x: () => -(scrollAmount() * 0.1),
      ease: "none",
      force3D: true
    }, 0);

    // Parallax foreground cards (moves left heavily to feel much faster)
    tl.to("#parallax-fg-cards", {
        x: () => -(scrollAmount() * 0.3),
        ease: "none",
        force3D: true
    }, 0);

    // Initial refresh
    ScrollTrigger.refresh();
};

/* ============================================================
   CATEGORIES INTERACTIVE BACKGROUND
============================================================ */
const initInteractiveBg = () => {
  const section = document.querySelector('.categories-section');
  const blob = document.querySelector('.interactive-bg-blob');
  if (!section || !blob) return;

  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Quick, smooth follow using transform
    blob.style.transform = `translate(${x}px, ${y}px)`;
  });
};

/* ============================================================
   IMAGE MODAL LOGIC
============================================================ */
const initImageModal = () => {
  const modal = document.getElementById('imageModal');
  const closeBtn = document.getElementById('modalClose');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalImg = document.getElementById('modalImg');

  if (!modal) return;

  const modalContent = modal.querySelector('.image-modal-content');

  document.querySelectorAll('.floating-photo-card, .center-main-poster, .iced-drink-item').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.getAttribute('data-title') || 'Experience Coffee';
      const desc = card.getAttribute('data-desc') || 'Explore our world of hand-crafted flavor profiles and heritage origins.';
      const isReverse = card.getAttribute('data-reverse') === 'true';
      
      if (img) modalImg.src = img.src;
      modalTitle.textContent = title;
      modalDesc.textContent = desc;

      if (isReverse) {
        modalContent.classList.add('modal-reverse');
      } else {
        modalContent.classList.remove('modal-reverse');
      }

      modal.classList.add('active');
    });
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
};

document.addEventListener('DOMContentLoaded', () => {
   initSmoothScroll();
   initScrollytelling();
   initCategoriesAnimation();
   initInteractiveBg();
   initImageModal();
});

window.addEventListener('load', () => {
   // Secondary refresh to ensure all images are loaded for ScrollTrigger
   ScrollTrigger.refresh();
});
window.addEventListener('resize', () => ScrollTrigger.refresh());
