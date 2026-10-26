import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CancelarConsultaDto {
  @ApiProperty({
    example: 'Imprevisto de trabalho / motivo de saúde pessoal',
    description: 'Justificativa do cancelamento (mínimo de 5 caracteres)',
  })
  @IsString()
  @IsNotEmpty({ message: 'A justificativa do cancelamento é obrigatória.' })
  @MinLength(5, { message: 'A justificativa deve ter ao menos 5 caracteres.' })
  motivo: string;
}
