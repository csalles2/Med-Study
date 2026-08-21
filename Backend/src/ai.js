
const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY});

/**
 * Determina a quantidade ideal de flashcards com base no tamanho do conteúdo.
 * Pequeno (<1500 chars) → 5-6 | Médio (<4000) → 8-10 | Grande → 12-15
 */
function calcQuantidade(chunk) {
  const len = chunk.trim().length;
  if (len < 1500) return { min: 5, max: 6, label: '5 a 6' };
  if (len < 4000) return { min: 8, max: 10, label: '8 a 10' };
  return { min: 12, max: 15, label: '12 a 15' };
}

async function generateStudyMaterial(chunk) {
  const { label } = calcQuantidade(chunk);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 6000,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: `Você é um especialista em medicina e preparação para provas de residência médica.
Analise o conteúdo abaixo e gere um material de estudo completo seguindo EXATAMENTE o formato especificado.

════════════════════════════════
REGRAS GERAIS
════════════════════════════════
- Use português com acentuação perfeita (é, á, í, ó, ú, ç)
- Use espanhol com acentuação correta (á, é, í, ó, ú, ñ, ¿?)
- Cada frase deve ser completa e terminar com pontuação
- NÃO escreva nada fora das seções definidas
- NÃO repita nenhuma seção
- NÃO misture seções entre si

════════════════════════════════
REGRAS DOS FLASHCARDS
════════════════════════════════
- Gere EXATAMENTE ${label} flashcards
- Numeração contínua: CARD 1, CARD 2, … sem reiniciar
- A pergunta fica APENAS nas linhas "PT:" e "ES:"
- A resposta fica APENAS nas linhas "RESPOSTA PT:" e "RESPUESTA ES:"
- Separe cada CARD com uma linha em branco

════════════════════════════════
REGRAS DAS QUESTÕES
════════════════════════════════
- Gere de 3 a 5 questões estilo residência médica
- Foco em diagnóstico, clínica, fisiologia e conduta
- Alternativas plausíveis, apenas UMA correta por questão
- Separe cada QUESTAO com uma linha em branco

════════════════════════════════
FORMATO OBRIGATÓRIO
════════════════════════════════

## RESUMO
(texto consolidado em português)

## PONTOS-CHAVE
- (conceito 1)
- (conceito 2)

## FLASHCARDS

CARD 1
PT: (pergunta em português)
ES: (pregunta en español)
RESPOSTA PT: (resposta objetiva em português)
RESPUESTA ES: (respuesta objetiva en español)

CARD 2
PT: (pergunta em português)
ES: (pregunta en español)
RESPOSTA PT: (resposta objetiva em português)
RESPUESTA ES: (respuesta objetiva en español)

## QUESTOES

QUESTAO 1
PERGUNTA: (texto da pergunta)
A) (alternativa)
B) (alternativa)
C) (alternativa)
D) (alternativa)
CORRETA: (letra)
EXPLICACAO: (explicação objetiva e curta)

QUESTAO 2
PERGUNTA: (texto da pergunta)
A) (alternativa)
B) (alternativa)
C) (alternativa)
D) (alternativa)
CORRETA: (letra)
EXPLICACAO: (explicação objetiva e curta)

════════════════════════════════
CONTEÚDO PARA ANALISAR:
════════════════════════════════
${chunk}`,
      },
    ],
  });

  return response.content[0].text;
}

async function analyzeImage(imageBuffer, mediaType) {
  const base64 = imageBuffer.toString('base64');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: `Você é um especialista em medicina. Analise esta imagem (pode ser uma foto de slide, quadro, anotação, esquema anatômico, tabela, gráfico ou texto médico).

Extraia TODO o conteúdo visível: textos, títulos, listas, tabelas, esquemas e conceitos.
Organize o conteúdo de forma estruturada e completa, como se fosse um texto de aula.
Responda APENAS com o conteúdo extraído, sem comentários adicionais.`,
          },
        ],
      },
    ],
  });

  return response.content[0].text;
}

module.exports = { generateStudyMaterial, analyzeImage };