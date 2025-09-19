export interface SupportTicketData {
  nome: string;
  email: string;
  unidade: string;
  setor: string;
  equipamento: string;
  outroEquipamento?: string;
  descricao: string;
}

export enum TicketPriority {
  Alta = 'Alta',
  Media = 'Média',
  Baixa = 'Baixa',
}

export interface TicketAnalysisResult {
  priority: TicketPriority;
  category: string;
  suggested_solution: string;
}
