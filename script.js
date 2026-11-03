(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const hero = $(".hero");
  requestAnimationFrame(() => hero?.classList.add("is-ready"));

  const revealElements = $$(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });

    revealElements.forEach((element) => revealObserver.observe(element));
  }

  const progress = $("#scrollProgress");
  const memoryFrames = $$(".memory-frame");
  let scrollTicking = false;

  const smoothstep = (start, end, value) => {
    const normalized = Math.min(1, Math.max(0, (value - start) / (end - start)));
    return normalized * normalized * (3 - 2 * normalized);
  };

  const updateMemoryBackdrop = (pageProgress) => {
    if (!memoryFrames.length) return;

    const scenePosition = pageProgress * (memoryFrames.length - 1);
    const currentScene = Math.min(memoryFrames.length - 1, Math.floor(scenePosition));
    const nextScene = Math.min(memoryFrames.length - 1, currentScene + 1);
    const sceneProgress = scenePosition - currentScene;
    const blend = currentScene === nextScene ? 0 : smoothstep(.18, .82, sceneProgress);

    memoryFrames.forEach((frame, index) => {
      let opacity = 0;
      if (index === currentScene) opacity = currentScene === nextScene ? 1 : 1 - blend;
      else if (index === nextScene) opacity = blend;

      frame.style.opacity = opacity.toFixed(4);
      frame.classList.toggle("is-active", opacity > .001);

      if (!reducedMotion && opacity > .001) {
        const distance = index - scenePosition;
        frame.style.setProperty("--memory-shift", `${(distance * 1.4).toFixed(2)}%`);
      }
    });
  };

  const updateProgress = () => {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    if (progress) progress.style.transform = `scaleX(${value})`;
    updateMemoryBackdrop(value);
    scrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });

  const letterDialog = $("#letterDialog");
  const openLetterButtons = $$('[data-open-letter]');
  const closeLetterButton = $('[data-close-letter]');

  const openLetter = () => {
    if (!letterDialog) return;
    if (typeof letterDialog.showModal === "function") letterDialog.showModal();
    else letterDialog.setAttribute("open", "");
    document.body.classList.add("dialog-open");
  };

  const closeLetter = () => {
    if (!letterDialog) return;
    if (typeof letterDialog.close === "function") letterDialog.close();
    else letterDialog.removeAttribute("open");
    document.body.classList.remove("dialog-open");
  };

  openLetterButtons.forEach((button) => button.addEventListener("click", openLetter));
  closeLetterButton?.addEventListener("click", closeLetter);
  letterDialog?.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  letterDialog?.addEventListener("click", (event) => {
    const rect = letterDialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) closeLetter();
  });

  const bridgePanel = $("#bridgePanel");
  const chooseUsButton = $("#chooseUsBtn");
  const bridgeMessage = $("#bridgeMessage");

  const setBridgeState = (joined) => {
    if (!bridgePanel || !chooseUsButton) return;
    bridgePanel.classList.toggle("is-joined", joined);
    chooseUsButton.setAttribute("aria-pressed", String(joined));
    bridgeMessage?.setAttribute("aria-hidden", String(!joined));
    const label = $("span", chooseUsButton);
    if (label) label.textContent = joined ? "Recordemos esto" : "Volvamos a nosotros";
  };

  chooseUsButton?.addEventListener("click", () => {
    setBridgeState(!bridgePanel?.classList.contains("is-joined"));
  });

  const slider = $("#choiceSlider");
  const knob = $("#sliderKnob");
  const fill = $("#sliderFill");
  const label = $("#sliderLabel");
  const result = $("#promiseResult");
  const promiseArea = $("#promiseArea");
  const initialLabel = "Desliza para confirmar que seguimos eligiéndonos";
  let dragging = false;
  let completed = false;
  let knobX = 0;
  let activePointerId = null;

  const sliderMetrics = () => {
    if (!slider || !knob) return { max: 0, knobWidth: 0, left: 0, padLeft: 0 };
    const sliderRect = slider.getBoundingClientRect();
    const knobRect = knob.getBoundingClientRect();
    const styles = getComputedStyle(slider);
    const padLeft = parseFloat(styles.paddingLeft) || 6;
    const padRight = parseFloat(styles.paddingRight) || 6;
    return {
      max: Math.max(0, sliderRect.width - knobRect.width - padLeft - padRight),
      knobWidth: knobRect.width,
      left: sliderRect.left,
      padLeft
    };
  };

  const renderSlider = (x) => {
    if (!knob || !fill || !label) return;
    const { max, knobWidth } = sliderMetrics();
    knobX = Math.max(0, Math.min(x, max));
    const percentage = max > 0 ? knobX / max : 0;
    knob.style.transform = `translate3d(${knobX}px, 0, 0)`;
    fill.style.width = `${knobX + knobWidth}px`;
    knob.setAttribute("aria-valuenow", String(Math.round(percentage * 100)));
    if (!completed) label.style.opacity = String(Math.max(.18, 1 - percentage * .95));
  };

  const clearSliderTransition = () => {
    if (!knob || !fill) return;
    knob.style.transition = "";
    fill.style.transition = "";
  };

  const resetSlider = (animateBack = false) => {
    if (!knob || !fill || !label || !result || !promiseArea) return;
    dragging = false;
    completed = false;
    activePointerId = null;
    result.classList.remove("is-visible");
    result.setAttribute("aria-hidden", "true");
    label.textContent = initialLabel;
    label.style.opacity = "1";
    label.style.padding = "";
    $$(".spark", promiseArea).forEach((spark) => spark.remove());

    const { knobWidth } = sliderMetrics();
    if (animateBack && !reducedMotion) {
      knob.style.transition = "transform .35s cubic-bezier(.22, 1, .36, 1)";
      fill.style.transition = "width .35s cubic-bezier(.22, 1, .36, 1)";
      requestAnimationFrame(() => {
        knob.style.transform = "translate3d(0, 0, 0)";
        fill.style.width = `${knobWidth}px`;
      });
      window.setTimeout(clearSliderTransition, 380);
    } else {
      clearSliderTransition();
      knob.style.transform = "translate3d(0, 0, 0)";
      fill.style.width = `${knobWidth}px`;
    }

    knobX = 0;
    knob.setAttribute("aria-valuenow", "0");
  };

  const createSparks = () => {
    if (reducedMotion || isMobile || !slider || !promiseArea) return;
    const sliderRect = slider.getBoundingClientRect();
    const areaRect = promiseArea.getBoundingClientRect();

    for (let index = 0; index < 10; index += 1) {
      const spark = document.createElement("span");
      spark.className = "spark";
      spark.style.left = `${sliderRect.left - areaRect.left + sliderRect.width / 2}px`;
      spark.style.top = `${sliderRect.top - areaRect.top + sliderRect.height / 2}px`;
      promiseArea.appendChild(spark);

      const angle = (Math.PI * 2 * index) / 10;
      const distance = 45 + Math.random() * 55;
      const animation = spark.animate({
        transform: ["translate(0, 0) scale(1)", `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(.3)`],
        opacity: [1, 0]
      }, { duration: 580, easing: "ease-out" });
      animation.addEventListener("finish", () => spark.remove(), { once: true });
    }
  };

  const celebrate = () => {
    if (completed || !slider || !label || !result) return;
    completed = true;
    dragging = false;
    const { max } = sliderMetrics();
    renderSlider(max);
    label.textContent = "Nos seguimos eligiendo";
    label.style.opacity = "1";
    label.style.padding = "0 72px";
    result.classList.add("is-visible");
    result.setAttribute("aria-hidden", "false");

    if (!reducedMotion) {
      slider.animate({ transform: ["scale(1)", "scale(1.012)", "scale(1)"] }, { duration: 500, easing: "ease-out" });
    }
    createSparks();
  };

  const pointerPositionToSliderX = (clientX) => {
    const { left, padLeft, knobWidth } = sliderMetrics();
    return clientX - left - padLeft - knobWidth / 2;
  };

  const startDrag = (event) => {
    if (!slider) return;
    if (completed) resetSlider(false);
    dragging = true;
    activePointerId = event.pointerId;
    clearSliderTransition();
    slider.setPointerCapture?.(event.pointerId);
    renderSlider(pointerPositionToSliderX(event.clientX));
    event.preventDefault();
  };

  const moveDrag = (event) => {
    if (!dragging || event.pointerId !== activePointerId) return;
    renderSlider(pointerPositionToSliderX(event.clientX));
  };

  const endDrag = (event) => {
    if (!dragging || (activePointerId !== null && event.pointerId !== activePointerId)) return;
    dragging = false;
    slider?.releasePointerCapture?.(event.pointerId);
    activePointerId = null;
    const { max } = sliderMetrics();
    if (max > 0 && knobX >= max * .78) celebrate();
    else resetSlider(true);
  };

  slider?.addEventListener("pointerdown", startDrag);
  slider?.addEventListener("pointermove", moveDrag);
  slider?.addEventListener("pointerup", endDrag);
  slider?.addEventListener("pointercancel", endDrag);

  knob?.addEventListener("keydown", (event) => {
    const { max } = sliderMetrics();
    const step = max * .08;
    if (["ArrowRight", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      if (completed) resetSlider(false);
      renderSlider(knobX + step);
    } else if (["ArrowLeft", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      if (completed) resetSlider(false);
      renderSlider(knobX - step);
    } else if (event.key === "Home") {
      event.preventDefault();
      resetSlider(true);
    } else if (["End", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (completed) resetSlider(false);
      else celebrate();
    }
  });

  const resetInteractiveState = () => {
    setBridgeState(false);
    resetSlider(false);
    updateProgress();
  };

  window.addEventListener("pageshow", resetInteractiveState);
  window.addEventListener("resize", () => {
    if (completed) renderSlider(sliderMetrics().max);
    else renderSlider(knobX);
  }, { passive: true });

  resetInteractiveState();
})();
