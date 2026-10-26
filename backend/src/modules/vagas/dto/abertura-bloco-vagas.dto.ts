import { ApiProperty } from '@nestjs/swagger';
import { Turno } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class AberturaBlocoVagasDto {
  @ApiProperty({ example: 'uuid-ubs-ponta-negra', description: 'ID da UBS onde as vagas serão abertas' })
  @IsString()
  @IsNotEmpty()
  ubsId: string;

  @ApiProperty({ example: 'uuid-clinico-geral', description: 'ID da especialidade da consulta' })
  @IsString()
  @IsNotEmpty()
  especialidadeId: string;

  @ApiProperty({ example: 'uuid-medico', description: 'ID do médico responsável (opcional)', required: false })
  @IsOptional()
  @IsString()
  medicoId?: string;

  @ApiProperty({ example: '2026-11-03', description: 'Data da agenda (AAAA-MM-DD)' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'A data deve estar no formato AAAA-MM-DD' })
  data: string;

  @ApiProperty({ enum: Turno, example: Turno.MANHA, description: 'Turno das consultas' })
  @IsEnum(Turno)
  turno: Turno;

  @ApiProperty({
    example: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00'],
    description: 'Lista de horários de início das vagas',
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  horarios: string[];

  @ApiProperty({ example: 30, description: 'Duração em minutos de cada consulta (padrão: 30)', required: false })
  @IsOptional()
  duracaoMinutos?: number;
}
