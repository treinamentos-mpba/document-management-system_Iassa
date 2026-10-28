import { useState } from 'react';
import { downloadDocument } from '../services/documents.js';

export default function DownloadButton({ document, userId, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const blob = await downloadDocument(userId, document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      onError(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? 'Baixando…' : 'Baixar'}
    </button>
  );
}