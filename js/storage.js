/**
 * Persists experiment trial records to localStorage and supports CSV export.
 * Compatible with experiment.js expectations:
 *   window.Storage.save(trialRecord)
 *   window.Storage.getAll()
 *   window.Storage.exportCSV()
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'cm_experiment_records_v1'; 

  function _read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      console.warn('[storage.js] Failed to parse storage; resetting.', e);
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  }

  function _write(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function save(trialRecord) {
    const records = _read();

    // prevent accidental duplicates (same participant + trialNumber)
    const dupe = records.find(r =>
      r.participantId === trialRecord.participantId &&
      r.trialNumber === trialRecord.trialNumber
    );
    if (dupe) {
      console.warn('[storage.js] Duplicate detected; overwriting:', trialRecord);
      const idx = records.indexOf(dupe);
      records[idx] = trialRecord;
    } else {
      records.push(trialRecord);
    }

    _write(records);
  }

  function getAll() {
    return _read();
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function exportCSV(participantId = null) {
    let records = _read();

    // Optional filter: export one participant only
    if (participantId) {
      records = records.filter(r => r.participantId === participantId);
    }

    if (!records.length) return '';

    const headers = Object.keys(records[0]);

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      // Quote if it contains comma, quote, or newline
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const lines = [
      headers.join(','),
      ...records.map(r => headers.map(h => escapeCSV(r[h])).join(','))
    ];

    return lines.join('\n');
  }

  /**
   * download CSV file locally
   */
  function downloadCSV(participantId = null, filename = null) {
    const csv = exportCSV(participantId);

    if (!csv) {
      console.warn('[storage.js] No data to download');
      alert('No data available to download. Complete at least one trial first');
      return;
    }

    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0,19);
      if (participantId) {
        filename = `experiment_${participantId}_${timestamp}.csv`;
      } else {
        filename = `experiment_all_${timestamp}.csv`;
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    
    console.log(`[storage.js] downloaded: ${filename}`);
  }

  // Expose module
  window.Storage = {
    save,
    getAll,
    exportCSV,
    downloadCSV,
    clearAll,
    key: STORAGE_KEY
  };

  console.log('[storage.js] loaded successfully');
})();
