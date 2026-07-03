document.getElementById('brief-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const btn = document.getElementById('submit-btn');
  const successBox = document.getElementById('status-success');
  const errorBox = document.getElementById('status-error');

  successBox.style.display = 'none';
  errorBox.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  const payload = {
    clientName: document.getElementById('clientName').value.trim(),
    clientUrl: document.getElementById('clientUrl').value.trim(),
    lobScope: document.getElementById('lobScope').value,
    deliveryLocation: document.getElementById('deliveryLocation').value,
    channelScope: document.getElementById('channelScope').value,
    requestedBy: document.getElementById('requestedBy').value.trim(),
    requestedByEmail: document.getElementById('requestedByEmail').value.trim()
  };

  try {
    const res = await fetch('/api/submit-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      successBox.textContent = `✅ Request submitted! Your project ID is: ${data.data.projectId}. You'll be notified when the brief is ready.`;
      successBox.style.display = 'block';
      document.getElementById('brief-form').reset();
    } else {
      throw new Error(data.error || 'Submission failed.');
    }
  } catch (err) {
    errorBox.textContent = `❌ ${err.message}`;
    errorBox.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Brief Request';
  }
});
