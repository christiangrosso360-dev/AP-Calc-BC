/* ============================================================
   shared JS helpers — Unit 10 guide (tool pages)
   Loaded in <head> before each page's inline script.
   ============================================================ */

/* Render LaTeX to an HTML string via KaTeX, with a plain-text
   fallback if KaTeX hasn't loaded yet (or errors).
   latex   - the LaTeX source string
   fallback - plain text to show if rendering isn't available (optional)
   display - true for display (block) mode, false/omitted for inline */
function tex(latex, fallback, display){
  if(window.katex){
    try{ return katex.renderToString(latex, {throwOnError:false, displayMode:!!display}); }
    catch(e){}
  }
  return `<span class="tex-fallback">${fallback!=null?fallback:latex}</span>`;
}

/* Wrap a LaTeX fragment in a color, for color-coded formulas.
   Returns a \textcolor{...}{...} string to embed inside other LaTeX. */
const cc = (hex, body) => `\\textcolor{${hex}}{${body}}`;

/* ============================================================
   progress recorder — quietly notes which lesson/exam/sheet
   pages you've opened, so the hub can offer "continue where you
   left off" and per-unit progress. Stored locally (this origin
   only) under vcalc:v1; never leaves the browser.
   ============================================================ */
(function(){
  try{
    var K='vcalc:v1';
    var s=JSON.parse(localStorage.getItem(K)||'{}');
    s.visited=s.visited||{};
    var f=(location.pathname.split('/').pop()||'').toLowerCase();
    if(f && f!=='index.html' && f.indexOf('-standalone')<0 && f.indexOf('.html')>=0){
      s.visited[f]=Date.now();
      s.last=f;
      localStorage.setItem(K, JSON.stringify(s));
    }
  }catch(e){}
})();

/* ============================================================
   LESSON SEQUENCE — the course order, derived from the unit hubs.
   Each entry is [slug, short title, unit]. This is the single source
   of truth for "what comes next" and for counting progress, so the
   hub never has to duplicate the list.
   ============================================================ */
var LESSONS=[
  ["what-is-a-limit","What a Limit Is",1],
  ["computing-limits","Computing Limits",1],
  ["squeeze-theorem","The Squeeze Theorem",1],
  ["continuity","Continuity & Its Failures",1],
  ["asymptotes-ivt","Asymptotes & the IVT",1],
  ["the-derivative-defined","The Derivative Defined",2],
  ["differentiability","Differentiability & Continuity",2],
  ["power-and-basic-rules","The Power Rule & Basic Rules",2],
  ["derivatives-of-functions","Derivatives of the Key Functions",2],
  ["product-and-quotient","The Product & Quotient Rules",2],
  ["chain-rule","The Chain Rule",3],
  ["implicit-differentiation","Implicit Differentiation",3],
  ["inverse-derivatives","Derivatives of Inverse Functions",3],
  ["higher-order-derivatives","Higher-Order Derivatives",3],
  ["selecting-procedures","Selecting Procedures",3],
  ["rates-in-context","The Derivative in Context",4],
  ["straight-line-motion","Straight-Line Motion",4],
  ["related-rates","Related Rates",4],
  ["linear-approximation","Linear Approximation",4],
  ["lhopitals-rule","L'Hôpital's Rule",4],
  ["mean-value-theorem","The Existence Theorems",5],
  ["first-derivative-test","Increasing, Decreasing & Extrema",5],
  ["concavity","Concavity & the Second Derivative",5],
  ["connecting-derivatives","Connecting f, f′ & f″",5],
  ["optimization","Optimization",5],
  ["riemann-sums","Accumulation & Riemann Sums",6],
  ["fundamental-theorem","The Fundamental Theorem",6],
  ["antiderivatives","Antiderivatives & u-Substitution",6],
  ["parts-partial-fractions","Integration by Parts & Partial Fractions",6],
  ["improper-integrals","Improper Integrals & Choosing Your Weapon",6],
  ["equations-of-change","Equations of Change",7],
  ["slope-fields","Slope Fields",7],
  ["eulers-method","Euler's Method",7],
  ["separation-of-variables","Separation of Variables",7],
  ["growth-models","Growth Models",7],
  ["unit8-foundations","The Integral as Accumulation",8],
  ["unit8-area","Area Between Curves",8],
  ["unit8-cross-sections","Volumes with Cross Sections",8],
  ["unit8-solids","Solids of Revolution",8],
  ["unit8-arc-length","Arc Length",8],
  ["unit9-parametric","Parametric Equations",9],
  ["unit9-vectors","Vector-Valued Functions",9],
  ["unit9-polar-graphing","Polar Graphing",9],
  ["unit9-polar-area","Area in Polar",9],
  ["series-foundations","Series Foundations",10],
  ["convergence-compass","Convergence Compass",10],
  ["error-bounds","Error Bounds",10],
  ["interval-of-convergence","Interval of Convergence",10],
  ["breaking-point","Taylor Toolkit",10]
];

