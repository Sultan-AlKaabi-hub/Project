// Spotlight pointer coordinates adapted from React Bits SpotlightCard, David Haz.
// See docs/REACT-BITS-LICENSE.md. Other effects are original vanilla CSS/JS.
(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let controller;
  function enhance() {
    controller?.abort();
    controller = new AbortController();
    if (reduced.matches) return;
    document.querySelectorAll(".campus-launch,.lab-hero").forEach((card) => {
      card.classList.add("rb-spotlight");
      card.addEventListener(
        "pointermove",
        (event) => {
          if (event.pointerType === "touch") return;
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--mouse-x", `${event.clientX - rect.left}px`);
          card.style.setProperty("--mouse-y", `${event.clientY - rect.top}px`);
        },
        { passive: true, signal: controller.signal },
      );
    });
    document
      .querySelectorAll(".campus-launch,.lab-panel,.campus-panel")
      .forEach((el, i) => {
        el.style.setProperty("--reveal-delay", `${Math.min(i, 5) * 40}ms`);
        el.classList.add("soft-reveal");
      });
  }
  window.RasidMotion = { enhance };
})();
