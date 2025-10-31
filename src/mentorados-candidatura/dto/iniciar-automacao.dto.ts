import { IsOptional, IsString, IsNumber, IsArray, Min, Max, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespostasChatConfig {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  disponibilidade?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avisoPrevio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  interesse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pretensaoSalarial?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pretensaoPj?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  localizacao?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experiencia?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  outrasPerguntas?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  respostaPadrao?: string;
}

export class IniciarAutomacaoDto {
  @ApiProperty({ description: 'Email do LinkedIn', required: true })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Senha do LinkedIn', required: true })
  @IsString()
  password: string;

  @ApiProperty({ description: 'Tipo de vaga desejada', example: 'Desenvolvedor Full Stack' })
  @IsString()
  tipoVaga: string;

  @ApiProperty({ 
    description: 'Empresas a serem evitadas', 
    example: ['Consultoria X', 'Empresa Y'], 
    required: false,
    default: [] 
  })
  @IsOptional()
  @IsArray()
  empresasBloqueadas?: string[] = [];

  @ApiProperty({ description: 'Máximo de aplicações por execução', example: 10, default: 5 })
  @IsNumber()
  @Min(1)
  @Max(50)
  maxAplicacoes: number = 5;

  @ApiProperty({ 
    description: 'ID do mentorado (opcional - será obtido do usuário logado se não informado)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  mentoradoId?: string;

  @ApiProperty({ 
    description: 'Configurações de respostas para o chat', 
    type: RespostasChatConfig,
    required: false,
    example: {
      disponibilidade: "",
      avisoPrevio: "",
      interesse: "",
      pretensaoSalarial: "",
      pretensaoPj: "",
      localizacao: "",
      experiencia: "",
      outrasPerguntas: "",
      respostaPadrao: ""
    }
  })
  @IsOptional()
  @IsObject()
  respostasChat?: RespostasChatConfig;
}