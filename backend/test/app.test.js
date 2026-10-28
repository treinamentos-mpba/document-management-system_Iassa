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

test('o app mantém o health check', async () => {
  const response = await fetch(`${await baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('faz upload de documento e retorna somente metadados públicos', async () => {
  const owner = `user-${randomUUID()}`;
  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'arquivo.txt');

  const response = await fetch(`${await baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });

  assert.equal(response.status, 201);
  const document = await response.json();
  assert.deepEqual(Object.keys(document).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt']);
  assert.equal(document.originalName, 'arquivo.txt');
  assert.equal(document.owner, owner);
  assert.equal(document.size, 17);
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));
});

test('lista documentos somente do usuário atual', async () => {
  const owner = `user-${randomUUID()}`;
  const form = new FormData();
  form.append('file', new Blob(['documento']), 'documento.txt');

  const uploadResponse = await fetch(`${await baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
  const uploaded = await uploadResponse.json();

  const listResponse = await fetch(`${await baseUrl}/documents`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual((await listResponse.json()).documents.map(({ id }) => id), [uploaded.id]);

  const otherUserResponse = await fetch(`${await baseUrl}/documents`, {
    headers: { 'X-User-Id': `${owner}-other` },
  });
  assert.deepEqual((await otherUserResponse.json()).documents, []);
});

test('baixa documentos do proprietário e oculta documentos de outros usuários', async () => {
  const owner = `user-${randomUUID()}`;
  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'arquivo.txt');

  const uploadResponse = await fetch(`${await baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': owner },
    body: form,
  });
  const document = await uploadResponse.json();

  const downloadResponse = await fetch(`${await baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': owner },
  });
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(await downloadResponse.text(), 'conteudo de teste');

  const unauthorizedResponse = await fetch(`${await baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': `${owner}-other` },
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
