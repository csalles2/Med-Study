require('dotenv').config();


const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const { extractFromPdf, extractFromPptx } = require('./extractor');
const { chunkText } = require('./chunker');
const { generateStudyMaterial } = require('./ai');
const { createPdf } = require('./pdf');
const db = require('./db');
const authRoutes = require('./routes/auth');
const { identificarUsuario } = require('./middleware/authMiddleware');

const app = express();
app.set('trust proxy', 1); // ADICIONAR ESSA LINHA
const PORT = process.env.PORT || 3001;

// OBS: o antigo APP_TOKEN único (compartilhado por todo mundo) saiu de cena.
// Agora cada requisição se identifica por login (usuário real) ou por um
// guest_id (teste grátis sem conta), então essa checagem de ambiente não
// se aplica mais.

// ─────────────────────────────────────────────
// SEGURANÇA — HELMET (headers HTTP)
// ─────────────────────────────────────────────

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      objectSrc:  ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// ─────────────────────────────────────────────
// CORS — somente origens autorizadas
// ─────────────────────────────────────────────

// Lista de origens permitidas
// USAR APENAS ESTA VERSÃO (com array fixo)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, cb) => {
    // Permite requisições sem origin (acesso direto ao navegador)
    if (!origin) return cb(null, true);
    
    // Permite origens na lista
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    
    cb(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Id'],
  credentials: false,
}));


app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'API Med-Study rodando!',
    timestamp: new Date().toISOString()
  });
});
// ─────────────────────────────────────────────
// RATE LIMITING — por IP
// ─────────────────────────────────────────────

// Limite apertado só pra login/cadastro — protege contra força bruta de senha
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

// Limite mais folgado pra quem está de fato usando o app (processar arquivo)
const limiterUso = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
  skip: (req) => req.path === '/health',
});

app.use('/api/auth', limiterAuth);
app.use('/api', limiterUso);
// ─────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────

app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin'));

// ─────────────────────────────────────────────
// SERVIR FRONTEND EM PRODUÇÃO
// ─────────────────────────────────────────────

const frontendBuild = path.resolve(__dirname, '../medstudy-frontend/build');
if (fs.existsSync(frontendBuild)) {
  app.use(express.static(frontendBuild, {
    index: false,
    dotfiles: 'deny',
    etag: true,
  }));
}

// ─────────────────────────────────────────────
// GARANTIR PASTA UPLOADS
// ─────────────────────────────────────────────

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true, mode: 0o700 });
}

// ─────────────────────────────────────────────
// MULTER — armazenamento e filtros
// ─────────────────────────────────────────────

const ALLOWED_EXTENSIONS = new Set(['.pptx', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp']);

const MAGIC_BYTES = {
  pdf:  { offset: 0, bytes: Buffer.from([0x25, 0x50, 0x44, 0x46]) },
  pptx: { offset: 0, bytes: Buffer.from([0x50, 0x4B, 0x03, 0x04]) },
  jpg:  { offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]) },
  png:  { offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47]) },
  gif:  { offset: 0, bytes: Buffer.from([0x47, 0x49, 0x46, 0x38]) },
  webp: { offset: 8, bytes: Buffer.from([0x57, 0x45, 0x42, 0x50]) },
};

function validateMagicBytesBuffer(buffer, ext) {
  const header = buffer.subarray(0, 16);

  const extMap = {
    '.pdf':  'pdf',
    '.pptx': 'pptx',
    '.jpg':  'jpg',
    '.jpeg': 'jpg',
    '.png':  'png',
    '.gif':  'gif',
    '.webp': 'webp',
  };

  const magicKey = extMap[ext];
  if (!magicKey) return false;

  const { offset, bytes } = MAGIC_BYTES[magicKey];
  return header.subarray(offset, offset + bytes.length).equals(bytes);
}

function sanitizeFilename(original) {
  const base = path.basename(original);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const rand = crypto.randomBytes(16).toString('hex');
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${rand}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Formato não suportado.'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter,
});

// ─────────────────────────────────────────────
// TESTE GRÁTIS SEM CONTA (1 uso por guest_id)
// ─────────────────────────────────────────────

function jaUsouTesteGratis(guestId) {
  return !!db.prepare('SELECT 1 FROM usos_convidado WHERE guest_id = ?').get(guestId);
}

function registrarTesteGratis(guestId) {
  db.prepare('INSERT OR IGNORE INTO usos_convidado (guest_id) VALUES (?)').run(guestId);
}

