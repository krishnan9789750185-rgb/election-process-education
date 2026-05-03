/**
 * @fileoverview Comprehensive test suite for ElectIQ.
 * Tests security, utilities, constants integrity, accessibility,
 * Google Services, and module logic with async support.
 */

/* ---- Minimal Test Framework with async support ---- */
const results = { passed: 0, failed: 0, total: 0, groups: [] };
let currentGroup = null;

function describe(name, fn) {
  currentGroup = { name, tests: [] };
  results.groups.push(currentGroup);
  fn();
  currentGroup = null;
}

async function it(name, fn) {
  results.total++;
  const start = performance.now();
  try {
    await fn();
    results.passed++;
    currentGroup.tests.push({ name, pass: true, time: performance.now() - start });
  } catch (e) {
    results.failed++;
    currentGroup.tests.push({ name, pass: false, error: e.message, time: performance.now() - start });
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertEqual(a, b, msg) { assert(a === b, msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function assertNotEqual(a, b, msg) { assert(a !== b, msg || `Expected values to differ`); }
function assertIncludes(str, sub) { assert(str.includes(sub), `Expected "${str}" to include "${sub}"`); }
function assertType(val, type) { assertEqual(typeof val, type, `Expected type ${type}, got ${typeof val}`); }
function assertGreaterThan(a, b, msg) { assert(a > b, msg || `Expected ${a} > ${b}`); }
function assertMatch(str, regex, msg) { assert(regex.test(str), msg || `Expected "${str}" to match ${regex}`); }
function assertThrows(fn, msg) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  assert(threw, msg || 'Expected function to throw');
}

/* ---- Import Modules ---- */
import { escapeHTML, sanitizeHTML, validateInput, rateLimiter, isValidAPIKey, generateNonce } from '../js/security.js';
import { formatScore, generateId, debounce, createElement, storage, showToast } from '../js/utils.js';
import {
  APP_CONFIG, ELECTION_TIMELINE, QUIZ_QUESTIONS, SIMULATOR_ROLES, SIMULATOR_SCENARIOS,
  SECURITY, CHART_CONFIG, PARTICLE_SYMBOLS, ELECTION_DATES, GOOGLE_TRANSLATE_CONFIG,
  QUIZ_GRADE_THRESHOLDS, SIMULATOR_GRADE_THRESHOLDS, DIFFICULTY_COLORS, SUGGESTED_QUESTIONS,
} from '../js/constants.js';
import { generateGoogleCalendarURL } from '../js/google-services.js';

/* ============================================================
 * SECURITY TESTS
 * ============================================================ */

describe('Security — escapeHTML', () => {
  it('should escape & character', () => { assertEqual(escapeHTML('a&b'), 'a&amp;b'); });
  it('should escape < and > characters', () => { assertEqual(escapeHTML('<script>'), '&lt;script&gt;'); });
  it('should escape quotes', () => { assertIncludes(escapeHTML('"hello"'), '&quot;'); });
  it('should return empty string for non-string', () => { assertEqual(escapeHTML(123), ''); });
  it('should return empty string for null', () => { assertEqual(escapeHTML(null), ''); });
  it('should handle empty string', () => { assertEqual(escapeHTML(''), ''); });
  it('should escape backticks', () => { assertIncludes(escapeHTML('`code`'), '&#96;'); });
  it('should escape single quotes', () => { assertIncludes(escapeHTML("it's"), '&#39;'); });
});

describe('Security — sanitizeHTML', () => {
  it('should remove script tags', () => {
    const result = sanitizeHTML('<script>alert("xss")</script>');
    assert(!result.includes('<script'), 'Script tag should be removed');
  });
  it('should allow safe tags', () => {
    const result = sanitizeHTML('<strong>bold</strong>');
    assertIncludes(result, '<strong>');
  });
  it('should remove quoted event handlers', () => {
    const result = sanitizeHTML('<div onclick="alert(1)">test</div>');
    assert(!result.includes('onclick'), 'Quoted event handler should be removed');
  });
  it('should remove unquoted event handlers', () => {
    const result = sanitizeHTML('<img onerror=alert(1) src=x>');
    assert(!result.includes('onerror'), 'Unquoted event handler should be removed');
  });
  it('should remove javascript: URLs', () => {
    const result = sanitizeHTML('<a href="javascript:alert(1)">click</a>');
    assert(!result.includes('javascript:'), 'javascript: URL should be removed');
  });
  it('should remove data: URLs', () => {
    const result = sanitizeHTML('<a href="data:text/html,<script>alert(1)</script>">x</a>');
    assert(!result.includes('data:'), 'data: URL should be removed');
  });
  it('should return empty for non-string', () => { assertEqual(sanitizeHTML(null), ''); });
  it('should return empty for undefined', () => { assertEqual(sanitizeHTML(undefined), ''); });
});

describe('Security — validateInput', () => {
  it('should accept valid input', () => {
    const r = validateInput('Hello world');
    assert(r.isValid, 'Should be valid');
  });
  it('should reject empty input', () => {
    const r = validateInput('');
    assert(!r.isValid, 'Empty input should be invalid');
  });
  it('should reject whitespace-only input', () => {
    const r = validateInput('   ');
    assert(!r.isValid, 'Whitespace-only should be invalid');
  });
  it('should reject input exceeding max length', () => {
    const r = validateInput('a'.repeat(1001));
    assert(!r.isValid, 'Over-length input should be invalid');
  });
  it('should reject non-string input', () => {
    const r = validateInput(42);
    assert(!r.isValid, 'Non-string should be invalid');
  });
  it('should sanitize output', () => {
    const r = validateInput('<script>alert(1)</script>');
    assert(r.isValid);
    assert(!r.sanitized.includes('<script'), 'Output should be sanitized');
  });
  it('should accept special characters within limits', () => {
    const r = validateInput('Hello, how are you? (fine!)');
    assert(r.isValid, 'Common punctuation should be valid');
  });
});

describe('Security — rateLimiter', () => {
  it('should allow requests within limit', () => {
    rateLimiter.reset();
    const r = rateLimiter.check('test-key');
    assert(r.allowed, 'First request should be allowed');
  });
  it('should block after exceeding limit', () => {
    rateLimiter.reset('burst-test');
    for (let i = 0; i < SECURITY.MAX_RATE_LIMIT_REQUESTS; i++) {
      rateLimiter.check('burst-test');
    }
    const r = rateLimiter.check('burst-test');
    assert(!r.allowed, 'Should be blocked after limit');
    assert(r.retryAfterMs > 0, 'Should have retry time');
  });
  it('should reset correctly', () => {
    rateLimiter.reset('reset-test');
    const r = rateLimiter.check('reset-test');
    assert(r.allowed, 'Should be allowed after reset');
  });
  it('should track independent keys separately', () => {
    rateLimiter.reset('key-a');
    rateLimiter.reset('key-b');
    rateLimiter.check('key-a');
    const r = rateLimiter.check('key-b');
    assert(r.allowed, 'Different keys should be independent');
  });
});

describe('Security — isValidAPIKey', () => {
  it('should reject empty string', () => { assert(!isValidAPIKey('')); });
  it('should reject short key', () => { assert(!isValidAPIKey('abc')); });
  it('should reject non-string', () => { assert(!isValidAPIKey(12345)); });
  it('should accept valid key format', () => { assert(isValidAPIKey('AIzaSyB1234567890abcdefg')); });
  it('should reject null', () => { assert(!isValidAPIKey(null)); });
  it('should reject undefined', () => { assert(!isValidAPIKey(undefined)); });
});

describe('Security — generateNonce', () => {
  it('should return a string', () => { assertType(generateNonce(), 'string'); });
  it('should generate unique nonces', () => { assertNotEqual(generateNonce(), generateNonce()); });
  it('should have sufficient length', () => { assertGreaterThan(generateNonce().length, 10, 'Nonce should be > 10 chars'); });
});

describe('Security — SECURITY constants', () => {
  it('should have allowed tags array', () => {
    assert(Array.isArray(SECURITY.ALLOWED_TAGS), 'ALLOWED_TAGS should be array');
    assert(SECURITY.ALLOWED_TAGS.length > 0, 'Should have at least one tag');
  });
  it('should have rate limit settings', () => {
    assertType(SECURITY.MAX_RATE_LIMIT_REQUESTS, 'number');
    assertType(SECURITY.RATE_LIMIT_WINDOW_MS, 'number');
    assert(SECURITY.MAX_RATE_LIMIT_REQUESTS > 0, 'Max requests should be positive');
  });
  it('should have CSP domain arrays', () => {
    assert(Array.isArray(SECURITY.CSP_ALLOWED_SCRIPT_DOMAINS), 'Should have script domains');
    assert(Array.isArray(SECURITY.CSP_ALLOWED_CONNECT_DOMAINS), 'Should have connect domains');
    assert(Array.isArray(SECURITY.CSP_ALLOWED_FRAME_DOMAINS), 'Should have frame domains');
  });
  it('should be frozen', () => {
    assert(Object.isFrozen(SECURITY), 'SECURITY should be frozen');
  });
});

/* ============================================================
 * UTILITY TESTS
 * ============================================================ */

describe('Utils — formatScore', () => {
  it('should pad single digit', () => { assertEqual(formatScore(5), '0005'); });
  it('should pad double digit', () => { assertEqual(formatScore(42), '0042'); });
  it('should handle zero', () => { assertEqual(formatScore(0), '0000'); });
  it('should handle negative as zero', () => { assertEqual(formatScore(-5), '0000'); });
  it('should not pad large numbers', () => { assertEqual(formatScore(12345), '12345'); });
});

describe('Utils — generateId', () => {
  it('should return string', () => { assertType(generateId(), 'string'); });
  it('should include prefix', () => { assertIncludes(generateId('test'), 'test_'); });
  it('should generate unique IDs', () => { assertNotEqual(generateId(), generateId()); });
  it('should work without prefix', () => { assertType(generateId(), 'string'); });
});

describe('Utils — createElement', () => {
  it('should create element with tag', () => {
    const el = createElement('div');
    assertEqual(el.tagName, 'DIV');
  });
  it('should set className', () => {
    const el = createElement('span', { className: 'test-class' });
    assertEqual(el.className, 'test-class');
  });
  it('should set attributes', () => {
    const el = createElement('input', { type: 'text', id: 'test-id' });
    assertEqual(el.getAttribute('type'), 'text');
    assertEqual(el.id, 'test-id');
  });
  it('should add text children', () => {
    const el = createElement('p', {}, 'Hello');
    assertEqual(el.textContent, 'Hello');
  });
  it('should add element children', () => {
    const child = createElement('span', {}, 'inner');
    const parent = createElement('div', {}, child);
    assertEqual(parent.children.length, 1);
  });
});

describe('Utils — storage', () => {
  it('should set and get values', () => {
    storage.set('_test_key', { a: 1 });
    const val = storage.get('_test_key');
    assertEqual(val.a, 1);
    storage.remove('_test_key');
  });
  it('should return default for missing key', () => {
    assertEqual(storage.get('_nonexistent_key_12345', 42), 42);
  });
  it('should remove keys', () => {
    storage.set('_test_remove', 'hello');
    storage.remove('_test_remove');
    assertEqual(storage.get('_test_remove', null), null);
  });
});

describe('Utils — showToast', () => {
  it('should create toast container', () => {
    showToast('Test notification', 'success');
    const container = document.getElementById('toast-container');
    assert(container !== null, 'Toast container should exist');
  });
});

/* ============================================================
 * CONSTANTS INTEGRITY TESTS
 * ============================================================ */

describe('Constants — APP_CONFIG', () => {
  it('should have app name', () => { assertEqual(APP_CONFIG.APP_NAME, 'ElectIQ'); });
  it('should have Gemini model', () => { assertType(APP_CONFIG.GEMINI_MODEL, 'string'); });
  it('should have API URL', () => { assertIncludes(APP_CONFIG.GEMINI_API_URL, 'generativelanguage'); });
  it('should be frozen', () => { assert(Object.isFrozen(APP_CONFIG), 'CONFIG should be frozen'); });
  it('should have animation constants', () => {
    assertType(APP_CONFIG.HERO_ANIMATION_BASE_DELAY_MS, 'number');
    assertType(APP_CONFIG.PARTICLE_COUNT, 'number');
    assertType(APP_CONFIG.SCROLL_THRESHOLD_PX, 'number');
  });
  it('should have Gemini generation config', () => {
    assertType(APP_CONFIG.GEMINI_TEMPERATURE, 'number');
    assertType(APP_CONFIG.GEMINI_TOP_K, 'number');
    assertType(APP_CONFIG.GEMINI_TOP_P, 'number');
    assertType(APP_CONFIG.GEMINI_MAX_OUTPUT_TOKENS, 'number');
  });
  it('should have font size bounds', () => {
    assertGreaterThan(APP_CONFIG.FONT_SIZE_MAX, APP_CONFIG.FONT_SIZE_MIN, 'Max > Min');
    assertGreaterThan(APP_CONFIG.FONT_SIZE_STEP, 0, 'Step > 0');
  });
});

describe('Constants — ELECTION_TIMELINE', () => {
  it('should have 10 steps', () => { assertEqual(ELECTION_TIMELINE.length, 10); });
  it('should be frozen', () => { assert(Object.isFrozen(ELECTION_TIMELINE)); });
  it('each step should have required fields', () => {
    ELECTION_TIMELINE.forEach((step) => {
      assertType(step.id, 'number');
      assertType(step.title, 'string');
      assertType(step.icon, 'string');
      assertType(step.summary, 'string');
      assert(Array.isArray(step.details), `Step ${step.id} should have details array`);
      assertType(step.keyFact, 'string');
    });
  });
  it('steps should have sequential IDs', () => {
    ELECTION_TIMELINE.forEach((step, i) => { assertEqual(step.id, i + 1); });
  });
});

describe('Constants — QUIZ_QUESTIONS', () => {
  it('should have 15 questions', () => { assertEqual(QUIZ_QUESTIONS.length, 15); });
  it('should be frozen', () => { assert(Object.isFrozen(QUIZ_QUESTIONS)); });
  it('each question should have valid structure', () => {
    QUIZ_QUESTIONS.forEach((q) => {
      assertType(q.id, 'string');
      assertType(q.question, 'string');
      assert(Array.isArray(q.options), 'Options should be array');
      assert(q.options.length >= 2, 'Should have at least 2 options');
      assertType(q.correct, 'number');
      assert(q.correct >= 0 && q.correct < q.options.length, 'Correct index should be valid');
      assertType(q.explanation, 'string');
      assert(['easy', 'medium', 'hard'].includes(q.difficulty), 'Valid difficulty');
    });
  });
  it('should have unique IDs', () => {
    const ids = QUIZ_QUESTIONS.map((q) => q.id);
    assertEqual(new Set(ids).size, ids.length, 'All IDs should be unique');
  });
});

describe('Constants — SIMULATOR', () => {
  it('should have 3 roles', () => { assertEqual(Object.keys(SIMULATOR_ROLES).length, 3); });
  it('should have voter, candidate, officer', () => {
    assert(SIMULATOR_ROLES.voter, 'Should have voter');
    assert(SIMULATOR_ROLES.candidate, 'Should have candidate');
    assert(SIMULATOR_ROLES.officer, 'Should have officer');
  });
  it('each role should have scenarios', () => {
    Object.keys(SIMULATOR_ROLES).forEach((roleId) => {
      assert(Array.isArray(SIMULATOR_SCENARIOS[roleId]), `${roleId} should have scenarios`);
      assert(SIMULATOR_SCENARIOS[roleId].length >= 3, `${roleId} should have at least 3 steps`);
    });
  });
  it('each scenario should have choices', () => {
    Object.values(SIMULATOR_SCENARIOS).forEach((scenarios) => {
      scenarios.forEach((step) => {
        assert(Array.isArray(step.choices), 'Should have choices');
        assert(step.choices.length >= 2, 'Should have at least 2 choices');
        assert(step.choices.some((c) => c.isOptimal), 'Should have an optimal choice');
      });
    });
  });
});

describe('Constants — CHART_CONFIG', () => {
  it('should be frozen', () => { assert(Object.isFrozen(CHART_CONFIG)); });
  it('should have color palette', () => {
    assertType(CHART_CONFIG.COLORS.PRIMARY, 'string');
    assertType(CHART_CONFIG.COLORS.SECONDARY, 'string');
    assertType(CHART_CONFIG.COLORS.TERTIARY, 'string');
  });
  it('should have chart area configs', () => {
    assertType(CHART_CONFIG.CHART_AREA_BAR.width, 'string');
    assertType(CHART_CONFIG.CHART_AREA_PIE.height, 'string');
  });
  it('should have pie hole size', () => {
    assertType(CHART_CONFIG.PIE_HOLE_SIZE, 'number');
    assertGreaterThan(CHART_CONFIG.PIE_HOLE_SIZE, 0);
  });
});

describe('Constants — PARTICLE_SYMBOLS', () => {
  it('should be a frozen array', () => {
    assert(Array.isArray(PARTICLE_SYMBOLS));
    assert(Object.isFrozen(PARTICLE_SYMBOLS));
  });
  it('should have at least 5 symbols', () => {
    assertGreaterThan(PARTICLE_SYMBOLS.length, 4);
  });
});

describe('Constants — ELECTION_DATES', () => {
  it('should have 4 dates', () => { assertEqual(ELECTION_DATES.length, 4); });
  it('should be frozen', () => { assert(Object.isFrozen(ELECTION_DATES)); });
  it('each date should have required fields', () => {
    ELECTION_DATES.forEach((d) => {
      assertType(d.title, 'string');
      assertType(d.date, 'string');
      assertType(d.description, 'string');
      assertType(d.location, 'string');
      assertMatch(d.date, /^\d{4}-\d{2}-\d{2}$/, 'Date should be YYYY-MM-DD');
    });
  });
});

describe('Constants — GOOGLE_TRANSLATE_CONFIG', () => {
  it('should be frozen', () => { assert(Object.isFrozen(GOOGLE_TRANSLATE_CONFIG)); });
  it('should have page language', () => { assertEqual(GOOGLE_TRANSLATE_CONFIG.PAGE_LANGUAGE, 'en'); });
  it('should have included languages', () => {
    assertIncludes(GOOGLE_TRANSLATE_CONFIG.INCLUDED_LANGUAGES, 'en');
    assertIncludes(GOOGLE_TRANSLATE_CONFIG.INCLUDED_LANGUAGES, 'hi');
  });
  it('should have element ID', () => { assertEqual(GOOGLE_TRANSLATE_CONFIG.ELEMENT_ID, 'google-translate-widget'); });
});

describe('Constants — QUIZ_GRADE_THRESHOLDS', () => {
  it('should be frozen', () => { assert(Object.isFrozen(QUIZ_GRADE_THRESHOLDS)); });
  it('should have expert > informed > learning', () => {
    assertGreaterThan(QUIZ_GRADE_THRESHOLDS.EXPERT, QUIZ_GRADE_THRESHOLDS.INFORMED);
    assertGreaterThan(QUIZ_GRADE_THRESHOLDS.INFORMED, QUIZ_GRADE_THRESHOLDS.LEARNING);
  });
});

describe('Constants — SIMULATOR_GRADE_THRESHOLDS', () => {
  it('should be frozen', () => { assert(Object.isFrozen(SIMULATOR_GRADE_THRESHOLDS)); });
  it('should have excellent > good', () => {
    assertGreaterThan(SIMULATOR_GRADE_THRESHOLDS.EXCELLENT, SIMULATOR_GRADE_THRESHOLDS.GOOD);
  });
});

describe('Constants — DIFFICULTY_COLORS', () => {
  it('should be frozen', () => { assert(Object.isFrozen(DIFFICULTY_COLORS)); });
  it('should have easy, medium, hard', () => {
    assertType(DIFFICULTY_COLORS.easy, 'string');
    assertType(DIFFICULTY_COLORS.medium, 'string');
    assertType(DIFFICULTY_COLORS.hard, 'string');
  });
  it('all colors should be hex format', () => {
    Object.values(DIFFICULTY_COLORS).forEach((color) => {
      assertMatch(color, /^#[0-9A-Fa-f]{6}$/, `${color} should be valid hex`);
    });
  });
});

describe('Constants — SUGGESTED_QUESTIONS', () => {
  it('should be frozen', () => { assert(Object.isFrozen(SUGGESTED_QUESTIONS)); });
  it('should have at least 5 questions', () => { assertGreaterThan(SUGGESTED_QUESTIONS.length, 4); });
  it('each should be a non-empty string', () => {
    SUGGESTED_QUESTIONS.forEach((q) => {
      assertType(q, 'string');
      assertGreaterThan(q.length, 0);
    });
  });
});

/* ============================================================
 * GOOGLE SERVICES TESTS
 * ============================================================ */

describe('Google Services — generateGoogleCalendarURL', () => {
  it('should generate valid Google Calendar URL', () => {
    const url = generateGoogleCalendarURL({
      title: 'Election Day', date: '2026-11-03',
      description: 'Vote!', location: 'Polling Station',
    });
    assertIncludes(url, 'calendar.google.com/calendar/render');
    assertIncludes(url, 'text=Election+Day');
    assertIncludes(url, 'dates=20261103');
  });
  it('should include location', () => {
    const url = generateGoogleCalendarURL({
      title: 'Test', date: '2026-01-01',
      description: 'Desc', location: 'My Office',
    });
    assertIncludes(url, 'location=My+Office');
  });
  it('should include ElectIQ branding in details', () => {
    const url = generateGoogleCalendarURL({
      title: 'Test', date: '2026-01-01',
      description: 'Desc', location: 'Loc',
    });
    assertIncludes(url, 'ElectIQ');
  });
  it('should handle all ELECTION_DATES entries', () => {
    ELECTION_DATES.forEach((event) => {
      const url = generateGoogleCalendarURL(event);
      assertIncludes(url, 'calendar.google.com');
      assertIncludes(url, event.date.replace(/-/g, ''));
    });
  });
});

/* ============================================================
 * ACCESSIBILITY TESTS
 * ============================================================ */

describe('Accessibility — DOM Structure', () => {
  it('should have lang attribute on html', () => {
    assertEqual(document.documentElement.lang, 'en');
  });
  it('should have a page title', () => {
    assert(document.title.length > 0, 'Page should have title');
  });
});

/* ============================================================
 * RENDER RESULTS
 * ============================================================ */

function renderResults() {
  const summaryEl = document.getElementById('summary');
  const resultsEl = document.getElementById('results');

  summaryEl.innerHTML = `
    <span class="pass">✅ Passed: ${results.passed}</span>
    <span class="fail">❌ Failed: ${results.failed}</span>
    <span>Total: ${results.total}</span>
  `;

  let html = '';
  results.groups.forEach((group) => {
    html += `<div class="test-group"><h2>${group.name}</h2>`;
    group.tests.forEach((t) => {
      const icon = t.pass ? '✅' : '❌';
      const cls = t.pass ? 'pass' : 'fail';
      const err = t.error ? ` — <span class="fail">${t.error}</span>` : '';
      html += `<div class="test"><span class="test-icon">${icon}</span><span class="test-name ${cls}">${t.name}${err}</span><span class="test-time">${t.time.toFixed(1)}ms</span></div>`;
    });
    html += '</div>';
  });

  resultsEl.innerHTML = html;
  console.log(`Tests: ${results.passed}/${results.total} passed, ${results.failed} failed`);
}

/* Wait for all async tests to finish */
setTimeout(renderResults, 500);
