(function () {
  function start() {
    const stage = document.querySelector('.threads-mount');
    if (!stage) return;

    let removeTimer = 0;
    window.addEventListener(
      'pointermove',
      (event) => {
        const rect = stage.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        ) {
          return;
        }

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        stage.style.setProperty('--threads-x', `${x}%`);
        stage.style.setProperty('--threads-y', `${y}%`);
        stage.classList.add('is-thread-pointer-active');
        window.clearTimeout(removeTimer);
        removeTimer = window.setTimeout(() => stage.classList.remove('is-thread-pointer-active'), 520);
      },
      { passive: true }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
