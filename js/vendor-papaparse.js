/* PapaParse-compatible local CSV parser for offline/local app use. */
(() => {
  if (window.Papa && typeof window.Papa.parse === 'function') return;
  function parseCSV(input, config = {}) {
    const text = String(input ?? '').replace(/^\uFEFF/, '');
    const delimiter = config.delimiter || detectDelimiter(text);
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else quoted = false;
        } else field += ch;
      } else if (ch === '"' && field === '') {
        quoted = true;
      } else if (ch === delimiter) {
        row.push(field); field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (config.skipEmptyLines && row.every(v => String(v).trim() === '')) { row = []; continue; }
        rows.push(row); row = [];
      } else field += ch;
    }
    if (field !== '' || row.length) {
      row.push(field);
      if (!(config.skipEmptyLines && row.every(v => String(v).trim() === ''))) rows.push(row);
    }
    if (!config.header) return { data: rows, errors: [], meta: { delimiter, fields: [] } };
    const headers = rows.shift() || [];
    const data = rows.map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] ?? ''; });
      return obj;
    });
    return { data, errors: [], meta: { delimiter, fields: headers } };
  }
  function detectDelimiter(text) {
    const line = (text.split(/\r?\n/).find(Boolean) || '');
    const candidates = [',', ';', '\t'];
    let best = ',', score = -1;
    candidates.forEach(d => { const n = line.split(d).length - 1; if (n > score) { score = n; best = d; } });
    return best;
  }
  window.Papa = { parse: parseCSV };
})();
