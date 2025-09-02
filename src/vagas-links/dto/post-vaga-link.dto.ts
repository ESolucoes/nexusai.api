import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class PostVagaLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titulo?: string;

  @IsUrl({ require_protocol: false, require_tld: false }) // aceita sem http/https; normalizamos no service
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fonte?: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
