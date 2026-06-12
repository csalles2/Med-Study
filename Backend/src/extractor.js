const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse-new');
const AdmZip = require('adm-zip');

async function extractFromUrl(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle0' });

    const text = await page.evaluate(() => {
        document.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());
        return document.body.innerText;
    });

    await browser.close();
    return text;
}

async function extractFromPdf(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
}

function extractFromPptx(filePath) {
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();
    
    let textoCompleto = '';

    for (const entry of entries) {
        if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
            const xml = entry.getData().toString('utf8');
            
            const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || [];
            const textoSlide = matches
                .map(tag => tag.replace(/<[^>]+>/g, ''))
                .join(' ');
            
            const numeroSlide = path.basename(entry.entryName, '.xml');
            textoCompleto += `\n[${numeroSlide}]\n${textoSlide}\n`;
        }
    }

    return textoCompleto;
}

module.exports = { extractFromPdf, extractFromUrl, extractFromPptx };