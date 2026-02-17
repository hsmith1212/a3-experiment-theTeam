/**
 * experiment.js
 * =============
 * Core experiment controller for the Cleveland-McGill replication.
 *
 * INTEGRATION GUIDE FOR TEAMMATES
 * ─────────────────────────────────────────────────────────────────
 * This file expects the following globals/modules to exist by the
 * time experiment.js runs. Each section is clearly marked so you
 * can drop in your implementations without touching this file.
 *
 *  data.js      → window.DataGen
 *                   .generateTrialData(n)   // returns { values, marked }
 *
 *  viz_bw.js    → window.VizBW
 *                   .render(container, trialData)
 *                   .clear(container)
 *
 *  viz_multicolor.js → window.VizMulticolor
 *                   .render(container, trialData)
 *                   .clear(container)
 *
 *  viz_gradient.js  → window.VizGradient
 *                   .render(container, trialData)
 *                   .clear(container)
 *
 *  grading.js   → window.Grader
 *                   .score(trialData, response) // returns { raw, log2Error }
 *
 *  storage.js   → window.Storage
 *                   .save(trialRecord)
 *                   .getAll()
 *                   .exportCSV()
 *
 *  analysis.js  → window.Analysis          (optional — for live feedback)
 *                   .summarize(records)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ─── Experiment Configuration ────────────────────────────────────────────────

const CONFIG = {
  // How many data points per trial (Cleveland & McGill used 5 or 10)
  pointsPerTrial: 10,

  // Number of trials per visualization type, per participant
  // 20 per type → 60 total trials per participant
  trialsPerCondition: 20,

  // Conditions to test — keys map to their viz module and a human label
  conditions: [
    {
      id: 'bw',
      label: 'Bar Chart (B&W)',
      hypothesis: 'Position along a common scale → lowest error (baseline)',
      // ↓ teammate: this property links to your viz module
      module: () => window.VizBW,
    },
    {
      id: 'multicolor',
      label: 'Bar Chart (Multi-Color)',
      hypothesis: 'Color coding aids identification but may inflate error vs B&W',
      module: () => window.VizMulticolor,
    },
    {
      id: 'gradient',
      label: 'Bar Chart (Gradient)',
      hypothesis: 'Gradient fill may hinder accurate length estimation vs solid fill',
      module: () => window.VizGradient,
    },
  ],

  // DOM element IDs that must exist in index.html
  dom: {
    screen_intro:    'screen-intro',
    screen_trial:    'screen-trial',
    screen_response: 'screen-response',
    screen_end:      'screen-end',
    viz_container:   'viz-container',
    condition_label: 'condition-label',
    trial_counter:   'trial-counter',
    response_input:  'response-input',
    response_submit: 'response-submit',
    response_error:  'response-error',
    csv_output:      'csv-output',
    btn_start:       'btn-start',
    btn_next:        'btn-next',
    participant_id:  'participant-id',
  },
};

// ─── Experiment State ────────────────────────────────────────────────────────

const state = {
  participantId: null,
  trialQueue: [],       // array of { conditionId, trialIndex }  — shuffled
  currentTrialIndex: 0, // pointer into trialQueue
  currentTrialData: null,
  currentCondition: null,
  results: [],          // accumulates trial records
  startTime: null,      // ms — set when trial is shown
};

// ─── Utility Helpers ─────────────────────────────────────────────────────────

/**
 * Fisher-Yates shuffle — mutates array in place, returns it.
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Safely retrieve a DOM element; throws a descriptive error if missing.
 * Helps teammates catch missing HTML early.
 */
function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`[experiment.js] Missing DOM element: #${id}`);
  return node;
}

/**
 * Show one screen, hide all others.
 * Screens are identified by the ids in CONFIG.dom.
 */
function showScreen(screenId) {
  // Hide all screens
  ['screen-intro', 'screen-trial', 'screen-response', 'screen-end']
    .forEach(id => {
      const node = document.getElementById(id);
      if (node) node.style.display = 'none';
    });
  // Show the target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.style.display = 'block';
  } else {
    console.error(`[experiment.js] Cannot show screen: #${screenId} not found`);
  }
}

// ─── Trial Queue Builder ──────────────────────────────────────────────────────

