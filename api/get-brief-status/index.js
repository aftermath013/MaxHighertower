const { TableClient } = require('@azure/data-tables');

const PROGRESS = {
  pending: 5,
  researching: 30,
  generating: 65,
  saving: 90,
  generated: 100,
  failed: 0
};

const DEFAULT_MESSAGE = {
  pending: 'Queued for generation...',
  researching: 'Researching your client...',
  generating: 'Generating brief with AI...',
  saving: 'Saving your brief...',
  generated: 'Brief is ready!',
  failed: 'Generation failed.'
};

module.exports = async function (context, req) {
  try {
    const projectId = req.query.id;
    if (!projectId) {
      context.res = { status: 400, body: { success: false, error: 'Missing project ID.' } };
      return;
    }

    const tableClient = TableClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING,
      process.env.TABLE_NAME
    );

    const entity = await tableClient.getEntity('projects', projectId);
    const status = entity.status || 'pending';

    context.res = {
      status: 200,
      body: {
        success: true,
        data: {
          status,
          message: entity.statusMessage || DEFAULT_MESSAGE[status] || status,
          progress: PROGRESS[status] ?? 5,
          blobUrl: entity.blobUrl || null,
          inputTokens: entity.inputTokens || null,
          outputTokens: entity.outputTokens || null,
          costUsd: entity.costUsd || null,
          clientName: entity.clientName
        }
      }
    };
  } catch (err) {
    context.log.error('get-brief-status error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch status.' } };
  }
};
