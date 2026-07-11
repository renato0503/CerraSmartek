import { BriefingData } from "./briefing";

export interface ConcorrenteData {
  place_id: string;
  nome: string;
  endereco: string;
  rating: number;
  total_ratings: number;
  tipos: string[];
  coordenadas: { lat: number; lng: number } | null;
  aberto_agora: boolean | null;
}

export interface DemografiaData {
  municipio: string;
  uf: string;
  populacao: number;
  densidade: number;
  renda_media: number;
  faixa_etaria: Record<string, number>;
}

export interface SentimentoData {
  total_concorrentes: number;
  rating_medio_regiao: number;
  principais_reclamacoes: string[];
  principais_elogios: string[];
  nuvem_palavras: string[];
}

export interface ResumoExecutivo {
  nota_viabilidade: "ALTA" | "MEDIA" | "BAIXA" | "NAO_RECOMENDADA";
  justificativa: string;
  recomendacao_principal: string;
}

export interface AnaliseConcorrencia {
  total_concorrentes: number;
  densidade_concorrencial: "ALTA" | "MEDIA" | "BAIXA";
  concorrentes_diretos: number;
  concorrentes_indiretos: number;
  analise: string;
  ameacas: string[];
  oportunidades: string[];
}

export interface AnaliseDemografica {
  publico_alvo_atingivel: number;
  renda_compativel: boolean;
  analise: string;
}

export interface AnaliseReputacao {
  satisfacao_media_regiao: number;
  principais_reclamacoes: string[];
  principais_elogios: string[];
  insight: string;
}

export interface SwotData {
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
}

export interface PlanoAcao {
  curto_prazo: string[];
  medio_prazo: string[];
  diferenciacao: string;
}

export interface AiReport {
  resumo_executivo: ResumoExecutivo;
  analise_concorrencia: AnaliseConcorrencia;
  analise_demografica: AnaliseDemografica;
  analise_reputacao: AnaliseReputacao;
  swot: SwotData;
  plano_acao: PlanoAcao;
}

export interface ReportData extends BriefingData {
  concorrentes?: ConcorrenteData[];
  demografia?: DemografiaData;
  sentimentos?: SentimentoData;
  aiReport?: AiReport;
  swot?: SwotData;
  pdfUrl?: string;
  completedAt?: Date;
  erro?: string;
}
