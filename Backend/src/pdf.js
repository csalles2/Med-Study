const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

const OUTPUT_PATH = require('path').resolve(__dirname, 'output.pdf');

function sanitize(text) {
  if (!text) return '';
  return String(text)
    // Símbolos gregos → equivalentes latinos
    .replace(/μ/g, 'u')
    .replace(/α/g, 'a')
    .replace(/β/g, 'b')
    .replace(/γ/g, 'y')
    .replace(/δ/g, 'd')
    // Símbolos matemáticos e especiais → ASCII
    .replace(/°/g, 'grau')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/→/g, '->')
    // Aspas tipográficas → aspas simples ASCII
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Traço longo → hífen
    .replace(/[\u2013\u2014]/g, '-')
    // Remove emojis e símbolos fora do Latin Extended (U+0000–U+024F)
    // MAS preserva acentos latinos (U+00C0–U+024F) que a Helvetica suporta
    .replace(/[^\x20-\x7E\u00C0-\u024F]/g, '');
}

async function createPdf(data) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica, { subset: true });
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold, { subset: true });

    const PAGE_WIDTH = 600;
    const PAGE_HEIGHT = 800;
    const margemX = 40;
    const maxWidth = PAGE_WIDTH - margemX * 2; // 520px de largura útil

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = 750;

    function novaPagina() {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = 750;
    }

    // Quebra uma string longa em linhas que cabem dentro de maxWidth
    function wrapText(text, size, selectedFont, maxW) {
        const words = sanitize(text).split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = selectedFont.widthOfTextAtSize(testLine, size);
            if (testWidth > maxW && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // Desenha texto simples (uma linha)
    function drawText(text, size = 10, bold = false, color = rgb(0, 0, 0)) {
        if (y < 60) novaPagina();
        const selectedFont = bold ? boldFont : font;
        page.drawText(sanitize(text), {
            x: margemX,
            y,
            size,
            font: selectedFont,
            color
        });
        y -= size + 6;
    }

    // Desenha texto COM word wrap — usa isso para blocos longos
    function drawWrappedText(text, size = 10, bold = false, color = rgb(0, 0, 0), indentX = 0) {
        const selectedFont = bold ? boldFont : font;
        // Processa cada parágrafo separado por \n
        const paragraphs = sanitize(text).split('\n');
        for (const para of paragraphs) {
            if (!para.trim()) {
                y -= size; // linha em branco
                continue;
            }
            const lines = wrapText(para, size, selectedFont, maxWidth - indentX);
            for (const line of lines) {
                if (y < 60) novaPagina();
                page.drawText(line, {
                    x: margemX + indentX,
                    y,
                    size,
                    font: selectedFont,
                    color
                });
                y -= size + 4;
            }
        }
        y -= 4; // espaço extra após o bloco
    }

    // Mesmo que drawWrappedText mas retorna as linhas sem desenhar (para calcular altura)
    function measureWrappedText(text, size, selectedFont) {
        const paragraphs = sanitize(text).split('\n');
        let totalLines = 0;
        for (const para of paragraphs) {
            if (!para.trim()) { totalLines++; continue; }
            totalLines += wrapText(para, size, selectedFont, maxWidth).length;
        }
        return totalLines * (size + 4);
    }

    // ─── TÍTULO ───────────────────────────────────────────────
    drawText(data.titulo || "MATERIAL DE ESTUDO", 16, true);
    y -= 10;

    // ─── RESUMO ───────────────────────────────────────────────
    drawText("RESUMO", 12, true, rgb(0, 0.5, 0));
    drawWrappedText(data.resumo || '', 10, false, rgb(0, 0, 0));
    y -= 6;

    // ─── PONTOS-CHAVE ─────────────────────────────────────────
    drawText("PONTOS-CHAVE", 12, true, rgb(0, 0.5, 0));
    drawWrappedText(data.pontoschave || '', 10, false, rgb(0, 0, 0));
    y -= 15;

    // ─── FLASHCARDS ───────────────────────────────────────────
    drawText("FLASHCARDS", 14, true);
    y -= 5;

    data.flashcards.forEach(card => {

        // Calcula altura dinâmica do card baseada no conteúdo
        const ptQ  = wrapText(card.perguntaPT  || '', 10, font, maxWidth - 20);
        const ptA  = wrapText(card.respostaPT  || '', 10, font, maxWidth - 20);
        const esQ  = wrapText(card.perguntaES  || '', 10, font, maxWidth - 20);
        const esA  = wrapText(card.respostaES  || '', 10, font, maxWidth - 20);

        const lineH = 14;
        const cardHeight = 
            20 +                            // CARD N header
            14 +                            // "PT:" label
            ptQ.length * lineH +
            ptA.length * lineH +
            14 +                            // "ES:" label
            esQ.length * lineH +
            esA.length * lineH +
            20;                             // padding bottom

        if (y - cardHeight < 40) novaPagina();

        // Borda do card
        page.drawRectangle({
            x: 30,
            y: y - cardHeight,
            width: 540,
            height: cardHeight,
            borderColor: rgb(0, 0.6, 0.4),
            borderWidth: 1,
        });

        let cy = y - 14;

        // CARD N
        page.drawText(sanitize(`CARD ${card.id}`), {
            x: margemX, y: cy, size: 11, font: boldFont, color: rgb(0, 0.6, 0.4)
        });
        cy -= 16;

        // PT label
        page.drawText("PT:", { x: margemX, y: cy, size: 10, font: boldFont, color: rgb(0,0,0) });
        cy -= lineH;

        // Pergunta PT (wrapped)
        for (const line of ptQ) {
            page.drawText(line, { x: margemX + 8, y: cy, size: 10, font, color: rgb(0,0,0) });
            cy -= lineH;
        }
        // Resposta PT (wrapped, levemente recuada e itálico visual — Helvetica não tem itálico, usamos cor)
        for (const line of ptA) {
            page.drawText(line, { x: margemX + 8, y: cy, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
            cy -= lineH;
        }

        cy -= 4;

        // ES label
        page.drawText("ES:", { x: margemX, y: cy, size: 10, font: boldFont, color: rgb(0,0,0) });
        cy -= lineH;

        // Pergunta ES (wrapped)
        for (const line of esQ) {
            page.drawText(line, { x: margemX + 8, y: cy, size: 10, font, color: rgb(0,0,0) });
            cy -= lineH;
        }
        // Resposta ES (wrapped)
        for (const line of esA) {
            page.drawText(line, { x: margemX + 8, y: cy, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
            cy -= lineH;
        }

        y -= cardHeight + 10; // espaço entre cards
    });

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(OUTPUT_PATH, pdfBytes);
    console.log('PDF gerado com sucesso!');
}

module.exports = { createPdf };