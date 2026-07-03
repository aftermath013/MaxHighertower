let adminSecret = '';

function unlock() {
  const pw = document.getElementById('gate-password').value;
  const errorBox = document.getElementById('gate-error');
  errorBox.style.display = 'none';

  if (!pw) return;

  adminSecret = pw;
  document.getElementById('gate').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadProjects();
}

document.getElementById('gate-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') unlock();
});

async function loadProjects() {
  try {
    const res = await fetch('/api/get-projects', {
      headers: { 'x-admin-secret': adminSecret }
    });
    const data = await res.json();

    document.getElementById('loading').style.display = 'none';

    if (!data.success) {
      if (res.status === 403) {
        document.getElementById('gate-error').textContent = '❌ Wrong password.';
        document.getElementById('gate-error').style.display = 'block';
        document.getElementById('gate').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
        return;
      }
      throw new Error(data.error);
    }

    const projects = data.data.projects;
    if (!projects.length) {
      document.getElementById('empty-state').style.display = 'block';
      return;
    }

    document.getElementById('table-wrap').style.display = 'block';
    renderProjects(projects);
  } catch (err) {
    document.getElementById('loading').innerHTML = `<div style="color:#ff6b6b;">Failed to load: ${err.message}</div>`;
  }
}

function renderProjects(projects) {
  const tbody = document.getElementById('projects-body');
  tbody.innerHTML = '';

  projects.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="font-weight:700;">${esc(p.clientName)}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;">${esc(p.clientUrl)}</div>
      </td>
      <td>${esc(p.lobScope)}</td>
      <td>${esc(p.deliveryLocation)}</td>
      <td>
        <div>${esc(p.requestedBy)}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);">${esc(p.requestedByEmail)}</div>
      </td>
      <td style="white-space:nowrap;">${formatDate(p.createdAt)}</td>
      <td><span class="badge badge-${p.status}">${p.status}</span></td>
      <td>${actionCell(p)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function actionCell(p) {
  if (p.status === 'generated' && p.blobUrl) {
    return `<a class="link-brief" href="${esc(p.blobUrl)}" target="_blank">View Brief →</a>`;
  }
  if (p.status === 'pending') {
    return `<button class="btn-approve" onclick="approve('${esc(p.projectId)}', this)">Approve</button>`;
  }
  if (p.status === 'approved') {
    return `<span style="font-size:11px;color:rgba(255,255,255,0.4);">Generating...</span>`;
  }
  if (p.status === 'failed') {
    return `<button class="btn-approve" onclick="approve('${esc(p.projectId)}', this)" style="background:var(--cnx-orange);">Retry</button>`;
  }
  return '—';
}

async function approve(projectId, btn) {
  btn.disabled = true;
  btn.textContent = 'Approving...';

  try {
    const res = await fetch('/api/approve-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': adminSecret
      },
      body: JSON.stringify({ projectId })
    });

    const data = await res.json();

    if (data.success) {
      btn.textContent = '✅ Done';
      setTimeout(loadProjects, 1500);
    } else {
      btn.disabled = false;
      btn.textContent = 'Approve';
      alert('Error: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Approve';
    alert('Request failed: ' + err.message);
  }
}

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
