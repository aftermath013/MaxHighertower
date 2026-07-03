const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

module.exports = async function (context, req) {
  const tableClient = TableClient.fromConnectionString(
    process.env.STORAGE_CONNECTION_STRING,
    process.env.TABLE_NAME
  );

  let projectId;
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      context.res = { status: 403, body: { success: false, error: 'Unauthorized.' } };
      return;
    }

    projectId = req.body?.projectId;
    if (!projectId) {
      context.res = { status: 400, body: { success: false, error: 'Missing projectId.' } };
      return;
    }

    const entity = await tableClient.getEntity('projects', projectId);
    if (entity.status !== 'approved') {
      context.res = { status: 400, body: { success: false, error: `Cannot generate: status is ${entity.status}.` } };
      return;
    }

    const systemPrompt = fs.readFileSync(path.join(__dirname, 'prompt.md'), 'utf8');
    const userMessage = buildUserMessage(entity);

    const html = await callAI(systemPrompt, userMessage, context);

    if (!html || !html.trim().toLowerCase().startsWith('<!doctype') && !html.trim().toLowerCase().startsWith('<html')) {
      await setStatus(tableClient, projectId, 'failed');
      context.res = { status: 500, body: { success: false, error: 'AI returned invalid HTML.' } };
      return;
    }

    const blobUrl = await saveToBlob(projectId, html);

    await tableClient.updateEntity({
      partitionKey: 'projects',
      rowKey: projectId,
      status: 'generated',
      blobUrl,
      generatedAt: new Date().toISOString()
    }, 'Merge');

    context.res = { status: 200, body: { success: true, data: { blobUrl } } };
  } catch (err) {
    context.log.error('generate-brief error:', err.message);
    if (projectId) await setStatus(tableClient, projectId, 'failed').catch(() => {});
    context.res = { status: 500, body: { success: false, error: 'Brief generation failed.' } };
  }
};

function buildUserMessage(entity) {
  return `Generate a CNX program brief for the following client:

CLIENT NAME: ${entity.clientName}
CLIENT URL: ${entity.clientUrl}
LOB SCOPE: ${entity.lobScope}
DELIVERY LOCATION: ${entity.deliveryLocation}
CHANNEL SCOPE: ${entity.channelScope || 'TBD'}
REQUESTED BY: ${entity.requestedBy}

Follow the system prompt exactly. Return raw HTML only.`;
}

async function callAI(systemPrompt, userMessage, context) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

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
        max_tokens: 16000,
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

    const data = await res.json();
    return data.content?.[0]?.text || '';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('AI call timed out after 90s');
    throw err;
  }
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

async function setStatus(tableClient, projectId, status) {
  await tableClient.updateEntity({
    partitionKey: 'projects',
    rowKey: projectId,
    status
  }, 'Merge');
}
