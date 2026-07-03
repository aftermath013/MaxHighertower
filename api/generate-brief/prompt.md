You are generating a CNX-branded client program brief as a single, complete, self-contained HTML file.

## OUTPUT RULES — READ FIRST
- Return RAW HTML ONLY. No markdown. No explanation. No code fences. No commentary before or after.
- The file must start with `<!DOCTYPE html>` and end with `</html>`.
- All CSS and JS must be inline inside the file.
- The only external dependency allowed is Google Fonts CDN.

## INPUTS
You will receive:
- CLIENT NAME
- CLIENT URL
- LOB SCOPE (e.g. "Full-Stack CS + Tech")
- DELIVERY LOCATION (e.g. "Philippines")
- CHANNEL SCOPE (e.g. "Voice + Chat" or "TBD")
- REQUESTED BY

## STEP 1 — RESEARCH
Before generating content, research the client:
1. Fetch the CLIENT URL — extract: product/service catalog, pricing tiers, target customer demographics
2. Search "[CLIENT NAME] customer complaints reviews 2025"
3. Search "[CLIENT NAME] BBB complaints" or "[CLIENT NAME] Trustpilot"
4. Use real findings. Do not invent pain points or cite fake sources.

## STEP 2 — GENERATE
Produce the complete HTML file using the exact structure below.

---

## HTML STRUCTURE

### HEAD
```
<title>[CLIENT NAME] — Concentrix Program Brief</title>
Google Fonts import: Montserrat (weights 300,400,500,600,700,800,900)
All CSS inline in <style> tag
```

### CSS TOKENS (use exactly — no deviations)
```css
:root {
  --cnx-blue: #003D5B;
  --cnx-teal: #25E2CC;
  --cnx-teal-60: #7CEEE0;
  --cnx-teal-20: #D3F9F5;
  --cnx-teal-10: #E9FCFA;
  --cnx-jade: #007380;
  --cnx-yellow: #FBCA18;
  --cnx-yellow-20: #FEF4D1;
  --cnx-orange: #FF8400;
  --cnx-raspberry: #CC3262;
  --cnx-charcoal: #2A2B2C;
  --cnx-gray: #F2F2F2;
  --cnx-white: #FFFFFF;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Montserrat', sans-serif; background: #fff; color: var(--cnx-charcoal); font-size: 13px; line-height: 1.7; }
```

### NAV BAR (fixed, top)
```html
<nav id="main-nav" style="position:fixed;top:0;left:0;right:0;height:60px;background:var(--cnx-blue);border-bottom:3px solid var(--cnx-teal);display:flex;align-items:center;padding:0 24px;gap:16px;z-index:2000;">
  <div class="nav-logo">CNX<span> | [CLIENT NAME]</span></div>
  <div class="nav-internal">Internal · Confidential</div>
  <div style="flex:1"></div>

  <!-- Share View controls (default) -->
  <div id="pdfControls" style="display:flex;align-items:center;gap:10px;">
    <div class="nav-pills" id="navPills">
      <button class="nav-pill" onclick="showPage(0)">01 Brief</button>
      <button class="nav-pill" onclick="showPage(1)">02 Pain Points</button>
      <button class="nav-pill" onclick="showPage(2)">03 Journey</button>
      <button class="nav-pill" onclick="showPage(3)">04 Agent Match</button>
      <button class="nav-pill" onclick="showPage(4)">05 Ops</button>
    </div>
    <button class="btn-nav btn-nav-outline" onclick="switchToWebView()">Web View</button>
    <button class="btn-nav btn-nav-teal" onclick="triggerPrint()">Print / PDF</button>
    <button class="btn-nav btn-edit" id="edit-btn" onclick="toggleEditMode()">✏️ Edit</button>
  </div>

  <!-- Web View controls (hidden by default) -->
  <div id="webControls" style="display:none;align-items:center;gap:10px;">
    <button class="btn-nav btn-nav-outline" onclick="switchToPdfView()">← Share View</button>
    <button class="btn-nav btn-nav-teal" onclick="triggerPrint()">Print</button>
  </div>
</nav>
```

