async function request(endpoint, userId, options = {}) {
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'X-User-Id': userId,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a operação.');
  }

  return response;
}

export async function listDocuments(userId, signal) {
  const response = await request('/documents', userId, { signal });
  return (await response.json()).documents;
}

export async function uploadDocument(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request('/upload', userId, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function downloadDocument(userId, documentId) {
  const response = await request(
    `/documents/${encodeURIComponent(documentId)}/download`,
    userId
  );
  return response.blob();
}