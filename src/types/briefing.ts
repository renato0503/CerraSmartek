export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BriefingData {
  id?: string;
  userId: string;
  status: BriefingStatus;
  nicho: string;
  subcategoria: string;
  ticketMedio: number;
  cep: string;
  coordenadas: Coordinates;
  raio: number;
  dor: string;
  diferencial: string;
  estagio: string;
  orcamento?: number;
  plano: "basico" | "completo" | "pro";
  createdAt?: Date;
  updatedAt?: Date;
}

export type BriefingStatus =
  | "rascunho"
  | "pagamento_pendente"
  | "pagamento_confirmado"
  | "processando"
  | "dados_coletados"
  | "relatorio_gerado"
  | "concluido"
  | "erro";
