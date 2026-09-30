/* ============================================
   Dream of Void — Dynamic Categorized Gallery
   با تب Contact و بازی سنگ کاغذ قیچی
   ============================================ */

const galleryEl = document.getElementById('gallery');
const tabsEl = document.getElementById('tabs');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close');
const curtains = document.querySelectorAll('.curtain');

/* Contact elements */
const contactSection = document.getElementById('contact');
const contactBg = document.getElementById('contact-bg');
const gameEl = document.getElementById('game');
const gameChoicesEl = document.getElementById('game-choices');
const gameResultEl = document.getElementById('game-result');
const gameScoreEl = document.getElementById('game-score');
const contactInfoEl = document.getElementById('contact-info');

const BASE_PATH = "images/";

/* isMobile بالای فایل — قبل از هر استفاده‌ای */
const isMobile = window.matchMedia('(max-width: 900px)').matches;

const FALLBACK_DATA = {
  bw:      ["1.webp", "2.webp", "3.webp"],
  colored: ["1.webp", "2.webp", "3.webp"],
  digital: ["1.webp", "2.webp", "3.webp"]
};

const CATEGORY_LABELS = {
  bw: "B&W",
  colored: "Colored",
  digital: "Digital",
  contact: "Contact Me"
};

let isClosing = false;
let isRendering = false;
let galleryData = { bw: [], colored: [], digital: [] };

/* Game state */
let wins = 0;
const WINS_NEEDED = 3;
let gameOver = false;

/* ============================================
   Load images.json
   ============================================ */
async function loadGalleryData() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(function() { controller.abort(); }, 1500);

    const res = await fetch('images.json', {
      cache: 'no-cache',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('images.json not found');
    const data = await res.json();

    galleryData = {
      bw:      Array.isArray(data.bw)      ? data.bw      : [],
      colored: Array.isArray(data.colored) ? data.colored : [],
      digital: Array.isArray(data.digital) ? data.digital : []
    };

    console.log('Loaded from images.json:', {
      bw: galleryData.bw.length,
      colored: galleryData.colored.length,
      digital: galleryData.digital.length
    });

    return galleryData;
  } catch (err) {
    console.warn('images.json failed (' + err.message + '). Using fallback list.');
    galleryData = {
      bw:      FALLBACK_DATA.bw.slice(),
      colored: FALLBACK_DATA.colored.slice(),
      digital: FALLBACK_DATA.digital.slice()
    };
    return galleryData;
  }
}

/* ============================================
   Build image path
   ============================================ */
function resolvePath(category, name) {
  if (name.startsWith('http://') || name.startsWith('https://')) return name;
  if (name.includes('/')) return name;
  return BASE_PATH + category + "/" + name;
}

/* ============================================
   Create card
   ============================================ */
function createCard(src, category, index) {
  const figure = document.createElement('figure');
  figure.className = 'card';
  figure.dataset.cat = category;
  figure.style.animationDelay = (0.05 + index * 0.08) + "s";

  const img = document.createElement('img');
  img.src = src;
  img.alt = (CATEGORY_LABELS[category] || category) + " " + (index + 1);
  img.loading = 'lazy';

  img.addEventListener('error', function() {
    console.warn("Image failed: " + src);
    figure.style.display = 'none';
  });

  figure.appendChild(img);
  return figure;
}

/* ============================================
   Render gallery
   ============================================ */
function renderGallery(cat) {
  if (isRendering) return;
  isRendering = true;

  galleryEl.innerHTML = '';
  const list = galleryData[cat] || [];

  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'empty';
    galleryEl.appendChild(empty);
    isRendering = false;
    return;
  }

  list.forEach(function(name, i) {
    const src = resolvePath(cat, name);
    galleryEl.appendChild(createCard(src, cat, i));
  });

  attachCardListeners();
  isRendering = false;
}

/* ============================================
   Card click = open lightbox
   ============================================ */
function attachCardListeners() {
  document.querySelectorAll('.card').forEach(function(card) {
    card.addEventListener('click', function() {
      const img = card.querySelector('img');
      if (!img) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.classList.remove('closing');
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      isClosing = false;
    });
  });
}

/* ============================================
   Theme switching
   ============================================ */
function applyTheme(cat) {
  document.body.classList.remove('theme-bw', 'theme-colored', 'theme-digital', 'theme-contact');
  if (cat === 'contact') {
    document.body.classList.add('theme-contact');
  } else {
    document.body.classList.add('theme-' + cat);
  }
  console.log('Theme applied:', cat);
}

/* ============================================
   Show / Hide sections
   ============================================ */
function showGallery(cat) {
  contactSection.classList.remove('active');
  galleryEl.style.display = '';
  renderGallery(cat);
}

function showContact() {
  galleryEl.innerHTML = '';
  galleryEl.style.display = 'none';
  contactSection.classList.add('active');
  buildFloatingBackground();
  resetGame();
}

/* ============================================
   Floating background images (Contact)
   ============================================ */
function buildFloatingBackground() {
  contactBg.innerHTML = '';

  const allImages = [];
  ['bw', 'colored', 'digital'].forEach(function(cat) {
    (galleryData[cat] || []).forEach(function(name) {
      allImages.push(resolvePath(cat, name));
    });
  });

  if (allImages.length === 0) {
    ['bw', 'colored', 'digital'].forEach(function(cat) {
      (FALLBACK_DATA[cat] || []).forEach(function(name) {
        allImages.push(resolvePath(cat, name));
      });
    });
  }

  const shuffled = allImages.sort(function() { return 0.5 - Math.random(); });
  const picked = shuffled.slice(0, 6);

  picked.forEach(function(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.addEventListener('error', function() { img.remove(); });
    contactBg.appendChild(img);
  });
}

