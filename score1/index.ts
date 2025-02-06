import puppeteer from 'puppeteer';
import { AxePuppeteer } from '@axe-core/puppeteer';
import lighthouse from 'lighthouse';
import fs from 'fs';
import { launch } from 'chrome-launcher';

const url = process.argv[2]; // Recebe a URL da linha de comando

if (!url) {
  console.error("❌ ERRO: Por favor, informe uma URL. Exemplo: node index.js https://exemplo.com");
  process.exit(1);
}

async function runAccessibilityChecks(targetUrl: string) {
  console.log(`🚀 Testando acessibilidade para: ${targetUrl}`);

  // Iniciar Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });

  // Teste com axe-core
  console.log("🔍 Executando axe-core...");
  const axeResults = await new AxePuppeteer(page).analyze();

  // Teste com Lighthouse
  console.log("🚦 Executando Lighthouse...");
  const chrome = await launch({ chromeFlags: ['--headless'] });
  const options = { logLevel: 'info' as 'info', output: 'json' as 'json', onlyCategories: ['accessibility'], port: chrome.port };
  const runnerResult = await lighthouse(targetUrl, options);

  // Gerar relatório JSON
  const report = {
    url: targetUrl,
    axe_violations: axeResults.violations.length,
    axe_issues: axeResults.violations.map(v => ({ id: v.id, description: v.description })),
    lighthouse_score: (runnerResult?.lhr?.categories?.accessibility?.score ?? 0) * 100,
  };

  // Salvar resultado
  fs.writeFileSync(`report_${Date.now()}.json`, JSON.stringify(report, null, 2));
  console.log(`✅ Relatório salvo: report_${Date.now()}.json`);

  // Exibir resumo
  console.log("\n📊 Resultado:");
  console.log(`🔴 Erros detectados (axe-core): ${report.axe_violations}`);
  console.log(`🟢 Score de acessibilidade (Lighthouse): ${report.lighthouse_score}/100`);

  await browser.close();
  await chrome.kill();
}

runAccessibilityChecks(url);