### MOBILE NAV (fixed bottom, shown in web view on ≤900px)
```html
<div id="mobile-nav" style="display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(0,61,91,0.98);border-top:2px solid var(--cnx-teal);display:flex;justify-content:space-around;padding:6px 0;z-index:1999;">
  <button class="mob-tab active" onclick="showPage(0)"><div>01</div><div>Brief</div></button>
  <button class="mob-tab" onclick="showPage(1)"><div>02</div><div>Pain</div></button>
  <button class="mob-tab" onclick="showPage(2)"><div>03</div><div>Journey</div></button>
  <button class="mob-tab" onclick="showPage(3)"><div>04</div><div>Agents</div></button>
  <button class="mob-tab" onclick="showPage(4)"><div>05</div><div>Ops</div></button>
</div>
```

### EDIT TOOLBAR (hidden until edit mode)
```html
<div id="edit-toolbar" style="display:none;position:fixed;bottom:24px;right:24px;background:var(--cnx-blue);border:1px solid var(--cnx-teal);border-radius:8px;padding:10px 16px;z-index:3000;gap:10px;align-items:center;">
  <span id="edit-status" style="font-size:11px;color:var(--cnx-teal);">✏️ Edit Mode</span>
  <button onclick="resetEdits()" style="font-size:11px;background:transparent;border:1px solid var(--cnx-raspberry);color:var(--cnx-raspberry);border-radius:4px;padding:4px 10px;cursor:pointer;">Reset</button>
  <button onclick="exportBrief()" style="font-size:11px;background:var(--cnx-teal);color:var(--cnx-blue);border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-weight:700;">Export HTML</button>
</div>
```

### BODY CLASS
```html
<body class="pdf-view">
```

### PAGE STRUCTURE
5 pages, each wrapped in `<div class="page">`. In pdf-view all are visible stacked. In web-view only `.active` is shown.

---

## THE 5 PAGES — CONTENT SPEC

### PAGE 1 — CLIENT BRIEF
Sections:
1. **Hero** — dark blue gradient background (`linear-gradient(135deg, #003D5B 0%, #001f30 55%, #000d18 100%)`). Contains:
   - Eyebrow: "CONCENTRIX PROGRAM BRIEF"
   - H1: "[CLIENT NAME]" with teal highlight on a key word
   - Subtitle: one-line description of what the client does
   - 4 stat cards (white-on-dark): key business facts (revenue, employees, founded year, HQ) — research these from the client URL
2. **Product/Service Catalog** — white section. A `<table>` with columns: Product/Service | Description | Price Range | Target Segment. Populate with real data from research.
3. **Customer Archetypes** — gray section. 6 cards, each with: icon emoji, archetype name, 2-line description of who they are and what they need from CS.
4. **CNX Role** — dark blue section. 2-3 callout boxes explaining what CNX brings: LOB scope, delivery location, channel scope.

### PAGE 2 — PAIN POINTS
Sections:
1. **Hero** — same dark gradient. Title: "Customer Pain Points". Subtitle: source summary.
2. **Pain Point Cards** — for each pain point (minimum 6):
   - Title of the pain point
   - Severity badge: HIGH (raspberry) / MED (orange) / LOW (yellow)
   - Description: 2-3 sentences from real complaints
   - Source citation (BBB, Trustpilot, Reddit, Google Reviews, etc.)
3. **Pattern Summary** — dark section. 2 callout boxes: "What customers keep saying" and "CS implication for CNX".

### PAGE 3 — CUSTOMER JOURNEY MAP
Sections:
1. **Hero** — dark gradient. Title: "Customer Journey Map".
2. **Journey Stages** — 5 to 7 stages in a horizontal scroll container (flex row). Each stage card:
   - Stage name (e.g. "Awareness", "Purchase", "Onboarding", "Usage", "Support", "Loyalty", "Churn Risk")
   - Emotion state emoji + label (😊 Excited / 😐 Neutral / 😟 Frustrated / 😡 Angry)
   - Contact triggers: 2-3 bullet points of why they'd contact CS at this stage
   - Channel: which channel they'd use (voice, chat, email)
3. **CS Opportunity** — white section. Table showing stage → CNX intervention opportunity.

