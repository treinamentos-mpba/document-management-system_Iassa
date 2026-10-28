import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documents.js';

export default function App() {
  const [userDraft, setUserDraft] = useState('usuario-1');
  const [activeUser, setActiveUser] = useState('usuario-1');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setDocuments([]);
    setIsLoading(true);

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
  }, [activeUser, refreshKey]);

  function applyUser(event) {
    event.preventDefault();
    const userId = userDraft.trim();

    if (!userId || userId.length > 128) {
      setNotice({ type: 'error', text: 'Informe um identificador de até 128 caracteres.' });
      return;
    }

    setNotice(null);
    setActiveUser(userId);
    setRefreshKey((key) => key + 1);
  }

  function handleUploadComplete() {
    setNotice({ type: 'success', text: 'Documento enviado.' });
    setRefreshKey((key) => key + 1);
  }

  function handleError(error) {
    setNotice({ type: 'error', text: error.message });
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

        <UploadComponent
          userId={activeUser}
          onUploaded={handleUploadComplete}
          onError={handleError}
        />

        {notice && (
          <p className={`notice notice-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
            {notice.text}
          </p>
        )}

        <DocumentList
          documents={documents}
          isLoading={isLoading}
          userId={activeUser}
          onError={handleError}
        />

        <footer className="page-footer">Os arquivos são armazenados neste servidor.</footer>
      </div>
    </main>
  );
}
