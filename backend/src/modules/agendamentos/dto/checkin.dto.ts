import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Token lido pelo scanner da câmera do QR Code',
    required: false,
  })
  @IsOptional()
  @IsString()
  qrCodeToken?: string;

  @ApiProperty({
    example: 'NAT-2026-X8Y9',
    description: 'Código de protocolo impresso ou apresentado no comprovante',
    required: false,
  })
  @IsOptional()
  @IsString()
  codigoProtocolo?: string;

  @ApiProperty({
    example: '12345678900',
    description: 'CPF do paciente para busca manual na recepção',
    required: false,
  })
  @IsOptional()
  @IsString()
  cpf?: string;
}
