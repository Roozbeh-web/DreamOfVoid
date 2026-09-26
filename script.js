/* ============================================
   Dream of Void — Dynamic Gallery
   اول از images.json می‌خونه، اگه نشد از لیست پیش‌فرض
   ============================================ */

const galleryEl = document.getElementById('gallery');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.querySelector('.close');
const curtains = document.querySelectorAll('.curtain');

const BASE_PATH = "images/";   // مسیر پوشه‌ی عکس‌ها

/* ---------- لیست پیش‌فرض (اگه fetch کار نکرد) ---------- */
const FALLBACK_LIST = [
  "portrait1.jpg",
  "portrait2.jpg",
  "portrait3.jpg",
  "portrait4.jpg",
  "portrait5.jpg",
  "portrait6.jpg",
  "portrait7.jpg",
  "Easy Life.jpg",
  "Gav.jpg",
  "Gorb.jpg",
  "Gorznam.jpg",
  "Kamal.jpg",
];

let isClosing = false;

/* ---------- خواندن لیست عکس‌ها از images.json ---------- */
async function loadImageList() {
  try {
    const res = await fetch('images.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('images.json not found');
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) throw new Error('empty list');
    console.log('✅ لیست از images.json خونده شد:', list.length, 'عکس');
    return list;
  } catch (err) {
    console.warn('⚠️ images.json لود نشد. از لیست پیش‌فرض استفاده می‌کنم.', err.message);
    return FALLBACK_LIST;
  }
}

/* ---------- ساخت مسیر نهایی ---------- */
function resolvePath(name) {
  if (name.startsWith('http://') || name.startsWith('https://')) return name;
  if (name.includes('/')) return name;
  return BASE_PATH + name;
}

/* ---------- ساخت کارت ---------- */
function createCard(src, index) {
  const figure = document.createElement('figure');
  figure.className = 'card';
  figure.style.animationDelay = `${0.1 + index * 0.12}s`;

  const img = document.createElement('img');
  img.src = src;
  img.alt = `artwork ${index + 1}`;
  img.loading = 'lazy';

  img.addEventListener('error', () => {
    console.warn(`❌ عکس لود نشد: ${src}`);
    figure.remove();
  });

  figure.appendChild(img);
  return figure;
}

/* ---------- پر کردن گالری ---------- */
async function renderGallery() {
  galleryEl.innerHTML = '';
  const list = await loadImageList();

  list.forEach((name, i) => {
    galleryEl.appendChild(createCard(resolvePath(name), i));
  });

  attachCardListeners();
}

/* ---------- وصل کردن کلیک کارت‌ها ---------- */
function attachCardListeners() {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
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

/* ---------- بستن لایت‌باکس ---------- */
function closeLightbox() {
  if (isClosing || !lightbox.classList.contains('open')) return;
  isClosing = true;
  lightbox.classList.add('closing');

  setTimeout(() => {
    lightbox.classList.remove('open');
    lightbox.classList.remove('closing');
    document.body.style.overflow = '';
    isClosing = false;
  }, 800);
}

closeBtn.addEventListener('click', e => {
  e.stopPropagation();
  closeLightbox();
});

curtains.forEach(curtain => {
  curtain.addEventListener('click', e => {
    e.stopPropagation();
    closeLightbox();
  });
});

lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});

const frame = document.querySelector('.lightbox-frame');
if (frame) {
  frame.addEventListener('click', e => e.stopPropagation());
}

/* ---------- پارالاکس ---------- */
let mouseX = 0, mouseY = 0;
let currentX = 0, currentY = 0;

document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function animateParallax() {
  currentX += (mouseX - currentX) * 0.04;
  currentY += (mouseY - currentY) * 0.04;

  document.querySelectorAll('.floating-eye').forEach((eye, i) => {
    const depth = (i + 1) * 8;
    eye.style.marginLeft = `${currentX * depth}px`;
    eye.style.marginTop  = `${currentY * depth}px`;
  });

  const fog = document.querySelector('.fog');
  if (fog) {
    fog.style.transform = `translate(${currentX * 20}px, ${currentY * 20}px)`;
  }

  requestAnimationFrame(animateParallax);
}
animateParallax();

/* ---------- لرزش تصادفی کارت‌ها ---------- */
setInterval(() => {
  const cards = document.querySelectorAll('.card');
  if (cards.length === 0) return;
  const randomCard = cards[Math.floor(Math.random() * cards.length)];
  if (!randomCard || randomCard.classList.contains('shiver')) return;
  randomCard.classList.add('shiver');
  setTimeout(() => randomCard.classList.remove('shiver'), 400);
}, 6000);

/* ---------- راه‌اندازی ---------- */
renderGallery();
