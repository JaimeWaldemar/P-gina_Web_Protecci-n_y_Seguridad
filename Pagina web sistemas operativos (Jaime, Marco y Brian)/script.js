/* ============================================================
   Módulo: Protección y Seguridad — Sistemas Operativos
   Navegación, búsqueda, índice, autoevaluación y fondo animado
   ============================================================ */

// ---------- Utilidades ----------
const TAB_ORDER = ['sec61', 'sec62', 'sec63', 'sec64', 'sec65', 'sec66', 'sec67', 'secRef'];

function getTabButton(tabId) {
  return document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
}

function getActiveTabId() {
  const active = document.querySelector('.tab-content.active');
  return active ? active.id : null;
}

// ---------- Control de Navegación por Pestañas ----------
function openTab(evt, tabId) {
  const target = document.getElementById(tabId);
  if (!target) return;

  // Ocultar todos los contenidos y quitar estado activo de los botones
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  // Mostrar el contenido solicitado
  target.classList.add('active');
  const btn = getTabButton(tabId);
  if (btn) btn.classList.add('active');

  // Reflejar la sección en la URL (permite enlaces y botón «atrás»)
  if (location.hash !== '#' + tabId) {
    location.hash = tabId;
  }

  // Situar la vista justo debajo de la cabecera, con la navegación fija arriba
  const main = document.querySelector('main');
  const nav = document.querySelector('.nav-container');
  if (main && nav) {
    const top = Math.max(0, main.offsetTop - nav.offsetHeight - 8);
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  if (evt && typeof evt.preventDefault === 'function') evt.preventDefault();
  updateProgressBar();
}

// Cambio de sección con los botones del navegador (atrás / adelante)
window.addEventListener('hashchange', function () {
  const id = location.hash.replace('#', '');
  if (TAB_ORDER.indexOf(id) !== -1 && id !== getActiveTabId()) {
    openTab(null, id);
  }
});

// Abrir la sección indicada en la URL al cargar la página
function openFromHash() {
  const id = location.hash.replace('#', '');
  if (TAB_ORDER.indexOf(id) !== -1) {
    openTab(null, id);
  }
}

/* ============================================================
   ÍNDICE AUTOMÁTICO POR SECCIÓN («En esta sección»)
   ============================================================ */
function buildSectionIndexes() {
  document.querySelectorAll('.tab-content').forEach(function (tab) {
    const title = tab.querySelector('h2.section-title');
    const subs = Array.from(tab.querySelectorAll('h3.sub-title'));
    if (!title || subs.length === 0) return;

    const nav = document.createElement('nav');
    nav.className = 'section-index';
    nav.setAttribute('aria-label', 'Índice de la sección');

    const label = document.createElement('span');
    label.className = 'section-index-label';
    label.textContent = 'En esta sección:';
    nav.appendChild(label);

    const ul = document.createElement('ul');
    subs.forEach(function (h, i) {
      if (!h.id) h.id = tab.id + '-sub-' + i;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    nav.appendChild(ul);
    title.insertAdjacentElement('afterend', nav);
  });
}

/* ============================================================
   PAGINACIÓN «ANTERIOR / SIGUIENTE» AL FINAL DE CADA SECCIÓN
   ============================================================ */
function buildPagers() {
  TAB_ORDER.forEach(function (id, i) {
    const tab = document.getElementById(id);
    if (!tab) return;
    const card = tab.querySelector('.section-card');
    if (!card) return;

    const prev = i > 0 ? TAB_ORDER[i - 1] : null;
    const next = i < TAB_ORDER.length - 1 ? TAB_ORDER[i + 1] : null;
    if (!prev && !next) return;

    const pager = document.createElement('nav');
    pager.className = 'section-pager';
    pager.setAttribute('aria-label', 'Navegación entre secciones');

    if (prev) {
      const b = document.createElement('button');
      b.className = 'pager-btn pager-prev';
      b.type = 'button';
      b.innerHTML = '<span class="pager-arrow">←</span> <span class="pager-label">' + getTabLabel(prev) + '</span>';
      b.addEventListener('click', function () { openTab(null, prev); });
      pager.appendChild(b);
    } else {
      const span = document.createElement('span');
      span.className = 'pager-spacer';
      pager.appendChild(span);
    }

    if (next) {
      const b = document.createElement('button');
      b.className = 'pager-btn pager-next';
      b.type = 'button';
      b.innerHTML = '<span class="pager-label">' + getTabLabel(next) + '</span> <span class="pager-arrow">→</span>';
      b.addEventListener('click', function () { openTab(null, next); });
      pager.appendChild(b);
    }

    card.appendChild(pager);
  });
}

function getTabLabel(tabId) {
  const btn = getTabButton(tabId);
  if (!btn) return tabId;
  const badge = btn.querySelector('.tab-badge');
  const badgeText = badge ? badge.textContent.trim() + ' ' : '';
  const clone = btn.cloneNode(true);
  clone.querySelectorAll('.tab-badge').forEach(el => el.remove());
  return badgeText + clone.textContent.trim();
}

/* ============================================================
   BOTÓN «COPIAR» EN LOS BLOQUES DE EJEMPLO
   ============================================================ */
function buildCopyButtons() {
  document.querySelectorAll('.example-container').forEach(function (box) {
    const header = box.querySelector('.example-header');
    const code = box.querySelector('pre code');
    if (!header || !code || header.querySelector('.copy-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'Copiar';
    btn.setAttribute('aria-label', 'Copiar ejemplo al portapapeles');

    btn.addEventListener('click', function () {
      const text = code.innerText;
      const done = function () {
        btn.textContent = '✓ Copiado';
        btn.classList.add('copied');
        setTimeout(function () {
          btn.textContent = 'Copiar';
          btn.classList.remove('copied');
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });

    header.appendChild(btn);
  });
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { /* sin portapapeles */ }
  document.body.removeChild(ta);
}

/* ============================================================
   AUTOEVALUACIÓN (QUIZ)
   ============================================================ */
function buildQuizzes() {
  document.querySelectorAll('.quiz-question').forEach(function (q) {
    const answer = q.getAttribute('data-answer');
    const explain = q.getAttribute('data-explain') || '';
    const feedback = q.querySelector('.quiz-feedback');
    const options = Array.from(q.querySelectorAll('.quiz-option'));

    options.forEach(function (opt) {
      opt.addEventListener('click', function () {
        if (q.classList.contains('answered')) return;
        q.classList.add('answered');

        const key = opt.getAttribute('data-key');
        const correct = key === answer;

        options.forEach(function (o) {
          o.disabled = true;
          const k = o.getAttribute('data-key');
          if (k === answer) o.classList.add('is-correct');
          else if (o === opt) o.classList.add('is-wrong');
          else o.classList.add('is-muted');
        });

        if (feedback) {
          feedback.textContent = (correct ? '✅ ¡Correcto! ' : '❌ Incorrecto. ') + explain;
          feedback.classList.add(correct ? 'fb-correct' : 'fb-wrong');
        }

        // Contabiliza el acierto en el panel de progreso
        if (correct && typeof Progress !== 'undefined') {
          const key = (q.querySelector('.quiz-text') || {}).textContent || q.textContent;
          const clean = key.replace(/^\s*\d+\.\s*/, '').trim();
          if (Progress.correct.indexOf(clean) === -1) {
            Progress.correct.push(clean);
            Progress.save();
            if (Progress.correct.length >= 15) award('estudioso');
            refreshDrawer();
          }
        }
      });
    });
  });
}

/* ============================================================
   BÚSQUEDA EN EL MÓDULO (Ctrl + K)
   ============================================================ */
const searchInput = document.getElementById('search-input');
const resultsBox = document.getElementById('search-results');
const countEl = document.getElementById('search-count');
let currentResults = [];
let highlightedEl = null;

function isSearchable(el) {
  if (!el) return false;
  if (el.closest('.quiz')) return false;
  if (el.closest('.section-index')) return false;
  if (el.closest('.section-pager')) return false;
  if (el.closest('.example-header')) return false;
  return true;
}

function performSearch(raw) {
  const q = raw.trim().toLowerCase();
  clearHighlights();
  currentResults = [];

  if (q.length < 2) {
    renderResults();
    if (countEl) countEl.textContent = '';
    return;
  }

  if (typeof Progress !== 'undefined' && !Progress.searched) {
    Progress.searched = true;
    Progress.save();
    award('curioso');
  }

  TAB_ORDER.forEach(function (tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;
    const nodes = tab.querySelectorAll('h2, h3, p, li, td, .concept-box, .book-note');
    nodes.forEach(function (el) {
      if (currentResults.length >= 10 || !isSearchable(el)) return;
      const text = el.textContent || '';
      const idx = text.toLowerCase().indexOf(q);
      if (idx === -1) return;
      const start = Math.max(0, idx - 45);
      const snippet = (start > 0 ? '…' : '') + text.substr(start, 130).trim() + (text.length > start + 130 ? '…' : '');
      currentResults.push({ tabId: tabId, el: el, term: raw.trim(), snippet: snippet });
    });
  });

  renderResults();
  if (countEl) {
    countEl.textContent = currentResults.length
      ? currentResults.length + (currentResults.length === 1 ? ' resultado' : ' resultados')
      : 'Sin resultados';
  }
}

function renderResults() {
  if (!resultsBox) return;
  resultsBox.innerHTML = '';
  if (!currentResults.length) {
    resultsBox.hidden = true;
    return;
  }
  resultsBox.hidden = false;

  currentResults.forEach(function (r, i) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'search-result';
    btn.setAttribute('role', 'option');

    const tabName = getTabLabel(r.tabId);
    btn.innerHTML = '<span class="sr-tab">' + tabName + '</span><span class="sr-snippet">' + escapeHtml(r.snippet) + '</span>';
    btn.addEventListener('click', function () { goToResult(i); });
    resultsBox.appendChild(btn);
  });
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function goToResult(i) {
  const r = currentResults[i];
  if (!r) return;
  openTab(null, r.tabId);
  resultsBox.hidden = true;
  setTimeout(function () {
    r.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlightIn(r.el, r.term);
  }, 350);
}

function clearHighlights() {
  document.querySelectorAll('mark.hl').forEach(function (m) {
    const parent = m.parentNode;
    parent.replaceChild(document.createTextNode(m.textContent), m);
    parent.normalize();
  });
  highlightedEl = null;
}

function highlightIn(el, term) {
  clearHighlights();
  if (!term) return;
  const lowerTerm = term.toLowerCase();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
  let node;
  while ((node = walker.nextNode())) {
    const idx = node.nodeValue.toLowerCase().indexOf(lowerTerm);
    if (idx === -1) continue;
    const after = node.splitText(idx);
    const mid = after.splitText(term.length);
    const mark = document.createElement('mark');
    mark.className = 'hl';
    mark.textContent = after.nodeValue;
    after.parentNode.replaceChild(mark, after);
    highlightedEl = mark;
    break;
  }
}

function closeResults() {
  if (resultsBox) resultsBox.hidden = true;
  if (countEl) countEl.textContent = '';
  clearHighlights();
}

if (searchInput) {
  searchInput.addEventListener('input', function () { performSearch(searchInput.value); });
  searchInput.addEventListener('focus', function () {
    if (searchInput.value.trim().length >= 2) performSearch(searchInput.value);
  });
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults.length) goToResult(0);
    } else if (e.key === 'Escape') {
      searchInput.value = '';
      closeResults();
      searchInput.blur();
    }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-box')) {
      if (resultsBox) resultsBox.hidden = true;
    }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

/* ============================================================
   BARRA DE PROGRESO DE LECTURA + BOTÓN «VOLVER ARRIBA»
   ============================================================ */
const progressBar = document.getElementById('progress-bar');
const backTop = document.getElementById('back-top');

function updateProgressBar() {
  if (!progressBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? (doc.scrollTop || document.body.scrollTop) / max * 100 : 0;
  progressBar.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

window.addEventListener('scroll', function () {
  updateProgressBar();
  if (backTop) {
    if (window.scrollY > 500) backTop.classList.add('visible');
    else backTop.classList.remove('visible');
  }
}, { passive: true });

if (backTop) {
  backTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   FECHA DE CITA ACADÉMICA
   ============================================================ */
(function fillCitationDate() {
  const el = document.getElementById('cite-date');
  if (!el) return;
  try {
    el.textContent = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    el.textContent = new Date().toLocaleDateString();
  }
})();

/* ============================================================
   FONDO DE RED DE NODOS DE CIBERSEGURIDAD (Fondo Formal)
   ============================================================ */
const canvas = document.getElementById('security-net-canvas');
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && canvas.getContext) {
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const nodes = [];
  const nodeCount = 45;

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1
    });
  }

  function drawNetwork() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      node.x += node.vx;
      node.y += node.vy;

      if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
      if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const other = nodes[j];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = 'rgba(168, 85, 247, ' + (0.15 * (1 - distance / 150)) + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    if (!reduceMotion) requestAnimationFrame(drawNetwork);
  }

  drawNetwork();
}

/* ============================================================
   CAPA INTERACTIVA — laboratorios, progreso y glosario
   ============================================================ */

// ---------- Almacenamiento persistente (tolerante a fallos) ----------
const Store = {
  get: function (k, def) {
    try { const v = localStorage.getItem('soseg_' + k); return v === null ? def : JSON.parse(v); }
    catch (e) { return def; }
  },
  set: function (k, v) { try { localStorage.setItem('soseg_' + k, JSON.stringify(v)); } catch (e) { /* modo privado */ } },
  del: function (k) { try { localStorage.removeItem('soseg_' + k); } catch (e) {} },
  wipe: function () {
    try {
      Object.keys(localStorage).filter(k => k.indexOf('soseg_') === 0).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }
};

const Progress = {
  visited: Store.get('visited', []),
  correct: Store.get('correct', []),
  labs: Store.get('labs', {}),
  badges: Store.get('badges', []),
  seconds: Store.get('seconds', 0),
  searched: Store.get('searched', false),

  save: function () {
    Store.set('visited', this.visited);
    Store.set('correct', this.correct);
    Store.set('labs', this.labs);
    Store.set('badges', this.badges);
    Store.set('seconds', this.seconds);
    Store.set('searched', this.searched);
  }
};

/* ============================================================
   MAPA RÁPIDO DE LA CABECERA
   ============================================================ */
document.querySelectorAll('.qm-tile').forEach(function (t) {
  t.addEventListener('click', function () { openTab(null, t.getAttribute('data-go')); });
});

/* ============================================================
   6.1 — TARJETAS VOLTEABLES
   ============================================================ */
(function () {
  const cards = document.querySelectorAll('#lab-flip61 .flip-card');
  const score = document.getElementById('flip61-score');
  const seen = new Set();

  cards.forEach(function (c) {
    c.setAttribute('type', 'button');
    c.addEventListener('click', function () {
      c.classList.toggle('flipped');
      if (c.classList.contains('flipped')) {
        seen.add(c);
        if (score) score.textContent = seen.size + ' de ' + cards.length + ' tarjetas descubiertas';
        if (seen.size === cards.length) markLab('flip61');
      }
    });
  });

  const reset = document.querySelector('[data-reset="flip61"]');
  if (reset) reset.addEventListener('click', function () {
    cards.forEach(function (c) { c.classList.remove('flipped'); });
    seen.clear();
    if (score) score.textContent = '0 de ' + cards.length + ' tarjetas descubiertas';
  });
})();

/* ============================================================
   6.2 — SIMULADOR BELL-LAPADULA
   ============================================================ */
(function () {
  const root = document.getElementById('lab-blp');
  if (!root) return;
  const state = { subject: 2, object: 2, op: 'read' };
  const names = ['Público (U)', 'Confidencial (C)', 'Secreto (S)', 'Estrictamente secreto (TS)'];
  const out = document.getElementById('blp-result');
  const rungs = root.querySelectorAll('.rung');

  function render() {
    rungs.forEach(function (r) {
      const lvl = +r.getAttribute('data-lvl');
      r.classList.toggle('on-subject', lvl === state.subject);
      r.classList.toggle('on-object', lvl === state.object);
    });

    const s = state.subject, o = state.object;
    let allow, rule, title, why;

    if (state.op === 'read') {
      allow = s >= o;
      rule = 'Regla simple — no leer hacia arriba';
      title = '📖 Leer';
      why = allow
        ? 'El sujeto <strong>' + names[s] + '</strong> está en un nivel igual o superior al objeto <strong>' + names[o] + '</strong>, así que puede leerlo sin ascender de nivel.'
        : 'El sujeto <strong>' + names[s] + '</strong> está <strong>por debajo</strong> del objeto <strong>' + names[o] + '</strong>. Leerlo le daría información de un nivel más alto: <em>no leer hacia arriba</em>.';
    } else {
      allow = s <= o;
      rule = 'Propiedad *  — no escribir hacia abajo';
      title = '✏️ Escribir';
      why = allow
        ? 'El sujeto <strong>' + names[s] + '</strong> escribe en un objeto de nivel igual o superior, de modo que no introduce datos secretos en un nivel más bajo.'
        : 'El sujeto <strong>' + names[s] + '</strong> intenta escribir en <strong>' + names[o] + '</strong>, un nivel inferior: filtraría información clasificada hacia abajo. <em>No escribir hacia abajo</em>.';
    }

    out.className = 'blp-result ' + (allow ? 'allow' : 'deny');
    out.innerHTML =
      '<span class="verdict">' + (allow ? '✅ PERMITIDO' : '❌ DENEGADO') + ' — ' + title + '</span>' +
      why +
      '<br><span class="rule">' + rule + '</span>' +
      (s === o && allow ? '<br><small>Mismo nivel: siempre permitido en Bell-LaPadula.</small>' : '');
  }

  root.querySelectorAll('.seg').forEach(function (seg) {
    const group = seg.getAttribute('data-group');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        seg.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        state[group] = group === 'op' ? b.getAttribute('data-val') : +b.getAttribute('data-val');
        render();
      });
    });
  });

  render();
})();

/* ============================================================
   6.3 — ARRASTRAR Y SOLTAR: DOMINIO vs RECURSO
   ============================================================ */
(function () {
  const root = document.getElementById('lab-dd');
  if (!root) return;
  const pool = root.querySelector('.dd-items');
  const msg = document.getElementById('dd-msg');
  const scoreEl = document.getElementById('dd-score');
  const originals = Array.from(pool.querySelectorAll('.dd-item'));
  let selected = null;
  let solved = 0;

  function refresh() {
    scoreEl.textContent = solved + ' / ' + originals.length + ' clasificadas correctamente';
  }

  function reset() {
    solved = 0;
    selected = null;
    root.querySelectorAll('.dd-slot .dd-item').forEach(function (it) {
      it.classList.remove('correct', 'wrong', 'selected');
      it.removeAttribute('draggable');
      pool.appendChild(it);
    });
    msg.textContent = '';
    msg.className = 'dd-msg';
    refresh();
  }

  originals.forEach(function (item) {
    item.setAttribute('draggable', 'true');

    item.addEventListener('dragstart', function (e) {
      selected = item;
      item.classList.add('selected');
      try { e.dataTransfer.setData('text/plain', 'x'); } catch (err) {}
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', function () {
      item.classList.remove('selected');
      document.querySelectorAll('.dd-bin').forEach(b => b.classList.remove('dragover'));
    });

    item.addEventListener('click', function () {
      if (item.classList.contains('correct')) return;
      if (selected === item) {
        item.classList.remove('selected');
        selected = null;
        return;
      }
      originals.forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selected = item;
    });
  });

  root.querySelectorAll('.dd-bin').forEach(function (bin) {
    bin.addEventListener('dragover', function (e) { e.preventDefault(); bin.classList.add('dragover'); });
    bin.addEventListener('dragleave', function () { bin.classList.remove('dragover'); });
    bin.addEventListener('drop', function (e) {
      e.preventDefault();
      bin.classList.remove('dragover');
      place(selected, bin);
    });
    bin.addEventListener('click', function () { if (selected) place(selected, bin); });
  });

  function place(item, bin) {
    if (!item || item.classList.contains('correct')) return;
    const want = item.getAttribute('data-kind');
    const got = bin.getAttribute('data-bin');
    const slot = bin.querySelector('.dd-slot');

    if (want === got) {
      item.classList.add('correct');
      item.classList.remove('selected', 'wrong');
      item.removeAttribute('draggable');
      slot.appendChild(item);
      solved++;
      msg.textContent = '✔ ¡Correcto! ' + (want === 'dom'
        ? 'Es un sujeto: actúa sobre los recursos.'
        : 'Es un objeto: sobre él se actúa.');
      msg.className = 'dd-msg ok';
      if (solved === originals.length) {
        msg.textContent = '🏆 ¡Perfecto! Has dominado la distinción sujeto–recurso.';
        markLab('dd');
      }
    } else {
      item.classList.add('wrong');
      msg.textContent = '✘ Eso no es ' + (got === 'dom' ? 'un dominio' : 'un recurso') + '. Piensa: ¿quién actúa o sobre qué se actúa?';
      msg.className = 'dd-msg bad';
      setTimeout(function () { item.classList.remove('wrong', 'selected'); selected = null; }, 850);
      return;
    }
    selected = null;
    refresh();
  }

  const resetBtn = root.querySelector('[data-reset="dd"]');
  if (resetBtn) resetBtn.addEventListener('click', reset);
  refresh();
})();

/* ============================================================
   6.4 — CHMOD + MATRIZ DE ACCESO
   ============================================================ */
(function () {
  const boxes = document.querySelectorAll('.chk input');
  if (!boxes.length) return;
  const octalEl = document.getElementById('chmod-octal');
  const cmdEl = document.getElementById('chmod-cmd');
  const lsEl = document.getElementById('chmod-ls');
  const verdict = document.getElementById('chmod-verdict');

  const SYM = { r: 'r', w: 'w', x: 'x' };

  function mode() {
    const m = { u: 0, g: 0, o: 0 };
    boxes.forEach(function (b) {
      if (b.checked) m[b.getAttribute('data-who')] += +b.getAttribute('data-bit');
    });
    return m;
  }

  function render() {
    const m = mode();
    const oct = '' + m.u + m.g + m.o;
    octalEl.textContent = oct;
    cmdEl.textContent = 'chmod ' + oct + ' archivo.txt';

    function bits(v, who) {
      let s = '';
      s += (v & 4) ? 'r' : '-';
      s += (v & 2) ? 'w' : '-';
      s += (v & 1) ? 'x' : '-';
      return s;
    }
    lsEl.textContent = '-' + bits(m.u) + bits(m.g) + bits(m.o) + ' 1 juan contadores 4096 … archivo.txt';

    let v = '', bad = false;
    if (oct === '777') { v = '⚠️ <strong>777 es peligroso:</strong> cualquier usuario del equipo puede modificar el archivo y ejecutarlo. Úsalo solo en carpetas de intercambio muy concretas.'; bad = true; }
    else if (oct === '644') { v = '✅ Fichero de datos normal: el dueño lee y escribe; el resto solo lee.'; }
    else if (oct === '755') { v = '✅ Script o directorio ejecutable: el dueño controla todo y los demás solo entran y leen.'; }
    else if (oct === '600' || oct === '700') { v = '🔐 Acceso exclusivo al dueño: el patrón correcto para claves privadas y <code>/etc/shadow</code>.'; }
    else if (m.o & 2) { v = '⚠️ <strong>«Otros» tienen permiso de escritura:</strong> cualquiera puede alterar el archivo.'; bad = true; }
    else if (m.o & 1 && !(m.o & 4)) { v = '🤔 Curioso: «otros» pueden ejecutarlo pero no leerlo (lo habitual es al revés).'; }
    else { v = 'ℹ️ Permisos personalizados: revisa que coincidan con la política de la organización.'; }
    verdict.innerHTML = v;
    verdict.classList.toggle('bad', bad);
  }

  boxes.forEach(b => b.addEventListener('change', render));

  document.querySelectorAll('.preset').forEach(function (p) {
    p.addEventListener('click', function () {
      const oct = p.getAttribute('data-mode');
      boxes.forEach(function (b) {
        const who = b.getAttribute('data-who');
        const bit = +b.getAttribute('data-bit');
        const idx = { u: 0, g: 1, o: 2 }[who];
        b.checked = (+oct[idx] & bit) !== 0;
      });
      render();
    });
  });

  const copyBtn = document.getElementById('chmod-copy');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    const done = function () {
      copyBtn.textContent = '✓ Copiado';
      copyBtn.classList.add('copied');
      setTimeout(function () { copyBtn.textContent = 'Copiar'; copyBtn.classList.remove('copied'); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cmdEl.textContent).then(done).catch(function () { fallbackCopy(cmdEl.textContent, done); });
    } else fallbackCopy(cmdEl.textContent, done);
  });

  render();

  // ---------- Matriz de acceso interactiva ----------
  const subjects = ['Proceso «navegador»', 'Usuario juan', 'Grupo contadores', 'Usuario root'];
  const objects = ['nómina.txt', 'base.dat', '/dev/sda', 'informe.pdf'];
  const CYCLE = ['', 'r', 'rw', 'rwx', 'w', 'wx', 'x'];
  const body = document.getElementById('aml-body');
  const aclOut = document.getElementById('aml-acl');
  const capOut = document.getElementById('aml-cap');
  const amlScore = document.getElementById('aml-score');
  const DEFAULT = [
    ['r', '', '', 'r'],
    ['rw', 'r', '', 'rw'],
    ['r', 'rw', '', ''],
    ['rwx', 'rwx', 'rwx', 'rwx']
  ];
  let data = DEFAULT.map(r => r.slice());

  function build() {
    body.innerHTML = '';
    subjects.forEach(function (s, i) {
      const tr = document.createElement('tr');
      const th = document.createElement('td');
      th.className = 'subject';
      th.innerHTML = '<strong>' + s + '</strong>';
      tr.appendChild(th);
      objects.forEach(function (o, j) {
        const td = document.createElement('td');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'aml-cell';
        b.textContent = data[i][j] || '—';
        b.setAttribute('data-rights', data[i][j]);
        b.title = s + ' → ' + o + ' : pulsa para cambiar';
        b.addEventListener('click', function () {
          const cur = CYCLE.indexOf(data[i][j]);
          data[i][j] = CYCLE[(cur + 1) % CYCLE.length];
          b.textContent = data[i][j] || '—';
          b.setAttribute('data-rights', data[i][j]);
          renderOut();
        });
        td.appendChild(b);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    renderOut();
  }

  function renderOut() {
    const acls = [];
    const caps = [];
    let total = 0;
    data.forEach(function (row, i) {
      row.forEach(function (rights, j) {
        if (!rights) return;
        total++;
        acls.push(objects[j] + ': user:' + subjects[i].replace(/.*«|»/g, '') + ':' + rights);
        caps.push('  ' + subjects[i] + ' → ' + objects[j] + '  [' + rights + ']');
      });
    });
    aclOut.textContent = acls.length ? '$ getfacl archivo\n' + acls.slice(0, 7).join('\n') + (acls.length > 7 ? '\n… +' + (acls.length - 7) + ' más' : '') : '$ getfacl archivo\n# sin permisos concedidos';
    capOut.textContent = caps.length ? caps.slice(0, 7).join('\n') + (caps.length > 7 ? '\n… +' + (caps.length - 7) + ' más' : '') : '# ninguna capacidad otorgada';
    amlScore.textContent = total + ' derechos asignados · ' + subjects.length + ' sujetos × ' + objects.length + ' objetos';
    markLab('aml', total > 12);
  }

  const amlReset = document.querySelector('[data-reset="aml"]');
  if (amlReset) amlReset.addEventListener('click', function () {
    data = DEFAULT.map(r => r.slice());
    build();
  });

  build();
})();

/* ============================================================
   6.5 — ACORDEÓN + ASISTENTE DE DECISIÓN
   ============================================================ */
(function () {
  document.querySelectorAll('#acc65 .acc-head').forEach(function (h) {
    h.setAttribute('type', 'button');
    h.addEventListener('click', function () {
      const item = h.parentElement;
      const open = item.classList.toggle('open');
      h.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  const tree = document.getElementById('tree65');
  if (!tree) return;
  const trail = document.getElementById('tree-trail');
  const result = document.getElementById('tree-result');
  const tags = [];

  const ADVICE = {
    'sandbox-estricta': ['🛡️ Sandbox estricta con permisos mínimos', 'Aísla el código en un entorno acotado, denegando por defecto todo lo no expresamente permitido. En Java, una <code>SecurityManager</code> con política de permisos; en el navegador, el modelo de origen (CORS) y WebAssembly sin acceso al sistema de archivos.'],
    'sandbox': ['📦 Sandbox + verificación en tiempo de compilación', 'Combina un entorno acotado con validaciones estáticas antes de ejecutar: si el compilador o el cargador detectan accesos prohibidos, el código ni siquiera llega a correr. Es la defensa en profundidad que prefiere Tanenbaum para código de terceros.'],
    'firma': ['✍️ Firma de código + cadena de confianza', 'Exige que cada módulo venga firmado por un emisor de confianza (certificado X.509) y comprueba la integridad con un hash antes de cargarlo. Si la verificación falla, no se ejecuta. Añade <strong>no repudio</strong>: se puede demostrar quién autorizó la ejecución.'],
    'externo': ['🔑 Controles de acceso en el SO + auditoría', 'Cuando el código es de terceros, el sistema operativo sigue siendo el guardián final: ACL sobre archivos y dispositivos, privilegios mínimos y bitácora de cada acceso. La política la fija la organización; el mecanismo lo implementa el núcleo.'],
    'propio': ['🔍 Revisión + pruebas antes de firmar', 'Si el código lo escribe tu equipo, invierte en validación estática, revisiones de código y pruebas de seguridad en el ciclo de desarrollo; después fírmalo para que el receptor pueda verificar procedencia e integridad.'],
    'critico': ['🔐 Autenticación fuerte y mínimo de privilegios', 'Para datos críticos añade autenticación multifactor (NIST SP 800-63B), separación de privilegios y registro firmado de cada operación sensible. Nunca confíes solo en la identidad del proceso: valida también a la persona.'],
    'normal': ['⚙️ Permisos estándar y copias de seguridad', 'Con uso general bastan permisos coherentes (<code>755</code>/<code>644</code>), actualizaciones puntuales y copias de seguridad verificadas.'],
    'reset': ['🔄 Reiniciado', 'Vuelve a responder las preguntas para obtener una nueva recomendación.']
  };

  tree.querySelectorAll('.tree-opts button').forEach(function (b) {
    b.setAttribute('type', 'button');
    b.addEventListener('click', function () {
      const tag = b.getAttribute('data-tag');
      const next = b.getAttribute('data-next');
      if (tag === 'reset') {
        tags.length = 0;
      } else if (tag) {
        tags.push(tag);
      }
      tree.querySelectorAll('.tree-step').forEach(function (s) {
        s.hidden = (+s.getAttribute('data-step') !== +next);
      });
      if (+next === 8) {
        const key = tags[tags.length - 1] || 'normal';
        const a = ADVICE[key] || ADVICE.normal;
        result.innerHTML = '<h5>' + a[0] + '</h5>' + a[1];
        trail.innerHTML = tags.map(t => '<span class="tree-chip">' + t + '</span>').join('');
      }
    });
  });
})();

/* ============================================================
   6.6 — MEDIDOR DE CONTRASEÑAS
   ============================================================ */
(function () {
  const input = document.getElementById('pass-input');
  if (!input) return;
  const fill = document.getElementById('pass-fill');
  const level = document.getElementById('pass-level');
  const bitsEl = document.getElementById('pass-bits');
  const timeEl = document.getElementById('pass-time');
  const spaceEl = document.getElementById('pass-space');
  const checks = document.getElementById('pass-checks');
  const COMMON = ['contraseña', 'password', 'qwerty', '123456', '12345678', 'admin', 'usuario', 'seguridad', 'sistema', 'iloveyou', 'monkey', 'dragon', 'letmein', 'master', 'abc123', 'football', 'welcome'];

  function poolSize(pw) {
    let n = 0;
    if (/[a-z]/.test(pw)) n += 26;
    if (/[A-Z]/.test(pw)) n += 26;
    if (/[0-9]/.test(pw)) n += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) n += 33;
    if (/[áéíóúñüÁÉÍÓÚÑÜ]/.test(pw)) n += 12;
    return n;
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec <= 0) return 'instantáneo';
    const units = [
      ['segundos', 60], ['minutos', 60], ['horas', 24], ['días', 365],
      ['años', 1000], ['milenios', 1000], ['millones de milenios', Infinity]
    ];
    let v = sec, u = 'segundos';
    for (let i = 0; i < units.length; i++) {
      if (v < units[i][1]) { u = units[i][0]; break; }
      v /= units[i][1];
      u = units[i + 1] ? units[i + 1][0] : u;
    }
    if (v >= 1e12) return 'más de un billón de años';
    return (v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('es-ES')) + ' ' + u;
  }

  function evaluate() {
    const pw = input.value;
    const rules = {
      len8: pw.length >= 8,
      len12: pw.length >= 12,
      upper: /[A-ZÁÉÍÓÚÑÜ]/.test(pw),
      lower: /[a-záéíóúñü]/.test(pw),
      digit: /[0-9]/.test(pw),
      sym: /[^a-zA-Z0-9áéíóúñüÁÉÍÓÚÑÜ\s]/.test(pw),
      common: pw.length > 0 && !COMMON.some(c => pw.toLowerCase().indexOf(c) !== -1) && !/(.)\1{2,}/.test(pw) && !/^(0123|1234|abcd|qwer|asdf)/i.test(pw)
    };

    checks.querySelectorAll('li').forEach(function (li) {
      li.classList.toggle('ok', !!rules[li.getAttribute('data-rule')]);
    });

    if (!pw) {
      fill.style.width = '0%';
      level.textContent = '—';
      level.style.color = '#ef4444';
      bitsEl.textContent = '0 bits de entropía';
      timeEl.textContent = 'instantáneo';
      spaceEl.textContent = '—';
      return;
    }

    const size = poolSize(pw);
    let bits = pw.length * Math.log2(Math.max(size, 2));
    if (!rules.common) bits = Math.min(bits, 12);
    if (rules.common && pw.length < 8) bits = Math.min(bits, 18);
    bits = Math.max(0, Math.round(bits));

    const pct = Math.min(100, Math.round(bits / 80 * 100));
    fill.style.width = pct + '%';

    let label, color;
    if (bits < 28) { label = '🔴 Muy débil'; color = '#ef4444'; }
    else if (bits < 44) { label = '🟠 Débil'; color = '#f97316'; }
    else if (bits < 60) { label = '🟡 Aceptable'; color = '#fbbf24'; }
    else if (bits < 80) { label = '🟢 Fuerte'; color = '#e879f9'; }
    else { label = '💎 Muy fuerte'; color = '#22d3ee'; }

    fill.style.background = color;
    level.textContent = label;
    level.style.color = color;
    bitsEl.textContent = bits + ' bits de entropía';
    spaceEl.textContent = Math.pow(2, bits).toExponential(1).replace('e+', ' × 10^') + ' combinaciones';
    timeEl.textContent = fmtTime(Math.pow(2, bits - 1) / 1e9);
  }

  input.addEventListener('input', evaluate);

  document.getElementById('pass-gen').addEventListener('click', function () {
    const A = ['caballo', 'lampara', 'norte', 'tigre', 'delfin', 'orbita', 'cactus', 'niebla', 'latigo', 'puente', 'zafiro', 'molino'];
    const pick = () => A[Math.floor(Math.random() * A.length)];
    const sym = ['!', '#', '$', '%', '&', '*'][Math.floor(Math.random() * 6)];
    input.value = pick() + '-' + pick() + '-' + pick() + sym + Math.floor(Math.random() * 90 + 10);
    evaluate();
  });

  evaluate();
})();

/* ============================================================
   6.6 — JUEGO DE CLASIFICAR AMENAZAS
   ============================================================ */
(function () {
  const startBtn = document.getElementById('threat-start');
  if (!startBtn) return;
  const card = document.getElementById('threat-card');
  const opts = document.getElementById('threat-opts');
  const scoreEl = document.getElementById('threat-score');
  const msg = document.getElementById('threat-msg');
  const bar = document.getElementById('threat-timer');

  const ROUNDS = [
    { t: 'Un correo que imita al banco pide iniciar sesión en una web falsa para «verificar» la cuenta.', c: 'externo' },
    { t: 'Un empleado con privilegios copia la base de clientes a un USB antes de dimitir.', c: 'interno' },
    { t: 'Un gusano se propaga por la red sin intervención del usuario y congestiona los enlaces.', c: 'malware' },
    { t: 'Un incendio en el cuarto eléctrico deja el centro de datos sin energía durante horas.', c: 'fisico' },
    { t: 'Un proceso cifra todos los archivos del servidor y exige un pago por descifrarlos.', c: 'malware' },
    { t: 'Un atacante desde Internet aprovecha un desbordamiento de búfer en un servicio expuesto.', c: 'externo' },
    { t: 'Un administrador guarda las contraseñas de producción en una hoja de cálculo compartida.', c: 'interno' },
    { t: 'Un disco duro con años de servicio falla de forma irreversible y sin aviso previo.', c: 'fisico' },
    { t: 'Un troyano se hace pasar por un programa útil y roba las credenciales guardadas.', c: 'malware' },
    { t: 'Un proveedor externo accede a datos que no necesitaba para su trabajo.', c: 'externo' },
    { t: 'Alguien del equipo desactiva el registro de auditoría para ocultar sus accesos.', c: 'interno' },
    { t: 'Una inundación en el sótano daña las cintas de respaldo almacenadas allí.', c: 'fisico' }
  ];
  const LABELS = { malware: '🦠 Malware', interno: '🕵️ Ataque interno', externo: '🌐 Ataque externo', fisico: '🔥 Fallo físico / desastre' };

  let deck = [], idx = 0, hits = 0, timeLeft = 10, timer = null, running = false;

  function setDisabled(v) {
    opts.querySelectorAll('button').forEach(b => b.disabled = v);
  }

  function tick() {
    timeLeft -= 0.1;
    bar.style.width = Math.max(0, timeLeft / 10 * 100) + '%';
    if (timeLeft <= 0) { clearInterval(timer); timer = null; answer(null); }
  }

  function next() {
    if (idx >= deck.length) { finish(); return; }
    card.innerHTML = '<strong>Ronda ' + (idx + 1) + '/' + deck.length + ':</strong> ' + deck[idx].t;
    timeLeft = 10;
    bar.style.width = '100%';
    msg.textContent = '';
    msg.className = 'dd-msg';
    setDisabled(false);
    opts.querySelectorAll('button').forEach(b => b.classList.remove('right', 'wrong'));
    if (!timer) timer = setInterval(tick, 100);
  }

  function answer(cat) {
    if (timer) { clearInterval(timer); timer = null; }
    setDisabled(true);
    const correct = deck[idx].c;
    const ok = cat === correct;
    if (ok) hits++;

    opts.querySelectorAll('button').forEach(function (b) {
      if (b.getAttribute('data-cat') === correct) b.classList.add('right');
      else if (cat && b.getAttribute('data-cat') === cat) b.classList.add('wrong');
    });

    msg.innerHTML = ok ? '✔ ¡Bien! Era ' + LABELS[correct] : '✘ Era ' + LABELS[correct];
    msg.className = 'dd-msg ' + (ok ? 'ok' : 'bad');
    scoreEl.textContent = 'Ronda ' + (idx + 1) + '/' + deck.length + ' · ' + hits + ' aciertos';
    idx++;
    setTimeout(next, 1250);
  }

  function finish() {
    running = false;
    startBtn.textContent = '🔁 Otra vez';
    setDisabled(true);
    card.innerHTML = '<strong>🏁 ¡Terminado!</strong> Has acertado <strong>' + hits + ' de ' + deck.length + '</strong> amenazas.';
    const good = hits >= deck.length * 0.7;
    msg.textContent = good ? '🏆 ¡Excelente ojo clínico!' : '💪 Repasa la sección 6.6 y vuelve a intentarlo.';
    msg.className = 'dd-msg ' + (good ? 'ok' : 'bad');
    bar.style.width = '0%';
    if (good) markLab('threat');
  }

  opts.querySelectorAll('button').forEach(function (b) {
    b.setAttribute('type', 'button');
    b.addEventListener('click', function () { if (running) answer(b.getAttribute('data-cat')); });
  });

  startBtn.setAttribute('type', 'button');
  startBtn.addEventListener('click', function () {
    deck = ROUNDS.slice().sort(() => Math.random() - 0.5).slice(0, 6);
    idx = 0; hits = 0; running = true;
    startBtn.textContent = '🔄 Reiniciar';
    next();
  });

  setDisabled(true);
})();

/* ============================================================
   6.6 — FILTRO DE TABLAS
   ============================================================ */
(function () {
  const input = document.getElementById('threat-filter');
  if (!input) return;
  const count = document.getElementById('filter-count');
  const tables = Array.from(document.querySelectorAll('#sec66 table.matrix-table'));
  if (!tables.length) return;
  const rows = tables.reduce(function (acc, t) {
    return acc.concat(Array.from(t.querySelectorAll('tbody tr')));
  }, []);
  const total = rows.length;

  function apply() {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach(function (r) {
      const hit = !q || r.textContent.toLowerCase().indexOf(q) !== -1;
      r.classList.toggle('filter-hidden', !hit);
      if (hit) shown++;
    });
    count.textContent = q ? shown + ' de ' + total + ' filas' : total + ' filas';
  }

  input.addEventListener('input', apply);

  document.querySelectorAll('#filter-chips .chip').forEach(function (c) {
    c.setAttribute('type', 'button');
    c.addEventListener('click', function () {
      const v = c.getAttribute('data-chip');
      const on = c.classList.contains('on');
      document.querySelectorAll('#filter-chips .chip').forEach(x => x.classList.remove('on'));
      if (on) { input.value = ''; }
      else { c.classList.add('on'); input.value = v; }
      apply();
    });
  });

  apply();
})();

/* ============================================================
   6.7 — CIFRADO CÉSAR
   ============================================================ */
(function () {
  const inp = document.getElementById('caesar-in');
  if (!inp) return;
  const out = document.getElementById('caesar-out');
  const shift = document.getElementById('caesar-shift');
  const shiftVal = document.getElementById('caesar-shift-val');
  const track = document.getElementById('caesar-track');
  const brute = document.getElementById('brute-list');
  let reverse = false;

  function caesar(text, k, dir) {
    const d = dir < 0 ? -1 : 1;
    const k1 = Math.abs(k) % 26;   // alfabeto ASCII: 26 letras
    const k2 = Math.abs(k) % 7;    // letras acentuadas: 7 letras (áéíóúñü)
    const low = 'abcdefghijklmnopqrstuvwxyz';
    const up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const acc = 'áéíóúñü';
    const accUp = 'ÁÉÍÓÚÑÜ';
    const rot = function (list, shift) {
      const L = list.length;
      return function (ch) {
        const i = list.indexOf(ch);
        if (i === -1) return ch;
        return list[(((i + d * shift) % L) + L) % L];
      };
    };
    const rl = rot(low, k1), ru = rot(up, k1), ra = rot(acc, k2), rau = rot(accUp, k2);
    return text.replace(/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g, function (ch) {
      if (ch >= 'a' && ch <= 'z') return rl(ch);
      if (ch >= 'A' && ch <= 'Z') return ru(ch);
      if (acc.indexOf(ch) !== -1) return ra(ch);
      return rau(ch);
    });
  }

  function render() {
    const k = +shift.value;
    shiftVal.textContent = k;
    out.value = caesar(inp.value, k, reverse ? -1 : 1);
    updateLabels();

    track.innerHTML = '';
    inp.value.split('').forEach(function (ch, i) {
      const d = document.createElement('span');
      d.className = 'cq-letter' + (ch !== out.value[i] && /[a-záéíóúñü]/i.test(ch) ? ' changed' : '');
      d.textContent = out.value[i] === undefined ? '' : out.value[i];
      track.appendChild(d);
    });

    brute.innerHTML = '';
    for (let i = 1; i <= 25; i++) {
      const row = document.createElement('div');
      row.className = 'brute-row' + (i === k ? ' hit' : '');
      const b = document.createElement('b');
      b.textContent = String(i).padStart(2, '0');
      const s = document.createElement('span');
      s.textContent = caesar(inp.value, i, 1);
      row.appendChild(b); row.appendChild(s);
      brute.appendChild(row);
    }
  }

  inp.addEventListener('input', render);
  shift.addEventListener('input', render);

  const rev = document.getElementById('caesar-reverse');
  const labIn = document.getElementById('caesar-lab-in');
  const labOut = document.getElementById('caesar-lab-out');
  const hint = document.getElementById('caesar-hint');
  rev.setAttribute('type', 'button');

  function updateLabels() {
    if (reverse) {
      labIn.textContent = 'Texto cifrado (ciphertext)';
      labOut.textContent = 'Texto descifrado (plaintext recuperado)';
      rev.textContent = '🔁 Volver a cifrar';
      if (hint) hint.textContent = 'Clave inversa: cada letra retrocede 3 posiciones y recupera el original.';
    } else {
      labIn.textContent = 'Texto original (plaintext)';
      labOut.textContent = 'Texto cifrado (ciphertext)';
      rev.textContent = '↩️ Descifrar (invertir clave)';
      if (hint) hint.textContent = 'Cada letra avanza ' + shift.value + ' posiciones en el alfabeto.';
    }
  }

  rev.addEventListener('click', function () {
    const currentOut = out.value;   // el resultado pasa a ser la nueva entrada
    reverse = !reverse;
    inp.value = currentOut;
    updateLabels();
    render();
  });

  const cp = document.getElementById('caesar-copy');
  cp.setAttribute('type', 'button');
  cp.addEventListener('click', function () {
    const done = function () {
      cp.textContent = '✓ Copiado';
      cp.classList.add('copied');
      setTimeout(function () { cp.textContent = 'Copiar'; cp.classList.remove('copied'); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(out.value).then(done).catch(function () { fallbackCopy(out.value, done); });
    } else fallbackCopy(out.value, done);
  });

  render();
})();

/* ============================================================
   6.7 — FUNCIONES HASH (SHA-256 en el navegador)
   ============================================================ */
(function () {
  const inp = document.getElementById('hash-in');
  if (!inp) return;
  const out = document.getElementById('hash-out');
  const out2 = document.getElementById('hash-out2');
  const wrap2 = document.getElementById('hash-compare');
  const diff = document.getElementById('hash-diff');
  const bars = document.getElementById('hash-bars');
  const flip = document.getElementById('hash-flip');
  let alt = null;

  function digest(text) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
        .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
    }
    // Reserva determinista si Web Crypto no está disponible
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < text.length; i++) {
      h1 = Math.imul(h1 ^ text.charCodeAt(i), 16777619) >>> 0;
      h2 = Math.imul(h2 + text.charCodeAt(i) * (i + 7), 2246822519) >>> 0;
    }
    let s = '';
    for (let i = 0; i < 8; i++) {
      h1 = Math.imul(h1 ^ (h1 >>> 13), 1274126177) >>> 0;
      h2 = Math.imul(h2 ^ (h2 >>> 16), 668265263) >>> 0;
      s += (h1 ^ h2).toString(16).padStart(8, '0');
    }
    return Promise.resolve(s.slice(0, 64));
  }

  function paint(el, hex) {
    el.textContent = hex;
    if (el !== out) return;
    bars.innerHTML = '';
    for (let i = 0; i < 64; i++) {
      const d = document.createElement('span');
      d.className = 'hb';
      const v = parseInt(hex.substr(i * 2, 2), 16) || 0;
      d.style.background = 'hsl(' + (180 + v * 0.6) + ', 70%, ' + (30 + v * 0.22) + '%)';
      bars.appendChild(d);
    }
  }

  function update() {
    const t = inp.value;
    digest(t).then(function (h) { paint(out, h); return h; }).then(function (h) {
      if (alt) {
        digest(alt).then(function (h2) {
          paint(out2, h2);
          wrap2.hidden = false;
          let same = 0;
          for (let i = 0; i < 64; i++) if (h[i] === h2[i]) same++;
          diff.innerHTML = 'Cambiaste <strong>' + escapeHtml(t) + '</strong> por <strong>' + escapeHtml(alt) +
            '</strong> (1 carácter) y el hash cambió en <strong>' + (64 - same) + ' de 64</strong> posiciones: efecto avalancha. ' +
            'Recuperar el mensaje a partir del hash es inviable.';
        });
      }
    });
  }

  flip.setAttribute('type', 'button');
  flip.addEventListener('click', function () {
    const base = inp.value || 'Proteccion y seguridad';
    const letters = 'aeiouABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const i = Math.floor(Math.random() * base.length);
    const ch = letters[Math.floor(Math.random() * letters.length)];
    alt = base.slice(0, i) + ch + base.slice(i + 1);
    if (alt === base) alt = base + ch;
    inp.value = base;
    update();
  });

  inp.addEventListener('input', function () { alt = null; wrap2.hidden = true; update(); });
  update();
})();

/* ============================================================
   GLOSARIO AUTOMÁTICO (desplegables)
   ============================================================ */
const GLOSSARY = {
  'protección': 'Conjunto de reglas y mecanismos del sistema operativo que deciden quién puede hacer qué con cada recurso (Tanenbaum, cap. 9.3).',
  'seguridad': 'El problema completo: proteger la información y los recursos frente a accesos no autorizados, fallos y desastres (cap. 9.1).',
  'política': 'La norma fija por la organización: qué se quiere lograr. Puede cambiar sin reescribir el sistema operativo.',
  'mecanismo': 'La herramienta concreta del SO que hace efectiva la política: ACL, capabilities, cifrado, comprobación de contraseñas.',
  'dominio de protección': 'Conjunto de objetos a los que un proceso tiene acceso en un momento dado; cada proceso se ejecuta dentro de un dominio (cap. 9.3.1).',
  'base de cómputo confiable': 'TCB: todo el hardware, software y procedimientos que aplican la política de seguridad de un sistema (cap. 9.3.5).',
  'monitor de referencia': 'Pieza de código que medía cada acceso de un sujeto a un objeto según la política; base del concepto de TCB (Anderson, 1972).',
  'lista de control de acceso': 'ACL: lista adjunta a un objeto con los derechos de cada sujeto. Es la implementación más habitual de la matriz de acceso.',
  'capacidad': 'Token o ticket que posee el sujeto y que identifica un objeto junto con los derechos sobre él. Migración y delegación de privilegios.',
  'bell-lapadula': 'Modelo multinivel: no leer hacia arriba ni escribir hacia abajo. Protege la confidencialidad (Bell y LaPadula, 1973).',
  'biba': 'Modelo complementario que protege la integridad con las reglas invertidas respecto a Bell-LaPadula (Biba, 1977).',
  'tcsec': 'Trusted Computer System Evaluation Criteria («Orange Book»): clasifica los sistemas en grados D, C1/C2, B1–B3 y A1.',
  'common criteria': 'Estándar internacional ISO/IEC 15408 que unifica TCSEC, ITSEC y otros; define perfiles de seguridad y niveles EAL 1–7.',
  'hash': 'Función unidireccional que convierte cualquier mensaje en una cadena de longitud fija. Usada para integridad y firmas digitales.',
  'cifrado asimétrico': 'Usa un par de claves (pública y privada): sirve para intercambiar claves y firmar, no para cifrar grandes volúmenes.',
  'firma digital': 'Hash del documento cifrado con la clave privada; cualquiera la verifica con la clave pública. Aporta integridad, autoría y no repudio.',
  'malware': 'Cualquier software malicioso: virus, gusano, troyano, spyware, ransomware, rootkit (cap. 9.7).',
  'ransomware': 'Cifra los datos de la víctima y exige un rescate por la clave de descifrado.',
  'gusano': 'Programa que se propaga solo por la red, sin necesidad de infectar un archivo huésped.',
  'troyano': 'Programa que aparenta ser útil y en cambio realiza una función oculta dañina.',
  'phishing': 'Suplantación de una entidad de confianza por correo o web para robar credenciales (ataque de ingeniería social).',
  'denegación de servicio': 'Ataque que impide el servicio legítimo agotando recursos: memoria, ancho de banda o conexiones (DoS/DDoS).',
  'desbordamiento de búfer': 'Escribir más datos de los previstos en una región de memoria y correr código ajeno; base de muchos exploits (CWE-120).',
  'sandbox': 'Entorno acotado donde el código solo puede usar los recursos permitidos explícitamente; denegación por defecto.',
  'tpm': 'Módulo de plataforma fiable: chip que custodia claves en hardware y permite arranque medido y atestación.',
  'autenticación': 'Verificar quién es alguien: algo que se sabe, se tiene o se es (cap. 9.4).',
  'multifactor': 'Combinar factores distintos (contraseña + token + biometría) según NIST SP 800-63B.',
  'sal': 'Valor aleatorio añadido a la contraseña antes de hashear, para que dos contraseñas iguales tengan hashes distintos.',
  'escalada de privilegios': 'Obtener permisos superiores a los concedidos, normalmente explotando un error del software.',
  'mediación total': 'Principio de Saltzer y Schroeder: comprobar cada acceso, no solo el primero.',
  'aislamiento': 'Separación rigurosa entre procesos: ninguno debe tocar la memoria ni los recursos de otro.',
  'confidencialidad': 'Que la información solo la vea quien está autorizado. Primera pilar de la tríada CIA.',
  'integridad': 'Que los datos no se alteren de forma indebida y que todo cambio quede registrado.',
  'disponibilidad': 'Que el sistema esté operativo y accesible cuando se necesita.',
  'no repudio': 'Imposibilidad de negar haber realizado una acción; se consigue con firmas y bitácoras firmadas.'
};

(function applyGlossary() {
  const SKIP = '.quiz, .section-index, .section-pager, .example-container, .lab, .gloss-pop, .drawer, code, pre, .nav-tabs, .quick-map';
  let count = 0;

  TAB_ORDER.forEach(function (tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;
    const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

    terms.forEach(function (term) {
      if (count > 90) return;
      const walker = document.createTreeWalker(tab, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (!n.nodeValue || n.nodeValue.trim().length < 3) return NodeFilter.FILTER_REJECT;
          const p = n.parentElement;
          if (!p || p.closest(SKIP) || p.classList.contains('gl-term')) return NodeFilter.FILTER_REJECT;
          if (n.nodeValue.toLowerCase().indexOf(term) === -1) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      const node = walker.nextNode();
      if (!node) return;
      const idx = node.nodeValue.toLowerCase().indexOf(term);
      const after = node.splitText(idx);
      const mid = after.splitText(term.length);
      const span = document.createElement('span');
      span.className = 'gl-term';
      span.setAttribute('tabindex', '0');
      span.setAttribute('data-def', GLOSSARY[term]);
      span.textContent = after.nodeValue;
      after.parentNode.replaceChild(span, after);
      count++;
    });
  });

  const pop = document.getElementById('gloss-pop');
  if (!pop) return;

  function show(el) {
    pop.innerHTML = '<strong>' + escapeHtml(el.textContent) + '</strong> — ' + escapeHtml(el.getAttribute('data-def'));
    pop.hidden = false;
    const r = el.getBoundingClientRect();
    const w = Math.min(310, window.innerWidth - 24);
    let left = r.left + window.scrollX + r.width / 2 - w / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
    pop.style.left = left + 'px';
    pop.style.width = w + 'px';
    pop.style.top = (r.bottom + window.scrollY + 9) + 'px';
  }
  function hide() { pop.hidden = true; }

  document.addEventListener('mouseover', function (e) {
    const t = e.target.closest ? e.target.closest('.gl-term') : null;
    if (t) show(t); else if (!e.target.closest('.gloss-pop')) hide();
  });
  document.addEventListener('focusin', function (e) {
    if (e.target.classList && e.target.classList.contains('gl-term')) show(e.target);
  });
  document.addEventListener('focusout', hide);
  window.addEventListener('scroll', hide, { passive: true });
})();

/* ============================================================
   CAJÓN «MI PROGRESO»
   ============================================================ */
const Drawer = (function () {
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const dot = document.getElementById('panel-dot');
  if (!drawer) return { open: function () {}, refresh: function () {} };

  const RING = 2 * Math.PI * 52;

  function open() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.hidden = false;
    refresh();
  }
  function close() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    backdrop.hidden = true;
  }

  function refresh() {
    // anillo
    const visitedPct = Progress.visited.length / TAB_ORDER.length;
    const quizPct = Progress.correct.length / 22;
    const labCount = Object.keys(Progress.labs).filter(k => Progress.labs[k]).length;
    const labPct = Math.min(1, labCount / 5);
    const pct = Math.round((visitedPct * 0.4 + quizPct * 0.4 + labPct * 0.2) * 100);

    const fg = document.getElementById('ring-fg');
    if (fg) {
      fg.style.strokeDasharray = RING;
      fg.style.strokeDashoffset = RING - (RING * pct / 100);
    }
    const rp = document.getElementById('ring-pct');
    if (rp) rp.textContent = pct + '%';

    setText('stat-visited', Progress.visited.length + '/' + TAB_ORDER.length);
    setText('stat-quiz', Progress.correct.length + '/22');
    const mins = Math.floor(Progress.seconds / 60);
    setText('stat-time', mins < 1 ? '< 1 min' : mins + ' min');
    setText('stat-labs', String(labCount));

    const list = document.getElementById('visit-list');
    if (list) {
      list.innerHTML = '';
      TAB_ORDER.forEach(function (id) {
        const li = document.createElement('li');
        if (Progress.visited.indexOf(id) !== -1) li.className = 'seen';
        li.innerHTML = '<span class="v-dot"></span>' + escapeHtml(getTabLabel(id));
        li.style.cursor = 'pointer';
        li.addEventListener('click', function () { openTab(null, id); close(); });
        list.appendChild(li);
      });
    }

    document.querySelectorAll('.badge').forEach(function (b) {
      b.classList.toggle('won', Progress.badges.indexOf(b.getAttribute('data-badge')) !== -1);
    });

    if (dot) dot.hidden = Progress.badges.length === 0;
  }

  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

  document.getElementById('btn-panel').addEventListener('click', open);
  document.getElementById('drawer-close').addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) close();
  });

  return { open: open, close: close, refresh: refresh };
})();

function markLab(key, force) {
  if (Progress.labs[key]) return;
  Progress.labs[key] = force === undefined ? true : !!force;
  if (!Progress.labs[key]) return;
  Progress.save();
  award('experimentador');
  refreshDrawer();
}

function award(id) {
  if (Progress.badges.indexOf(id) !== -1) return;
  Progress.badges.push(id);
  Progress.save();
  refreshDrawer();
  const b = document.querySelector('.badge[data-badge="' + id + '"]');
  if (b) {
    b.style.transform = 'scale(1.06)';
    setTimeout(function () { b.style.transform = ''; }, 400);
  }
}

// El cajón se define más abajo; aquí solo se refresca si ya existe (evita TDZ).
function refreshDrawer() {
  try { if (Drawer && typeof Drawer.refresh === 'function') Drawer.refresh(); } catch (e) { /* aún no inicializado */ }
}

// Notas
(function () {
  const area = document.getElementById('my-notes');
  if (!area) return;
  area.value = Store.get('notes', '');
  let t;
  area.addEventListener('input', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      Store.set('notes', area.value);
      const st = document.getElementById('notes-status');
      if (st) { st.textContent = '✓ guardado'; setTimeout(function () { st.textContent = ''; }, 1600); }
    }, 450);
  });

  document.getElementById('notes-copy').addEventListener('click', function () {
    const done = function () {
      const st = document.getElementById('notes-status');
      st.textContent = '✓ copiado';
      setTimeout(function () { st.textContent = ''; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(area.value).then(done).catch(function () { fallbackCopy(area.value, done); });
    else fallbackCopy(area.value, done);
  });

  document.getElementById('notes-clear').addEventListener('click', function () {
    area.value = '';
    Store.del('notes');
  });

  document.getElementById('reset-all').addEventListener('click', function () {
    if (!confirm('¿Borrar todo el progreso, las notas y los logros?')) return;
    Store.wipe();
    location.reload();
  });
})();

// Tiempo de estudio (solo con la pestaña visible)
(function () {
  setInterval(function () {
    if (!document.hidden) {
      Progress.seconds += 5;
      if (Progress.seconds % 30 === 0) Progress.save();
    }
  }, 5000);
  window.addEventListener('beforeunload', function () { Progress.save(); });
})();

/* ============================================================
   MARCADOR DE SECCIONES VISTAS + BÚSQUEDA
   ============================================================ */
(function () {
  function markVisited() {
    const id = getActiveTabId();
    if (!id) return;
    if (Progress.visited.indexOf(id) === -1) {
      Progress.visited.push(id);
      Progress.save();
      if (Progress.visited.length === TAB_ORDER.length) award('explorador');
      Drawer.refresh();
    }
  }
  window.__markVisited = markVisited;
  markVisited();
  window.addEventListener('hashchange', function () { setTimeout(markVisited, 60); });
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.addEventListener('click', function () { setTimeout(markVisited, 60); });
  });
})();

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */
buildSectionIndexes();
buildPagers();
buildCopyButtons();
buildQuizzes();
openFromHash();
updateProgressBar();
Drawer.refresh();
if (window.__markVisited) window.__markVisited();