/**
 * Build a fully-shuffled list of (condition, trialIndex) pairs.
 * e.g. trialsPerCondition = 20, conditions = 3 → 60 entries, randomized.
 */
function buildTrialQueue() {
  const queue = [];
  CONFIG.conditions.forEach(condition => {
    for (let i = 0; i < CONFIG.trialsPerCondition; i++) {
      queue.push({ conditionId: condition.id, trialIndex: i });
    }
  });
  return shuffle(queue);
}

// ─── Experiment Flow ──────────────────────────────────────────────────────────

/**
 * Called when the participant clicks "Start Experiment".
 * Validates the participant ID, builds the queue, shows first trial.
 */
function startExperiment() {
  const pidInput = document.getElementById(CONFIG.dom.participant_id);
  const pid = pidInput ? pidInput.value.trim() : 'P001';

  if (!pid) {
    alert('Please enter a participant ID before starting.');
    return;
  }

  state.participantId = pid;
  state.trialQueue = buildTrialQueue();
  state.currentTrialIndex = 0;
  state.results = [];

  console.log(`[experiment.js] Starting experiment for participant: ${pid}`);
  console.log(`[experiment.js] Total trials: ${state.trialQueue.length}`);

  runNextTrial();
}

/**
 * Advance to the next trial, or end the experiment if the queue is exhausted.
 */
function runNextTrial() {
  if (state.currentTrialIndex >= state.trialQueue.length) {
    endExperiment();
    return;
  }

  const { conditionId } = state.trialQueue[state.currentTrialIndex];
  state.currentCondition = CONFIG.conditions.find(c => c.id === conditionId);

  // ── 1. Generate trial data ───────────────────────────────────────────────
  // INTEGRATION: window.DataGen must expose .generateTrialData(n)
  // It should return an object like:
  //   { values: [number, ...], marked: [indexA, indexB] }
  // where values are in [0, 100] and marked is two distinct indices.
  let trialData;
  if (typeof window.DataGen !== 'undefined' && window.DataGen.generateTrialData) {
    trialData = window.DataGen.generateTrialData(CONFIG.pointsPerTrial);
  } else {
    // ── STUB (remove once data.js is integrated) ──────────────────────────
    console.warn('[experiment.js] window.DataGen not found — using stub data generator.');
    trialData = _stubGenerateTrialData(CONFIG.pointsPerTrial);
  }

  state.currentTrialData = trialData;

  // ── 2. Render the visualization ──────────────────────────────────────────
  // INTEGRATION: each viz module must expose .render(container, trialData)
  const container = document.getElementById(CONFIG.dom.viz_container);
  if (!container) throw new Error('[experiment.js] Missing #viz-container in HTML');

  const vizModule = state.currentCondition.module();

  if (vizModule && typeof vizModule.render === 'function') {
    vizModule.clear && vizModule.clear(container); // clear previous
    vizModule.render(container, trialData);
  } else {
    // ── STUB renderer ──────────────────────────────────────────────────────
    console.warn(`[experiment.js] Viz module for "${conditionId}" not found — using stub.`);
    _stubRender(container, trialData, state.currentCondition.label);
  }

  // ── 3. Update UI chrome ──────────────────────────────────────────────────
  const labelEl = document.getElementById(CONFIG.dom.condition_label);
  if (labelEl) labelEl.textContent = state.currentCondition.label;

  const counterEl = document.getElementById(CONFIG.dom.trial_counter);
  if (counterEl) {
    counterEl.textContent =
      `Trial ${state.currentTrialIndex + 1} of ${state.trialQueue.length}`;
  }

  // ── 4. Clear previous response & error message ───────────────────────────
  const input = document.getElementById(CONFIG.dom.response_input);
  if (input) input.value = '';

  const errEl = document.getElementById(CONFIG.dom.response_error);
  if (errEl) errEl.textContent = '';

  // ── 5. Record when the trial was shown (for reaction time) ───────────────
  state.startTime = Date.now();

  // ── 6. Show the trial screen ─────────────────────────────────────────────
  showScreen('screen-trial');

  console.log(
    `[experiment.js] Trial ${state.currentTrialIndex + 1} | condition: ${conditionId}`,
    trialData
  );
}

/**
 * Called when the participant submits their response.
 * Validates input, grades, stores, and advances.
 */
