const fs = require('node:fs/promises');
const documentRepository = require('../repositories/documentRepository');

class DocumentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
  }
}

async function upload({ file, owner }) {
  if (!file) {
    throw new DocumentError('FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    return documentRepository.save({ file, owner });
  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    throw error;
  }
}

function list(owner) {
  return documentRepository.findByOwner(owner);
}

function findForDownload(id, owner) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner) {
    return null;
  }

  return {
    document,
    filePath: documentRepository.getFilePath(document),
  };
}

module.exports = { upload, list, findForDownload, DocumentError };