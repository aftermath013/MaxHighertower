const { TableClient } = require('@azure/data-tables');

module.exports = async function (context, req) {
  try {
    const tableClient = TableClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING,
      process.env.TABLE_NAME
    );

    const projects = [];
    for await (const entity of tableClient.listEntities({ queryOptions: { filter: "PartitionKey eq 'projects'" } })) {
      projects.push({
        projectId: entity.rowKey,
        clientName: entity.clientName,
        briefName: entity.briefName || '',
        clientUrl: entity.clientUrl,
        lobScope: entity.lobScope,
        deliveryLocation: entity.deliveryLocation,
        channelScope: entity.channelScope,
        requestedBy: entity.requestedBy,
        requestedByEmail: entity.requestedByEmail,
        status: entity.status,
        statusMessage: entity.statusMessage || null,
        blobUrl: entity.blobUrl || null,
        inputTokens: entity.inputTokens || null,
        outputTokens: entity.outputTokens || null,
        costUsd: entity.costUsd || null,
        createdAt: entity.createdAt,
        generatedAt: entity.generatedAt || null
      });
    }

    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    context.res = { status: 200, body: { success: true, data: projects } };
  } catch (err) {
    context.log.error('get-projects error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch projects.' } };
  }
};
