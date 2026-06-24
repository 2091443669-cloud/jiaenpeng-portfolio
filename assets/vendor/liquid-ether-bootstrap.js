(function () {
  let activeScale = 0;
  let resizeTimer = null;

  function getEffectScale() {
    const widthScale = window.innerWidth / 1440;
    const heightScale = window.innerHeight / 900;
    return Math.min(1.45, Math.max(1, Math.min(widthScale, heightScale)));
  }

  function getOptions(scale) {
    return {
      colors: ['#5227FF', '#FF9FFC', '#B497CF'],
      mouseForce: 13 * scale,
      cursorSize: 140 * scale,
      isViscous: true,
      viscous: 30,
      iterationsViscous: 16,
      iterationsPoisson: 20,
      resolution: 0.35,
      isBounce: false,
      autoDemo: true,
      // Keep the idle animation alive when the cursor is resting over the hero.
      // Actual pointer movement still takes over through Mouse.onInteract.
      autoPlayWhileHovered: true,
      autoSpeed: 0.22 * Math.sqrt(scale),
      autoIntensity: 1.25 * scale,
      takeoverDuration: 0.25,
      autoResumeDelay: 3000,
      autoRampDuration: 0.6
    };
  }

  function start(force) {
    const mount = document.querySelector('#liquidEtherMount');
    if (!mount || !window.createLiquidEther) return;
    const scale = getEffectScale();
    if (!force && Math.abs(scale - activeScale) < 0.04) return;
    if (window.__liquidEtherDestroy) window.__liquidEtherDestroy();
    mount.replaceChildren();
    window.__liquidEtherDestroy = window.createLiquidEther(mount, getOptions(scale));
    activeScale = scale;
  }

  function handleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => start(false), 180);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start(true), { once: true });
  } else {
    start(true);
  }

  window.addEventListener('resize', handleResize, { passive: true });
})();
