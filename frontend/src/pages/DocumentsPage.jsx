import { useEffect, useRef, useState } from 'react';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from '../services/documents.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const fileInputRef = useRef(null);
  const [userDraft, setUserDraft] = useState('usuario-1');
  const [activeUser, setActiveUser] = useState('usuario-1');
  const [documents, setDocuments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setDocuments([]);
    setIsLoading(true);
    setNotice(null);

    listDocuments(activeUser, controller.signal)
      .then(setDocuments)
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setNotice({ type: 'error', text: error.message });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [activeUser]);

  function applyUser(event) {
    event.preventDefault();
    const userId = userDraft.trim();

    if (!userId || userId.length > 128) {
      setNotice({ type: 'error', text: 'Informe um identificador de até 128 caracteres.' });
      return;
    }

    setActiveUser(userId);
  }

  async function handleUpload(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setNotice(null);
    try {
      await uploadDocument(activeUser, selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setDocuments(await listDocuments(activeUser));
      setNotice({ type: 'success', text: 'Documento enviado.' });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setNotice(null);
    try {
      const blob = await downloadDocument(activeUser, document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="DMS, início">
          <span className="wordmark-mark" aria-hidden="true">D</span>
          <span>DMS <span className="wordmark-light">/ arquivos</span></span>
        </a>
        <span className="storage-indicator"><span /> armazenamento local</span>
      </header>

      <div className="content">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">BIBLIOTECA DE DOCUMENTOS</p>
            <h1 id="page-title">Seus arquivos,<br />em um só lugar.</h1>
          </div>
          <form className="user-form" onSubmit={applyUser}>
            <label htmlFor="user-id">Usuário atual</label>
            <div className="user-control">
              <input
                id="user-id"
                value={userDraft}
                onChange={(event) => setUserDraft(event.target.value)}
                maxLength={128}
                autoComplete="off"
              />
              <button type="submit" className="button button-secondary">Aplicar</button>
            </div>
          </form>
        </section>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR</p>
              <h2 id="upload-title">Enviar documento</h2>
            </div>
            <span className="limit-note">Limite definido pelo servidor</span>
          </div>
          <form className="upload-form" onSubmit={handleUpload}>
            <label className="file-picker" htmlFor="document-file">
              <span className="file-symbol" aria-hidden="true">＋</span>
              <span className="file-copy">
                <strong>{selectedFile ? selectedFile.name : 'Escolher um arquivo'}</strong>
                <small>{selectedFile ? formatSize(selectedFile.size) : 'Um arquivo por envio'}</small>
              </span>
              <input
                id="document-file"
                type="file"
                ref={fileInputRef}
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
            </label>
            <button className="button button-primary" type="submit" disabled={!selectedFile || isUploading}>
              {isUploading ? 'Enviando…' : 'Enviar arquivo'}
            </button>
          </form>
        </section>

        {notice && (
          <p className={`notice notice-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
            {notice.text}
          </p>
        )}

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading list-heading">
            <div>
              <p className="eyebrow">ARQUIVOS SALVOS</p>
              <h2 id="documents-title">Documentos</h2>
            </div>
            <span className="document-count">
              {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
            </span>
          </div>

          <div className="document-table" aria-live="polite">
            <div className="table-header" aria-hidden="true">
              <span>Nome</span><span>Tamanho</span><span>Enviado em</span><span />
            </div>
            {isLoading ? (
              <p className="empty-state">Carregando documentos…</p>
            ) : documents.length === 0 ? (
              <p className="empty-state">Nenhum documento encontrado para este usuário.</p>
            ) : (
              documents.map((document) => (
                <article className="document-row" key={document.id}>
                  <div className="document-name">
                    <span className="document-icon" aria-hidden="true">DOC</span>
                    <span title={document.originalName}>{document.originalName}</span>
                  </div>
                  <span className="document-size">{formatSize(document.size)}</span>
                  <time className="document-date" dateTime={document.uploadedAt}>
                    {dateFormatter.format(new Date(document.uploadedAt))}
                  </time>
                  <button
                    className="download-button"
                    type="button"
                    onClick={() => handleDownload(document)}
                    disabled={downloadingId === document.id}
                  >
                    {downloadingId === document.id ? 'Baixando…' : 'Baixar'}
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
        <footer className="page-footer">Os arquivos são armazenados neste servidor.</footer>
      </div>
    </main>
  );
}