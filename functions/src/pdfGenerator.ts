import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import puppeteer from "puppeteer";

const db = admin.firestore();
const bucket = admin.storage().bucket();

export const pdfGenerator = onDocumentCreated(
  {
    document: "pdfQueue/{docId}",
    region: "southamerica-east1",
    memory: "1GiB",
    timeoutSeconds: 300,
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const { briefingId } = snapshot.data() || {};
    if (!briefingId) {
      await snapshot.ref.delete();
      return;
    }

    try {
      const briefingDoc = await db.collection("briefings").doc(briefingId).get();
      if (!briefingDoc.exists) {
        await snapshot.ref.delete();
        return;
      }

      const briefing = briefingDoc.data() || {};

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      const html = generateReportHTML(briefing);
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      });

      await browser.close();

      const filePath = `reports/${briefing.userId || "anon"}/${briefingId}.pdf`;
      const file = bucket.file(filePath);

      await file.save(Buffer.from(pdfBuffer), {
        metadata: { contentType: "application/pdf" },
      });

      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      await briefingDoc.ref.update({
        pdfUrl: url,
        status: "concluido",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await snapshot.ref.delete();
    } catch (error) {
      console.error("Erro no pdfGenerator:", error);
      await db.collection("briefings").doc(briefingId).update({
        status: "erro",
        erro: error instanceof Error ? error.message : "Erro ao gerar PDF",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await snapshot.ref.delete();
    }
  }
);

function generateReportHTML(briefing: Record<string, unknown>): string {
  const aiReport = (briefing.aiReport as Record<string, unknown>) || {};

  const resumo = (aiReport.resumo_executivo as Record<string, string>) || {};
  const concorrencia = (aiReport.analise_concorrencia as Record<string, unknown>) || {};
  const demografia = (aiReport.analise_demografica as Record<string, string>) || {};
  const reputacao = (aiReport.analise_reputacao as Record<string, unknown>) || {};
  const swot = (aiReport.swot as Record<string, string[]>) || {};
  const plano = (aiReport.plano_acao as Record<string, unknown>) || {};

  function lista(items: unknown): string {
    if (!Array.isArray(items)) return "<li>DADOS_INSUFICIENTES</li>";
    return items.map((i) => `<li>${String(i)}</li>`).join("");
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a2e; line-height: 1.6; padding: 0; }
  .cover { background: linear-gradient(135deg, #0A2540, #1E5AA8); color: white; padding: 80px 60px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
  .cover h1 { font-size: 42px; margin-bottom: 20px; }
  .cover .subtitle { font-size: 18px; opacity: 0.85; }
  .cover .meta { margin-top: 40px; font-size: 14px; opacity: 0.7; }
  .section { padding: 30px 60px; page-break-before: always; }
  .section:first-of-type { page-break-before: auto; }
  .section h2 { font-size: 26px; color: #0A2540; border-bottom: 3px solid #C9A961; padding-bottom: 8px; margin-bottom: 20px; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-bottom: 15px; }
  .badge-alta { background: #d4edda; color: #155724; }
  .badge-media { background: #fff3cd; color: #856404; }
  .badge-baixa { background: #f8d7da; color: #721c24; }
  .summary-box { background: #f5f7fa; padding: 20px; border-radius: 8px; margin: 15px 0; }
  .swot-grid { display: flex; gap: 20px; margin-top: 20px; }
  .swot-col { flex: 1; padding: 20px; border-radius: 8px; }
  .swot-forcas { background: #d4edda; }
  .swot-fraquezas { background: #f8d7da; }
  .swot-oportunidades { background: #d1ecf1; }
  .swot-ameacas { background: #fff3cd; }
  .swot-col h3 { font-size: 18px; margin-bottom: 10px; }
  .swot-col ul { padding-left: 20px; font-size: 13px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background: #0A2540; color: white; padding: 10px; text-align: left; font-size: 12px; }
  td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; font-size: 12px; }
  .footer { text-align: center; padding: 40px 60px; color: #999; font-size: 11px; border-top: 1px solid #e0e0e0; }
</style>
</head>
<body>

<div class="cover">
  <h1>Relatório de Inteligência de Localização</h1>
  <p class="subtitle">${briefing.nicho || briefing.subcategoria || ""}</p>
  <p class="meta">${briefing.endereco || ""} • CEP ${briefing.cep || ""} • Raio ${briefing.raio || 1000}m</p>
  <p class="meta">Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
</div>

<div class="section">
  <h2>Resumo Executivo</h2>
  <span class="badge badge-${(resumo.nota_viabilidade || "").toLowerCase()}">${resumo.nota_viabilidade || "—"}</span>
  <div class="summary-box">
    <p><strong>Justificativa:</strong> ${resumo.justificativa || "—"}</p>
    <p style="margin-top: 10px;"><strong>Recomendação:</strong> ${resumo.recomendacao_principal || "—"}</p>
  </div>
</div>

<div class="section">
  <h2>Análise de Concorrência</h2>
  <p><strong>Total:</strong> ${concorrencia.total_concorrentes || 0} concorrentes • <strong>Densidade:</strong> ${concorrencia.densidade_concorrencial || "—"}</p>
  <p style="margin-top: 10px;">${concorrencia.analise || "—"}</p>
  <p style="margin-top: 15px;"><strong>Ameaças:</strong></p>
  <ul>${lista(concorrencia.ameacas)}</ul>
  <p style="margin-top: 15px;"><strong>Oportunidades:</strong></p>
  <ul>${lista(concorrencia.oportunidades)}</ul>
</div>

<div class="section">
  <h2>Análise Demográfica</h2>
  <p>${demografia.analise || "DADOS_INSUFICIENTES"}</p>
  <p style="margin-top: 10px;"><strong>Renda compatível com ticket médio:</strong> ${demografia.renda_compativel === "true" ? "Sim" : "Não verificado"}</p>
</div>

<div class="section">
  <h2>Análise de Reputação</h2>
  <p><strong>Satisfação média da região:</strong> ${reputacao.satisfacao_media_regiao || "—"}</p>
  <p style="margin-top: 15px;"><strong>Principais Reclamações:</strong></p>
  <ul>${lista(reputacao.principais_reclamacoes)}</ul>
  <p style="margin-top: 15px;"><strong>Principais Elogios:</strong></p>
  <ul>${lista(reputacao.principais_elogios)}</ul>
  <p style="margin-top: 15px;"><strong>Insight:</strong> ${reputacao.insight || "—"}</p>
</div>

<div class="section">
  <h2>Matriz SWOT</h2>
  <div class="swot-grid">
    <div class="swot-col swot-forcas">
      <h3>Forças</h3>
      <ul>${lista(swot.forcas)}</ul>
    </div>
    <div class="swot-col swot-fraquezas">
      <h3>Fraquezas</h3>
      <ul>${lista(swot.fraquezas)}</ul>
    </div>
  </div>
  <div class="swot-grid">
    <div class="swot-col swot-oportunidades">
      <h3>Oportunidades</h3>
      <ul>${lista(swot.oportunidades)}</ul>
    </div>
    <div class="swot-col swot-ameacas">
      <h3>Ameaças</h3>
      <ul>${lista(swot.ameacas)}</ul>
    </div>
  </div>
</div>

<div class="section">
  <h2>Plano de Ação</h2>
  <p><strong>Curto Prazo (30 dias):</strong></p>
  <ul>${lista(plano.curto_prazo)}</ul>
  <p style="margin-top: 15px;"><strong>Médio Prazo (3-6 meses):</strong></p>
  <ul>${lista(plano.medio_prazo)}</ul>
  <p style="margin-top: 15px;"><strong>Estratégia de Diferenciação:</strong> ${plano.diferenciacao || "—"}</p>
</div>

<div class="footer">
  <p>© ${new Date().getFullYear()} Prévoya. Todos os direitos reservados.</p>
  <p>Este relatório foi gerado automaticamente e deve ser utilizado como ferramenta de apoio à decisão.</p>
</div>

</body>
</html>`;
}
