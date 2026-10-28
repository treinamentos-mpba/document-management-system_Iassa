const path = require('node:path');

const configuredLimit = Number(process.env.MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);

if (!Number.isSafeInteger(configuredLimit) || configuredLimit <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  storageDir: path.resolve(
    process.env.STORAGE_DIR || path.join(__dirname, '../storage')
  ),
  maxFileSizeBytes: configuredLimit,
};