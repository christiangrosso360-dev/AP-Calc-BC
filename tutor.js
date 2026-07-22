/* ============================================================
   Visual AP Calculus BC — shared AI tutor ("Walk me through it")
   Drop into ANY exam-practice page:  <script src="tutor.js"></script>
   right before </body>, after the page's inline script.

   Works across all three exam-page build formats (the standard
   MC/FRQS spine, plus the two legacy formats used by Unit 3 and
   Unit 10) by (a) watching the shared DOM anchors #mcFb / #frqParts
   with MutationObservers instead of hooking named functions, and
   (b) normalising each page's data shape through small adapters.

   - Injects its own CSS (uses each page's --approx, auto-themes).
   - Talks to the Cloudflare Worker holding the Gemini key.
   - If the endpoint is blank, it does nothing (tutor stays hidden).
   ============================================================ */
(function () {
  var TUTOR_ENDPOINT = "https://calc-tutor.christiangrosso360.workers.dev";
  try { TUTOR_ENDPOINT = localStorage.getItem('tutor:endpoint') || TUTOR_ENDPOINT; } catch (e) {}
  if (!TUTOR_ENDPOINT) return;

  /* ---------- CSS (accent-agnostic) ---------- */
  var CSS =
  '.tutor-row{margin-top:12px}' +
  '.tutor-btn{font-family:var(--mono);font-size:12.5px;color:var(--approx);background:transparent;border:1px solid var(--line-2);border-radius:20px;padding:7px 15px;cursor:pointer;transition:all .15s}' +
  '.tutor-btn:hover{background:rgba(255,255,255,.05);border-color:var(--approx)}' +
  '.tutor-panel{margin-top:12px;background:var(--bg);border:1px solid var(--line-2);border-radius:12px;overflow:hidden;animation:tutorIn .25s ease}' +
  '@keyframes tutorIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}' +
  '.tutor-head{display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-bottom:1px solid var(--line);font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--approx)}' +
  '.tutor-head button{background:none;border:none;color:var(--muted);font-size:15px;cursor:pointer;padding:0 2px;line-height:1}' +
  '.tutor-head button:hover{color:var(--ink)}' +
  '.tutor-log{max-height:340px;overflow-y:auto;padding:13px 14px;display:flex;flex-direction:column;gap:9px}' +
  '.tb{max-width:88%;padding:9px 13px;border-radius:12px;font-size:13.5px;line-height:1.55}' +
  '.tb.tutor{background:var(--panel-2);border:1px solid var(--line);color:var(--ink);align-self:flex-start;border-bottom-left-radius:4px}' +
  '.tb.student{background:rgba(255,255,255,.08);border:1px solid var(--line-2);color:var(--ink);align-self:flex-end;border-bottom-right-radius:4px}' +
  '.tb .katex{font-size:1.02em}' +
  '.tb.thinking{color:var(--muted);font-family:var(--mono);font-size:12px}' +
  '.tb.thinking span{display:inline-block;animation:tdot 1.2s infinite}' +
  '.tb.thinking span:nth-child(2){animation-delay:.2s}.tb.thinking span:nth-child(3){animation-delay:.4s}' +
  '@keyframes tdot{0%,60%,100%{opacity:.25}30%{opacity:1}}' +
  '.tutor-mathfb{font-family:var(--mono);font-size:.94em;background:rgba(255,255,255,.06);border-radius:4px;padding:1px 5px}' +
  '.tutor-err{color:var(--div);font-size:12.5px;font-family:var(--mono);padding:0 14px 10px}' +
  '.tutor-inrow{display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--line)}' +
  '.tutor-inrow input{flex:1;background:var(--panel);border:1px solid var(--line-2);border-radius:9px;color:var(--ink);font-family:var(--body);font-size:13.5px;padding:9px 12px}' +
  '.tutor-inrow input:focus{outline:none;border-color:var(--approx)}' +
  '.tutor-send{font-family:var(--mono);font-size:12.5px;background:var(--approx);color:#17140e;border:none;border-radius:9px;padding:9px 16px;cursor:pointer;font-weight:600}' +
  '.tutor-send:disabled{opacity:.45;cursor:default}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  /* ---------- state ---------- */
  var LAST_MC = null, TUTOR = { dock: null, msgs: [], busy: false, ctx: null }, lastClicked = null;
  /* Page data (const MC/FRQS/TOPICS, let mcIdx/frqActive…) lives in the global lexical scope,
     shared by all classic scripts, so we read it by bare name with typeof guards. */

  /* ---------- text helpers ---------- */
  function tStrip(s) {
    return String(s || '')
      .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&middot;/g, '·')
      .replace(/&rarr;/g, '→').replace(/&rsquo;/g, '’').replace(/&ldquo;|&rdquo;/g, '"');
  }
  function tEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function tRender(s) {
    var raw = String(s || '');
    raw = raw.replace(/\$([^$\n]+)\$/g, function (m, inner) { return '\\(' + inner + '\\)'; });
    var store = [];
    raw = raw.replace(/\\\(([\s\S]+?)\\\)/g, function (m, inner) {
      var html;
      try { html = window.katex ? katex.renderToString(inner, { throwOnError: true, strict: false }) : null; }
      catch (e) { html = null; }
      if (html == null) html = '<code class="tutor-mathfb">' + tEsc(inner.trim()) + '</code>';
      store.push(html); return 'MATHPH' + (store.length - 1) + 'ENDPH';
    });
    var t = tEsc(raw);
    t = t.replace(/\*\*([^*]+)\*\*/g, function (m, inner) { return '<b>' + inner + '</b>'; });
    t = t.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:!?)]|$)/g, function (m, pre, inner) { return pre + '<i>' + inner + '</i>'; });
    t = t.replace(/\n/g, '<br>');
    t = t.replace(/MATHPH(\d+)ENDPH/g, function (m, i) { return store[+i]; });
    return t;
  }
  function cleanText(el) {
    var c = el.cloneNode(true), mm = c.querySelectorAll('.katex-mathml');
    for (var i = 0; i < mm.length; i++) mm[i].remove();
    return (c.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* ---------- adapters: read the CURRENT question + normalise data shape ---------- */
  function rawCurrentQ() {
    var idx = (typeof mcIdx !== 'undefined') ? mcIdx : 0;
    if (typeof mcBatch !== 'undefined' && mcBatch) return mcBatch[idx];                                  // standard spine
    if (typeof mcOrder !== 'undefined' && typeof MC !== 'undefined' && mcOrder && MC) return MC[mcOrder[idx]]; // Unit 10
    if (typeof mcQueue !== 'undefined' && typeof EXAM !== 'undefined' && mcQueue && EXAM) return EXAM[mcQueue[idx]]; // Unit 3
    return null;
  }
  function topicName(k) {
    try { if (typeof TOPICS === 'undefined' || !TOPICS) return String(k); var t = TOPICS[k]; if (!t) return String(k); return tStrip(t[0] || t.n || String(k)); }
    catch (e) { return String(k); }
  }
  function normMC(q) {
    if (!q) return null;
    if (Array.isArray(q.o) && typeof q.a === 'number') {                            // Unit 3: {t,q,o[],a,ex}
      var tn = '';
      try { if (typeof TOPICS !== 'undefined' && TOPICS && TOPICS[q.t]) tn = tStrip(TOPICS[q.t].n || ''); } catch (e) {}
      return { prompt: q.q, math: '', explain: q.ex,
        opts: q.o.map(function (t, i) { return { t: t, correct: i === q.a }; }), topicName: tn };
    }
    return { prompt: q.prompt, math: q.math || '', explain: q.explain, opts: q.opts || [], topicName: topicName(q.topic) };
  }
  function rawFRQ() {
    if (typeof FRQS === 'undefined' || !FRQS) return null;
    var a = (typeof frqActive !== 'undefined' && frqActive) ? frqActive : 0;
    return FRQS[a];
  }
  function normFRQ(f, pi) {
    if (!f || !f.parts || !f.parts[pi]) return null;
    var p = f.parts[pi];
    if (f.intro !== undefined || p.prompt !== undefined) {                          // Unit 3: {title,intro,parts:[{label,pts,prompt,sol}]}
      return { label: tStrip(f.title || f.label || 'Free Response'), given: tStrip(f.intro || f.given || ''), givenNote: '', table: '',
        part: { pl: p.label || p.pl || '', pts: p.pts || '', q: tStrip(p.prompt || p.q || ''), sol: tStrip(p.sol || ''), rubric: '', topicName: '' } };
    }
    var table = '';                                                                 // standard / Unit 10
    if (f.table) table = f.table.head.join(' | ') + '\n' + f.table.rows.map(function (r) { return r.join(' | '); }).join('\n');
    return { label: tStrip(f.label || ''), given: f.given ? ('\\(' + f.given + '\\)') : '', givenNote: tStrip(f.givenNote || ''), table: table,
      part: { pl: p.pl || p.label || '', pts: p.pts || '', q: tStrip(p.q || p.prompt || ''), sol: tStrip(p.sol || ''),
        rubric: p.rubric ? p.rubric.map(function (r) { return '- ' + tStrip(r); }).join('\n') : '', topicName: p.topic ? topicName(p.topic) : '' } };
  }

  /* ---------- system prompt + context ---------- */
  function sysPrompt(ctx) {
    return 'You are the tutor on "Visual AP Calculus BC", helping a high-school student one-on-one with the specific exam problem below.\n'
      + 'PERSONALITY: warm, encouraging, Socratic — you guide, you never lecture.\n'
      + 'STYLE: keep every reply SHORT (2–5 sentences). Ask exactly ONE question at a time, then wait. Write ALL math as inline LaTeX inside \\( ... \\) delimiters — never $…$, never bare ^ or _ outside math. No headers, no lists; plain sentences (occasional **bold** is fine).\n'
      + 'METHOD: (1) First find where THEY are stuck — ask what they tried or which step lost them. (2) Guide with hints and small questions toward the authoritative solution; never dump it all at once. (3) If they ask for the answer outright, give only the next step. (4) When they get it, close with a one-sentence statement of the principle.\n'
      + 'If their gap is an earlier concept (e.g. what a critical point is), briefly re-teach that first.\n'
      + 'The context below is AUTHORITATIVE — its correct answer and reasoning are ground truth; never contradict it.\n\n'
      + '==== PROBLEM CONTEXT ====\n' + ctx.body;
  }
  function mcContext() {
    var m = LAST_MC; if (!m) return { body: '(no question context)' };
    var q = m.norm;
    var opts = q.opts.map(function (o) { return '- ' + tStrip(o.t) + (o.correct ? '   [CORRECT ANSWER]' : ''); }).join('\n');
    return { body: 'MULTIPLE-CHOICE (topic: ' + q.topicName + ')\n\nQUESTION:\n' + tStrip(q.prompt)
      + (q.math ? '\nGIVEN: \\(' + q.math + '\\)' : '')
      + '\n\nOPTIONS:\n' + opts
      + '\n\nSTUDENT PICKED: "' + m.pickedText + '" — ' + (m.correct ? 'and it was CORRECT (they may want deeper understanding).' : 'which is WRONG.')
      + '\n\nAUTHORITATIVE EXPLANATION:\n' + tStrip(q.explain) };
  }
  function frqContext(pi) {
    var nf = normFRQ(rawFRQ(), pi); if (!nf) return { body: '(no FRQ context)' };
    var body = 'FREE-RESPONSE — ' + nf.label + ', ' + nf.part.pl + ' (' + nf.part.pts + ' points' + (nf.part.topicName ? ', topic: ' + nf.part.topicName : '') + ')\n\n';
    if (nf.given) body += 'GIVEN: ' + nf.given + '\n';
    if (nf.givenNote) body += nf.givenNote + '\n';
    if (nf.table) body += 'TABLE:\n' + nf.table + '\n';
    body += '\nTHE PART THE STUDENT IS WORKING ON:\n' + nf.part.q + '\n\nAUTHORITATIVE WORKED SOLUTION:\n' + nf.part.sol;
    if (nf.part.rubric) body += '\n\nRUBRIC (what earns the points):\n' + nf.part.rubric;
    return { body: body };
  }

  /* ---------- chat UI ---------- */
  function openMcTutor() { var d = document.getElementById('mcTutorDock'); if (d && LAST_MC) openTutor(d, mcContext()); }
  function openFrqTutor(pi) { var d = document.getElementById('frqTutorDock' + pi); if (d) openTutor(d, frqContext(pi)); }
  function openTutor(dock, ctx) {
    if (TUTOR.dock && TUTOR.dock !== dock) TUTOR.dock.innerHTML = '';
    if (dock.querySelector('.tutor-panel')) { dock.innerHTML = ''; TUTOR.dock = null; return; }
    TUTOR = { dock: dock, msgs: [], busy: false, ctx: ctx };
    dock.innerHTML = '<div class="tutor-panel">'
      + '<div class="tutor-head"><span>🎓 tutor</span><button title="close" onclick="closeTutor()">×</button></div>'
      + '<div class="tutor-log" id="tutorLog"></div>'
      + '<div class="tutor-err" id="tutorErr" style="display:none"></div>'
      + '<div class="tutor-inrow"><input id="tutorIn" placeholder="type your answer or question…" autocomplete="off">'
      + '<button class="tutor-send" id="tutorSend" onclick="tutorSendMsg()">Send</button></div></div>';
    document.getElementById('tutorIn').addEventListener('keydown', function (e) { if (e.key === 'Enter') tutorSendMsg(); });
    TUTOR.msgs.push({ role: 'user', text: '(I just clicked "Walk me through it" on this problem. Greet me in one short friendly line and ask one opening question based on my result.)', hidden: true });
    tutorCall();
  }
  function closeTutor() { if (TUTOR.dock) { TUTOR.dock.innerHTML = ''; TUTOR.dock = null; } }
  function logRender() {
    var log = document.getElementById('tutorLog'); if (!log) return;
    log.innerHTML = TUTOR.msgs.filter(function (m) { return !m.hidden; }).map(function (m) {
      return '<div class="tb ' + (m.role === 'tutor' ? 'tutor' : 'student') + '">' + tRender(m.text) + '</div>';
    }).join('') + (TUTOR.busy ? '<div class="tb tutor thinking">thinking<span>.</span><span>.</span><span>.</span></div>' : '');
    log.scrollTop = log.scrollHeight;
  }
  function tutorSendMsg() {
    if (TUTOR.busy) return;
    var inp = document.getElementById('tutorIn'); var v = (inp.value || '').trim(); if (!v) return;
    inp.value = ''; TUTOR.msgs.push({ role: 'user', text: v }); tutorCall();
  }
  function tutorCall() {
    TUTOR.busy = true; logRender();
    var sendBtn = document.getElementById('tutorSend'); if (sendBtn) sendBtn.disabled = true;
    var errEl = document.getElementById('tutorErr'); if (errEl) errEl.style.display = 'none';
    var ctrl = new AbortController(); var to = setTimeout(function () { ctrl.abort(); }, 30000);
    fetch(TUTOR_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ system: sysPrompt(TUTOR.ctx), messages: TUTOR.msgs.map(function (m) { return { role: m.role === 'tutor' ? 'tutor' : 'user', text: m.text }; }) }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        clearTimeout(to); TUTOR.busy = false; if (sendBtn) sendBtn.disabled = false;
        if (res.ok && res.d.text) { TUTOR.msgs.push({ role: 'tutor', text: res.d.text }); logRender(); }
        else { logRender(); if (errEl) { errEl.textContent = '⚠ ' + (res.d.detail || res.d.error || 'The tutor is unreachable right now — the written explanation above has the full story.'); errEl.style.display = 'block'; } }
      })
      .catch(function (e) {
        clearTimeout(to); TUTOR.busy = false; if (sendBtn) sendBtn.disabled = false; logRender();
        if (errEl) { errEl.textContent = '⚠ Couldn’t reach the tutor (' + (e.name === 'AbortError' ? 'timed out' : 'network') + ') — the written explanation above has the full story.'; errEl.style.display = 'block'; }
      });
  }
  window.openMcTutor = openMcTutor; window.openFrqTutor = openFrqTutor;
  window.tutorSendMsg = tutorSendMsg; window.closeTutor = closeTutor;

  /* ---------- button injection via observers (format-independent) ---------- */
  var MC_BTN = '<div class="tutor-row"><button class="tutor-btn" onclick="openMcTutor()">🎓 Still stuck? Walk me through it</button></div><div class="tutor-dock" id="mcTutorDock"></div>';
  // remember which option was clicked (capture phase → before the page's own onclick)
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#mcOpts button');
    if (b) lastClicked = b;
  }, true);
  function onFeedback(fb) {
    if (!fb.classList.contains('show')) return;
    if (fb.querySelector('.tutor-btn')) return;
    var q = rawCurrentQ(); var norm = normMC(q); if (!norm) return;
    var picked = lastClicked;
    LAST_MC = { norm: norm, correct: picked ? !picked.classList.contains('wrong') : false, pickedText: picked ? cleanText(picked) : '' };
    fb.insertAdjacentHTML('beforeend', MC_BTN);
  }
  function injectFrq() {
    var parts = document.querySelectorAll('#frqParts .part');
    for (var pi = 0; pi < parts.length; pi++) {
      var partEl = parts[pi];
      if (partEl.querySelector('.tutor-btn')) continue;
      var html = '<div class="tutor-row"><button class="tutor-btn" onclick="openFrqTutor(' + pi + ')">🎓 Walk me through it</button></div><div class="tutor-dock" id="frqTutorDock' + pi + '"></div>';
      var sol = partEl.querySelector('.frq-sol');
      if (sol) sol.insertAdjacentHTML('beforebegin', html); else partEl.insertAdjacentHTML('beforeend', html);
    }
  }
  function wire() {
    var fb = document.getElementById('mcFb');
    if (fb && !fb.__tutorWired) { fb.__tutorWired = true;
      new MutationObserver(function () { try { onFeedback(fb); } catch (e) {} }).observe(fb, { attributes: true, attributeFilter: ['class'], childList: true });
      try { onFeedback(fb); } catch (e) {}
    }
    var fp = document.getElementById('frqParts');
    if (fp && !fp.__tutorWired) { fp.__tutorWired = true;
      new MutationObserver(function () { try { injectFrq(); } catch (e) {} }).observe(fp, { childList: true });
      try { injectFrq(); } catch (e) {}
    }
    return fb && fp;
  }
  if (!wire()) {   // anchors may not exist yet (script ran early) — poll briefly
    var n = 0, iv = setInterval(function () { if (wire() || ++n > 25) clearInterval(iv); }, 150);
  }
})();
