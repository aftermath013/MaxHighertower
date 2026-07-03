const { TableClient } = require('@azure/data-tables');

module.exports = async function (context, req) {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      context.res = { status: 403, body: { success: false, error: 'Unauthorized.' } };
      return;
    }

    const tableClient = TableClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING,
      process.env.TABLE_NAME
    );

    const projects = [];
    for await (const entity of tableClient.listEntities({ queryOptions: { filter: "PartitionKey eq 'projects'" } })) {
      projects.push({
        projectId: entity.rowKey,
        clientName: entity.clientName,
        clientUrl: entity.clientUrl,
        lobScope: entity.lobScope,
        deliveryLocation: entity.deliveryLocation,
        channelScope: entity.channelScope,
        requestedBy: entity.requestedBy,
        requestedByEmail: entity.requestedByEmail,
        status: entity.status,
        blobUrl: entity.blobUrl || null,
        createdAt: entity.createdAt,
        approvedAt: entity.approvedAt || null,
        generatedAt: entity.generatedAt || null
      });
    }

    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    context.res = { status: 200, body: { success: true, data: { projects } } };
  } catch (err) {
    context.log.error('get-projects error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch projects.' } };
  }
};