// ─────────────────────────────────────────────
// HELPER — limpar arquivo temporário
// ─────────────────────────────────────────────

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error('[cleanup] Falha ao remover arquivo temporário:', e.message);
  }
}

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// ─────────────────────────────────────────────
// ROTA PRINCIPAL — PROCESSAR ARQUIVO
// ─────────────────────────────────────────────

app.post('/api/processar', identificarUsuario, async (req, res) => {
  const { filename, mimetype, data } = req.body || {};

  if (!filename || !data) {
    return res.status(400).json({ message: 'Arquivo ausente ou requisição inválida.' });
  }

  // Quem está logado passa direto (limite de plano entra numa próxima etapa).
  // Quem não está logado precisa de um guest_id e só tem direito a 1 uso.
  let guestId = null;
  if (!req.usuario) {
    guestId = req.headers['x-guest-id'];
    if (!guestId) {
      return res.status(400).json({ message: 'Identificação ausente.' });
    }
    if (jaUsouTesteGratis(guestId)) {
      return res.status(403).json({
        message: 'Você já usou seu teste grátis. Crie uma conta gratuita para continuar usando.',
        codigo: 'TESTE_GRATIS_USADO',
      });
    }
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return res.status(400).json({ message: 'Formato não suportado.' });
  }

  let buffer;
  try {
    buffer = Buffer.from(data, 'base64');
  } catch {
    return res.status(400).json({ message: 'Dados do arquivo inválidos.' });
  }

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (buffer.length > MAX_SIZE) {
    return res.status(413).json({ message: 'Arquivo muito grande (máx. 50MB).' });
  }
  if (buffer.length < 512) {
    return res.status(422).json({ message: 'Arquivo muito pequeno ou corrompido.' });
  }

  if (!validateMagicBytesBuffer(buffer, ext)) {
    return res.status(422).json({
      message: 'Conteúdo do arquivo não corresponde à extensão informada.',
    });
  }

  let tempPath = null;

  try {
    const imageExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

    let text = '';
    let slidesProcessados = 0;

    if (imageExts.has(ext)) {
      // Imagens: processa direto do buffer, sem tocar disco
      const { analyzeImage } = require('./ai');
      text = await analyzeImage(buffer, mimetype);
      slidesProcessados = 1;
    } else {
      // PDF/PPTX: extractors precisam de um caminho de arquivo
      const rand = crypto.randomBytes(16).toString('hex');
      tempPath = path.join(UPLOADS_DIR, `${Date.now()}-${rand}${ext}`);
      fs.writeFileSync(tempPath, buffer);

      if (ext === '.pptx') {
        text = extractFromPptx(tempPath);
        slidesProcessados = (text.match(/\[slide\d+\]/gi) || []).length || 10;
      } else {
        text = await extractFromPdf(tempPath);
        slidesProcessados = Math.ceil(text.length / 3000);
      }

      safeUnlink(tempPath);
      tempPath = null;
    }

    console.log('[processar] Texto extraído:', text.slice(0, 200).replace(/\n/g, ' '), '...');

    if (!text || text.trim().length < 50) {
      return res.status(422).json({ message: 'Não foi possível extrair texto suficiente.' });
    }

    const chunks = chunkText(text);
    const chunksLimitados = chunks.slice(0, 5);

    const resultados = await Promise.all(
      chunksLimitados.map(chunk => generateStudyMaterial(chunk))
    );
    const rawContent = resultados.join('\n\n');

    const originalName = sanitizeFilename(filename);
    const material = parseAIContent(rawContent, originalName, slidesProcessados);

    await createPdf(material);

    console.log(`[processar] Cards gerados: ${material.flashcards.length}`);

    if (guestId) registrarTesteGratis(guestId);

    return res.json(material);
  } catch (err) {
    if (tempPath) safeUnlink(tempPath);
    console.error('[processar] Erro:', err);
    return res.status(500).json({ message: 'Erro interno.' });
  }
});

// ─────────────────────────────────────────────
// DOWNLOAD PDF
// ─────────────────────────────────────────────

app.get('/api/download-pdf', (req, res) => {
  const filePath = path.resolve(__dirname, 'output.pdf');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'PDF não encontrado.' });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="material-estudo.pdf"');
  res.sendFile(filePath);
});

// ─────────────────────────────────────────────
// FRONTEND REACT (catch-all — deve vir por último)
// ─────────────────────────────────────────────

app.get(/.*/, (req, res) => {
  const buildIndex = path.join(frontendBuild, 'index.html');

  if (fs.existsSync(buildIndex)) {
    const resolved = path.resolve(buildIndex);
    if (!resolved.startsWith(frontendBuild)) {
      return res.status(400).end();
    }
    return res.sendFile(resolved);
  }

  res.json({
    status: 'MedStudy API rodando',
    frontend: 'Execute npm start na pasta medstudy-frontend',
  });
});

