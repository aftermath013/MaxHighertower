const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  try {
    const { projectId } = req.body || {};
    if (!projectId) {
      context.res = { status: 400, body: { success: false, error: 'Missing projectId.' } };
      return;
    }

    const tableClient = TableClient.fromConnectionString(
      process.env.STORAGE_CONNECTION_STRING,
      process.env.TABLE_NAME
    );

    // Fetch entity to get blobUrl before deleting
    let blobUrl = null;
    try {
      const entity = await tableClient.getEntity('projects', projectId);
      blobUrl = entity.blobUrl || null;
    } catch {
      // If entity doesn't exist, nothing to delete
      context.res = { status: 404, body: { success: false, error: 'Project not found.' } };
      return;
    }

    // Delete table row
    await tableClient.deleteEntity('projects', projectId);

    // Delete blob if it exists
    if (blobUrl) {
      try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(process.env.BLOB_CONTAINER);
        const blobClient = containerClient.getBlockBlobClient(`${projectId}.html`);
        await blobClient.deleteIfExists();
      } catch (blobErr) {
        context.log.warn('Blob delete failed (non-fatal):', blobErr.message);
      }
    }

    context.res = { status: 200, body: { success: true } };
  } catch (err) {
    context.log.error('delete-project error:', err.message);
    context.res = { status: 500, body: { success: false, error: 'Delete failed.' } };
  }
};
