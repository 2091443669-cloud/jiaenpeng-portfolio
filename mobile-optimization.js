(function () {
  const mobileQuery = "(max-width: 760px), (pointer: coarse)";
  const isMobile = () => window.matchMedia?.(mobileQuery).matches;

  if (!isMobile()) return;

  const doc = document.documentElement;
  const body = document.body;
  const modal = document.querySelector("#project-modal");
  const imageViewer = document.querySelector("#image-viewer");
  const modalMedia = document.querySelector(".modal-media");
  const modalImage = document.querySelector("#modal-image");
  const modalPdf = document.querySelector("#modal-pdf");
  const modalGallery = document.querySelector("#modal-gallery");

  let scrollLock = null;
  let quickHoldFrame = 0;
  let quickHeldTransform = "";
  let quickReleaseTimer = 0;

  function lockPage() {
    if (scrollLock) return;
    scrollLock = {
      y: window.scrollY,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width
    };
    doc.classList.add("mobile-scroll-lock");
    body.style.position = "fixed";
    body.style.top = `-${scrollLock.y}px`;
    body.style.width = "100%";
  }

  function unlockPage() {
    if (!scrollLock) return;
    const y = scrollLock.y;
    body.style.position = scrollLock.position === "fixed" ? "" : scrollLock.position;
    body.style.top = scrollLock.position === "fixed" ? "" : scrollLock.top;
    body.style.width = scrollLock.width;
    doc.classList.remove("mobile-scroll-lock");
    scrollLock = null;
    window.scrollTo(0, y);
  }

  function isLayerOpen(layer) {
    return Boolean(layer?.classList.contains("is-open") || layer?.getAttribute("aria-hidden") === "false");
  }

  function quickSphere() {
    return document.querySelector(".quick-dome-sphere");
  }

  function holdQuickBrowse(active) {
    const sphere = quickSphere();
    window.clearTimeout(quickReleaseTimer);

    if (!sphere) return;

    if (active) {
      if (!quickHeldTransform) quickHeldTransform = sphere.style.transform || getComputedStyle(sphere).transform;
      window.cancelAnimationFrame(quickHoldFrame);
      const hold = () => {
        sphere.style.transform = quickHeldTransform;
        quickHoldFrame = window.requestAnimationFrame(hold);
      };
      hold();
      return;
    }

    quickReleaseTimer = window.setTimeout(() => {
      window.cancelAnimationFrame(quickHoldFrame);
      quickHoldFrame = 0;
      quickHeldTransform = "";
    }, 520);
  }

  function syncLocks() {
    const open = isLayerOpen(modal) || isLayerOpen(imageViewer);
    if (open) {
      holdQuickBrowse(true);
    } else {
      holdQuickBrowse(false);
    }
  }

  [modal, imageViewer].forEach((layer) => {
    if (!layer) return;
    new MutationObserver(syncLocks).observe(layer, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden"]
    });
  });

  document.addEventListener("click", () => window.setTimeout(syncLocks, 0), true);
  document.addEventListener("keydown", () => window.setTimeout(syncLocks, 0), true);
  syncLocks();

  function ensureDots() {
    if (!modalMedia) return null;
    let dots = document.querySelector("#modal-image-dots");
    if (!dots) {
      dots = document.createElement("div");
      dots.className = "modal-image-dots";
      dots.id = "modal-image-dots";
      dots.setAttribute("aria-label", "Image navigation");
      dots.hidden = true;
      modalMedia.appendChild(dots);
    }
    return dots;
  }

  function thumbs() {
    return [...(modalGallery?.querySelectorAll(".thumb-btn") || [])];
  }

  function activeIndex() {
    const items = thumbs();
    const index = items.findIndex((item) => item.classList.contains("is-active"));
    if (index >= 0) return index;
    const current = document.querySelector("#modal-original")?.getAttribute("href") || "";
    return Math.max(
      items.findIndex((item) => item.querySelector("img")?.src && current && item.querySelector("img").src.includes(current)),
      0
    );
  }

  function preloadAround(index) {
    const items = thumbs();
    [-2, -1, 0, 1, 2].forEach((offset) => {
      const img = items[(index + offset + items.length) % items.length]?.querySelector("img");
      if (!img?.src) return;
      window.preloadPortfolioImage?.(img.src);
    });
  }

  function goToImage(index) {
    const items = thumbs();
    if (!items.length) return;
    const next = (index + items.length) % items.length;
    const nextImage = items[next]?.querySelector("img")?.src;
    if (nextImage) window.preloadPortfolioImage?.(nextImage);
    items[next]?.click();
    window.requestAnimationFrame(() => {
      updateDots();
      preloadAround(next);
    });
  }

  function updateDots() {
    const dots = ensureDots();
    const items = thumbs();
    const open = isLayerOpen(modal);
    const pdfOpen = Boolean(modalPdf && !modalPdf.hidden);

    if (!dots || !open || pdfOpen || items.length < 2) {
      if (dots) dots.hidden = true;
      return;
    }

    dots.hidden = false;
    if (dots.children.length !== items.length) {
      dots.replaceChildren();
      items.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "modal-image-dot";
        dot.setAttribute("aria-label", `Show image ${index + 1}`);
        dot.addEventListener("click", () => goToImage(index));
        dots.appendChild(dot);
      });
    }

    const selected = activeIndex();
    [...dots.children].forEach((dot, index) => {
      dot.classList.toggle("is-active", index === selected);
    });
    preloadAround(selected);
  }

  if (modalGallery) {
    new MutationObserver(updateDots).observe(modalGallery, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }
  if (modalImage) {
    new MutationObserver(updateDots).observe(modalImage, {
      attributes: true,
      attributeFilter: ["src", "hidden"]
    });
  }
  updateDots();

  let modalSwipe = null;

  function resetModalImage() {
    if (!modalImage) return;
    modalImage.style.transition = "";
    modalImage.style.transform = "";
    modalImage.style.opacity = "";
    modalMedia?.classList.remove("is-swipe-intent");
  }

  modalMedia?.addEventListener(
    "pointerdown",
    (event) => {
      if (!isLayerOpen(modal) || event.pointerType === "mouse" || thumbs().length < 2) return;
      if (modalPdf && !modalPdf.hidden) return;
      if (event.target.closest(".modal-image-dot")) return;
      modalSwipe = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        axis: null
      };
      try {
        modalMedia.setPointerCapture?.(event.pointerId);
      } catch {
        // Synthetic or interrupted touch streams may not be capturable.
      }
      event.stopImmediatePropagation();
    },
    true
  );

  modalMedia?.addEventListener(
    "pointermove",
    (event) => {
      if (!modalSwipe || event.pointerId !== modalSwipe.id) return;
      const dx = event.clientX - modalSwipe.startX;
      const dy = event.clientY - modalSwipe.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!modalSwipe.axis && Math.max(absX, absY) > 5) {
        if (absX > absY * 0.72) {
          modalSwipe.axis = "x";
        } else if (absY > absX * 1.45) {
          modalSwipe.axis = "y";
        }
      }

      if (modalSwipe.axis !== "x") return;

      if (event.cancelable) event.preventDefault();
      event.stopImmediatePropagation();
      modalSwipe.x = event.clientX;
      modalMedia.classList.add("is-swipe-intent");

      if (modalImage) {
        const mediaWidth = Math.max(modalMedia.clientWidth, 1);
        const offset = Math.max(mediaWidth * -0.42, Math.min(mediaWidth * 0.42, dx * 0.92));
        const progress = Math.min(Math.abs(offset) / Math.max(mediaWidth, 1), 0.34);
        modalImage.style.transition = "none";
        modalImage.style.transform = `translate3d(${offset}px, 0, 0) scale(${1 - progress * 0.05})`;
        modalImage.style.opacity = String(1 - progress * 0.45);
      }
    },
    { capture: true, passive: false }
  );

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
    modalMedia?.addEventListener(
      type,
      (event) => {
        if (!modalSwipe || (event.pointerId && event.pointerId !== modalSwipe.id)) return;
        const dx = modalSwipe.x - modalSwipe.startX;
        const axis = modalSwipe.axis;
        modalSwipe = null;

        if (axis === "x" && Math.abs(dx) > Math.min(58, Math.max(34, modalMedia.clientWidth * 0.1))) {
          event.preventDefault();
          event.stopImmediatePropagation();
          goToImage(activeIndex() + (dx < 0 ? 1 : -1));
        }

        window.setTimeout(resetModalImage, 20);
      },
      { capture: true, passive: false }
    );
  });

  const quickBrowse = document.querySelector("#selected-grid");
  let quickTouch = null;

  quickBrowse?.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      quickTouch = { x: touch.clientX, y: touch.clientY, axis: null };
      quickBrowse.classList.remove("is-horizontal-drag");
    },
    { capture: true, passive: true }
  );

  quickBrowse?.addEventListener(
    "touchmove",
    (event) => {
      if (!quickTouch) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - quickTouch.x;
      const dy = touch.clientY - quickTouch.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!quickTouch.axis && Math.max(absX, absY) > 7) {
        quickTouch.axis = absX > absY * 0.82 ? "x" : "y";
      }

      if (quickTouch.axis === "x") {
        quickBrowse.classList.add("is-horizontal-drag");
        if (event.cancelable) event.preventDefault();
      }
    },
    { capture: true, passive: false }
  );

  ["touchend", "touchcancel"].forEach((type) => {
    quickBrowse?.addEventListener(
      type,
      () => {
        quickTouch = null;
        window.setTimeout(() => quickBrowse.classList.remove("is-horizontal-drag"), 80);
      },
      { capture: true, passive: true }
    );
  });

  let certificateTouch = null;
  let suppressCertificateClickUntil = 0;

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!event.target.closest(".timeline-card")) return;
      certificateTouch = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
    },
    true
  );

  document.addEventListener(
    "pointermove",
    (event) => {
      if (!certificateTouch || event.pointerId !== certificateTouch.id) return;
      const dx = Math.abs(event.clientX - certificateTouch.x);
      const dy = Math.abs(event.clientY - certificateTouch.y);
      if (dy > 10 && dy > dx) suppressCertificateClickUntil = performance.now() + 520;
    },
    true
  );

  ["pointerup", "pointercancel", "lostpointercapture"].forEach((type) => {
    document.addEventListener(
      type,
      () => {
        certificateTouch = null;
      },
      true
    );
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!event.target.closest(".timeline-card")) return;
      if (performance.now() > suppressCertificateClickUntil) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
})();
