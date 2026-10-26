import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AgendarConsultaDto {
  @ApiProperty({ example: 'uuid-da-vaga', description: 'ID da vaga a ser reservada' })
  @IsString()
  @IsNotEmpty({ message: 'O ID da vaga é obrigatório.' })
  vagaId: string;

  @ApiProperty({
    example: 'uuid-do-paciente',
    description: 'ID do paciente (opcional; se não informado, assume o cidadão autenticado. Usado no agendamento assistido no balcão da UBS)',
    required: false,
  })
  @IsOptional()
  @IsString()
  pacienteId?: string;
}