/* ------------------------------------------------------------
   prev / next footer. Injected on any page whose filename matches
   a lesson slug, so all 49 get it without editing 49 files.
   At the end of a unit "next" points at that unit's practice
   questions rather than the next unit's first lesson — finishing
   the unit is what you should actually do before moving on.
   ------------------------------------------------------------ */
(function(){
  window.VC_LESSONS = LESSONS;          /* the hub reads this to count progress */

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var here = (location.pathname.split('/').pop()||'').toLowerCase().replace(/\.html$/,'');
    var i = -1;
    for (var k=0;k<LESSONS.length;k++){ if (LESSONS[k][0] === here){ i = k; break; } }
    if (i < 0) return;                                    /* not a lesson page */
    if (document.querySelector('.lesson-nav')) return;    /* never inject twice */

    var cur = LESSONS[i], prev = LESSONS[i-1], next = LESSONS[i+1], L, R;

    /* back: the previous lesson, or this unit's hub if we're at its start */
    if (prev && prev[2] === cur[2]) L = { href: prev[0]+'.html', kick:'Previous', title: prev[1] };
    else                           L = { href: 'unit'+cur[2]+'.html', kick:'Back to', title:'Unit '+cur[2] };

    /* on: the next lesson, the unit's practice questions at a unit boundary,
       or the full mock exam once all ten units are behind you */
    if (next && next[2] === cur[2]) R = { href: next[0]+'.html', kick:'Next', title: next[1] };
    else if (next)                  R = { href:'unit'+cur[2]+'-exam-practice.html',
                                          kick:'Finish the unit', title:'Unit '+cur[2]+' practice questions' };
    else                            R = { href:'mock-exam.html',
                                          kick:"That's all ten units", title:'Sit the full mock exam' };

    var st = document.createElement('style');
    st.textContent =
      '.lesson-nav{max-width:var(--wrap-max,1060px);margin:46px auto 10px;display:grid;'+
      'grid-template-columns:1fr 1fr;gap:12px}'+
      '@media(max-width:640px){.lesson-nav{grid-template-columns:1fr}}'+
      '.lesson-nav a{display:block;text-decoration:none;background:var(--panel,#1a1813);'+
      'border:1px solid var(--line,#332e25);border-radius:14px;padding:14px 16px;'+
      'transition:border-color .15s,transform .15s}'+
      '.lesson-nav a:hover{border-color:var(--gold,#e8a13c);transform:translateY(-2px)}'+
      '.lesson-nav .k{display:block;font-family:var(--mono,ui-monospace,monospace);font-size:11px;'+
      'letter-spacing:.14em;text-transform:uppercase;color:var(--muted,#9a9183);margin-bottom:5px}'+
      '.lesson-nav .t{font-family:var(--display,Georgia,serif);font-size:17px;font-weight:600;'+
      'color:var(--ink,#ece7dd);line-height:1.25;display:block}'+
      '.lesson-nav .r{text-align:right}';
    document.head.appendChild(st);

    var nav = document.createElement('nav');
    nav.className = 'lesson-nav';
    nav.setAttribute('aria-label','Lesson navigation');
    nav.innerHTML =
      '<a href="'+L.href+'"><span class="k">&larr; '+esc(L.kick)+'</span>'+
        '<span class="t">'+esc(L.title)+'</span></a>'+
      '<a class="r" href="'+R.href+'"><span class="k">'+esc(R.kick)+' &rarr;</span>'+
        '<span class="t">'+esc(R.title)+'</span></a>';
    document.body.appendChild(nav);
  });
})();
