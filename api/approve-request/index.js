const { TableClient } = require('@azure/data-tables');

module.exports = async function (context, req) {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      context.res = { status: 403, body: { success: false, error: 'Unauthorized.' } };
      return;
    }

    const { projectId } = req.body || {};
    if (!projectId) {
      context.res = { status: 400, body: { success: false, error: 'Missing projectId.' } };
      return;
    }

    const tableClient = TableClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING,
      process.env.TABLE_NAME
    );

    const entity = await tableClient.getEntity('projects', projectId);
    if (entity.status !== 'pending') {
      context.res = { status: 400, body: { success: false, error: `Project is already ${entity.status}.` } };
      return;
    }

    await tableClient.updateEntity({
      partitionKey: 'projects',
      rowKey: projectId,
      status: 'approved',
      approvedAt: new Date().toISOString()
    }, 'Merge');

    const generateUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers['host']}/api/generate-brief`;
    const generateRes = await fetch(generateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET
      },
      body: JSON.stringify({ projectId })
    });

    const generateData = await generateRes.json();
    context.res = { status: 200, body: { success: true, data: generateData.data || {} } };
  } catch (err) {
    context.log.error('approve-request error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to approve request.' } };
  }
};
