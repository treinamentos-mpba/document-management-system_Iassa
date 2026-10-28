const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDir;
const app = require('../src/app');
const server = app.listen(0);
const baseUrl = new Promise((resolve) => {
  server.once('listening', () => resolve(`http://127.0.0.1:${server.address().port}`));
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  fs.rmSync(storageDir, { recursive: true, force: true });
});

test('o app Express é exportado e mantém o health check', async () => {
  assert.equal(typeof app, 'function');
  const response = await fetch(`${await baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('faz upload, lista somente documentos do dono e permite download autorizado', async () => {
  const userId = `user-${randomUUID()}`;
  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'arquivo.txt');

  const uploadResponse = await fetch(`${await baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: form,
  });
  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.deepEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.equal(document.originalName, 'arquivo.txt');
  assert.equal(document.owner, userId);
  assert.equal(document.size, 17);

  const listResponse = await fetch(`${await baseUrl}/documents`, {
    headers: { 'X-User-Id': userId },
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents.map(({ id }) => id), [document.id]);

  const otherUserResponse = await fetch(`${await baseUrl}/documents`, {
    headers: { 'X-User-Id': `${userId}-other` },
  });
  assert.deepEqual((await otherUserResponse.json()).documents, []);

  const downloadResponse = await fetch(`${await baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': userId },
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'conteudo de teste');

  const unauthorizedResponse = await fetch(`${await baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': `${userId}-other` },
  });
  assert.equal(unauthorizedResponse.status, 404);
  assert.deepEqual(await unauthorizedResponse.json(), {
    error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
  });
});

test('rejeita usuário ausente, arquivo ausente e arquivo acima do limite', async () => {
  const noUserResponse = await fetch(`${await baseUrl}/documents`);
  assert.equal(noUserResponse.status, 400);
  assert.equal((await noUserResponse.json()).error.code, 'USER_REQUIRED');

  const noFileResponse = await fetch(`${await baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': `user-${randomUUID()}` },
    body: new FormData(),
  });
  assert.equal(noFileResponse.status, 400);
  assert.equal((await noFileResponse.json()).error.code, 'FILE_REQUIRED');

  const form = new FormData();
  form.append('file', new Blob(['x'.repeat(10 * 1024 * 1024 + 1)]), 'large.txt');
  const oversizedResponse = await fetch(`${await baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': `user-${randomUUID()}` },
    body: form,
  });
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).error.code, 'LIMIT_FILE_SIZE');
});
