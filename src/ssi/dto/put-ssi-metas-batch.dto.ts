import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { PutSsiMetaDto } from './put-ssi-meta.dto';

export class PutSsiMetasBatchDto {
  @ApiProperty({ type: [PutSsiMetaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PutSsiMetaDto)
  itens: PutSsiMetaDto[];
}
