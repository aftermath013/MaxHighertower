const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

const INPUT_PRICE_PER_TOKEN = 3.0 / 1_000_000;
const OUTPUT_PRICE_PER_TOKEN = 15.0 / 1_000_000;

module.exports = async function (context, req) {
  const tableClient = TableClient.fromConnectionString(
    process.env.STORAGE_CONNECTION_STRING,
    process.env.TABLE_NAME
  );

  let projectId;
  try {
    projectId = req.body?.projectId;
    if (!projectId) {
      context.res = { status: 400, body: { success: false, error: 'Missing projectId.' } };
      return;
    }

    const entity = await tableClient.getEntity('projects', projectId);
    if (!['pending', 'failed'].includes(entity.status)) {
      context.res = { status: 400, body: { success: false, error: `Cannot generate: status is ${entity.status}.` } };
      return;
    }

    // Research phase
    await updateStatus(tableClient, projectId, 'researching', 'Researching your client...');
    const clientInfo = await fetchClientInfo(entity.clientUrl);

    // Generation phase
    await updateStatus(tableClient, projectId, 'generating', 'Generating brief with AI...');
    const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompt.md'), 'utf8');
    const userMessage = buildUserMessage(entity, clientInfo);

    const { data, inputTokens, outputTokens } = await callAI(systemPrompt, userMessage, context);

    if (!data || !data.clientName) {
      await updateStatus(tableClient, projectId, 'failed', 'AI returned invalid data.');
      context.res = { status: 500, body: { success: false, error: 'AI returned invalid data.' } };
      return;
    }

    const html = buildHTML(data, entity);

    // Save phase
    await updateStatus(tableClient, projectId, 'saving', 'Saving your brief...');
    const blobUrl = await saveToBlob(projectId, html);

    const costUsd = ((inputTokens * INPUT_PRICE_PER_TOKEN) + (outputTokens * OUTPUT_PRICE_PER_TOKEN)).toFixed(4);

    await tableClient.updateEntity({
      partitionKey: 'projects',
      rowKey: projectId,
      status: 'generated',
      statusMessage: 'Brief is ready!',
      blobUrl,
      inputTokens,
      outputTokens,
      costUsd,
      generatedAt: new Date().toISOString()
    }, 'Merge');

    context.res = { status: 200, body: { success: true, data: { blobUrl, inputTokens, outputTokens, costUsd } } };
  } catch (err) {
    context.log.error('generate-brief error:', err.message);
    if (projectId) {
      await updateStatus(tableClient, projectId, 'failed', err.message).catch(() => {});
    }
    context.res = { status: 500, body: { success: false, error: 'Brief generation failed.' } };
  }
};

// ─── AI call ──────────────────────────────────────────────────────────────────

async function callAI(systemPrompt, userMessage, context) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 80000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'claude-sonnet-4-5',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const apiData = await res.json();
    let text = apiData.content?.[0]?.text || '';
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error('AI returned unparseable JSON: ' + e.message);
    }

    return {
      data,
      inputTokens: apiData.usage?.input_tokens || 0,
      outputTokens: apiData.usage?.output_tokens || 0
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('AI call timed out after 80s');
    throw err;
  }
}

// ─── Support functions ────────────────────────────────────────────────────────

async function fetchClientInfo(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const html = await res.text();
    const title = html.match(/<title[^>]*>([^<]+)/i)?.[1]?.trim() || '';
    const descMatch = html.match(/meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,500})/i);
    const description = descMatch?.[1]?.trim() || '';
    return { title, description, fetched: true };
  } catch {
    return { title: '', description: '', fetched: false };
  }
}

function buildUserMessage(entity, clientInfo) {
  let extra = '';
  if (clientInfo.fetched) {
    extra = `\nCLIENT WEBSITE DATA:\nTitle: ${clientInfo.title}\nDescription: ${clientInfo.description}\n`;
  }
  return `Generate a CNX program brief for the following client:

CLIENT NAME: ${entity.clientName}
CLIENT URL: ${entity.clientUrl}
LOB SCOPE: ${entity.lobScope}
DELIVERY LOCATION: ${entity.deliveryLocation}
CHANNEL SCOPE: ${entity.channelScope || 'TBD'}
REQUESTED BY: ${entity.requestedBy}
${extra}
Return the JSON object only. No explanation.`;
}

