import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";
import fs from "fs";

const url = process.argv[2];

if (!url) {
  console.error("❌ ERRO: Por favor, informe uma URL.");
  process.exit(1);
}

async function runAccessibilityChecks(targetUrl: string) {
  console.log(`🚀 Testando acessibilidade para: ${targetUrl}`);

  // Iniciar Puppeteer
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Aguardar página carregar completamente
  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  // Esperar um tempo extra para garantir que scripts assíncronos carreguem
  await page.waitForTimeout(3000); 

  console.log("🔍 Executando axe-core...");
  try {
    // CORREÇÃO: Passar `page` diretamente, sem `.mainFrame()`
    const axeResults = await new AxePuppeteer(page).analyze();

    const report = {
      url: targetUrl,
      axe_violations: axeResults.violations.length,
      axe_issues: axeResults.violations.map(v => ({
        id: v.id,
        description: v.description
      }))
    };

    const fileName = `report_${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(report, null, 2));
    console.log(`✅ Relatório salvo: ${fileName}`);

    console.log("\n📊 Resultado:");
    console.log(`🔴 Erros detectados (axe-core): ${report.axe_violations}`);
  } catch (error) {
    console.error("❌ Erro ao executar axe-core:", error);
  }

  await browser.close();
}

// Executar a ferramenta
runAccessibilityChecks(url);
