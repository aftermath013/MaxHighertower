const { TableClient } = require('@azure/data-tables');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  try {
    const { clientName, clientUrl, lobScope, deliveryLocation, channelScope } = req.body || {};

    if (!clientName || !clientUrl || !lobScope || !deliveryLocation) {
      context.res = { status: 400, body: { success: false, error: 'Missing required fields.' } };
      return;
    }

    let parsedUrl;
    try { parsedUrl = new URL(clientUrl); } catch {
      context.res = { status: 400, body: { success: false, error: 'Invalid client URL.' } };
      return;
    }

    let requestedBy = 'Unknown User';
    let requestedByEmail = '';
    const principalHeader = req.headers['x-ms-client-principal'];
    if (principalHeader) {
      try {
        const decoded = Buffer.from(principalHeader, 'base64').toString('utf8');
        const principal = JSON.parse(decoded);
        requestedBy = principal.userDetails || principal.userRoles?.[0] || 'Unknown';
        const emailClaim = principal.claims?.find(c =>
          c.typ === 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress' ||
          c.typ === 'email' ||
          c.typ === 'preferred_username'
        );
        requestedByEmail = emailClaim?.val || principal.userDetails || '';
      } catch { /* use defaults */ }
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
      statusMessage: 'Queued for generation...',
      createdAt: new Date().toISOString()
    });

    context.res = { status: 200, body: { success: true, data: { projectId } } };
  } catch (err) {
    context.log.error('submit-request error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to submit request.' } };
  }
};
