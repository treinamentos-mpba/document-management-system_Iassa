const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const express = require('express');
const multer = require('multer');
const { storageDir, maxFileSizeBytes } = require('../config');
const documentController = require('../controllers/documentController');

const router = express.Router();
const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDir, { recursive: true })
      .then(() => callback(null, storageDir), callback);
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
    files: 1,
    fields: 0,
  },
});

router.post('/upload', documentController.requireUser, upload.single('file'), documentController.upload);
router.get('/documents', documentController.requireUser, documentController.list);
router.get('/documents/:id/download', documentController.requireUser, documentController.download);

module.exports = router;