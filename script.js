/* =========================================================
   Phoen1x.kg — сайты для заведений и NFC-таблички
   Интерактив демо, калькулятор «сайт + таблички», заявка
   Номер WhatsApp: WHATSAPP_NUMBER (996XXXXXXXXX)
   ========================================================= */

const WHATSAPP_NUMBER = '996220233693';
const WHATSAPP_NAME = 'Phoen1x.kg';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const waLink = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

const numberFormatter = new Intl.NumberFormat('ru-RU');
const money = (value) => numberFormatter.format(Math.round(value)) + ' сом';
const formatNumber = (value, suffix = '') => numberFormatter.format(Math.round(value)) + suffix;

/* ---------- Мобильное меню ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('mainNav');

function closeNav() {
  nav.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-label', 'Открыть меню');
  document.body.style.overflow = '';
}

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', String(open));
  burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.style.overflow = open ? 'hidden' : '';
});

nav.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeNav();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNav();
});

/* ---------- Демо: касание → меню → сайт ---------- */
const screens = [...document.querySelectorAll('.screen-view')];
const demoTabs = [...document.querySelectorAll('.demo-controls button')];
const phone = document.querySelector('.phone');
let demoInteracted = false;

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle('is-active', screen.dataset.screen === name);
  });
  demoTabs.forEach((tab) => {
    const active = tab.dataset.go === name;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
}

demoTabs.forEach((tab) => {
  tab.setAttribute('aria-pressed', String(tab.classList.contains('is-active')));
  tab.addEventListener('click', () => {
    demoInteracted = true;
    showScreen(tab.dataset.go);
  });
});

const demoOrder = ['tap', 'menu', 'site'];
phone.addEventListener('click', () => {
  demoInteracted = true;
  const current = screens.findIndex((screen) => screen.classList.contains('is-active'));
  showScreen(demoOrder[(current + 1) % demoOrder.length]);
});

if (!reducedMotion) {
  window.setTimeout(() => {
    if (!demoInteracted) showScreen('menu');
  }, 2600);
}

/* ---------- Ссылка в шапке ---------- */
document.getElementById('headerWa').href = waLink(
  'Здравствуйте! Хочу узнать о сайте для заведения и NFC-табличках. Подскажите, с чего начать?'
);

/* ---------- Калькулятор: сайт + NFC-таблички ---------- */
const sitePlan = document.getElementById('sitePlan');
const plateCount = document.getElementById('plateCount');
const plateTypeInputs = [...document.querySelectorAll('input[name="plateType"]')];
const plateOptions = [...document.querySelectorAll('.plate-option')];
const estimate = document.getElementById('estimate');
const estimateAnnounce = document.getElementById('estimateAnnounce');
const breakdown = document.getElementById('breakdown');
const calcCta = document.getElementById('calcCta');
const calcResult = document.querySelector('.calc-result');

let displayedTotal = 0;
let currentTotal = 0;
let changeTimer = null;
let firstCalculation = true;
const numberAnimations = new WeakMap();

/* Общий «одометр»: прокрутка числа от from до target */
function animateNumber(el, target, options = {}) {
  const { from = 0, suffix = '', duration = 650, immediate = false } = options;
  const running = numberAnimations.get(el);
  if (running) cancelAnimationFrame(running);

  if (immediate || reducedMotion) {
    el.textContent = formatNumber(target, suffix);
    el.classList.remove('is-rolling');
    numberAnimations.delete(el);
    return;
  }

  const start = performance.now();
  el.classList.add('is-rolling');

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = formatNumber(from + (target - from) * eased, suffix);
    if (progress < 1) {
      numberAnimations.set(el, requestAnimationFrame(tick));
    } else {
      el.textContent = formatNumber(target, suffix);
      el.classList.remove('is-rolling');
      numberAnimations.delete(el);
    }
  };
  numberAnimations.set(el, requestAnimationFrame(tick));
}

const sitePrices = {
  start: 9990,
  business: 18990,
  premium: 28990
};

const siteNames = {
  start: 'Старт',
  business: 'Бизнес',
  premium: 'Премиум'
};

const platePrices = {
  card: 990,
  plastic: 1490,
  wood: 2490
};

const plateNames = {
  card: 'карточка',
  plastic: 'пластиковая табличка',
  wood: 'деревянная табличка'
};

function selectedMaterial() {
  return plateTypeInputs.find((input) => input.checked)?.value || 'card';
}