// ─────────────────────────────────────────────
// TRATAMENTO DE ERROS
// ─────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err.message === 'Origem não permitida pelo CORS') {
    return res.status(403).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});



// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function parseAIContent(raw, filename, slidesProcessados) {
  const titulo = filename.replace(/\.[^/.]+$/, '').toUpperCase();

  const resumo = (
    raw.match(/##\s*RESUMO\s*([\s\S]*?)(?=##\s*PONTOS-CHAVE|##\s*FLASHCARDS)/i)?.[1] ?? ''
  ).trim();

  const pontoschave = (
    raw.match(/##\s*PONTOS-CHAVE\s*([\s\S]*?)(?=##\s*FLASHCARDS)/i)?.[1] ?? ''
  ).trim();

  // =========================
  // FLASHCARDS
  // =========================

  const flashcardsSection =
  raw.match(/##\s*FLASHCARDS\s*([\s\S]*?)(?=##\s*QUESTOES|$)/i)?.[1] ?? raw;

  const blocos = [
    ...flashcardsSection.matchAll(
      /CARD\s+(\d+)\s*([\s\S]*?)(?=CARD\s+\d+|$)/gi
    )
  ];

  const flashcards = [];

  for (const match of blocos) {
    const bloco = match[2].trim();

    const perguntaPT =
      bloco.match(/^PT\s*:\s*(.+)/im)?.[1]?.trim() ?? '';

    const perguntaES =
      bloco.match(/^ES\s*:\s*(.+)/im)?.[1]?.trim() ?? '';

    const respostaPT =
      bloco.match(/RESPOSTA PT\s*:\s*([\s\S]*?)(?=RESPUESTA ES\s*:|$)/i)?.[1]?.trim() ?? '';

    const respostaES =
      bloco.match(/RESPUESTA ES\s*:\s*([\s\S]*?)$/i)?.[1]?.trim() ?? '';

    if (perguntaPT && respostaPT) {
      flashcards.push({
        id: flashcards.length + 1,
        perguntaPT,
        respostaPT,
        perguntaES: perguntaES || perguntaPT,
        respostaES: respostaES || respostaPT,
      });
    }
  }

  
  



// =========================
// QUESTÕES
// =========================

const questoesSection =
  raw.match(/##\s*QUEST[OÕ]ES?\s*\n([\s\S]*?)(?=\n##\s|$)/i)?.[1] ?? '';

console.log('[debug questoes] seção encontrada:', questoesSection.slice(0, 300));

const questoesBlocos = [
  ...questoesSection.matchAll(
    /QUEST[AÃ]O\s+(\d+)\s*([\s\S]*?)(?=QUEST[AÃ]O\s+\d+|$)/gi
  )
];

const questoes = [];

for (const match of questoesBlocos) {
  const bloco = match[2].trim();

  const pergunta =
    bloco.match(/PERGUNTA\s*:\s*([\s\S]*?)(?=\nA\))/i)?.[1]?.trim() ?? '';

  const alternativaA = bloco.match(/A\)\s*(.+)/i)?.[1]?.trim() ?? '';
  const alternativaB = bloco.match(/B\)\s*(.+)/i)?.[1]?.trim() ?? '';
  const alternativaC = bloco.match(/C\)\s*(.+)/i)?.[1]?.trim() ?? '';
  const alternativaD = bloco.match(/D\)\s*(.+)/i)?.[1]?.trim() ?? '';

  const correta = bloco.match(/CORRETA\s*:\s*(.+)/i)?.[1]?.trim() ?? '';

  const explicacao =
    bloco.match(/EXPLICA[CÇ][AÃ]O\s*:\s*([\s\S]*?)$/i)?.[1]?.trim() ?? '';

  if (pergunta) {
    questoes.push({
      id: questoes.length + 1,
      pergunta,
      alternativas: { A: alternativaA, B: alternativaB, C: alternativaC, D: alternativaD },
      correta,
      explicacao,
    });
  }
}

  console.log(`[parse] Cards extraídos: ${flashcards.length}`);
  console.log(`[parse] Questões extraídas: ${questoes.length}`);

  return {
    titulo,
    slidesProcessados,
    resumo,
    pontoschave,
    flashcards,
    questoes,
  };
}

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🏥 MedStudy API rodando em http://localhost:${PORT}`);
  console.log(`📁 Frontend: cd medstudy-frontend && npm start\n`);
});