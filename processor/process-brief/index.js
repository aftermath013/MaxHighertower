const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');

const INPUT_PRICE_PER_TOKEN = 3.0 / 1_000_000;
const OUTPUT_PRICE_PER_TOKEN = 15.0 / 1_000_000;

module.exports = async function (context, queueItem) {
  const tableClient = TableClient.fromConnectionString(
    process.env.STORAGE_CONNECTION_STRING,
    process.env.TABLE_NAME
  );

  let projectId;
  try {
    const message = typeof queueItem === 'string' ? JSON.parse(queueItem) : queueItem;
    projectId = message.projectId;

    if (!projectId) throw new Error('Missing projectId in queue message.');

    const entity = await tableClient.getEntity('projects', projectId);

    // Research
    await updateStatus(tableClient, projectId, 'researching', 'Researching your client...');
    const clientInfo = await fetchClientInfo(entity.clientUrl);

    // Generate
    await updateStatus(tableClient, projectId, 'generating', 'Generating brief with AI...');
    const systemPrompt = fs.readFileSync(path.join(__dirname, '..', 'generate-brief', 'prompt.md'), 'utf8');
    const userMessage = buildUserMessage(entity, clientInfo);
    const aiResult = await callAI(systemPrompt, userMessage, context);
    const { html, inputTokens, outputTokens } = aiResult;

    if (!html || (!html.trim().toLowerCase().startsWith('<!doctype') && !html.trim().toLowerCase().startsWith('<html'))) {
      throw new Error('AI returned invalid HTML.');
    }

    // Save
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

    context.log(`Brief generated for ${projectId}: ${blobUrl}`);
  } catch (err) {
    context.log.error('process-brief error:', err.message);
    if (projectId) {
      await updateStatus(tableClient, projectId, 'failed', err.message).catch(() => {});
    }
  }
};

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
Follow the system prompt exactly. Return raw HTML only.`;
}

async function callAI(systemPrompt, userMessage, context) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240000);

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
    return {
      html: data.content?.[0]?.text || '',
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0
    };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('AI call timed out after 240s');
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

async function updateStatus(tableClient, projectId, status, message) {
  await tableClient.updateEntity({
    partitionKey: 'projects',
    rowKey: projectId,
    status,
    statusMessage: message || ''
  }, 'Merge');
}
