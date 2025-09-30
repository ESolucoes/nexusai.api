import { ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertRotinaItemDto {
  @IsOptional() @IsString() @MaxLength(32)
  grupo?: string; // FIXA

  @IsString() @MaxLength(32)
  dia!: string;

  @IsString() @MaxLength(200)
  titulo!: string;

  @IsOptional() @IsInt()
  ordem?: number;

  @IsOptional() @IsBoolean()
  ativo?: boolean;
}

export class UpsertRotinaDto {
  @IsArray() @ArrayMinSize(1)
  itens!: UpsertRotinaItemDto[];
}
