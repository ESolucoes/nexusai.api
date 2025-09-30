import { IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCronogramaSemanaDto {
  @IsOptional() @IsString() @MaxLength(32)
  semana?: string;

  @IsOptional() @IsString() @MaxLength(160)
  meta?: string;

  @IsOptional() @IsString()
  tarefa?: string;

  @IsOptional() @IsInt()
  ordem?: number;

  @IsOptional() @IsBoolean()
  concluido?: boolean;
}
