const documentService = require('../services/documentService');


function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();

  if (!owner || owner.length > 128) {
    const error = new Error('Informe um identificador de usuário válido.');
    error.code = 'USER_REQUIRED';
    return next(error);
  }

  req.userId = owner;
  return next();
}

async function upload(req, res, next) {
  try {
    const document = await documentService.upload({ file: req.file, owner: req.userId });
    const { storageName, ...publicDocument } = document;
    return res.status(201).json(publicDocument);
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    const documents = documentService.list(req.userId).map(({ storageName, ...document }) => document);
    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
}

function download(req, res, next) {
  const result = documentService.findForDownload(req.params.id, req.userId);

  if (!result) {
    const error = new Error('Documento não encontrado.');
    error.code = 'DOCUMENT_NOT_FOUND';
    return next(error);
  }

  const safeName = result.document.originalName.replace(/[\\/]/g, '_');
  return res.download(result.filePath, safeName, (error) => {
    if (error) {
      if (error.code === 'ENOENT') {
        error.code = 'DOCUMENT_NOT_FOUND';
      }
      next(error);
    }
  });
}

module.exports = { requireUser, upload, list, download };