### PAGE 4 — AGENT PROFILE MATCH
Sections:
1. **Hero** — dark gradient. Title: "Agent Profile Match".
2. **Side-by-side comparison** — two-column layout:
   - Left: "Customer Profile" — demographics, communication style, expectations, tech savviness
   - Right: "CNX Agent Profile" — recommended profile, language skills, empathy level, domain knowledge needed
3. **Competency Fit Table** — columns: Competency | Customer Need | CNX Delivery | Fit Score (High/Med/Low)
4. **Hiring Criteria** — gray section. 3 cards: Must-Have Skills, Nice-to-Have, Red Flags.

### PAGE 5 — OPS FRAMEWORK
Sections:
1. **Hero** — dark gradient. Title: "Operations Framework".
2. **Tiered Routing** — 3 tier blocks (T1, T2, T3):
   - Each tier: badge (teal/yellow/raspberry), tier name, estimated volume %, contact types, agent profile, escalation triggers
3. **KPI Framework** — dark section. Grid of 8 KPI cards: CSAT target, FCR rate, AHT target, first response time, escalation rate, resolution SLA, quality score, NPS target. Base on industry benchmarks for the client's sector.
4. **Open Discovery Items** — white section. 4-6 cards of things CNX still needs from the client to finalize the program design.
5. **Footer** — "Why CNX, Why Now" — 2 dark callout boxes making the closing argument.

---

## CSS COMPONENT CLASSES TO USE

