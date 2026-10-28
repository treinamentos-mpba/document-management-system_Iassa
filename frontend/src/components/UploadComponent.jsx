import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documents.js';
import formatSize from '../utils/formatSize.js';

export default function UploadComponent({ userId, onUploaded, onError }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await uploadDocument(userId, selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploaded();
    } catch (error) {
      onError(error);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ADICIONAR</p>
          <h2 id="upload-title">Enviar documento</h2>
        </div>
        <span className="limit-note">Limite definido pelo servidor</span>
      </div>
      <form className="upload-form" onSubmit={handleSubmit}>
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
  );
}