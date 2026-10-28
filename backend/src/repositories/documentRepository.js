const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { storageDir } = require('../config');

const documents = new Map();

function save({ file, owner }) {
  const document = {
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storageName: file.filename,
  };

  documents.set(document.id, document);
  return document;
}

function findByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt));
}

function findById(id) {
  return documents.get(id) || null;
}

function getFilePath(document) {
  return path.join(storageDir, document.storageName);
}

module.exports = { save, findByOwner, findById, getFilePath };