```css
/* Navigation */
.nav-logo { font-size:13px; font-weight:800; color:var(--cnx-teal); letter-spacing:1px; text-transform:uppercase; }
.nav-logo span { color:var(--cnx-white); font-weight:400; }
.nav-internal { font-size:9px; font-weight:700; color:var(--cnx-teal-60); text-transform:uppercase; letter-spacing:1.5px; }
.nav-pill { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--cnx-teal-60); border:1px solid rgba(37,226,204,0.3); border-radius:20px; padding:4px 10px; cursor:pointer; background:transparent; transition:all 0.2s; }
.nav-pill:hover, .nav-pill.active { background:var(--cnx-teal); color:var(--cnx-blue); border-color:var(--cnx-teal); }
.btn-nav { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; border-radius:20px; padding:6px 14px; cursor:pointer; border:none; transition:all 0.2s; }
.btn-nav-teal { background:var(--cnx-teal); color:var(--cnx-blue); }
.btn-nav-outline { background:transparent; color:var(--cnx-teal); border:1px solid var(--cnx-teal); }
.btn-edit { background:var(--cnx-yellow); color:var(--cnx-blue); }

/* Pages */
body.pdf-view .page { display:block; }
body.web-view .page { display:none; }
body.web-view .page.active { display:block; }
.page { position:relative; z-index:0; padding-top:60px; min-height:100vh; }

/* Hero */
.hero { background:linear-gradient(135deg,#003D5B 0%,#001f30 55%,#000d18 100%); padding:60px 48px 48px; position:relative; overflow:hidden; }
.hero-eyebrow { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:var(--cnx-teal); margin-bottom:12px; }
.hero h1 { font-size:42px; font-weight:900; color:var(--cnx-white); line-height:1.1; margin-bottom:8px; }
.hero h1 span { color:var(--cnx-teal); }
.hero-sub { font-size:13px; font-weight:400; color:rgba(255,255,255,0.65); margin-bottom:32px; }
.stat-row { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.stat-card { background:rgba(255,255,255,0.06); border:1px solid rgba(37,226,204,0.2); border-radius:8px; padding:16px; }
.stat-card .stat-val { font-size:24px; font-weight:900; color:var(--cnx-teal); line-height:1; margin-bottom:4px; }
.stat-card .stat-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.55); }

/* Sections */
.section { padding:48px; }
.section-gray { background:var(--cnx-gray); }
.section-dark { background:var(--cnx-blue); color:var(--cnx-white); }
.section-eyebrow { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:var(--cnx-teal); margin-bottom:8px; }
.section h2 { font-size:22px; font-weight:800; color:var(--cnx-blue); margin-bottom:20px; }
.section-dark h2 { color:var(--cnx-white); }
.section-dark .section-eyebrow { color:var(--cnx-teal-60); }

/* Grid layouts */
.two-col { display:grid; grid-template-columns:1fr 1fr; gap:32px; }
.three-col { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.four-col { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
.six-col { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }

/* Cards */
.card { background:var(--cnx-white); border:1px solid #e8e8e8; border-top:3px solid var(--cnx-teal); border-radius:6px; padding:20px; }
.card-dark { background:rgba(255,255,255,0.07); border:1px solid rgba(37,226,204,0.2); border-top:3px solid var(--cnx-teal); border-radius:6px; padding:20px; }
.card h4 { font-size:12px; font-weight:700; margin-bottom:8px; }
.card-dark h4 { color:var(--cnx-teal); }
.card p, .card-dark p { font-size:12px; line-height:1.65; }
.card-dark p { color:rgba(255,255,255,0.75); }

/* Chips */
.chip { display:inline-block; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; border-radius:20px; padding:3px 8px; margin:2px 2px 2px 0; }
.chip-teal { background:var(--cnx-teal-10); color:var(--cnx-jade); border:1px solid var(--cnx-teal-60); }
.chip-yellow { background:var(--cnx-yellow-20); color:#7a5e00; border:1px solid var(--cnx-yellow); }
.chip-orange { background:#FFF3E0; color:#8a4500; border:1px solid var(--cnx-orange); }
.chip-red { background:#FDEEF3; color:#8a1038; border:1px solid var(--cnx-raspberry); }

/* Table */
.data-table { width:100%; border-collapse:collapse; font-size:12px; }
.data-table th { background:var(--cnx-blue); color:var(--cnx-white); padding:10px 14px; text-align:left; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; }
.data-table td { padding:10px 14px; border-bottom:1px solid #e8e8e8; vertical-align:top; }
.data-table tr:nth-child(even) td { background:var(--cnx-gray); }

/* KPI */
.kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
.kpi-card { background:rgba(255,255,255,0.07); border:1px solid rgba(37,226,204,0.15); border-radius:8px; padding:16px; text-align:center; }
.kpi-val { font-size:22px; font-weight:900; color:var(--cnx-teal); }
.kpi-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:rgba(255,255,255,0.55); margin-top:4px; }

/* Callout */
.callout-dark { background:rgba(255,255,255,0.05); border-left:3px solid var(--cnx-teal); border-radius:0 6px 6px 0; padding:16px 20px; margin-bottom:12px; }
.callout-dark h4 { font-size:12px; font-weight:700; color:var(--cnx-teal); margin-bottom:6px; }
.callout-dark p { font-size:12px; color:rgba(255,255,255,0.75); line-height:1.65; }

/* Journey */
.journey-container { display:flex; gap:16px; overflow-x:auto; padding-bottom:16px; }
.journey-stage { min-width:180px; flex:1; background:var(--cnx-white); border:1px solid #e8e8e8; border-top:3px solid var(--cnx-teal); border-radius:6px; padding:16px; }
.journey-stage h4 { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:var(--cnx-blue); margin-bottom:8px; }
.emotion { font-size:18px; margin-bottom:4px; }
.emotion-lbl { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#888; margin-bottom:12px; }
.journey-stage ul { font-size:11px; line-height:1.6; padding-left:14px; color:#555; }

/* Pain points */
.pain-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
.pain-item { background:var(--cnx-white); border:1px solid #e8e8e8; border-radius:6px; padding:20px; }
.pain-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.pain-title { font-size:13px; font-weight:700; color:var(--cnx-blue); }
.pain-severity { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:1px; border-radius:20px; padding:3px 8px; }
.sev-high { background:#FDEEF3; color:var(--cnx-raspberry); border:1px solid var(--cnx-raspberry); }
.sev-med { background:#FFF3E0; color:#8a4500; border:1px solid var(--cnx-orange); }
.sev-low { background:var(--cnx-yellow-20); color:#7a5e00; border:1px solid var(--cnx-yellow); }
.pain-desc { font-size:12px; line-height:1.65; color:#444; margin-bottom:8px; }
.pain-source { font-size:10px; color:#888; font-style:italic; }

/* Framework tiers */
.framework-tier { border:1px solid #e8e8e8; border-radius:8px; margin-bottom:16px; overflow:hidden; }
.tier-header { display:flex; align-items:center; gap:12px; padding:14px 20px; background:var(--cnx-gray); }
.tier-badge { font-size:11px; font-weight:800; padding:4px 10px; border-radius:4px; }
.tier-title { font-size:14px; font-weight:700; color:var(--cnx-blue); }
.tier-volume { margin-left:auto; font-size:11px; color:#666; }
.tier-body { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
.tier-col { padding:16px 20px; border-right:1px solid #e8e8e8; }
.tier-col:last-child { border-right:none; }
.tier-col-label { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--cnx-teal); margin-bottom:8px; }
.tier-col ul { font-size:11px; line-height:1.7; padding-left:14px; color:#444; }

/* Discovery */
.discovery-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.discovery-card { background:#f9f9f9; border:1px solid #e8e8e8; border-radius:6px; padding:20px; }
.disc-icon { font-size:20px; margin-bottom:8px; }
.discovery-card h5 { font-size:12px; font-weight:700; color:var(--cnx-blue); margin-bottom:6px; }
.discovery-card p { font-size:11px; line-height:1.6; color:#555; }

/* Footer */
.page-footer { background:var(--cnx-charcoal); color:rgba(255,255,255,0.5); display:flex; justify-content:space-between; align-items:center; padding:16px 48px; font-size:9px; font-weight:500; letter-spacing:0.5px; }

/* Edit mode */
[contenteditable="true"] { outline:2px dashed var(--cnx-teal); outline-offset:2px; border-radius:2px; }

/* Mobile nav */
.mob-tab { background:transparent; border:none; color:rgba(255,255,255,0.5); font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; text-align:center; padding:4px 8px; cursor:pointer; flex:1; }
.mob-tab.active { color:var(--cnx-teal); }
.mob-tab div:first-child { font-size:11px; font-weight:800; }

/* Responsive */
@media (max-width:900px) {
  .stat-row { grid-template-columns:repeat(2,1fr); }
  .two-col, .three-col, .four-col, .six-col { grid-template-columns:1fr; }
  .kpi-grid { grid-template-columns:repeat(2,1fr); }
  .pain-grid { grid-template-columns:1fr; }
  .tier-body { grid-template-columns:1fr; }
  .discovery-grid { grid-template-columns:repeat(2,1fr); }
  .section { padding:32px 24px; }
  .hero { padding:40px 24px 32px; }
  .hero h1 { font-size:28px; }
  body.web-view .page { padding-bottom:80px; }
  #edit-toolbar { bottom:88px; }
}

@media (max-width:480px) {
  .stat-row { grid-template-columns:1fr 1fr; }
  .kpi-grid { grid-template-columns:1fr 1fr; }
  .discovery-grid { grid-template-columns:1fr; }
  .hero h1 { font-size:22px; }
  .section { padding:24px 16px; }
  .hero { padding:32px 16px 24px; }
  #edit-toolbar { bottom:84px; right:16px; }
}

/* Print */
@media print {
  #main-nav, #mobile-nav, #edit-toolbar { display:none !important; }
  body.pdf-view .page, body.web-view .page, .page { display:block !important; padding-top:0 !important; }
  .page ~ .page { page-break-before:always; break-before:page; }
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  .card, .card-dark, .pain-item, .framework-tier, .stat-card, .kpi-card { break-inside:avoid; }
  .journey-container { flex-direction:row !important; overflow-x:visible !important; }
  .data-table { display:table !important; overflow-x:visible !important; }
}
```

