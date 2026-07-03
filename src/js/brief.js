const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

if (!projectId) {
  showError('No project ID in URL. Use /brief.html?id=YOUR_PROJECT_ID');
} else {
  loadBrief(projectId);
}

async function loadBrief(id) {
  try {
    const res = await fetch(`/api/get-brief?id=${encodeURIComponent(id)}`);
    const data = await res.json();

    if (!data.success) {
      showError(data.error || 'Brief not found.');
      return;
    }

    window.location.href = data.data.blobUrl;
  } catch (err) {
    showError('Failed to load brief: ' + err.message);
  }
}

function showError(msg) {
  document.getElementById('loading').style.display = 'none';
  const el = document.getElementById('error-state');
  el.textContent = '❌ ' + msg;
  el.style.display = 'block';
}
