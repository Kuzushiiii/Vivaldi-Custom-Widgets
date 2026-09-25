(function () {
  'use strict';

  const container = document.querySelector('.container');
  const gifImg = container ? container.querySelector('img') : null;
  if (!container || !gifImg) return;

  let isTabVisible = !document.hidden;
  let isIntersecting = true;

  function updateSleepState() {
    const shouldSleep = !isTabVisible || !isIntersecting;

    if (shouldSleep) {
      document.body.classList.add('deep-sleep');
    } else {
      document.body.classList.remove('deep-sleep');
    }
  }

  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    updateSleepState();
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isIntersecting = entry.isIntersecting;
        updateSleepState();
      });
    }, {
      threshold: 0.05
    });

    observer.observe(container);
  }

  updateSleepState();
})();