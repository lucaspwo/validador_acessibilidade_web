import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const WAVE_API_KEY = process.env.WAVE_API_KEY;
const url = process.argv[2]; // Recebe a URL da linha de comando

if (!WAVE_API_KEY) {
  console.error("❌ ERRO: API Key do WAVE não encontrada. Adicione ao .env");
  process.exit(1);
}

if (!url) {
  console.error("❌ ERRO: Por favor, informe uma URL. Exemplo: node waveChecker.ts https://exemplo.com");
  process.exit(1);
}

async function checkAccessibility(targetUrl: string) {
  console.log(`🚀 Testando acessibilidade com WAVE para: ${targetUrl}`);

  try {
    const response = await axios.get("https://wave.webaim.org/api/request", {
      params: {
        key: WAVE_API_KEY,
        url: targetUrl,
        format: "json",
      },
    });

    const results = response.data;

    // Resumo dos problemas detectados
    const report = {
      url: targetUrl,
      errors: results.categories.error.count,
      alerts: results.categories.alert.count,
      features: results.categories.feature.count,
      structure: results.categories.structure.count,
      contrast: results.categories.contrast.count,
      total_issues:
        results.categories.error.count +
        results.categories.alert.count +
        results.categories.structure.count +
        results.categories.contrast.count,
      accessibility_score: Math.max(
        100 - (results.categories.error.count + results.categories.alert.count) * 2,
        0
      ),
    };

    // Salvar relatório JSON
    const fileName = `wave_report_${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(report, null, 2));
    console.log(`✅ Relatório salvo: ${fileName}`);

    // Exibir resumo
    console.log("\n📊 Resultado:");
    console.log(`🔴 Erros: ${report.errors}`);
    console.log(`⚠️ Alertas: ${report.alerts}`);
    console.log(`✅ Boas práticas detectadas: ${report.features}`);
    console.log(`🎨 Problemas de contraste: ${report.contrast}`);
    console.log(`🏗️ Problemas estruturais: ${report.structure}`);
    console.log(`📈 Score de Acessibilidade: ${report.accessibility_score}/100`);
  } catch (error) {
    console.error("❌ Erro ao acessar a API WAVE:", error.message);
  }
}

checkAccessibility(url);
