import DownloadButton from './DownloadButton.jsx';
import formatSize from '../utils/formatSize.js';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function DocumentList({ documents, isLoading, userId, onError }) {
  return (
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
              <DownloadButton document={document} userId={userId} onError={onError} />
            </article>
          ))
        )}
      </div>
    </section>
  );
}