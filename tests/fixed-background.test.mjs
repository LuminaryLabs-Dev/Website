// Run with: node --test tests/fixed-background.test.mjs
// Lifecycle and source contracts; this is not a browser or WebGL rendering test.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/js/shader-renderer.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../assets/css/site-shell.css', import.meta.url), 'utf8');

function fixture({ marketing = true } = {}) {
  const windowElement = {};
  const frames = new Map();
  const observers = [];
  const motion = Object.assign(new EventTarget(), { matches: false });
  let frameId = 0;
  class Element extends EventTarget {
    constructor() {
      super();
      this.attributes = new Map();
      this.dataset = {};
      this.children = [];
      this.rect = { width: 1406, height: 872 };
    }
    setAttribute(name, value) {
      const old = this.attributes.get(name) ?? null;
      this.attributes.set(name, String(value));
      if (this.constructor.observedAttributes?.includes(name) && old !== String(value)) {
        this.attributeChangedCallback(name, old, String(value));
      }
    }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) {
      const old = this.attributes.get(name);
      this.attributes.delete(name);
      if (old !== undefined && this.constructor.observedAttributes?.includes(name)) {
        this.attributeChangedCallback(name, old, null);
      }
    }
    append(element) { this.children.push(element); element.parent = this; }
    remove() {
      if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this);
    }
    closest(selector) { return marketing && selector === '.presentation-visual' ? windowElement : null; }
    getBoundingClientRect() { return this.rect; }
  }
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
  }
  const document = Object.assign(new EventTarget(), {
    hidden: false,
    body: { classList: { contains: () => false } },
    querySelector: () => null,
    createElement: () => new Element(),
  });
  const window = Object.assign(new EventTarget(), {
    matchMedia: () => motion,
    devicePixelRatio: 2,
    ResizeObserver: Observer,
    IntersectionObserver: Observer,
  });
  const context = vm.createContext({
    window, document, HTMLElement: Element, ResizeObserver: Observer,
    IntersectionObserver: Observer, Event, CustomEvent, AbortController,
    performance: { now: () => 1000 }, console, setTimeout, clearTimeout,
    requestAnimationFrame(callback) { const id = ++frameId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    customElements: { get: () => undefined, define() {} },
  });
  vm.runInContext(source, context);
  const renderer = new window.ShaderRenderer();
  // GPU compilation is outside this unit test. Exercise the real connection,
  // visibility, pause, resize and disposal methods with a controlled draw seam.
  renderer.initialize = async () => {};
  renderer.draw = elapsed => { renderer.lastElapsed = elapsed; };
  renderer.connectedCallback();
  renderer.ready = true;
  return { renderer, windowElement, frames, motion, document, observers };
}

test('marketing scene watches its scrolling window, not its fixed canvas', () => {
  const { renderer, windowElement } = fixture();
  assert.equal(renderer.intersectionObserver.target, windowElement);
  assert.notEqual(renderer.intersectionObserver.target, renderer);
  assert.equal(renderer.children.length, 1);
});

test('intro, studies and other non-marketing renderers still observe themselves', () => {
  const { renderer } = fixture({ marketing: false });
  assert.equal(renderer.intersectionObserver.target, renderer);
});

test('covering and uncovering the scene pauses it without replacing its canvas', () => {
  const { renderer, frames } = fixture();
  const canvas = renderer.canvas;
  const generation = renderer.runGeneration;
  const uniforms = renderer.uniformValues;
  renderer.elapsedBeforePause = renderer.lastElapsed = 12;
  renderer.syncAnimation();
  assert.equal(frames.size, 1);
  renderer.intersectionObserver.callback([{ isIntersecting: false }]);
  assert.equal(renderer.shouldAnimate(), false);
  assert.equal(frames.size, 0);
  assert.equal(renderer.lastElapsed, 12);
  renderer.intersectionObserver.callback([{ isIntersecting: true }]);
  assert.equal(renderer.shouldAnimate(), true);
  assert.equal(frames.size, 1);
  assert.equal(renderer.canvas, canvas);
  assert.equal(renderer.runGeneration, generation);
  assert.equal(renderer.uniformValues, uniforms);
  assert.equal(renderer.children.length, 1);
  assert.equal(renderer.disposed, false);
});

