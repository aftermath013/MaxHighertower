const { TableClient } = require('@azure/data-tables');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  try {
    const { clientName, clientUrl, lobScope, deliveryLocation, channelScope, requestedBy, requestedByEmail } = req.body || {};

    if (!clientName || !clientUrl || !lobScope || !deliveryLocation || !requestedBy || !requestedByEmail) {
      context.res = { status: 400, body: { success: false, error: 'Missing required fields.' } };
      return;
    }

    let parsedUrl;
    try { parsedUrl = new URL(clientUrl); } catch {
      context.res = { status: 400, body: { success: false, error: 'Invalid client URL.' } };
      return;
    }

    if (!requestedByEmail.includes('@')) {
      context.res = { status: 400, body: { success: false, error: 'Invalid email address.' } };
      return;
    }

    const projectId = uuidv4();
    const client = TableClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING,
      process.env.TABLE_NAME
    );

    await client.createEntity({
      partitionKey: 'projects',
      rowKey: projectId,
      clientName,
      clientUrl: parsedUrl.href,
      lobScope,
      deliveryLocation,
      channelScope: channelScope || 'TBD',
      requestedBy,
      requestedByEmail,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    context.res = { status: 200, body: { success: true, data: { projectId } } };
  } catch (err) {
    context.log.error('submit-request error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to submit request.' } };
  }
};