---

## JAVASCRIPT (copy exactly into a `<script>` tag before `</body>`)

```javascript
const STORAGE_KEY = 'cnx_[CLIENTNAME_SLUG]_brief_edits_v1';
const EXPORT_FILENAME = '[clientname-slug]-brief-final.html';
const EDITABLE_SELECTORS = 'h1, h2, h3, h4, h5, p, li, .stat-val, .stat-lbl, .kpi-val, .kpi-lbl, td, .hero-sub, .tier-title, .tier-volume, .pain-source, .pain-title, .pain-desc, .emotion-lbl';

let currentView = 'pdf';
let editMode = false;
let saveTimer = null;

function switchToWebView() {
  currentView = 'web';
  document.body.classList.remove('pdf-view');
  document.body.classList.add('web-view');
  document.getElementById('pdfControls').style.display = 'none';
  document.getElementById('webControls').style.display = 'flex';
  if (window.innerWidth <= 900) {
    document.getElementById('mobile-nav').style.display = 'flex';
  }
  showPage(0);
}

function switchToPdfView() {
  if (editMode) toggleEditMode();
  currentView = 'pdf';
  document.body.classList.remove('web-view');
  document.body.classList.add('pdf-view');
  document.getElementById('pdfControls').style.display = 'flex';
  document.getElementById('webControls').style.display = 'none';
  document.getElementById('mobile-nav').style.display = 'none';
  window.scrollTo(0, 0);
}

function triggerPrint() {
  if (currentView !== 'pdf') switchToPdfView();
  setTimeout(() => window.print(), 150);
}

function showPage(idx) {
  if (currentView !== 'web') return;
  document.querySelectorAll('.page').forEach((p, i) => p.classList.toggle('active', i === idx));
  document.querySelectorAll('#navPills .nav-pill').forEach((p, i) => p.classList.toggle('active', i === idx));
  document.querySelectorAll('.mob-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  window.scrollTo(0, 0);
}

function stampEditIds() {
  let counter = 1;
  document.querySelectorAll(EDITABLE_SELECTORS).forEach(el => {
    if (!el.dataset.editId) el.dataset.editId = 'eid_' + counter++;
  });
}

function loadEdits() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const edits = JSON.parse(saved);
    Object.entries(edits).forEach(([eid, html]) => {
      const el = document.querySelector('[data-edit-id="' + eid + '"]');
      if (el) el.innerHTML = html;
    });
  } catch(e) {}
}

function saveEdit(el) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      saved[el.dataset.editId] = el.innerHTML;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      document.getElementById('edit-status').textContent = '✅ Saved';
      setTimeout(() => { document.getElementById('edit-status').textContent = '✏️ Edit Mode'; }, 1500);
    } catch(e) {}
  }, 1200);
}

function toggleEditMode() {
  editMode = !editMode;
  const toolbar = document.getElementById('edit-toolbar');
  toolbar.style.display = editMode ? 'flex' : 'none';
  document.querySelectorAll(EDITABLE_SELECTORS).forEach(el => {
    if (editMode) {
      el.contentEditable = 'true';
      el.addEventListener('input', () => saveEdit(el));
    } else {
      el.contentEditable = 'false';
    }
  });
  if (editMode && currentView === 'pdf') switchToWebView();
}

function resetEdits() {
  if (!confirm('Reset all edits? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function exportBrief() {
  const clone = document.cloneNode(true);
  clone.getElementById('edit-toolbar')?.remove();
  clone.getElementById('mobile-nav')?.remove();
  clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
  clone.querySelectorAll('[data-edit-id]').forEach(el => el.removeAttribute('data-edit-id'));
  clone.body.className = 'pdf-view';
  const blob = new Blob(['<!DOCTYPE html>' + clone.documentElement.outerHTML], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = EXPORT_FILENAME;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.addEventListener('DOMContentLoaded', () => {
  stampEditIds();
  loadEdits();
});
```

**In the JS, replace:**
- `[CLIENTNAME_SLUG]` with the client name lowercased, spaces replaced by underscores (e.g. `gentle_monster`)
- `[clientname-slug]` with the client name lowercased, spaces replaced by hyphens (e.g. `gentle-monster`)

---

## PAGE FOOTER (repeat on each page, last element before closing `</div>`)
```html
<div class="page-footer">
  <div>© 2025 Concentrix Corp. All rights reserved. Confidential and proprietary.</div>
  <div>[CLIENT NAME] Program Brief</div>
  <div>Prepared by [REQUESTED BY] · Internal use only</div>
</div>
```

---

## FINAL REMINDER
- Output is RAW HTML only. Starts with `<!DOCTYPE html>`. Ends with `</html>`.
- All 5 pages must be present and fully populated with real research data.
- No placeholder text. No lorem ipsum. No "[INSERT DATA]" markers in the output.
- Every pain point must have a real source citation.
- KPI targets must be realistic for the client's industry.
