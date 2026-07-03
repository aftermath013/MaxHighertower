const params = new URLSearchParams(window.location.search);
const projectId = params.get('id');

if (!projectId) {
  showError('No project ID in URL. Use /brief.html?id=YOUR_PROJECT_ID');
} else {
  // Redirect to the authenticated API endpoint — blob URL stays server-side
  window.location.href = `/api/get-brief?id=${encodeURIComponent(projectId)}`;
}

function showError(msg) {
  document.getElementById('loading').style.display = 'none';
  const el = document.getElementById('error-state');
  el.textContent = '❌ ' + msg;
  el.style.display = 'block';
}