function animateEstimate(value) {
  if (changeTimer) clearTimeout(changeTimer);

  estimate.classList.add('is-changing');
  breakdown.classList.remove('is-changing');
  void breakdown.offsetWidth;
  breakdown.classList.add('is-changing');
  calcResult.classList.remove('is-updating');
  void calcResult.offsetWidth;
  calcResult.classList.add('is-updating');
  changeTimer = window.setTimeout(() => estimate.classList.remove('is-changing'), 320);

  animateNumber(estimate, value, {
    from: displayedTotal || value,
    suffix: ' сом',
    duration: 480,
    immediate: firstCalculation || reducedMotion
  });
  displayedTotal = value;
}

function syncPlateOptions() {
  plateOptions.forEach((option) => {
    option.classList.toggle('is-selected', option.querySelector('input').checked);
  });
}

function updateCalculator() {
  const plan = sitePlan.value;
  const material = selectedMaterial();
  const quantity = Math.max(1, Math.min(500, Number(plateCount.value) || 1));

  const site = sitePrices[plan];
  const platePrice = platePrices[material];
  const plates = quantity * platePrice;
  const total = site + plates;
  currentTotal = total;

  animateEstimate(total);
  estimateAnnounce.textContent = `Итого: ${money(total)}`;
  breakdown.textContent =
    `Сайт «${siteNames[plan]}» — ${money(site)} · ${plateNames[material]} ${quantity} × ${money(platePrice)} — ${money(plates)}`;

  const message = [
    'Здравствуйте! Хочу посчитать заказ.',
    `Сайт: «${siteNames[plan]}» — ${money(site)}.`,
    `Таблички: ${plateNames[material]}, ${quantity} шт. × ${money(platePrice)} = ${money(plates)}.`,
    `Итого ориентировочно: ${money(total)}.`
  ].join('\n');

  calcCta.href = waLink(message);
  firstCalculation = false;
}

[sitePlan, plateCount].forEach((input) => {
  input.addEventListener('input', updateCalculator);
  input.addEventListener('change', updateCalculator);
});

plateTypeInputs.forEach((input) => {
  input.addEventListener('change', () => {
    syncPlateOptions();
    updateCalculator();
  });
});

document.querySelectorAll('.step-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const delta = Number(button.dataset.step);
    const next = Math.max(1, Math.min(500, (Number(plateCount.value) || 1) + delta));
    plateCount.value = next;
    plateCount.classList.remove('bump');
    void plateCount.offsetWidth;
    plateCount.classList.add('bump');
    updateCalculator();
  });
});

updateCalculator();

/* ---------- Форма заявки ---------- */
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.getElementById('cName').value.trim();
  const phoneValue = document.getElementById('cPhone').value.trim();
  const message = document.getElementById('cMessage').value.trim();

  let status = contactForm.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    contactForm.appendChild(status);
  }

  if (!name || !phoneValue) {
    status.style.color = '#e8a07a';
    status.textContent = 'Укажите имя и номер телефона — без них не сможем ответить.';
    (name ? document.getElementById('cPhone') : document.getElementById('cName')).focus();
    return;
  }

  status.style.color = '';
  status.textContent = 'Открываем WhatsApp с готовым сообщением…';

  const text = [
    `Здравствуйте, ${WHATSAPP_NAME}!`,
    `Меня зовут ${name}.`,
    `Телефон: ${phoneValue}.`,
    message ? `Задача: ${message}` : ''
  ].filter(Boolean).join('\n');

  window.location.href = waLink(text);
});

/* ---------- Плавный якорь с учётом шапки ---------- */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

/* ---------- Мягкое появление блоков при прокрутке ---------- */
if (!reducedMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.section-head, .problem-item, .feature, .steps li, .tariff, .addon, .case, .faq-list details, .calc-copy, .calc-card, .contact-copy, .contact-form'
  );

  revealTargets.forEach((element) => element.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children].filter((child) => child.classList.contains('reveal'));
      const index = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${Math.min(index, 5) * 70}ms`;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealTargets.forEach((element) => revealObserver.observe(element));
}

/* ---------- Одометры: числа крутятся при входе в экран в обе стороны ---------- */
if (!reducedMotion && 'IntersectionObserver' in window) {
  const rollTargets = [...document.querySelectorAll('.roll-number'), estimate];

  const rollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;

      if (el === estimate) {
        animateNumber(estimate, currentTotal, { from: 0, suffix: ' сом', duration: 700 });
      } else {
        const target = Number(el.dataset.value);
        if (!Number.isFinite(target)) return;
        const from = Number(el.dataset.from ?? 0);
        animateNumber(el, target, { from, duration: 700 });
      }
      // Не отписываемся: при прокрутке вверх число прокрутится снова.
    });
  }, { threshold: 0.4, rootMargin: '0px 0px -30px 0px' });

  rollTargets.forEach((element) => rollObserver.observe(element));
}
