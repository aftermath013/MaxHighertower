const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');

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

    // Fetch blob content server-side — never expose the blob URL to the client
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(process.env.BLOB_CONTAINER);
    const blobClient = containerClient.getBlockBlobClient(`${projectId}.html`);
    const download = await blobClient.download();

    const chunks = [];
    for await (const chunk of download.readableStreamBody) {
      chunks.push(chunk);
    }
    const html = Buffer.concat(chunks).toString('utf8');

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'no-store'
      },
      body: html
    };
  } catch (err) {
    context.log.error('get-brief error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Failed to fetch brief.' } };
  }
};
