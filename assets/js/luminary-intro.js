(function () {
  const STORAGE_KEY = "luminary:intro:seen";
  const DEFAULT_VERSION = "20261123-vfx-2";
  const READY_DEADLINE_MS = 2500;
  const IGNITION_TO_REVEAL_MS = 1200;
  const EXIT_MS = 600;
  const ACTIVATION_FAILSAFE_MS = 2800;

  class LuminaryIntro extends HTMLElement {
    constructor() {
      super();
      this.renderer = null;
      this.status = null;
      this.abortController = null;
      this.timers = new Set();
      this.pageTargets = [];
      this.replayControl = null;
      this.replayFocusTarget = null;
      this.ready = false;
      this.finishing = false;
      this.finished = false;
      this.running = false;
      this.finishReason = "";
      this.startedAt = 0;
      this.activationAt = null;
      this.activationRequested = null;
      this.boundReplayClick = event => this.onReplayRequest(event);
    }

    connectedCallback() {
      window.clearTimeout(window.__luminaryIntroFallback);
      this.bindReplayControl();

      if (this.shouldBypass()) {
        this.commitHome("bypass");
        return;
      }

      this.startIntro();
    }

    disconnectedCallback() {
      this.cleanupRun();
      this.unbindReplayControl();
      this.setPageInactive(false);
      document.body.classList.remove("ll-intro-open");
      document.documentElement.classList.remove("ll-intro-pending");
      document.documentElement.classList.add("ll-intro-bypass");
    }

    startIntro({ restoreFocusTo = null } = {}) {
      if (this.running) return false;

      this.cleanupRun();
      this.replaceChildren();
      this.replayFocusTarget = restoreFocusTo?.isConnected ? restoreFocusTo : null;
      this.ready = false;
      this.finishing = false;
      this.finished = false;
      this.running = true;
      this.finishReason = "";
      this.startedAt = performance.now();
      this.activationAt = null;
      this.activationRequested = null;
      this.hidden = false;
      this.classList.remove("is-exiting");
      this.setAttribute("role", "dialog");
      this.setAttribute("aria-modal", "true");
      this.dataset.state = "loading";
      document.documentElement.classList.remove("ll-intro-bypass");
      document.documentElement.classList.add("ll-intro-pending");
      document.body.classList.add("ll-intro-open");
      this.setPageInactive(true);
      this.mount();

      this.schedule(() => {
        if (!this.ready) this.finishIntro({ immediate: true, reason: "slow-renderer" });
      }, READY_DEADLINE_MS);


      if (this.replayFocusTarget) {
        this.schedule(() => {
          this.querySelector(".luminary-intro__activate")?.focus({ preventScroll: true });
        }, 0);
      }

      return true;
    }

    replay() {
      if (this.running) return false;
      return this.startIntro({ restoreFocusTo: this.replayControl });
    }

    shouldBypass() {
      const bootstrap = window.__luminaryIntro;
      if (bootstrap && !bootstrap.show) return true;
      if (location.hash) return true;
      if (typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

      try {
        return localStorage.getItem(STORAGE_KEY) === this.version;
      } catch (error) {
        return false;
      }
    }

    get version() {
      return this.getAttribute("version") || window.__luminaryIntro?.version || DEFAULT_VERSION;
    }

    bindReplayControl() {
      const control = document.querySelector(".universal-signature");
      if (!control || control === this.replayControl) return;

      this.unbindReplayControl();
      this.replayControl = control;
      control.setAttribute("aria-label", "Replay Luminary Labs intro");
      control.addEventListener("click", this.boundReplayClick);
    }

    unbindReplayControl() {
      this.replayControl?.removeEventListener("click", this.boundReplayClick);
      this.replayControl = null;
    }

    onReplayRequest(event) {
      const isNormalClick = event.button === 0
        && !event.metaKey
        && !event.ctrlKey
        && !event.shiftKey
        && !event.altKey;
      if (!isNormalClick) return;

      if (this.running) {
        event.preventDefault();
        return;
      }

      if (this.replay()) event.preventDefault();
    }

    mount() {
      this.abortController = new AbortController();
      const signal = this.abortController.signal;
      const fragmentSource = this.getAttribute("fragment-src") || "assets/shaders/fractal-filament.glsl";
      const passes = this.getAttribute("passes") || "";

      this.addEventListener("shader-ready", () => this.onRendererReady(), { signal });
      this.addEventListener("shader-error", () => {
        this.finishIntro({ immediate: true, reason: "renderer-error" });
      }, { signal });

      this.innerHTML = `
        <div class="luminary-intro__scene">
          <shader-renderer
            fragment-src="${this.escapeAttribute(fragmentSource)}"
            passes="${this.escapeAttribute(passes)}"
            max-pixels="520000"
            max-fps="30"
            pixel-ratio-cap="1.5"
            transparent
            aria-hidden="true"></shader-renderer>
        </div>
        <button class="luminary-intro__activate" type="button" aria-label="Ignite the Luminary Labs lightbulb"></button>
        <p class="luminary-intro__guide">Click to ignite</p>
        <button class="luminary-intro__skip" type="button">Skip Intro</button>
        <span class="luminary-intro__status" aria-live="polite">Loading the Luminary Labs introduction</span>
      `;

      this.renderer = this.querySelector("shader-renderer");
      this.status = this.querySelector(".luminary-intro__status");
      this.renderer.setUniform("uVfxTime", -1, false);
      this.renderer.beforeDraw = elapsed => {
        this.renderer.setUniform("uVfxTime", this.activationAt === null ? -1 : Math.max(0, elapsed - this.activationAt), false);
      };
      this.querySelector(".luminary-intro__activate")?.addEventListener("click", () => {
        this.activate("interaction");
      }, { signal });
      this.querySelector(".luminary-intro__skip")?.addEventListener("click", event => {
        event.stopPropagation();
        this.finishIntro({ immediate: true, reason: "skip" });
      }, { signal });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          event.preventDefault();
          this.finishIntro({ immediate: true, reason: "escape" });
          return;
        }

        const isActivationKey = event.key === "Enter" || event.key === " ";
        const interactiveTarget = event.target instanceof Element
          && event.target.closest("a, button, input, select, textarea, [contenteditable]");
        if (!isActivationKey || event.repeat || interactiveTarget) return;

        event.preventDefault();
        this.activate("keyboard");
      }, { signal });
    }

    onRendererReady() {
      if (!this.running || this.finished || this.finishing) return;
      this.ready = true;
      this.dataset.state = "ready";
      if (this.status) this.status.textContent = "The Luminary Labs light is ready";
      this.renderer?.setUniform("uPower", 0);
      this.renderer?.setUniform("uStarA", 0);
      this.renderer?.setUniform("uStarB", 0);
      this.renderer?.setUniform("uStarC", 0);
      if (this.activationRequested) this.activate(this.activationRequested);
    }

    activate(reason) {
      if (!this.running || this.finished || this.finishing || this.activationAt !== null) return;
      if (!this.ready) { this.activationRequested = reason; return; }
      this.activationRequested = null;
      this.activationAt = this.renderer.lastElapsed || 0;
      this.dataset.state = "activating";
      if (this.status) this.status.textContent = "Light ignited";
      const guide = this.querySelector(".luminary-intro__guide");
      if (guide) guide.textContent = "Luminary Labs";
      this.renderer.setUniform("uVfxTime", 0, false);
      this.renderer.passes?.forEach(pass => pass.activate?.(this.activationAt));
      this.schedule(() => this.finishIntro({ immediate: false, reason }), IGNITION_TO_REVEAL_MS);
      this.schedule(() => this.finishIntro({ immediate: true, reason: "vfx-timeout" }), ACTIVATION_FAILSAFE_MS);
    }

    finishIntro({ immediate = false, reason = "complete" } = {}) {
      if (!this.running || this.finished) return;
      if (this.finishing && !immediate) return;

      this.finishing = true;
      this.finishReason = reason;
      this.clearTimers();
      this.rememberCompletion();

      if (immediate) {
        this.commitHome(reason);
        return;
      }

      this.dataset.state = "exiting";
      this.classList.add("is-exiting");
      this.schedule(() => this.commitHome(reason), EXIT_MS);
    }

    commitHome(reason) {
      if (this.finished && !this.running) return;
      const focusTarget = this.replayFocusTarget;
      this.finished = true;
      this.finishing = false;
      this.running = false;
      this.finishReason = reason;
      this.clearTimers();
      this.rememberCompletion();
      this.setPageInactive(false);
      document.body.classList.remove("ll-intro-open");
      document.documentElement.classList.remove("ll-intro-pending");
      document.documentElement.classList.add("ll-intro-bypass");
      this.dataset.state = "finished";
      this.hidden = true;
      this.cleanupRun();
      this.replaceChildren();
      this.renderer = null;
      this.status = null;
      this.replayFocusTarget = null;
      this.dispatchEvent(new CustomEvent("luminary-intro-finished", {
        detail: {
          reason,
          elapsedMs: this.startedAt ? performance.now() - this.startedAt : 0,
        },
      }));

      if (focusTarget?.isConnected) {
        window.requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
      }
    }

    setPageInactive(inactive) {
      if (inactive) {
        this.pageTargets = [
          document.querySelector(".site-header"),
          document.querySelector("main"),
          document.querySelector(".site-footer"),
        ].filter(Boolean);
      }

      this.pageTargets.forEach(target => {
        target.inert = inactive;
        if (inactive) target.setAttribute("aria-hidden", "true");
        else target.removeAttribute("aria-hidden");
      });
    }

    rememberCompletion() {
      try {
        localStorage.setItem(STORAGE_KEY, this.version);
      } catch (error) {
        // Private browsing and storage policies may reject writes.
      }
    }

    schedule(callback, delay) {
      const timer = window.setTimeout(() => {
        this.timers.delete(timer);
        callback();
      }, delay);
      this.timers.add(timer);
      return timer;
    }

    clearTimers() {
      this.timers.forEach(timer => window.clearTimeout(timer));
      this.timers.clear();
    }

    cleanupRun() {
      this.clearTimers();
      this.abortController?.abort();
      this.abortController = null;
    }

    escapeAttribute(value) {
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }

  if (!customElements.get("luminary-intro")) {
    customElements.define("luminary-intro", LuminaryIntro);
  }
})();
