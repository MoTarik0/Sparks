/**
 * ============================================
 * CINEMATIC PUZZLE EXPERIENCE - SCENE 1
 * Interactive Puzzle Logic & Animations
 * ============================================
 */

/* ---- CONFIGURATION ---- */
// EDIT HERE: Change the password characters
const PASSWORD = ['J', 'u', 'l', 'y', '1', '1'];

// EDIT HERE: Adjust number of scattered characters
const TOTAL_CHARS = 40; // Total characters on screen

// EDIT HERE: Adjust animation intensity/speed
const CHAR_FLOAT_DURATION_MIN = 12; // seconds
const CHAR_FLOAT_DURATION_MAX = 22;

/* ---- STATE ---- */
let collectedCount = 0;
let isTransitioning = false;
const slots = document.querySelectorAll('.slot');
const charsContainer = document.getElementById('scattered-chars');
const particleContainer = document.getElementById('particle-container');
const transitionOverlay = document.getElementById('transition-overlay');

/* ============================================
   PARTICLE SYSTEM (Embers / Floating Dust)
   ============================================ */
function initParticles() {
  const canvas = document.getElementById('embers-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // EDIT HERE: Adjust particle count
  const PARTICLE_COUNT = 60;

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 100;
      this.size = Math.random() * 3.5 + 1.2; // Slightly bigger
      this.speedY = Math.random() * 0.5 + 0.1;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.7 + 0.3; // Much more visible
      this.fadeSpeed = Math.random() * 0.002 + 0.001;
      // EDIT HERE: Adjust particle colors
      // Mix of blue and golden/white sparks to ensure they show on any bg
      this.hue = Math.random() > 0.5 ? (Math.random() * 40 + 200) : (Math.random() * 30 + 40); 
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.opacity -= this.fadeSpeed;

      if (this.opacity <= 0 || this.y < -10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 80%, 75%, ${this.opacity})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = `hsla(${this.hue}, 80%, 75%, ${this.opacity * 0.5})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = new Particle();
    // Start particles at random heights for immediate visibility
    p.y = Math.random() * canvas.height;
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    animationId = requestAnimationFrame(animate);
  }
  animate();

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate();
    }
  });
}

/* ============================================
   SCATTER CHARACTERS (Puzzle Setup)
   ============================================ */
function initPuzzle() {
  const decoyChars = 'ABCDEFGHIKMNOPQRSTVWXYZabcdefghijklmnopqrstuvwxyz023456789!@#$%&*?';
  const allChars = [];

  // Create password characters with target slot info
  PASSWORD.forEach((char, index) => {
    allChars.push({
      char: char,
      isCorrect: true,
      slotIndex: index
    });
  });

  // Create decoy characters
  const decoyCount = TOTAL_CHARS - PASSWORD.length;
  for (let i = 0; i < decoyCount; i++) {
    allChars.push({
      char: decoyChars[Math.floor(Math.random() * decoyChars.length)],
      isCorrect: false,
      slotIndex: -1
    });
  }

  // Shuffle
  for (let i = allChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
  }

  // Position and render each character
  const padding = 80; // Keep away from edges
  const usedPositions = [];

  allChars.forEach((item, i) => {
    const el = document.createElement('span');
    el.className = `scatter-char${item.isCorrect ? ' correct' : ''}`;
    el.textContent = item.char;
    el.dataset.correct = item.isCorrect;
    el.dataset.slotIndex = item.slotIndex;
    el.dataset.char = item.char;

    // Find non-overlapping position
    let pos = findPosition(usedPositions, padding);
    usedPositions.push(pos);

    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';

    // Random float animation duration
    const duration = Math.random() * (CHAR_FLOAT_DURATION_MAX - CHAR_FLOAT_DURATION_MIN) + CHAR_FLOAT_DURATION_MIN;
    el.style.animationDuration = duration + 's';
    el.style.animationDelay = (Math.random() * -duration) + 's';

    // Entrance animation
    el.style.opacity = '0';
    el.style.transform = 'scale(0)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
      // Remove transition after entrance to not interfere with float animation
      setTimeout(() => {
        el.style.transition = 'color 0.3s, text-shadow 0.3s';
      }, 650);
    }, 300 + i * 50); // Staggered entrance

    // Click handler
    el.addEventListener('click', (e) => handleCharClick(e, el, item));

    if (charsContainer) {
      charsContainer.appendChild(el);
    }
  });
}

function findPosition(used, padding) {
  const maxAttempts = 100;
  let attempts = 0;
  const minDist = 50; // Minimum distance between characters

  // Avoid UI panel area (top center)
  const uiArea = {
    xMin: window.innerWidth * 0.2,
    xMax: window.innerWidth * 0.8,
    yMin: 0,
    yMax: 160
  };

  while (attempts < maxAttempts) {
    const x = padding + Math.random() * (window.innerWidth - padding * 2);
    const y = padding + Math.random() * (window.innerHeight - padding * 2);

    // Check if in UI panel area
    if (x > uiArea.xMin && x < uiArea.xMax && y > uiArea.yMin && y < uiArea.yMax) {
      attempts++;
      continue;
    }

    // Check distance from other characters
    let tooClose = false;
    for (const pos of used) {
      const dist = Math.hypot(pos.x - x, pos.y - y);
      if (dist < minDist) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      return { x, y };
    }
    attempts++;
  }

  // Fallback: random position
  return {
    x: padding + Math.random() * (window.innerWidth - padding * 2),
    y: padding + Math.random() * (window.innerHeight - padding * 2)
  };
}

/* ============================================
   CLICK HANDLERS
   ============================================ */
function handleCharClick(event, el, item) {
  if (isTransitioning) return;

  // Prevent double clicks
  if (el.classList.contains('collecting') || el.classList.contains('wrong-click')) return;

  if (item.isCorrect) {
    handleCorrectClick(el, item);
  } else {
    handleWrongClick(el);
  }
}

function handleCorrectClick(el, item) {
  el.classList.add('collecting');

  // Get target slot position
  const targetSlot = slots[item.slotIndex];
  const slotRect = targetSlot.getBoundingClientRect();
  const charRect = el.getBoundingClientRect();

  // Create burst particles at character position
  createBurst(charRect.left + charRect.width / 2, charRect.top + charRect.height / 2);

  // Calculate distance to slot for animation duration
  const dx = slotRect.left + slotRect.width / 2 - (charRect.left + charRect.width / 2);
  const dy = slotRect.top + slotRect.height / 2 - (charRect.top + charRect.height / 2);
  const distance = Math.hypot(dx, dy);
  const duration = Math.min(800, Math.max(400, distance * 0.8));

  // Animate character to slot using FLIP-like approach
  el.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease`;
  el.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
  el.style.opacity = '0';

  setTimeout(() => {
    // Fill the slot
    targetSlot.classList.add('filled');
    targetSlot.innerHTML = `<span class="slot-character">${item.char}</span>`;

    // Remove the original element
    el.remove();

    // Increment collected count
    collectedCount++;

    // Pulse glow effect on UI panel
    const uiPanel = document.getElementById('ui-panel');
    if (uiPanel) {
      uiPanel.style.opacity = '1'; // Prevent it from reverting to opacity 0
      uiPanel.style.animation = 'none';
      uiPanel.offsetHeight; // Trigger reflow
      uiPanel.style.animation = 'successFlash 0.6s ease';
    }

    // Check win condition
    if (collectedCount >= PASSWORD.length) {
      setTimeout(triggerWinSequence, 400);
    }
  }, duration);
}

function handleWrongClick(el) {
  el.classList.add('wrong-click');

  // Small red flicker particle
  const rect = el.getBoundingClientRect();
  createErrorSpark(rect.left + rect.width / 2, rect.top + rect.height / 2);

  // Remove after animation completes
  setTimeout(() => {
    el.remove();
  }, 650);
}

/* ============================================
   PARTICLE EFFECTS
   ============================================ */
function createBurst(x, y) {
  // EDIT HERE: Adjust burst particle count
  const particleCount = 12;
  const colors = ['#6B8CFF', '#96B4FF', '#B4C8FF', '#FFFFFF'];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'burst-particle';

    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const speed = 40 + Math.random() * 80;
    const tx = Math.cos(angle) * speed;
    const ty = Math.sin(angle) * speed;
    const size = 2 + Math.random() * 4;

    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.boxShadow = `0 0 ${size * 2}px ${size / 2}px ${particle.style.background}`;

    particleContainer.appendChild(particle);

    // Animate
    requestAnimationFrame(() => {
      particle.style.transition = 'all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
      particle.style.opacity = '0';
    });

    setTimeout(() => particle.remove(), 700);
  }
}