/* ============================================
   Rock Paper Scissors Game
   ============================================ */
const CHOICES = ['rock', 'paper', 'scissors'];
const BEATS = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper'
};

function resetGame() {
  wins = 0;
  gameOver = false;
  gameEl.classList.remove('hidden');
  contactInfoEl.classList.remove('visible');
  gameResultEl.innerHTML = '';
  gameScoreEl.textContent = 'Wins: 0 / ' + WINS_NEEDED;

  document.querySelectorAll('.choice').forEach(function(btn) {
    btn.disabled = false;
  });
}

function computerChoice() {
  return CHOICES[Math.floor(Math.random() * 3)];
}

function playRound(player) {
  if (gameOver) return;

  const computer = computerChoice();
  let outcome;

  if (player === computer) {
    outcome = 'tie';
  } else if (BEATS[player] === computer) {
    outcome = 'win';
    wins++;
  } else {
    outcome = 'lose';
  }

  const playerLabel = player.toUpperCase();
  const compLabel = computer.toUpperCase();

  let outcomeText = '';
  let outcomeClass = '';

  if (outcome === 'win') {
    outcomeText = '— you win —';
    outcomeClass = 'win';
  } else if (outcome === 'lose') {
    outcomeText = '— you lose —';
    outcomeClass = 'lose';
  } else {
    outcomeText = '— tie —';
    outcomeClass = 'tie';
  }

  gameResultEl.innerHTML =
    '<div class="line">You: ' + playerLabel + ' &nbsp; Computer: ' + compLabel + '</div>' +
    '<div class="line ' + outcomeClass + '">' + outcomeText + '</div>';

  gameScoreEl.textContent = 'Wins: ' + wins + ' / ' + WINS_NEEDED;

  if (wins >= WINS_NEEDED) {
    setTimeout(function() {
      gameOver = true;
      gameResultEl.innerHTML += '<div class="line win">ACCESS GRANTED</div>';

      document.querySelectorAll('.choice').forEach(function(btn) {
        btn.disabled = true;
      });

      setTimeout(function() {
        gameEl.classList.add('hidden');
        contactInfoEl.classList.add('visible');
      }, 1800);
    }, 900);
  }
}

gameChoicesEl.addEventListener('click', function(e) {
  const btn = e.target.closest('.choice');
  if (!btn) return;
  playRound(btn.dataset.choice);
});

/* ============================================
   Tabs
   ============================================ */
tabsEl.addEventListener('click', function(e) {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  if (tab.classList.contains('active')) return;

  document.querySelectorAll('.tab').forEach(function(t) {
    t.classList.remove('active');
  });
  tab.classList.add('active');

  const cat = tab.dataset.cat;
  applyTheme(cat);

  if (cat === 'contact') {
    showContact();
  } else {
    showGallery(cat);
  }
});

/* ============================================
   Close lightbox
   ============================================ */
function closeLightbox() {
  if (isClosing || !lightbox.classList.contains('open')) return;
  isClosing = true;
  lightbox.classList.add('closing');

  setTimeout(function() {
    lightbox.classList.remove('open');
    lightbox.classList.remove('closing');
    document.body.style.overflow = '';
    isClosing = false;
  }, 800);
}

closeBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  closeLightbox();
});

curtains.forEach(function(curtain) {
  curtain.addEventListener('click', function(e) {
    e.stopPropagation();
    closeLightbox();
  });
});

lightbox.addEventListener('click', function(e) {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLightbox();
});

const frame = document.querySelector('.lightbox-frame');
if (frame) {
  frame.addEventListener('click', function(e) {
    e.stopPropagation();
  });
}

/* ============================================
   Parallax — فقط روی دسکتاپ
   ============================================ */
let mouseX = 0, mouseY = 0;
let currentX = 0, currentY = 0;

if (!isMobile) {
  document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });
}

function animateParallax() {
  currentX += (mouseX - currentX) * 0.04;
  currentY += (mouseY - currentY) * 0.04;

  document.querySelectorAll('.floating-eye').forEach(function(eye, i) {
    const depth = (i + 1) * 8;
    eye.style.marginLeft = (currentX * depth) + "px";
    eye.style.marginTop  = (currentY * depth) + "px";
  });

  const fog = document.querySelector('.fog');
  if (fog) {
    fog.style.transform = "translate(" + (currentX * 20) + "px, " + (currentY * 20) + "px)";
  }

  requestAnimationFrame(animateParallax);
}
animateParallax();

/* ============================================
   Random shiver — فقط روی دسکتاپ
   ============================================ */
if (!isMobile) {
  setInterval(function() {
    const cards = document.querySelectorAll('.card');
    if (cards.length === 0) return;
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    if (!randomCard || randomCard.classList.contains('shiver')) return;
    randomCard.classList.add('shiver');
    setTimeout(function() {
      randomCard.classList.remove('shiver');
    }, 400);
  }, 25000);
}

/* ============================================
   Init
   ============================================ */
(async function init() {
  await loadGalleryData();
  applyTheme('bw');
  renderGallery('bw');

  await waitForImages();
  hideLoader();
})();

function waitForImages() {
  return new Promise(function(resolve) {
    const imgs = document.querySelectorAll('.gallery img');
    if (imgs.length === 0) return resolve();

    let loaded = 0;
    const total = imgs.length;

    function check() {
      loaded++;
      if (loaded >= total) resolve();
    }

    imgs.forEach(function(img) {
      if (img.complete) {
        check();
      } else {
        img.addEventListener('load', check, { once: true });
        img.addEventListener('error', check, { once: true });
      }
    });

    setTimeout(resolve, 2500);
  });
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(function() {
      loader.classList.add('hidden');
    }, 300);
  }
}
