(function () {
  const checkoutLinks = {
    'landing-page-rescue': '',
    'spreadsheet-to-dashboard': '',
    'repository-to-live-demo': ''
  };

  document.querySelectorAll('[data-checkout]').forEach((button) => {
    const offer = button.dataset.checkout;
    const link = checkoutLinks[offer];
    if (link) {
      button.href = link;
      button.removeAttribute('aria-disabled');
      return;
    }
    button.href = '#checkout-pending';
    button.setAttribute('aria-disabled', 'true');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const notice = document.querySelector('[data-checkout-notice]');
      if (notice) notice.textContent = 'Secure checkout is being connected before this offer is opened for purchase.';
    });
  });

  const params = new URLSearchParams(window.location.search);
  const selectedOffer = params.get('offer');
  const offerField = document.querySelector('[name="offer"]');
  if (offerField && selectedOffer) offerField.value = selectedOffer;

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();

  const comparison = document.querySelector('[data-comparison]');
  if (!comparison) return;

  const stage = comparison.querySelector('[data-comparison-stage]');
  const range = comparison.querySelector('[data-comparison-range]');
  const beforeImage = comparison.querySelector('[data-comparison-before]');
  const afterImage = comparison.querySelector('[data-comparison-after-image]');
  const afterLayer = comparison.querySelector('[data-comparison-after]');
  const divider = comparison.querySelector('.comparison-divider');
  const options = Array.from(comparison.querySelectorAll('[data-comparison-option]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let introAnimations = [];
  let introPlayed = false;
  let introGeneration = 0;
  let selectionRequest = 0;

  const setPosition = (value) => {
    const position = Math.min(100, Math.max(0, Number(value)));
    stage.style.setProperty('--comparison-position', `${position}%`);
    range.value = String(position);
    range.setAttribute('aria-valuetext', `${Math.round(position)}% redesign visible`);
  };

  const stopIntro = () => {
    introGeneration += 1;
    introAnimations.forEach((animation) => animation.cancel());
    introAnimations = [];
    setPosition(range.value);
  };

  const decodeImage = (image) => {
    if (image.complete && image.naturalWidth > 0) return Promise.resolve();
    if (typeof image.decode === 'function') return image.decode().catch(() => undefined);
    return new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
  };

  const loadImage = (source) => {
    const image = new Image();
    image.src = source;
    return decodeImage(image);
  };

  const playIntro = () => {
    if (introPlayed || reducedMotion.matches || typeof afterLayer.animate !== 'function') {
      setPosition(50);
      return;
    }

    introPlayed = true;
    const generation = ++introGeneration;
    setPosition(50);
    const timing = { duration: 1350, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'none' };
    introAnimations = [
      afterLayer.animate([
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 28% 0 0)', offset: .68 },
        { clipPath: 'inset(0 50% 0 0)' }
      ], timing),
      divider.animate([
        { left: '0%' },
        { left: '72%', offset: .68 },
        { left: '50%' }
      ], timing)
    ];

    Promise.allSettled(introAnimations.map((animation) => animation.finished)).then(() => {
      if (generation !== introGeneration) return;
      introAnimations = [];
      setPosition(50);
    });
  };

  range.addEventListener('input', () => {
    stopIntro();
    setPosition(range.value);
  });
  range.addEventListener('pointerdown', stopIntro);
  range.addEventListener('keydown', (event) => {
    if (event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    stopIntro();
    setPosition(event.key === 'Home' ? 0 : 100);
  });

  options.forEach((option) => {
    option.addEventListener('click', async () => {
      if (option.getAttribute('aria-pressed') === 'true') return;
      const request = ++selectionRequest;
      stopIntro();
      stage.classList.add('is-loading');
      options.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === option)));

      const name = option.dataset.name;
      await Promise.all([loadImage(option.dataset.before), loadImage(option.dataset.after)]);
      if (request !== selectionRequest) return;

      beforeImage.src = option.dataset.before;
      afterImage.src = option.dataset.after;
      beforeImage.alt = `Original ${name} landing-page demonstration`;
      range.setAttribute('aria-label', `Reveal the redesigned ${name} landing page`);

      await Promise.all([decodeImage(beforeImage), decodeImage(afterImage)]);
      if (request !== selectionRequest) return;
      stage.classList.remove('is-loading');
      setPosition(50);
    });
  });

  Promise.all([decodeImage(beforeImage), decodeImage(afterImage)]).then(playIntro);

  const preloadImages = () => {
    options.slice(1).forEach((option) => {
      [option.dataset.before, option.dataset.after].forEach((source) => {
        const image = new Image();
        image.src = source;
      });
    });
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(preloadImages);
  else window.setTimeout(preloadImages, 500);
})();
