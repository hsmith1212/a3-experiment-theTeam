
'use strict';

// ─── Experiment Configuration ────────────────────────────────────────────────

const CONFIG = {
  pointsPerTrial: 5,
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
  trialQueue: [],       
  currentTrialIndex: 0, 
  currentTrialData: null,
  currentCondition: null,
  results: [],          
  startTime: null,      
};

// ─── helper functions  ─────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function el(id) {
  const node = document.getElementById(id);
  if (!node) throw new Error(`[experiment.js] Missing DOM element: #${id}`);
  return node;
}

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

// ─── Trial Queue ──────────────────────────────────────────────────────

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
 * for when participant clicks "Start Experiment".
 * Validates the participant ID, builds the queue, shows first trial
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
 * Advance to the next trial, or end the experiment if the queue is done
 */
function runNextTrial() {
  if (state.currentTrialIndex >= state.trialQueue.length) {
    endExperiment();
    return;
  }

  const { conditionId } = state.trialQueue[state.currentTrialIndex];
  state.currentCondition = CONFIG.conditions.find(c => c.id === conditionId);

  // ── 1. Generate trial data ───────────────────────────────────────────────
  let trialData;
  if (typeof window.DataGen !== 'undefined' && window.DataGen.generateTrialData) {
    trialData = window.DataGen.generateTrialData(CONFIG.pointsPerTrial);
  } else {
    console.error('[experiment.js] window.DataGen not found make sure data.js is loaded');
    alert('Error: data generation module not loaded, check console for details');
    return;
  }

  state.currentTrialData = trialData;

  // ── 2. Render the visualization ──────────────────────────────────────────
  const container = document.getElementById(CONFIG.dom.viz_container);
  if (!container) throw new Error('[experiment.js] Missing #viz-container in HTML');

  const vizModule = state.currentCondition.module();

  if (vizModule && typeof vizModule.render === 'function') {
    vizModule.clear && vizModule.clear(container); // clear previous
    vizModule.render(container, trialData);
  } 

  // ── 3. Update UI  ──────────────────────────────────────────────────
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

  // ── 6. Show trial screen ─────────────────────────────────────────────
  showScreen('screen-trial');

  console.log(
    `[experiment.js] Trial ${state.currentTrialIndex + 1} | condition: ${conditionId}`,
    trialData
  );
}

/**
 * Called when the participant submits their response.
 * Validates input, grades, stores, and advances
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

  // ── Grade response ───────────────────────────────────────────────────
  let grading;
  if (typeof window.Grader !== 'undefined' && window.Grader.score) {
    grading = window.Grader.score(state.currentTrialData, response);
  } else {
    console.error('[experiment.js] window.Grader not found! Make sure grading.js is loaded.');
    alert('Error: Grading module not loaded. Check console for details.');
    return;
  }

  // ── trial record ───────────────────────────────────────────────────
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

  // ── storage ───────────────────────────────────────────────
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

function endExperiment() {
  console.log('[experiment.js] Experiment complete. Total records:', state.results.length);

  let csv = '';
  if (window.Storage && window.Storage.exportCSV) {
    csv = window.Storage.exportCSV();
  }

  const csvBox = document.getElementById(CONFIG.dom.csv_output);
  if (csvBox) csvBox.value = csv;

  if (window.Analysis && window.Analysis.summarize) {
    const summary = window.Analysis.summarize(state.results);
    console.log('[experiment.js] Summary:', summary);
  }

  showScreen('screen-end');
}


// ─── DOM Event Wiring  ───────────────────────────────

function initEventListeners() {
  const btnStart = document.getElementById(CONFIG.dom.btn_start);
  if (btnStart) btnStart.addEventListener('click', startExperiment);

  const btnSubmit = document.getElementById(CONFIG.dom.response_submit);
  if (btnSubmit) btnSubmit.addEventListener('click', submitResponse);

  const responseInput = document.getElementById(CONFIG.dom.response_input);
  if (responseInput) {
    responseInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') submitResponse();
    });
  }

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



window.Experiment = {
  start: startExperiment,
  getResults: () => [...state.results],
  getState: () => ({ ...state }),
  /** Reset for a new participant without reloading the page */
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

  CONFIG,
};

// ─── Entry Point ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  console.log('[experiment.js] DOM ready — wiring event listeners.');
  initEventListeners();
  showScreen('screen-intro');
});