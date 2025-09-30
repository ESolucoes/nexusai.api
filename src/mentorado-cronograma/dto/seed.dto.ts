import { IsOptional, IsUUID } from 'class-validator';

export class SeedCronogramaDto {
  @IsOptional()
  @IsUUID()
  usuarioId?: string;
}
