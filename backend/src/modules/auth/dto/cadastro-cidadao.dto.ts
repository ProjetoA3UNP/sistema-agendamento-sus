import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Equals,
} from 'class-validator';

export class CadastroCidadaoDto {
  @ApiProperty({ example: 'João da Silva Santos', description: 'Nome completo do cidadão' })
  @IsString({ message: 'O nome deve ser uma string.' })
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  @MinLength(3, { message: 'O nome deve conter ao menos 3 caracteres.' })
  nome: string;

  @ApiProperty({ example: '12345678900', description: 'CPF válido (apenas dígitos ou formatado)' })
  @IsString({ message: 'O CPF deve ser uma string.' })
  @IsNotEmpty({ message: 'O CPF é obrigatório.' })
  cpf: string;

  @ApiProperty({ example: '700000000000001', description: 'Número do Cartão Nacional de Saúde (CNS)', required: false })
  @IsOptional()
  @IsString({ message: 'O Cartão SUS deve ser uma string.' })
  cartaoSus?: string;

  @ApiProperty({ example: 'joao.silva@email.com', description: 'E-mail para login e notificações' })
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @ApiProperty({ example: 'Senha@123', description: 'Senha de acesso (mínimo de 6 caracteres)' })
  @IsString({ message: 'A senha deve ser uma string.' })
  @MinLength(6, { message: 'A senha deve conter pelo menos 6 caracteres.' })
  senha: string;

  @ApiProperty({ example: '(84) 99999-1234', description: 'Telefone celular ou WhatsApp', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ example: 'Ponta Negra', description: 'Bairro de residência em Natal-RN' })
  @IsString()
  @IsNotEmpty({ message: 'O bairro de residência é obrigatório.' })
  bairro: string;

  @ApiProperty({ example: '1990-05-15', description: 'Data de nascimento (AAAA-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  dataNascimento?: string;

  @ApiProperty({ example: true, description: 'Consentimento formal de tratamento de dados de saúde pela LGPD' })
  @IsBoolean({ message: 'O aceite dos termos deve ser verdadeiro ou falso.' })
  @Equals(true, { message: 'É obrigatório aceitar os Termos de Privacidade e Consentimento da LGPD para utilizar o sistema.' })
  aceitouTermosLgpd: boolean;
}
