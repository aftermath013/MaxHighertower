const { TableClient } = require('@azure/data-tables');

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

    if (entity.status !== 'generated' || !entity.blobUrl) {
      context.res = { status: 404, body: { success: false, error: 'Brief not ready yet.', status: entity.status } };
      return;
    }

    context.res = { status: 200, body: { success: true, data: { blobUrl: entity.blobUrl, clientName: entity.clientName } } };
  } catch (err) {
    context.log.error('get-brief error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch brief.' } };
  }
};
