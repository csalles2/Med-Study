# MedStudy AI — Setup Completo

## Estrutura final do projeto

```
automocao-MED/
├── src/
│   ├── index.js        (CLI original — pode manter)
│   ├── extractor.js
│   ├── chunker.js
│   ├── ai.js
│   ├── pdf.js
│   └── server.js       ← NOVO: API Express
├── medstudy-frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── types/index.ts
│   │   ├── hooks/useStudyMaterial.ts
│   │   ├── styles/global.css
│   │   └── components/
│   │       ├── UploadView.tsx
│   │       ├── LoaderView.tsx
│   │       ├── ResultView.tsx
│   │       ├── FlashcardItem.tsx
│   │       └── QuestaoItem.tsx
│   ├── package.json
│   └── tsconfig.json
├── .env
└── package.json
```

## Passo a passo

### 1. Instalar dependências do backend
```bash
cd automocao-MED
npm install express multer cors
```

### 2. Copiar o server.js
Coloque o arquivo `server.js` dentro da pasta `src/`.

### 3. Instalar dependências do frontend
```bash
cd medstudy-frontend
npm install
```

### 4. Rodar o backend (terminal 1)
```bash
cd automocao-MED
node src/server.js
```

### 5. Rodar o frontend (terminal 2)
```bash
cd medstudy-frontend
npm start
```

O site abre em http://localhost:3000
A API roda em http://localhost:3001

## Como usar
1. Acesse http://localhost:3000
2. Faça upload de um .pptx ou .pdf
3. Aguarde a IA processar
4. Veja o resumo, flashcards e questões
5. Baixe o PDF ou exporte para Anki