async function saveToBlob(projectId, html) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(process.env.BLOB_CONTAINER);
  const blobClient = containerClient.getBlockBlobClient(`${projectId}.html`);
  await blobClient.upload(html, Buffer.byteLength(html), {
    blobHTTPHeaders: { blobContentType: 'text/html; charset=utf-8' }
  });
  return blobClient.url;
}

async function updateStatus(tableClient, projectId, status, message) {
  await tableClient.updateEntity({
    partitionKey: 'projects',
    rowKey: projectId,
    status,
    statusMessage: message || ''
  }, 'Merge');
}

// ─── HTML shell ───────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function safe(v, fallback = '') { return v || fallback; }
function safeArr(v) { return Array.isArray(v) ? v : []; }

function buildHTML(data, entity) {
  const clientName = safe(data.clientName, entity.clientName);
  const requestedBy = safe(entity.requestedBy);
  const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const hyphenSlug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(clientName)} — Concentrix Program Brief</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--cnx-blue:#003D5B;--cnx-teal:#25E2CC;--cnx-teal-60:#7CEEE0;--cnx-teal-20:#D3F9F5;--cnx-teal-10:#E9FCFA;--cnx-jade:#007380;--cnx-yellow:#FBCA18;--cnx-yellow-20:#FEF4D1;--cnx-orange:#FF8400;--cnx-raspberry:#CC3262;--cnx-charcoal:#2A2B2C;--cnx-gray:#F2F2F2;--cnx-white:#FFFFFF}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Montserrat',sans-serif;background:#fff;color:var(--cnx-charcoal);font-size:13px;line-height:1.7}
