(function () {
  const mobileQuery = "(max-width: 760px), (pointer: coarse)";
  const isMobile = () => window.matchMedia?.(mobileQuery).matches;

  if (!isMobile()) return;

  document.documentElement.classList.add("is-mobile-smooth");

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    const contextType = String(type || "").toLowerCase();
    const parent = this.parentElement;

    if (this.id === "ambientCanvas" && contextType === "2d") return null;

    if (
      parent?.classList?.contains("awards-light-rays") &&
      (contextType === "webgl" || contextType === "experimental-webgl")
    ) {
      parent.classList.add("is-static");
      return null;
    }

    return originalGetContext.call(this, type, ...args);
  };

  function mobileLiquidOptions(options) {
    return {
      ...options,
      mouseForce: Math.min(Number(options?.mouseForce) || 7, 7),
      cursorSize: Math.min(Number(options?.cursorSize) || 92, 92),
      viscous: Math.min(Number(options?.viscous) || 18, 18),
      iterationsViscous: Math.min(Number(options?.iterationsViscous) || 8, 8),
      iterationsPoisson: Math.min(Number(options?.iterationsPoisson) || 10, 10),
      resolution: Math.min(Number(options?.resolution) || 0.22, 0.22),
      autoSpeed: Math.min(Number(options?.autoSpeed) || 0.18, 0.18),
      autoIntensity: Math.min(Number(options?.autoIntensity) || 0.8, 0.8),
      autoResumeDelay: Math.max(Number(options?.autoResumeDelay) || 4200, 4200)
    };
  }

  if (window.LiquidEtherReact?.mount && !window.LiquidEtherReact.__mobileSmoothWrapped) {
    const originalMount = window.LiquidEtherReact.mount.bind(window.LiquidEtherReact);
    window.LiquidEtherReact.mount = function (mount, options) {
      mount?.classList?.add("is-mobile-lite");
      return originalMount(mount, mobileLiquidOptions(options));
    };
    window.LiquidEtherReact.__mobileSmoothWrapped = true;
  }

  if (typeof window.createLiquidEther === "function" && !window.__mobileSmoothLiquidWrapped) {
    const originalCreateLiquidEther = window.createLiquidEther;
    window.createLiquidEther = function (mount, options) {
      mount?.classList?.add("is-mobile-lite");
      return originalCreateLiquidEther(mount, mobileLiquidOptions(options));
    };
    window.__mobileSmoothLiquidWrapped = true;
  }
})();