function createErrorSpark(x, y) {
  const spark = document.createElement('div');
  spark.style.position = 'absolute';
  spark.style.left = x + 'px';
  spark.style.top = y + 'px';
  spark.style.width = '6px';
  spark.style.height = '6px';
  spark.style.borderRadius = '50%';
  spark.style.background = '#FF4D4D';
  spark.style.boxShadow = '0 0 15px 5px rgba(255, 77, 77, 0.6)';
  spark.style.pointerEvents = 'none';
  spark.style.zIndex = '150';

  particleContainer.appendChild(spark);

  spark.style.transition = 'all 0.5s ease';
  requestAnimationFrame(() => {
    spark.style.transform = `translate(${(Math.random() - 0.5) * 30}px, 20px) scale(0)`;
    spark.style.opacity = '0';
  });

  setTimeout(() => spark.remove(), 500);
}

/* ============================================
   WIN SEQUENCE
   ============================================ */
function triggerWinSequence() {
  if (isTransitioning) return;
  isTransitioning = true;

  // 1. Explode remaining wrong characters outward
  const wrongChars = document.querySelectorAll('.scatter-char:not(.collecting):not(.wrong-click)');
  wrongChars.forEach((el, i) => {
    const rect = el.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = rect.left - centerX;
    const dy = rect.top - centerY;
    const angle = Math.atan2(dy, dx);
    const distance = 300 + Math.random() * 400;

    el.style.transition = `all 0.8s cubic-bezier(0.87, 0, 0.13, 1) ${i * 30}ms`;
    el.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0) rotate(${Math.random() * 360}deg)`;
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });

  // 2. Success flash on UI panel
  const uiPanel = document.getElementById('ui-panel');
  if (uiPanel) {
    uiPanel.style.opacity = '1';
    uiPanel.style.transition = 'all 1s ease';
    uiPanel.style.boxShadow = '0 0 80px 30px rgba(107, 140, 255, 0.5)';
  }

  // 3. Create celebration burst
  setTimeout(() => {
    createBurst(window.innerWidth / 2, window.innerHeight / 2);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createBurst(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight
        );
      }, i * 150);
    }
  }, 600);

  // 4. Fade to black and transition
  setTimeout(() => {
    transitionOverlay.classList.add('active');
  }, 1500);

  // 5. Navigate to second page
  setTimeout(() => {
    window.location.href = './second.html';
  }, 3200);
}

/* ============================================
   CUSTOM CURSOR
   ============================================ */
function initCursor() {
  // Skip on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.id = 'custom-cursor';
  cursor.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    transition: transform 0.15s ease, width 0.2s ease, height 0.2s ease, border-color 0.2s ease;
    mix-blend-mode: difference;
    transform: translate(-50%, -50%);
  `;
  document.body.appendChild(cursor);

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';
    requestAnimationFrame(updateCursor);
  }
  updateCursor();

  // Hover effects on characters
  document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('scatter-char')) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
      cursor.style.borderColor = e.target.classList.contains('correct') ? 'rgba(107, 140, 255, 0.9)' : 'rgba(255, 77, 77, 0.7)';
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.classList.contains('scatter-char')) {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      cursor.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    }
  });

  // Hide default cursor
  document.body.style.cursor = 'none';
}

