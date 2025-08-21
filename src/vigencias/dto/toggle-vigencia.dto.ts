import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleVigenciaDto {
  @ApiProperty({ description: 'Define se deseja ficar ativo (true) ou desativar (false)' })
  @IsBoolean()
  ativo: boolean;
}