test('scroll visibility cannot override an explicit user pause', () => {
  const { renderer, frames } = fixture();
  renderer.setAttribute('paused', '');
  renderer.intersectionObserver.callback([{ isIntersecting: false }]);
  renderer.intersectionObserver.callback([{ isIntersecting: true }]);
  assert.equal(renderer.shouldAnimate(), false);
  assert.equal(frames.size, 0);
  renderer.removeAttribute('paused');
  assert.equal(renderer.shouldAnimate(), true);
  assert.equal(frames.size, 1);
});

test('reduced-motion changes retain the existing pause gate', () => {
  const { renderer, motion, frames } = fixture();
  renderer.syncAnimation();
  const change = new Event('change');
  Object.defineProperty(change, 'matches', { value: true });
  motion.dispatchEvent(change);
  assert.equal(renderer.reduceMotion, true);
  assert.equal(renderer.shouldAnimate(), false);
  assert.equal(frames.size, 0);
});

test('hidden-tab suspension still takes precedence over scene visibility', () => {
  const { renderer, document, frames } = fixture();
  renderer.syncAnimation();
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  renderer.intersectionObserver.callback([{ isIntersecting: true }]);
  assert.equal(renderer.shouldAnimate(), false);
  assert.equal(frames.size, 0);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(renderer.shouldAnimate(), true);
  assert.equal(frames.size, 1);
});

test('viewport-sized scenes still obey their existing pixel budgets', () => {
  const { renderer } = fixture();
  renderer.gl = { viewport() {} };
  renderer.setAttribute('startup-independent', '');
  renderer.setAttribute('pixel-ratio-cap', '1');
  for (const [width, height, budget] of [[2560, 1412, 921600], [390, 796, 480000], [1406, 872, 260000]]) {
    renderer.rect = { width, height };
    renderer.setAttribute('max-pixels', String(budget));
    renderer.resize();
    assert.ok(renderer.canvas.width * renderer.canvas.height <= budget);
    assert.ok(renderer.canvas.width <= width);
    assert.ok(renderer.canvas.height <= height);
  }
});

test('actual disposal disconnects observers, removes canvas and stops scheduling', () => {
  const { renderer, frames } = fixture();
  renderer.syncAnimation();
  renderer.dispose();
  assert.equal(renderer.resizeObserver.disconnected, true);
  assert.equal(renderer.intersectionObserver.disconnected, true);
  assert.equal(renderer.canvas, null);
  assert.equal(renderer.children.length, 0);
  assert.equal(frames.size, 0);
  assert.equal(renderer.shouldAnimate(), false);
});

test('existing fixed navigation, skip link and fullscreen player retain their layers', () => {
  assert.match(css, /\.ll-site \.site-header\{position:fixed;[^}]*z-index:100;/);
  assert.match(css, /\.ll-site \.skip-link\{[^}]*z-index:120;/);
  assert.match(css, /\.ll-site\.arcade-player-page \.player-shell\{z-index:200\}/);
});

test('shared background rules preserve normal-flow panels and scope out the player', () => {
  const layers = css.slice(css.indexOf('/* Shared marketing layers.'));
  assert.match(layers, /\.presentation-visual > :is\(\.page-scene, shader-renderer, \.hallway-poster, \.hero-loading-cover\)\s*\{\s*position: fixed;/);
  assert.match(layers, /inset: var\(--header-height\) 0 0;/);
  assert.match(layers, /\.presentation-actions,[\s\S]*?position: relative;\s*z-index: 10;/);
  assert.doesNotMatch(layers, /(?:transform|filter|box-shadow|animation|transition|font|padding|aspect-ratio)\s*:/);
  for (const rule of layers.replace(/\/\*[\s\S]*?\*\//g, '').split('}').filter(rule => rule.trim())) {
    const selectors = rule.split('{')[0];
    assert.ok(selectors.trim().startsWith('.ll-site.presentation-page'));
  }
});