/* ============================================
   KEYBOARD TYPING SUPPORT
   ============================================ */
function initKeyboardTyping() {
  document.addEventListener('keydown', (e) => {
    if (isTransitioning) return;
    
    // Ignore modifier keys and long keys like 'Enter', 'Shift'
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length > 1) return;

    const typedChar = e.key;
    
    // Find matching uncollected correct char (case-insensitive for convenience)
    const uncollectedChars = Array.from(document.querySelectorAll('.scatter-char[data-correct="true"]:not(.collecting)'));
    const match = uncollectedChars.find(el => el.dataset.char.toLowerCase() === typedChar.toLowerCase());

    if (match) {
      // Simulate click on the matching floating character
      match.click();
    } else if (typedChar !== ' ') {
      // Trigger error effect on the UI panel
      const uiPanel = document.getElementById('ui-panel');
      if (uiPanel) {
        uiPanel.style.opacity = '1'; // Prevent disappearance
        uiPanel.classList.remove('error-shake');
        void uiPanel.offsetWidth; // trigger reflow
        uiPanel.classList.add('error-shake');
      }
    }
  });
}

/* ============================================
   INITIALIZATION
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Always initialize spark particles (it checks for the canvas internally)
  initParticles();

  if (document.getElementById('puzzle-scene')) {
    initPuzzle();
    initCursor();
    initKeyboardTyping();
  }

  // --- PAGE 2: SECOND.HTML LOGIC ---
  const messageEl = document.getElementById('message-text');
  const audio = document.getElementById('bg-audio');
  const particlesContainer = document.getElementById('particles');

  if (messageEl) {
      const MESSAGE_TEXT = "Well done, my little one. You did beautifully, and very soon you’ll reap the fruits of every ounce of effort you poured into this. This is merely a small gift — far too little for someone as precious as you. I love you.";

      // Trigger cinematic bars
      setTimeout(() => {
          document.body.classList.add('loaded');
      }, 500);

      // Play Audio
      if (audio) {
          audio.volume = 0;
          audio.play().then(() => {
              let vol = 0;
              const fadeAudio = setInterval(() => {
                  if (vol < 0.4) {
                      vol += 0.02;
                      audio.volume = vol;
                  } else {
                      clearInterval(fadeAudio);
                  }
              }, 100);
          }).catch(e => console.log("Audio autoplay prevented by browser interaction policy"));
      }

      // Generate Smooth Dust Particles
      if (particlesContainer) {
          for (let i = 0; i < 40; i++) { // Increased count
              const p = document.createElement('div');
              p.classList.add('dust');
              const size = Math.random() * 8 + 3; // Bigger dust
              p.style.width = `${size}px`;
              p.style.height = `${size}px`;
              p.style.left = `${Math.random() * 100}vw`;
              p.style.animationDelay = `${Math.random() * 10}s`;
              p.style.animationDuration = `${8 + Math.random() * 12}s`; // Slightly faster
              particlesContainer.appendChild(p);
          }
      }

      // Smooth Fade-in Text Effect
      messageEl.style.opacity = 1;
      messageEl.innerHTML = '';

      // Wrap each character (or word) in a span for smooth fade in
      const words = MESSAGE_TEXT.split(' ');
      words.forEach((word, index) => {
          const span = document.createElement('span');
          span.innerText = word;
          span.className = 'smooth-char';
          // Stagger the fade-in delay for a smooth emotional effect
          span.style.transitionDelay = `${(index * 300) + 1000}ms`;
          messageEl.appendChild(span);
          messageEl.appendChild(document.createTextNode(' '));
      });

      // Trigger the visibility shortly after creating
      setTimeout(() => {
          const chars = document.querySelectorAll('.smooth-char');
          chars.forEach(c => c.classList.add('visible'));
      }, 100);
  }
});