function submitResponse() {
  const input = document.getElementById(CONFIG.dom.response_input);
  const errEl = document.getElementById(CONFIG.dom.response_error);

  // ── Validate ─────────────────────────────────────────────────────────────
  const rawValue = input ? input.value.trim() : '';
  const response = parseFloat(rawValue);

  if (isNaN(response) || response < 0 || response > 100) {
    if (errEl) errEl.textContent = 'Please enter a number between 0 and 100.';
    return;
  }

  const reactionTime = Date.now() - state.startTime; // ms

  // ── Grade the response ───────────────────────────────────────────────────
  // INTEGRATION: window.Grader.score(trialData, response)
  // Should return: { rawError: number, log2Error: number }
  //   rawError  = |true_percentage - response|
  //   log2Error = log2( |true_percentage - response| + 1/8 )
  //               clamped to 0 when perfectly correct (see paper)
  let grading;
  if (typeof window.Grader !== 'undefined' && window.Grader.score) {
    grading = window.Grader.score(state.currentTrialData, response);
  } else {
    // ── STUB grader ────────────────────────────────────────────────────────
    console.warn('[experiment.js] window.Grader not found — using stub grader.');
    grading = _stubGrade(state.currentTrialData, response);
  }

  // ── Build trial record ───────────────────────────────────────────────────
  const trialRecord = {
    participantId:   state.participantId,
    trialNumber:     state.currentTrialIndex + 1,
    conditionId:     state.currentCondition.id,
    conditionLabel:  state.currentCondition.label,
    values:          state.currentTrialData.values.join(';'),
    markedA:         state.currentTrialData.marked[0],
    markedB:         state.currentTrialData.marked[1],
    trueValueA:      state.currentTrialData.values[state.currentTrialData.marked[0]],
    trueValueB:      state.currentTrialData.values[state.currentTrialData.marked[1]],
    truePercentage:  state.currentTrialData.truePercentage,  // smaller/larger * 100
    response:        response,
    rawError:        grading.rawError,
    log2Error:       grading.log2Error,
    reactionTimeMs:  reactionTime,
    timestamp:       new Date().toISOString(),
  };

  state.results.push(trialRecord);

  // ── Persist via storage.js ───────────────────────────────────────────────
  // INTEGRATION: window.Storage.save(trialRecord)
  if (typeof window.Storage !== 'undefined' && window.Storage.save) {
    window.Storage.save(trialRecord);
  } else {
    console.warn('[experiment.js] window.Storage not found — record held in memory only.');
  }

  console.log('[experiment.js] Trial result:', trialRecord);

  // ── Advance ──────────────────────────────────────────────────────────────
  state.currentTrialIndex++;
  runNextTrial();
}

/**
 * Called when all trials are complete.
 * Renders the CSV output so the participant can copy it.
 */
function endExperiment() {
  console.log('[experiment.js] Experiment complete. Total records:', state.results.length);

  // ── Generate CSV ─────────────────────────────────────────────────────────
  // INTEGRATION: window.Storage.exportCSV() is preferred.
  // Falls back to building CSV from in-memory results.
  let csv;
  if (typeof window.Storage !== 'undefined' && window.Storage.exportCSV) {
    csv = window.Storage.exportCSV();
  } else {
    csv = _buildCSV(state.results);
  }

  const csvBox = document.getElementById(CONFIG.dom.csv_output);
  if (csvBox) csvBox.value = csv;

  // ── Optional live summary via analysis.js ────────────────────────────────
  // INTEGRATION: window.Analysis.summarize(records)
  if (typeof window.Analysis !== 'undefined' && window.Analysis.summarize) {
    const summary = window.Analysis.summarize(state.results);
    console.log('[experiment.js] Summary:', summary);
    // Optionally render summary to a DOM element here
  }

  showScreen('screen-end');
}

// ─── CSV Builder (fallback if storage.js not present) ────────────────────────