.nav-logo{font-size:13px;font-weight:800;color:var(--cnx-teal);letter-spacing:1px;text-transform:uppercase}
.nav-logo span{color:var(--cnx-white);font-weight:400}
.nav-internal{font-size:9px;font-weight:700;color:var(--cnx-teal-60);text-transform:uppercase;letter-spacing:1.5px}
.nav-pill{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--cnx-teal-60);border:1px solid rgba(37,226,204,.3);border-radius:20px;padding:4px 10px;cursor:pointer;background:transparent;transition:all .2s}
.nav-pill:hover,.nav-pill.active{background:var(--cnx-teal);color:var(--cnx-blue);border-color:var(--cnx-teal)}
.btn-nav{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;border-radius:20px;padding:6px 14px;cursor:pointer;border:none;transition:all .2s}
.btn-nav-teal{background:var(--cnx-teal);color:var(--cnx-blue)}
.btn-nav-outline{background:transparent;color:var(--cnx-teal);border:1px solid var(--cnx-teal)}
.btn-edit{background:var(--cnx-yellow);color:var(--cnx-blue)}
body.pdf-view .page{display:block}
body.web-view .page{display:none}
body.web-view .page.active{display:block}
.page{position:relative;z-index:0;padding-top:60px;min-height:100vh}
.hero{background:linear-gradient(135deg,#003D5B 0%,#001f30 55%,#000d18 100%);padding:60px 48px 48px;position:relative;overflow:hidden}
.hero-eyebrow{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--cnx-teal);margin-bottom:12px}
.hero h1{font-size:42px;font-weight:900;color:var(--cnx-white);line-height:1.1;margin-bottom:8px}
.hero h1 span{color:var(--cnx-teal)}
.hero-sub{font-size:13px;font-weight:400;color:rgba(255,255,255,.65);margin-bottom:32px}
.stat-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.stat-card{background:rgba(255,255,255,.06);border:1px solid rgba(37,226,204,.2);border-radius:8px;padding:16px}
.stat-card .stat-val{font-size:24px;font-weight:900;color:var(--cnx-teal);line-height:1;margin-bottom:4px}
.stat-card .stat-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.55)}
.section{padding:48px}
.section-gray{background:var(--cnx-gray)}
.section-dark{background:var(--cnx-blue);color:var(--cnx-white)}
.section-eyebrow{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:var(--cnx-teal);margin-bottom:8px}
.section h2{font-size:22px;font-weight:800;color:var(--cnx-blue);margin-bottom:20px}
.section-dark h2{color:var(--cnx-white)}
.section-dark .section-eyebrow{color:var(--cnx-teal-60)}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.four-col{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.six-col{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:var(--cnx-white);border:1px solid #e8e8e8;border-top:3px solid var(--cnx-teal);border-radius:6px;padding:20px}
.card-dark{background:rgba(255,255,255,.07);border:1px solid rgba(37,226,204,.2);border-top:3px solid var(--cnx-teal);border-radius:6px;padding:20px}
.card h4{font-size:12px;font-weight:700;margin-bottom:8px}
.card-dark h4{color:var(--cnx-teal)}
.card p,.card-dark p{font-size:12px;line-height:1.65}
.card-dark p{color:rgba(255,255,255,.75)}
.chip{display:inline-block;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;border-radius:20px;padding:3px 8px;margin:2px 2px 2px 0}
.chip-teal{background:var(--cnx-teal-10);color:var(--cnx-jade);border:1px solid var(--cnx-teal-60)}
.chip-yellow{background:var(--cnx-yellow-20);color:#7a5e00;border:1px solid var(--cnx-yellow)}
.chip-orange{background:#FFF3E0;color:#8a4500;border:1px solid var(--cnx-orange)}
.chip-red{background:#FDEEF3;color:#8a1038;border:1px solid var(--cnx-raspberry)}
.data-table{width:100%;border-collapse:collapse;font-size:12px}
.data-table th{background:var(--cnx-blue);color:var(--cnx-white);padding:10px 14px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
.data-table td{padding:10px 14px;border-bottom:1px solid #e8e8e8;vertical-align:top}
.data-table tr:nth-child(even) td{background:var(--cnx-gray)}
.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.kpi-card{background:rgba(255,255,255,.07);border:1px solid rgba(37,226,204,.15);border-radius:8px;padding:16px;text-align:center}
.kpi-val{font-size:22px;font-weight:900;color:var(--cnx-teal)}
.kpi-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:rgba(255,255,255,.55);margin-top:4px}
.callout-dark{background:rgba(255,255,255,.05);border-left:3px solid var(--cnx-teal);border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:12px}
.callout-dark h4{font-size:12px;font-weight:700;color:var(--cnx-teal);margin-bottom:6px}
.callout-dark p{font-size:12px;color:rgba(255,255,255,.75);line-height:1.65}
.journey-container{display:flex;gap:16px;overflow-x:auto;padding-bottom:16px}
.journey-stage{min-width:180px;flex:1;background:var(--cnx-white);border:1px solid #e8e8e8;border-top:3px solid var(--cnx-teal);border-radius:6px;padding:16px}
.journey-stage h4{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--cnx-blue);margin-bottom:8px}
.emotion{font-size:18px;margin-bottom:4px}
.emotion-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#888;margin-bottom:12px}
.journey-stage ul{font-size:11px;line-height:1.6;padding-left:14px;color:#555}
.pain-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.pain-item{background:var(--cnx-white);border:1px solid #e8e8e8;border-radius:6px;padding:20px}
.pain-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.pain-title{font-size:13px;font-weight:700;color:var(--cnx-blue)}
.pain-severity{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:1px;border-radius:20px;padding:3px 8px}
.sev-high{background:#FDEEF3;color:var(--cnx-raspberry);border:1px solid var(--cnx-raspberry)}
.sev-med{background:#FFF3E0;color:#8a4500;border:1px solid var(--cnx-orange)}
.sev-low{background:var(--cnx-yellow-20);color:#7a5e00;border:1px solid var(--cnx-yellow)}
.pain-desc{font-size:12px;line-height:1.65;color:#444;margin-bottom:8px}
.pain-source{font-size:10px;color:#888;font-style:italic}
.framework-tier{border:1px solid #e8e8e8;border-radius:8px;margin-bottom:16px;overflow:hidden}
.tier-header{display:flex;align-items:center;gap:12px;padding:14px 20px;background:var(--cnx-gray)}
.tier-badge{font-size:11px;font-weight:800;padding:4px 10px;border-radius:4px}
.tier-title{font-size:14px;font-weight:700;color:var(--cnx-blue)}
.tier-volume{margin-left:auto;font-size:11px;color:#666}
.tier-body{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.tier-col{padding:16px 20px;border-right:1px solid #e8e8e8}
.tier-col:last-child{border-right:none}
.tier-col-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--cnx-teal);margin-bottom:8px}
.tier-col ul{font-size:11px;line-height:1.7;padding-left:14px;color:#444}
.discovery-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.discovery-card{background:#f9f9f9;border:1px solid #e8e8e8;border-radius:6px;padding:20px}
.disc-icon{font-size:20px;margin-bottom:8px}
.discovery-card h5{font-size:12px;font-weight:700;color:var(--cnx-blue);margin-bottom:6px}
.discovery-card p{font-size:11px;line-height:1.6;color:#555}
.page-footer{background:var(--cnx-charcoal);color:rgba(255,255,255,.5);display:flex;justify-content:space-between;align-items:center;padding:16px 48px;font-size:9px;font-weight:500;letter-spacing:.5px}
[contenteditable="true"]{outline:2px dashed var(--cnx-teal);outline-offset:2px;border-radius:2px}
.mob-tab{background:transparent;border:none;color:rgba(255,255,255,.5);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;text-align:center;padding:4px 8px;cursor:pointer;flex:1}
.mob-tab.active{color:var(--cnx-teal)}
.mob-tab div:first-child{font-size:11px;font-weight:800}
@media(max-width:900px){.stat-row{grid-template-columns:repeat(2,1fr)}.two-col,.three-col,.four-col,.six-col{grid-template-columns:1fr}.kpi-grid{grid-template-columns:repeat(2,1fr)}.pain-grid{grid-template-columns:1fr}.tier-body{grid-template-columns:1fr}.discovery-grid{grid-template-columns:repeat(2,1fr)}.section{padding:32px 24px}.hero{padding:40px 24px 32px}.hero h1{font-size:28px}body.web-view .page{padding-bottom:80px}#edit-toolbar{bottom:88px}}
@media(max-width:480px){.stat-row{grid-template-columns:1fr 1fr}.kpi-grid{grid-template-columns:1fr 1fr}.discovery-grid{grid-template-columns:1fr}.hero h1{font-size:22px}.section{padding:24px 16px}.hero{padding:32px 16px 24px}#edit-toolbar{bottom:84px;right:16px}}
@media print{#main-nav,#mobile-nav,#edit-toolbar{display:none!important}body.pdf-view .page,body.web-view .page,.page{display:block!important;padding-top:0!important}.page~.page{page-break-before:always;break-before:page}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.card,.card-dark,.pain-item,.framework-tier,.stat-card,.kpi-card{break-inside:avoid}.journey-container{flex-direction:row!important;overflow-x:visible!important}.data-table{display:table!important;overflow-x:visible!important}}
</style>
</head>
<body class="pdf-view">

<nav id="main-nav" style="position:fixed;top:0;left:0;right:0;height:60px;background:var(--cnx-blue);border-bottom:3px solid var(--cnx-teal);display:flex;align-items:center;padding:0 24px;gap:16px;z-index:2000;">
  <div class="nav-logo">CNX<span> | ${esc(clientName)}</span></div>
  <div class="nav-internal">Internal &middot; Confidential</div>
  <div style="flex:1"></div>
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
  <div id="webControls" style="display:none;align-items:center;gap:10px;">
    <button class="btn-nav btn-nav-outline" onclick="switchToPdfView()">← Share View</button>
    <button class="btn-nav btn-nav-teal" onclick="triggerPrint()">Print</button>
  </div>
</nav>

<div id="mobile-nav" style="display:none;position:fixed;bottom:0;left:0;right:0;background:rgba(0,61,91,.98);border-top:2px solid var(--cnx-teal);display:flex;justify-content:space-around;padding:6px 0;z-index:1999;">
  <button class="mob-tab active" onclick="showPage(0)"><div>01</div><div>Brief</div></button>
  <button class="mob-tab" onclick="showPage(1)"><div>02</div><div>Pain</div></button>
  <button class="mob-tab" onclick="showPage(2)"><div>03</div><div>Journey</div></button>
  <button class="mob-tab" onclick="showPage(3)"><div>04</div><div>Agents</div></button>
  <button class="mob-tab" onclick="showPage(4)"><div>05</div><div>Ops</div></button>
</div>

<div id="edit-toolbar" style="display:none;position:fixed;bottom:24px;right:24px;background:var(--cnx-blue);border:1px solid var(--cnx-teal);border-radius:8px;padding:10px 16px;z-index:3000;gap:10px;align-items:center;">
  <span id="edit-status" style="font-size:11px;color:var(--cnx-teal);">✏️ Edit Mode</span>
  <button onclick="resetEdits()" style="font-size:11px;background:transparent;border:1px solid var(--cnx-raspberry);color:var(--cnx-raspberry);border-radius:4px;padding:4px 10px;cursor:pointer;">Reset</button>
  <button onclick="exportBrief()" style="font-size:11px;background:var(--cnx-teal);color:var(--cnx-blue);border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-weight:700;">Export HTML</button>
</div>

${buildPage1(data, clientName, requestedBy)}
${buildPage2(data, clientName, requestedBy)}
${buildPage3(data, clientName, requestedBy)}
${buildPage4(data, clientName, requestedBy)}
${buildPage5(data, clientName, requestedBy)}

<script>
var STORAGE_KEY='cnx_${slug}_brief_edits_v1';
var EXPORT_FILENAME='${hyphenSlug}-brief-final.html';
var EDITABLE_SELECTORS='h1,h2,h3,h4,h5,p,li,.stat-val,.stat-lbl,.kpi-val,.kpi-lbl,td,.hero-sub,.tier-title,.tier-volume,.pain-source,.pain-title,.pain-desc,.emotion-lbl';
var currentView='pdf',editMode=false,saveTimer=null;
function switchToWebView(){currentView='web';document.body.classList.remove('pdf-view');document.body.classList.add('web-view');document.getElementById('pdfControls').style.display='none';document.getElementById('webControls').style.display='flex';if(window.innerWidth<=900)document.getElementById('mobile-nav').style.display='flex';showPage(0);}
function switchToPdfView(){if(editMode)toggleEditMode();currentView='pdf';document.body.classList.remove('web-view');document.body.classList.add('pdf-view');document.getElementById('pdfControls').style.display='flex';document.getElementById('webControls').style.display='none';document.getElementById('mobile-nav').style.display='none';window.scrollTo(0,0);}
function triggerPrint(){if(currentView!=='pdf')switchToPdfView();setTimeout(function(){window.print();},150);}
function showPage(idx){if(currentView!=='web')return;document.querySelectorAll('.page').forEach(function(p,i){p.classList.toggle('active',i===idx);});document.querySelectorAll('#navPills .nav-pill').forEach(function(p,i){p.classList.toggle('active',i===idx);});document.querySelectorAll('.mob-tab').forEach(function(t,i){t.classList.toggle('active',i===idx);});window.scrollTo(0,0);}
function stampEditIds(){var counter=1;document.querySelectorAll(EDITABLE_SELECTORS).forEach(function(el){if(!el.dataset.editId)el.dataset.editId='eid_'+counter++;});}
function loadEdits(){try{var saved=localStorage.getItem(STORAGE_KEY);if(!saved)return;var edits=JSON.parse(saved);Object.entries(edits).forEach(function(e){var el=document.querySelector('[data-edit-id="'+e[0]+'"]');if(el)el.innerHTML=e[1];});}catch(e){}}
function saveEdit(el){clearTimeout(saveTimer);saveTimer=setTimeout(function(){try{var saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');saved[el.dataset.editId]=el.innerHTML;localStorage.setItem(STORAGE_KEY,JSON.stringify(saved));document.getElementById('edit-status').textContent='✅ Saved';setTimeout(function(){document.getElementById('edit-status').textContent='✏️ Edit Mode';},1500);}catch(e){}},1200);}
function toggleEditMode(){editMode=!editMode;var toolbar=document.getElementById('edit-toolbar');toolbar.style.display=editMode?'flex':'none';document.querySelectorAll(EDITABLE_SELECTORS).forEach(function(el){if(editMode){el.contentEditable='true';el.addEventListener('input',function(){saveEdit(el);});}else{el.contentEditable='false';}});if(editMode&&currentView==='pdf')switchToWebView();}
function resetEdits(){if(!confirm('Reset all edits? This cannot be undone.'))return;localStorage.removeItem(STORAGE_KEY);location.reload();}
function exportBrief(){var clone=document.cloneNode(true);clone.getElementById('edit-toolbar')&&clone.getElementById('edit-toolbar').remove();clone.getElementById('mobile-nav')&&clone.getElementById('mobile-nav').remove();clone.querySelectorAll('[contenteditable]').forEach(function(el){el.removeAttribute('contenteditable');});clone.querySelectorAll('[data-edit-id]').forEach(function(el){el.removeAttribute('data-edit-id');});clone.body.className='pdf-view';var blob=new Blob(['<!DOCTYPE html>'+clone.documentElement.outerHTML],{type:'text/html'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=EXPORT_FILENAME;a.click();URL.revokeObjectURL(a.href);}
document.addEventListener('DOMContentLoaded',function(){stampEditIds();loadEdits();});
</script>
</body>
</html>`;
}

function buildFooter(clientName, requestedBy) {
  return `<div class="page-footer">
  <div>&copy; 2025 Concentrix Corp. All rights reserved. Confidential and proprietary.</div>
  <div>${esc(clientName)} Program Brief</div>
  <div>Prepared by ${esc(requestedBy)} &middot; Internal use only</div>
</div>`;
}

function buildPage1(data, clientName, requestedBy) {
  const stats = safeArr(data.stats).slice(0, 4).map(s =>
    `<div class="stat-card"><div class="stat-val">${esc(s.val)}</div><div class="stat-lbl">${esc(s.lbl)}</div></div>`
  ).join('');

  const catalogRows = safeArr(data.catalog).map(r =>
    `<tr><td><strong>${esc(r.product)}</strong></td><td>${esc(r.description)}</td><td>${esc(r.priceRange)}</td><td>${esc(r.targetSegment)}</td></tr>`
  ).join('');

  const archetypes = safeArr(data.archetypes).slice(0, 6).map(a =>
    `<div class="card"><div style="font-size:28px;margin-bottom:8px;">${esc(a.icon)}</div><h4>${esc(a.name)}</h4><p>${esc(a.description)}</p></div>`
  ).join('');

  const cnxRole = safeArr(data.cnxRole).map(r =>
    `<div class="card-dark"><h4>${esc(r.title)}</h4><p>${esc(r.body)}</p></div>`
  ).join('');

  return `<div class="page">
  <div class="hero">
    <div class="hero-eyebrow">Concentrix Program Brief</div>
    <h1>${esc(clientName)}</h1>
    <div class="hero-sub">${esc(safe(data.clientTagline))}</div>
    <div class="stat-row">${stats}</div>
  </div>
  <div class="section">
    <div class="section-eyebrow">Product &amp; Service Catalog</div>
    <h2>What ${esc(clientName)} Sells</h2>
    <table class="data-table">
      <thead><tr><th>Product / Service</th><th>Description</th><th>Price Range</th><th>Target Segment</th></tr></thead>
      <tbody>${catalogRows}</tbody>
    </table>
  </div>
  <div class="section section-gray">
    <div class="section-eyebrow">Customer Archetypes</div>
    <h2>Who Contacts CS</h2>
    <div class="six-col">${archetypes}</div>
  </div>
  <div class="section section-dark">
    <div class="section-eyebrow">CNX Role</div>
    <h2>What We Bring</h2>
    <div class="three-col">${cnxRole}</div>
  </div>
  ${buildFooter(clientName, requestedBy)}
</div>`;
}

function buildPage2(data, clientName, requestedBy) {
  const sevClass = { HIGH: 'sev-high', MED: 'sev-med', LOW: 'sev-low' };

  const painItems = safeArr(data.painPoints).map(p =>
    `<div class="pain-item">
      <div class="pain-header">
        <span class="pain-title">${esc(p.title)}</span>
        <span class="pain-severity ${sevClass[p.severity] || 'sev-med'}">${esc(p.severity)}</span>
      </div>
      <div class="pain-desc">${esc(p.description)}</div>
      <div class="pain-source">Source: ${esc(p.source)}</div>
    </div>`
  ).join('');

  const summary = data.painSummary || {};

  return `<div class="page">
  <div class="hero">
    <div class="hero-eyebrow">Page 02</div>
    <h1>Customer <span>Pain Points</span></h1>
    <div class="hero-sub">Real complaints sourced from public review platforms and consumer protection filings.</div>
  </div>
  <div class="section">
    <div class="section-eyebrow">Complaint Analysis</div>
    <h2>What Customers Are Saying</h2>
    <div class="pain-grid">${painItems}</div>
  </div>
  <div class="section section-dark">
    <div class="section-eyebrow">Pattern Summary</div>
    <h2>Implications for CNX</h2>
    <div class="callout-dark"><h4>What customers keep saying</h4><p>${esc(safe(summary.whatCustomersSay))}</p></div>
    <div class="callout-dark"><h4>CS implication for CNX</h4><p>${esc(safe(summary.csImplication))}</p></div>
  </div>
  ${buildFooter(clientName, requestedBy)}
</div>`;
}

function buildPage3(data, clientName, requestedBy) {
  const stages = safeArr(data.journeyStages).map(s =>
    `<div class="journey-stage">
      <h4>${esc(s.name)}</h4>
      <div class="emotion">${esc(s.emotion)}</div>
      <div class="emotion-lbl">${esc(s.emotionLabel)}</div>
      <ul>${safeArr(s.triggers).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <div style="margin-top:10px;font-size:10px;color:#888;">${esc(s.channel)}</div>
    </div>`
  ).join('');

  const opportunityRows = safeArr(data.csOpportunity).map(o =>
    `<tr><td><strong>${esc(o.stage)}</strong></td><td>${esc(o.intervention)}</td></tr>`
  ).join('');

  return `<div class="page">
  <div class="hero">
    <div class="hero-eyebrow">Page 03</div>
    <h1>Customer <span>Journey Map</span></h1>
    <div class="hero-sub">Lifecycle stages, emotion states, and contact triggers across the customer relationship.</div>
  </div>
  <div class="section">
    <div class="section-eyebrow">Journey Stages</div>
    <h2>The ${esc(clientName)} Customer Lifecycle</h2>
    <div class="journey-container">${stages}</div>
  </div>
  <div class="section section-gray">
    <div class="section-eyebrow">CS Opportunity</div>
    <h2>Where CNX Intervenes</h2>
    <table class="data-table">
      <thead><tr><th>Stage</th><th>CNX Intervention Opportunity</th></tr></thead>
      <tbody>${opportunityRows}</tbody>
    </table>
  </div>
  ${buildFooter(clientName, requestedBy)}
</div>`;
}

function buildPage4(data, clientName, requestedBy) {
  const cp = data.customerProfile || {};
  const ap = data.agentProfile || {};

  const competencyRows = safeArr(data.competencies).map(c => {
    const fitColor = { High: 'chip-teal', Med: 'chip-yellow', Low: 'chip-orange' }[c.fitScore] || 'chip-teal';
    return `<tr>
      <td><strong>${esc(c.competency)}</strong></td>
      <td>${esc(c.customerNeed)}</td>
      <td>${esc(c.cnxDelivery)}</td>
      <td><span class="chip ${fitColor}">${esc(c.fitScore)}</span></td>
    </tr>`;
  }).join('');

  const hiring = data.hiring || {};

  return `<div class="page">
  <div class="hero">
    <div class="hero-eyebrow">Page 04</div>
    <h1>Agent Profile <span>Match</span></h1>
    <div class="hero-sub">Aligning customer expectations with CNX agent design and hiring criteria.</div>
  </div>
  <div class="section">
    <div class="section-eyebrow">Profile Comparison</div>
    <h2>Customer vs. CNX Agent</h2>
    <div class="two-col">
      <div class="card">
        <h4>Customer Profile</h4>
        <table class="data-table" style="margin-top:12px;">
          <tbody>
            <tr><td><strong>Demographics</strong></td><td>${esc(cp.demographics)}</td></tr>
            <tr><td><strong>Communication Style</strong></td><td>${esc(cp.commStyle)}</td></tr>
            <tr><td><strong>Expectations</strong></td><td>${esc(cp.expectations)}</td></tr>
            <tr><td><strong>Tech Savviness</strong></td><td>${esc(cp.techSavvy)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="card">
        <h4>CNX Agent Profile</h4>
        <table class="data-table" style="margin-top:12px;">
          <tbody>
            <tr><td><strong>Recommended Profile</strong></td><td>${esc(ap.profile)}</td></tr>
            <tr><td><strong>Language Skills</strong></td><td>${esc(ap.languages)}</td></tr>
            <tr><td><strong>Empathy Level</strong></td><td>${esc(ap.empathy)}</td></tr>
            <tr><td><strong>Domain Knowledge</strong></td><td>${esc(ap.domainKnowledge)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="section section-gray">
    <div class="section-eyebrow">Competency Fit</div>
    <h2>Alignment Table</h2>
    <table class="data-table">
      <thead><tr><th>Competency</th><th>Customer Need</th><th>CNX Delivery</th><th>Fit Score</th></tr></thead>
      <tbody>${competencyRows}</tbody>
    </table>
  </div>
  <div class="section">
    <div class="section-eyebrow">Hiring Criteria</div>
    <h2>What We Hire For</h2>
    <div class="three-col">
      <div class="card">
        <h4>Must-Have Skills</h4>
        <ul style="padding-left:16px;font-size:12px;line-height:1.8;">${safeArr(hiring.mustHave).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
      <div class="card">
        <h4>Nice-to-Have</h4>
        <ul style="padding-left:16px;font-size:12px;line-height:1.8;">${safeArr(hiring.niceToHave).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
      <div class="card" style="border-top-color:var(--cnx-raspberry);">
        <h4 style="color:var(--cnx-raspberry);">Red Flags</h4>
        <ul style="padding-left:16px;font-size:12px;line-height:1.8;">${safeArr(hiring.redFlags).map(s => `<li>${esc(s)}</li>`).join('')}</ul>
      </div>
    </div>
  </div>
  ${buildFooter(clientName, requestedBy)}
</div>`;
}

function buildPage5(data, clientName, requestedBy) {
  const badgeStyle = { teal: 'background:var(--cnx-teal);color:var(--cnx-blue)', yellow: 'background:var(--cnx-yellow);color:var(--cnx-blue)', raspberry: 'background:var(--cnx-raspberry);color:#fff' };

  const tiers = safeArr(data.tiers).map(t =>
    `<div class="framework-tier">
      <div class="tier-header">
        <span class="tier-badge" style="${badgeStyle[t.badgeColor] || badgeStyle.teal}">${esc(t.badge)}</span>
        <span class="tier-title">${esc(t.title)}</span>
        <span class="tier-volume">${esc(t.volume)} of volume</span>
      </div>
      <div class="tier-body">
        <div class="tier-col"><div class="tier-col-label">Contact Types</div><ul>${safeArr(t.contactTypes).map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
        <div class="tier-col"><div class="tier-col-label">Agent Profile</div><p style="font-size:12px;color:#444;">${esc(t.agentProfile)}</p></div>
        <div class="tier-col"><div class="tier-col-label">Escalation Triggers</div><ul>${safeArr(t.escalationTriggers).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>
      </div>
    </div>`
  ).join('');

  const kpis = safeArr(data.kpis).map(k =>
    `<div class="kpi-card"><div class="kpi-val">${esc(k.val)}</div><div class="kpi-lbl">${esc(k.lbl)}</div></div>`
  ).join('');

  const discovery = safeArr(data.discoveryItems).map(d =>
    `<div class="discovery-card"><div class="disc-icon">${esc(d.icon)}</div><h5>${esc(d.title)}</h5><p>${esc(d.body)}</p></div>`
  ).join('');

  const whyCnx = safeArr(data.whyCnx).map(w =>
    `<div class="callout-dark"><h4>${esc(w.title)}</h4><p>${esc(w.body)}</p></div>`
  ).join('');

  return `<div class="page">
  <div class="hero">
    <div class="hero-eyebrow">Page 05</div>
    <h1>Operations <span>Framework</span></h1>
    <div class="hero-sub">Tiered routing model, KPI targets, and open discovery items for program design.</div>
  </div>
  <div class="section">
    <div class="section-eyebrow">Tiered Routing</div>
    <h2>Contact Handling Model</h2>
    ${tiers}
  </div>
  <div class="section section-dark">
    <div class="section-eyebrow">KPI Framework</div>
    <h2>Target Metrics</h2>
    <div class="kpi-grid">${kpis}</div>
  </div>
  <div class="section section-gray">
    <div class="section-eyebrow">Open Discovery</div>
    <h2>What CNX Still Needs</h2>
    <div class="discovery-grid">${discovery}</div>
  </div>
  <div class="section section-dark">
    <div class="section-eyebrow">Closing Argument</div>
    <h2>Why CNX, Why Now</h2>
    ${whyCnx}
  </div>
  ${buildFooter(clientName, requestedBy)}
</div>`;
}
