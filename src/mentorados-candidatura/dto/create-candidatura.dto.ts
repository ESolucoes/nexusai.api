// backend/src/mentorados-candidatura/dto/create-candidatura.dto.ts
export class CreateCandidaturaDto {
  linkedin: string;               // Login do LinkedIn
  senha: string;                   // Senha do LinkedIn
  mentoradoId: number;             // ID do mentorado no sistema
  tipoVaga?: string;               // Tipo de vaga desejada (ex: Front-end, Data Science)
  pretensaoClt?: number;           // Pretensão CLT
  pretensaoPj?: number;            // Pretensão PJ
  empresasBloqueadas?: string[];   // Lista de empresas para não candidatar
  ativarIA?: boolean;              // Usar IA para seleção de vagas
}
