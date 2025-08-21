import { ApiProperty } from '@nestjs/swagger';

export class DeleteUsuarioDto {
  @ApiProperty({ description: 'ID do usuário deletado' })
  id: string;

  @ApiProperty({ description: 'Indica se a deleção foi bem-sucedida' })
  sucesso: boolean;
}