function _buildCSV(records) {
  if (!records.length) return '';
  const headers = Object.keys(records[0]);
  const rows = records.map(r =>
    headers.map(h => {
      const val = r[h] ?? '';
      // Wrap in quotes if the value contains a comma
      return String(val).includes(',') ? `"${val}"` : val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// ─── Stub Implementations (to be replaced by teammate modules) ────────────────

/**
 * STUB: data.js replacement.
 * Generates n values in [0,100], picks two distinct indices to mark.
 * The "true percentage" is the smaller value expressed as a % of the larger.
 * Remove once window.DataGen is available.
 */
function _stubGenerateTrialData(n) {
  const values = Array.from({ length: n }, () => Math.round(Math.random() * 95) + 5);
  let [a, b] = shuffle([...Array(n).keys()]).slice(0, 2);
  const smaller = Math.min(values[a], values[b]);
  const larger  = Math.max(values[a], values[b]);
  const truePercentage = Math.round((smaller / larger) * 100);
  return { values, marked: [a, b], truePercentage };
}

/**
 * STUB: grading.js replacement.
 * Cleveland & McGill log-base-2 error:
 *   error = log2( |true - response| + 1/8 )
 * If perfectly correct, set to 0 (not log2(1/8) = -3).
 * Remove once window.Grader is available.
 */
function _stubGrade(trialData, response) {
  const diff = Math.abs(trialData.truePercentage - response);
  const rawError = diff;
  // Exact match → 0 error (paper convention)
  const log2Error = diff === 0 ? 0 : Math.log2(diff + (1 / 8));
  return { rawError, log2Error };
}

/**
 * STUB: viz module replacement.
 * Renders a plain text description so the experiment loop can run
 * without any visualization modules. Remove once viz files are ready.
 */
function _stubRender(container, trialData, label) {
  container.innerHTML = '';
  const msg = document.createElement('div');
  msg.style.cssText =
    'font-family:monospace;padding:20px;border:1px dashed #ccc;border-radius:4px;';
  msg.innerHTML = `
    <strong>[STUB] ${label}</strong><br><br>
    Values: [${trialData.values.join(', ')}]<br>
    Marked indices: ${trialData.marked[0]} and ${trialData.marked[1]}<br>
    Values at marked: 
      <strong>${trialData.values[trialData.marked[0]]}</strong>, 
      <strong>${trialData.values[trialData.marked[1]]}</strong><br>
    True percentage: ${trialData.truePercentage}%<br><br>
    <em>(Replace _stubRender by implementing a viz module)</em>
  `;
  container.appendChild(msg);
}

// ─── DOM Event Wiring (runs after DOM is ready) ───────────────────────────────

function initEventListeners() {
  // "Start" button on the intro screen
  const btnStart = document.getElementById(CONFIG.dom.btn_start);
  if (btnStart) btnStart.addEventListener('click', startExperiment);

  // "Submit" button on the trial/response screen
  const btnSubmit = document.getElementById(CONFIG.dom.response_submit);
  if (btnSubmit) btnSubmit.addEventListener('click', submitResponse);

  // Allow pressing Enter to submit
  const responseInput = document.getElementById(CONFIG.dom.response_input);
  if (responseInput) {
    responseInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitResponse();
    });
  }

  // "Copy CSV" convenience button (if present)
  const btnCopy = document.getElementById('btn-copy-csv');
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      const csvBox = document.getElementById(CONFIG.dom.csv_output);
      if (csvBox) {
        csvBox.select();
        document.execCommand('copy');
        btnCopy.textContent = 'Copied!';
        setTimeout(() => (btnCopy.textContent = 'Copy CSV'), 2000);
      }
    });
  }
}

// ─── Public API (exposed on window for debugging / cross-module access) ───────

window.Experiment = {
  /** Start programmatically (e.g. from a test harness). */
  start: startExperiment,

  /** Get all results recorded so far. */
  getResults: () => [...state.results],

  /** Get current experiment state snapshot (read-only copy). */
  getState: () => ({ ...state }),

  /** Reset for a new participant without reloading the page. */
  reset: () => {
    state.participantId = null;
    state.trialQueue = [];
    state.currentTrialIndex = 0;
    state.currentTrialData = null;
    state.currentCondition = null;
    state.results = [];
    state.startTime = null;
    showScreen('screen-intro');
    console.log('[experiment.js] State reset — ready for next participant.');
  },

  /** Expose config for teammates to inspect. */
  CONFIG,
};

// ─── Entry Point ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log('[experiment.js] DOM ready — wiring event listeners.');
  initEventListeners();
  showScreen('screen-intro');
});