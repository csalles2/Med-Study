import React, { useState, useRef } from 'react';
import { Upload, FileText, Presentation, Image } from 'lucide-react';
import { Link } from 'react-router-dom';

interface UploadViewProps {
  onFile: (file: File) => Promise<void>;
  error: string | null;
  codigoErro?: string | null;
}

export default function UploadView({ onFile, error, codigoErro }: any) {
  const [dragging, setDragging] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const isImage = file.type.startsWith('image/');
    const isPptx = file.name.endsWith('.pptx');

    if (validTypes.includes(file.type) || isPptx) {
      onFile(file);
    } else {
      alert('Por favor, envie apenas arquivos PDF, PPTX ou imagens (JPG, PNG, WEBP).');
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="upload-container">
      <div className="upload-hero">
        <h1>Transforme aulas em<br /><span>material de estudo</span></h1>
        <p>Envie seu PPTX, PDF ou imagem e receba resumo estruturado, flashcards bilíngues e questões estilo residência em segundos.</p>
      </div>

      <div
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{ cursor: 'pointer' }}
      >
        <div className="upload-zone-icon">
          <Upload size={24} />
        </div>
        <h3>Arraste seu arquivo aqui</h3>
        <p>ou clique para selecionar</p>

        <button
          className="btn-primary"
          type="button"
          onClick={e => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <FileText size={15} />
          Selecionar arquivo
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".pptx,.pdf,.jpg,.jpeg,.png,.gif,.webp"
          style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      <div className="file-formats">
        <span className="format-pill">
          <Presentation size={11} style={{ display: 'inline', marginRight: 4 }} />
          PPTX
        </span>
        <span className="format-pill">
          <FileText size={11} style={{ display: 'inline', marginRight: 4 }} />
          PDF
        </span>
        <span className="format-pill">
          <Image size={11} style={{ display: 'inline', marginRight: 4 }} />
          Imagem
        </span>
        <span className="format-pill">Espanhol médico</span>
        <span className="format-pill">Bilíngue PT/ES</span>
      </div>

      {error && codigoErro === 'TESTE_GRATIS_USADO' && (
        <div className="cta-criar-conta">
          {error} <Link to="/cadastro">Criar conta grátis →</Link>
        </div>
      )}

      {error && codigoErro !== 'TESTE_GRATIS_USADO' && (
        <div style={{ color: '#F09595', fontSize: 13, textAlign: 'center', maxWidth: 400, marginTop: 20 }}>
          Erro: {error}
        </div>
      )}
    </div>
  );
}