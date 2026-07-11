import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Groq from "groq-sdk";
import { SYSTEM_PROMPT, NICHE_PROMPTS } from "./utils/prompts";

const db = admin.firestore();

export const aiReportWriter = onDocumentCreated(
  { document: "aiQueue/{docId}", region: "southamerica-east1", memory: "256MiB" },
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

      const nicho = (briefing.nicho || briefing.subcategoria || "") as string;
      const nichePrompt = NICHE_PROMPTS[nicho.toLowerCase()] || "";

      const contexto = {
        nicho,
        localizacao: briefing.endereco || "",
        cep: briefing.cep || "",
        raio: briefing.raio || 1000,
        ticketMedio: briefing.ticketMedio || 0,
        dorDoCliente: briefing.dor || "",
        diferencial: briefing.diferencial || "",
        concorrentes: (briefing.concorrentes || []).slice(0, 10),
        demografia: briefing.demografia || {},
        sentimentos: briefing.sentimentos || {},
      };

      let aiReport;

      try {
        aiReport = await callGroq(contexto, nichePrompt);
      } catch {
        aiReport = fallbackReport(contexto);
      }

      await briefingDoc.ref.update({
        aiReport,
        swot: aiReport.swot,
        planoAcao: aiReport.plano_acao,
        status: "relatorio_gerado",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection("pdfQueue").add({
        briefingId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await snapshot.ref.delete();
    } catch (error) {
      console.error("Erro no aiReportWriter:", error);
      await db.collection("briefings").doc(briefingId).update({
        status: "erro",
        erro: error instanceof Error ? error.message : "Erro na IA",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await snapshot.ref.delete();
    }
  }
);

async function callGroq(contexto: unknown, nichePrompt = "") {
  const groqKey = functions.config().groq?.api_key || process.env.GROQ_API_KEY || "";
  const groq = new Groq({ apiKey: groqKey });

  const systemPrompt = nichePrompt ? SYSTEM_PROMPT + nichePrompt : SYSTEM_PROMPT;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(contexto, null, 2) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = completion.choices[0]?.message?.content || "{}";
  return JSON.parse(content);
}

function fallbackReport(contexto: Record<string, unknown>) {
  const concorrentes = (contexto.concorrentes as Array<{ nome: string; rating: number }>) || [];
  const total = concorrentes.length;

  return {
    resumo_executivo: {
      nota_viabilidade: total > 15 ? "BAIXA" : total > 8 ? "MEDIA" : "ALTA",
      justificativa: `Foram identificados ${total} concorrentes na região. Análise automática sem IA — configure a chave GROQ_API_KEY para relatórios detalhados.`,
      recomendacao_principal: "Avalie a densidade de concorrentes e compare o ticket médio com a renda da região.",
    },
    analise_concorrencia: {
      total_concorrentes: total,
      densidade_concorrencial: total > 15 ? "ALTA" : total > 8 ? "MEDIA" : "BAIXA",
      concorrentes_diretos: total,
      concorrentes_indiretos: 0,
      analise: `Foram encontrados ${total} estabelecimentos no raio de análise.`,
      ameacas: ["DADOS_INSUFICIENTES"],
      oportunidades: ["DADOS_INSUFICIENTES"],
    },
    analise_demografica: {
      publico_alvo_atingivel: 0,
      renda_compativel: false,
      analise: "DADOS_INSUFICIENTES",
    },
    analise_reputacao: {
      satisfacao_media_regiao: concorrentes.reduce((acc, c) => acc + (c.rating || 0), 0) / (total || 1),
      principais_reclamacoes: ["DADOS_INSUFICIENTES"],
      principais_elogios: ["DADOS_INSUFICIENTES"],
      insight: "Configure a chave GROQ_API_KEY para análise completa.",
    },
    swot: {
      forcas: ["DADOS_INSUFICIENTES"],
      fraquezas: ["DADOS_INSUFICIENTES"],
      oportunidades: ["DADOS_INSUFICIENTES"],
      ameacas: ["DADOS_INSUFICIENTES"],
    },
    plano_acao: {
      curto_prazo: ["DADOS_INSUFICIENTES"],
      medio_prazo: ["DADOS_INSUFICIENTES"],
      diferenciacao: "DADOS_INSUFICIENTES",
    },
  };
}
